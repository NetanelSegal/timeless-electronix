import { createApiClient } from './apiClient';

const apiUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const api = createApiClient(apiUrl);
