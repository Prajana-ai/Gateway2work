import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const MfaVerifySchema = z.object({
  mfaSessionToken: z.string(),
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
});
export type MfaVerifyDto = z.infer<typeof MfaVerifySchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
