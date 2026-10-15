import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from './strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  requiresMfa: boolean;
  mfaSessionToken?: string;
  tokens?: TokenPair;
}

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const result = await this.databaseService.query(
      `SELECT u.id, u.tenant_id, u.email, u.password_hash, u.mfa_enabled, u.mfa_secret,
              u.is_active, r.id as role_id, r.name as role_name
       FROM public.users u
       LEFT JOIN public.roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result.rows[0];
    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.databaseService.query(
      'UPDATE public.users SET last_login_at = NOW() WHERE id = $1',
      [user.id],
    );

    if (user.mfa_enabled) {
      // Return MFA session token
      const mfaSessionToken = this.jwtService.sign(
        { sub: user.id, tid: user.tenant_id, type: 'mfa_session' },
        { expiresIn: '5m' },
      );
      return { requiresMfa: true, mfaSessionToken };
    }

    // No MFA - issue tokens directly
    const tokens = await this.issueTokens(user);
    return { requiresMfa: false, tokens };
  }

  async verifyMfa(mfaSessionToken: string, code: string): Promise<TokenPair> {
    let payload: { sub: string; tid: string; type: string };
    try {
      payload = this.jwtService.verify(mfaSessionToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA session');
    }

    if (payload.type !== 'mfa_session') {
      throw new UnauthorizedException('Invalid token type');
    }

    const result = await this.databaseService.query(
      `SELECT u.id, u.tenant_id, u.email, u.mfa_secret,
              r.id as role_id, r.name as role_name
       FROM public.users u
       LEFT JOIN public.roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [payload.sub],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    const user = result.rows[0];
    const isValid = authenticator.verify({
      token: code,
      secret: user.mfa_secret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    return this.issueTokens({ ...user, mfa_verified: true });
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; tid: string; jti: string; type: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const tokenHash = this.hashToken(refreshToken);

    // Check token exists and hasn't been revoked
    const tokenResult = await this.databaseService.query(
      `SELECT id, user_id, is_revoked, used_at FROM public.refresh_tokens
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash],
    );

    if (tokenResult.rows.length === 0) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    const storedToken = tokenResult.rows[0];

    if (storedToken.is_revoked) {
      // Token was already revoked - possible replay attack
      // Revoke ALL tokens for this user as a security measure
      await this.databaseService.query(
        'UPDATE public.refresh_tokens SET is_revoked = true WHERE user_id = $1',
        [storedToken.user_id],
      );
      throw new UnauthorizedException(
        'Security alert: refresh token reuse detected',
      );
    }

    if (storedToken.used_at) {
      // Token replay detected
      await this.databaseService.query(
        'UPDATE public.refresh_tokens SET is_revoked = true WHERE user_id = $1',
        [storedToken.user_id],
      );
      throw new UnauthorizedException(
        'Security alert: refresh token reuse detected',
      );
    }

    // Mark old token as used
    await this.databaseService.query(
      'UPDATE public.refresh_tokens SET used_at = NOW(), is_revoked = true WHERE id = $1',
      [storedToken.id],
    );

    // Fetch user to issue new tokens
    const userResult = await this.databaseService.query(
      `SELECT u.id, u.tenant_id, u.email, u.is_active, u.mfa_enabled,
              r.id as role_id, r.name as role_name
       FROM public.users u
       LEFT JOIN public.roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [payload.sub],
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    return this.issueTokens({
      ...userResult.rows[0],
      mfa_verified: userResult.rows[0].mfa_enabled,
    });
  }

  async enrollMfa(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const secret = authenticator.generateSecret();
    const issuer = this.configService.get('MFA_ISSUER', 'Gateway2Work');

    const userResult = await this.databaseService.query(
      'SELECT email FROM public.users WHERE id = $1',
      [userId],
    );
    if (userResult.rows.length === 0) {
      throw new BadRequestException('User not found');
    }

    const qrCodeUrl = authenticator.keyuri(
      userResult.rows[0].email,
      issuer,
      secret,
    );

    // Store secret temporarily (not enabled until confirmed)
    await this.databaseService.query(
      'UPDATE public.users SET mfa_secret = $1 WHERE id = $2',
      [secret, userId],
    );

    return { secret, qrCodeUrl };
  }

  async confirmMfa(userId: string, code: string): Promise<void> {
    const result = await this.databaseService.query(
      'SELECT mfa_secret FROM public.users WHERE id = $1',
      [userId],
    );

    if (result.rows.length === 0 || !result.rows[0].mfa_secret) {
      throw new BadRequestException('MFA enrollment not started');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: result.rows[0].mfa_secret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    await this.databaseService.query(
      'UPDATE public.users SET mfa_enabled = true WHERE id = $1',
      [userId],
    );
  }

  private async issueTokens(user: {
    id: string;
    tenant_id: string;
    email: string;
    role_id: string;
    role_name: string;
    mfa_enabled?: boolean;
    mfa_verified?: boolean;
  }): Promise<TokenPair> {
    // Determine zones based on role
    const zones = await this.getUserZones(user.role_id);

    const jti = uuidv4();
    const accessPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      tid: user.tenant_id,
      email: user.email,
      rid: user.role_id,
      rname: user.role_name,
      zones,
      mfa: user.mfa_verified || false,
      mfaEnabled: user.mfa_enabled || false,
      jti,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshJti = uuidv4();
    const refreshToken = this.jwtService.sign(
      { sub: user.id, tid: user.tenant_id, jti: refreshJti, type: 'refresh' },
      { expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '24h') },
    );

    // Store refresh token hash
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await this.databaseService.query(
      `INSERT INTO public.refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt],
    );

    return { accessToken, refreshToken };
  }

  private async getUserZones(roleId: string): Promise<string[]> {
    const result = await this.databaseService.query(
      `SELECT DISTINCT p.data_zone
       FROM public.role_permissions rp
       JOIN public.permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [roleId],
    );

    const zones = new Set<string>();
    for (const row of result.rows) {
      if (row.data_zone === 'both') {
        zones.add('protected');
        zones.add('application');
      } else {
        zones.add(row.data_zone);
      }
    }
    return Array.from(zones);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
