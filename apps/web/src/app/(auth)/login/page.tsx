'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

interface LoginResponse {
  requiresMfa: boolean;
  mfaSessionToken?: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

interface MfaResponse {
  accessToken: string;
  refreshToken: string;
}

function decodeUserFromToken(accessToken: string): AuthUser {
  const payload = JSON.parse(atob(accessToken.split('.')[1]));
  return {
    id: payload.sub,
    email: payload.email || '',
    tenantId: payload.tid,
    roleName: payload.rname,
    zones: payload.zones || [],
  };
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      if (res.requiresMfa && res.mfaSessionToken) {
        setMfaToken(res.mfaSessionToken);
      } else if (res.tokens) {
        const user = decodeUserFromToken(res.tokens.accessToken);
        login(res.tokens, user);
        if (user.roleName === 'participant') {
          router.push('/welcome');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post<MfaResponse>('/auth/mfa/verify', {
        mfaSessionToken: mfaToken,
        code: mfaCode,
      });

      const user = decodeUserFromToken(res.accessToken);
      login(
        { accessToken: res.accessToken, refreshToken: res.refreshToken },
        user,
      );
      if (user.roleName === 'participant') {
        router.push('/welcome');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid code. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Gateway2Work</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Behavioral Health Referral Platform
          </h1>
          <p className="text-lg text-blue-200">
            Streamline referrals, coordinate care, and improve outcomes for
            participants across your network.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">
              Gateway2Work
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {mfaToken ? 'Two-factor authentication' : 'Sign in to your account'}
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            {mfaToken
              ? 'Enter the verification code from your authenticator app.'
              : 'Enter your credentials to access the platform.'}
          </p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!mfaToken ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                  className="input-field"
                  placeholder="you@organization.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                  className="input-field"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfa} className="space-y-5">
              <div>
                <label
                  htmlFor="mfaCode"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Verification code
                </label>
                <input
                  id="mfaCode"
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoFocus
                  value={mfaCode}
                  onChange={(e) => setMfaCode((e.target as HTMLInputElement).value)}
                  className="input-field text-center text-lg tracking-[0.3em]"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMfaToken(null);
                  setMfaCode('');
                  setError('');
                }}
                className="btn-secondary w-full"
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
