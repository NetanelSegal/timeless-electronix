import { apiUrl } from './api';
import { createApiClient } from './apiClient';

/** Base URL for admin routes, e.g. `http://localhost:3001/api/admin` */
export const adminApiBase = `${apiUrl}/admin`;

function getToken(): string | null {
  return sessionStorage.getItem('admin-token');
}

export function setToken(token: string) {
  sessionStorage.setItem('admin-token', token);
}

export function clearToken() {
  sessionStorage.removeItem('admin-token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export const adminApi = createApiClient(adminApiBase, {
  getHeaders: () => {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },
  onUnauthorized: () => {
    clearToken();
    window.location.href = '/admin/login';
  },
});
