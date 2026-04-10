import { createApiClient } from './apiClient';

const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) {
  throw new Error('VITE_API_URL is not set');
}

export const api = createApiClient(apiUrl);
