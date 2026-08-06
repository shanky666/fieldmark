import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';
import { CONFIG } from '../constants/config';

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token from cross-platform storage
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await secureStorage.getItem('access_token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (e) {
      console.error('Error reading token from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle JWT Refresh rotation on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await secureStorage.getItem('refresh_token');
        if (refreshToken) {
          // Attempt token rotation
          const response = await axios.post(`${CONFIG.API_BASE_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access, refresh: newRefresh } = response.data;

          // Save rotated keys
          await secureStorage.setItem('access_token', access);
          if (newRefresh) {
            await secureStorage.setItem('refresh_token', newRefresh);
          }

          // Update headers and retry
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed, logging out...', refreshError);

        // Clear stores on auth failure
        await secureStorage.deleteItem('access_token');
        await secureStorage.deleteItem('refresh_token');

        // Trigger callback to clean state if registered
        if (onAuthFailureCallback) {
          onAuthFailureCallback();
        }
      }
    }
    return Promise.reject(error);
  }
);

let onAuthFailureCallback: (() => void) | null = null;
export function registerAuthFailureHandler(callback: () => void) {
  onAuthFailureCallback = callback;
}
