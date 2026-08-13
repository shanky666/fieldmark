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

// Request Interceptor: Attach access token from memory or cross-platform storage
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (!config.headers.Authorization && apiClient.defaults.headers.common['Authorization']) {
        config.headers.Authorization = apiClient.defaults.headers.common['Authorization'];
      }
      if (!config.headers.Authorization) {
        const accessToken = await secureStorage.getItem('access_token');
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
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
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await secureStorage.getItem('refresh_token');
        if (refreshToken) {
          // Attempt token rotation
          const response = await axios.post(`${CONFIG.API_BASE_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access, refresh: newRefresh } = response.data;

          // Save rotated keys to storage and memory headers
          await secureStorage.setItem('access_token', access);
          if (newRefresh) {
            await secureStorage.setItem('refresh_token', newRefresh);
          }
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

          // Update headers and retry request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed, resetting auth session...', refreshError);

        // Clear tokens from storage and memory on auth failure
        delete apiClient.defaults.headers.common['Authorization'];
        await secureStorage.deleteItem('access_token');
        await secureStorage.deleteItem('refresh_token');
        await secureStorage.deleteItem('user_role');
        await secureStorage.deleteItem('worker_id');

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
