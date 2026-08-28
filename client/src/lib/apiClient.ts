/**
 * Error from a non-2xx API response. `status` lets callers tell a genuine
 * "not found" apart from a backend/network failure, which must never be
 * rendered as a 404-style page (search engines log those as soft 404s).
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiClientOptions {
  getHeaders?: () => Record<string, string>;
  onUnauthorized?: () => void;
}

export function createApiClient(base: string, options: ApiClientOptions = {}) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.getHeaders?.(),
      ...(init?.headers as Record<string, string>),
    };

    const res = await fetch(`${base}${path}`, { ...init, headers });

    if (res.status === 401 && options.onUnauthorized) {
      options.onUnauthorized();
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: unknown;
      };
      const msg = body.error;
      throw new ApiError(
        typeof msg === "string" && msg
          ? msg
          : `Request failed: ${res.status}`,
        res.status,
      );
    }
    return res.json() as Promise<T>;
  }

  async function upload<T>(path: string, formData: FormData): Promise<T> {
    const headers: Record<string, string> = {
      ...options.getHeaders?.(),
    };

    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.status === 401 && options.onUnauthorized) {
      options.onUnauthorized();
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: unknown;
      };
      const msg = body.error;
      throw new ApiError(
        typeof msg === "string" && msg
          ? msg
          : `Upload failed: ${res.status}`,
        res.status,
      );
    }
    return res.json() as Promise<T>;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(path: string, body?: unknown) =>
      request<T>(
        path,
        body !== undefined
          ? { method: 'DELETE', body: JSON.stringify(body) }
          : { method: 'DELETE' },
      ),
    upload,
  };
}
