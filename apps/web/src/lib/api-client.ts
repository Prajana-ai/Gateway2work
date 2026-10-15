import { useAuthStore } from '@/stores/auth-store';
import { isTokenExpired, refreshAccessToken } from '@/lib/auth';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isApiError(err: unknown): err is ApiError {
    return (
      err instanceof ApiError ||
      (err instanceof Error && err.name === 'ApiError') ||
      (typeof err === 'object' && err !== null && (err as any).name === 'ApiError')
    );
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const store = useAuthStore.getState();
  const headers: Record<string, string> = {};

  if (store.accessToken) {
    // Check if token is expired and attempt refresh
    if (isTokenExpired(store.accessToken) && store.refreshToken) {
      const tokens = await refreshAccessToken(store.refreshToken);
      if (tokens) {
        store.setTokens(tokens);
        headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      } else {
        // Refresh failed, force logout
        store.logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiError('AUTH_EXPIRED', 'Session expired', 401);
      }
    } else {
      headers['Authorization'] = `Bearer ${store.accessToken}`;
    }
  }

  if (store.user?.tenantId) {
    headers['X-Tenant-ID'] = store.user.tenantId;
  }

  return headers;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 - attempt token refresh once
  if (res.status === 401) {
    const store = useAuthStore.getState();
    if (store.refreshToken) {
      const tokens = await refreshAccessToken(store.refreshToken);
      if (tokens) {
        store.setTokens(tokens);

        // Retry the original request
        const retryRes = await fetch(`${BASE_URL}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
            ...(store.user?.tenantId
              ? { 'X-Tenant-ID': store.user.tenantId }
              : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (retryRes.status === 401) {
          // Already tried once, don't infinite loop
          throw new ApiError('UNAUTHORIZED', 'Authentication failed', 401);
        }

        let retryJson: ApiEnvelope<T>;
        try {
          retryJson = await retryRes.json();
        } catch (e) {
          if (!retryRes.ok) {
            throw new ApiError(
              'HTTP_ERROR',
              `Server returned ${retryRes.status}: ${retryRes.statusText}`,
              retryRes.status,
            );
          }
          throw e;
        }

        if (retryJson.error) {
          throw new ApiError(
            retryJson.error.code,
            retryJson.error.message,
            retryRes.status,
            retryJson.error.details,
          );
        }

        if (!retryRes.ok) {
          throw new ApiError(
            'UNKNOWN_ERROR',
            (retryJson as any).message || 'An unexpected error occurred',
            retryRes.status,
            (retryJson as any).details || retryJson,
          );
        }

        return retryJson.data;
      }
    }

    // Refresh failed or no refresh token
    store.logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError('UNAUTHORIZED', 'Authentication required', 401);
  }

  let json: ApiEnvelope<T>;
  try {
    json = await res.json();
  } catch (e) {
    if (!res.ok) {
      throw new ApiError(
        'HTTP_ERROR',
        `Server returned ${res.status}: ${res.statusText}`,
        res.status,
      );
    }
    throw e;
  }

  if (json.error) {
    throw new ApiError(
      json.error.code,
      json.error.message,
      res.status,
      json.error.details,
    );
  }

  if (!res.ok) {
    throw new ApiError(
      'UNKNOWN_ERROR',
      (json as any).message || 'An unexpected error occurred',
      res.status,
      (json as any).details || json,
    );
  }

  return json.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export { ApiError };
