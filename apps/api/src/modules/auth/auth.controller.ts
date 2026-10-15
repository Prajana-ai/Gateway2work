import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(
    @Body() body: { mfaSessionToken: string; code: string },
  ) {
    return this.authService.verifyMfa(body.mfaSessionToken, body.code);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('mfa/enroll')
  async enrollMfa(@CurrentUser() user: RequestUser) {
    return this.authService.enrollMfa(user.id);
  }

  @Post('mfa/enroll/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmMfa(
    @CurrentUser() user: RequestUser,
    @Body() body: { code: string },
  ) {
    await this.authService.confirmMfa(user.id, body.code);
    return { message: 'MFA enabled successfully' };
  }
}
