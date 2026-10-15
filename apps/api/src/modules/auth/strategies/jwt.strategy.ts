import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RequestUser } from '../../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  tid: string;
  email: string;
  rid: string;
  rname: string;
  zones: string[];
  mfa: boolean;
  mfaEnabled: boolean;
  iat: number;
  exp: number;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    if (!payload.sub || !payload.tid) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      tenantId: payload.tid,
      email: payload.email || '',
      roleId: payload.rid,
      roleName: payload.rname,
      zones: payload.zones || [],
      mfa: payload.mfa || false,
      mfaEnabled: payload.mfaEnabled || false,
    };
  }
}
