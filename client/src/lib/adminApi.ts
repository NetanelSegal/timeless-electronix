const BASE = "/api/admin";

function getToken(): string | null {
  return sessionStorage.getItem("admin-token");
}

export function setToken(token: string) {
  sessionStorage.setItem("admin-token", token);
}

export function clearToken() {
  sessionStorage.removeItem("admin-token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as Record<string, string>).error ?? `Request failed: ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (res.status === 401) {
      clearToken();
      window.location.href = "/admin/login";
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as Record<string, string>).error ??
          `Upload failed: ${res.status}`,
      );
    }
    return res.json() as Promise<T>;
  },
};
