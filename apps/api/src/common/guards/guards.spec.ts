import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { MfaGuard } from './mfa.guard';
import { DataZoneGuard } from './data-zone.guard';

function createMockExecutionContext(user: any = {}): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false).mockReturnValueOnce(null);
    const ctx = createMockExecutionContext({ roleName: 'staff' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow when roles array is empty', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false).mockReturnValueOnce([]);
    const ctx = createMockExecutionContext({ roleName: 'staff' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow when user role matches required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false).mockReturnValueOnce(['admin', 'staff']);
    const ctx = createMockExecutionContext({ roleName: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should block when user role does not match required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false).mockReturnValueOnce(['admin']);
    const ctx = createMockExecutionContext({ roleName: 'staff' });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should allow public routes regardless of roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);
    const ctx = createMockExecutionContext({});
    expect(guard.canActivate(ctx)).toBe(true);
  });
});

describe('MfaGuard', () => {
  let guard: MfaGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new MfaGuard(reflector);
  });

  it('should allow public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);
    const ctx = createMockExecutionContext({});
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow non-protected data zone routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)   // isPublic
      .mockReturnValueOnce('general'); // dataZone
    const ctx = createMockExecutionContext({ mfa: false });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow routes with no data zone annotation', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)   // isPublic
      .mockReturnValueOnce(null);   // dataZone
    const ctx = createMockExecutionContext({ mfa: false });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should block protected routes when MFA is enabled but not verified', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)       // isPublic
      .mockReturnValueOnce('protected'); // dataZone
    const ctx = createMockExecutionContext({ mfaEnabled: true, mfa: false });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should allow protected routes when MFA is not enabled', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('protected');
    const ctx = createMockExecutionContext({ mfaEnabled: false, mfa: false });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow protected routes when user has no mfaEnabled property', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('protected');
    const ctx = createMockExecutionContext({});
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow protected routes with MFA enabled and verified', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('protected');
    const ctx = createMockExecutionContext({ mfaEnabled: true, mfa: true });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});

describe('DataZoneGuard', () => {
  let guard: DataZoneGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new DataZoneGuard(reflector);
  });

  it('should allow when no zone is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce(null); // dataZone
    const ctx = createMockExecutionContext({ zones: ['general'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow when user has the matching zone', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('protected');
    const ctx = createMockExecutionContext({ zones: ['general', 'protected'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should block when user does not have the required zone', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('protected');
    const ctx = createMockExecutionContext({ zones: ['general'] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should block when user has no zones at all', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('protected');
    const ctx = createMockExecutionContext({});
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow public routes regardless of zone', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);
    const ctx = createMockExecutionContext({});
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
