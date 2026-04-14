import { createApiClient } from './apiClient';

export const apiUrl = import.meta.env.VITE_API_URL;

export const api = createApiClient(apiUrl);
