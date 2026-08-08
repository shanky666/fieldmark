import { Platform } from 'react-native';

const env = process.env as any;

const getApiBaseUrl = () => {
  if (env.EXPO_PUBLIC_API_URL) {
    return env.EXPO_PUBLIC_API_URL;
  }

  return 'https://fieldmark.onrender.com';
};

export const CONFIG = {
  API_BASE_URL: getApiBaseUrl(),
  DEFAULT_ACCURACY_THRESHOLD_METERS: 20,
  GPS_MISMATCH_THRESHOLD_METERS: 100,
  LIVENESS_BLUR_THRESHOLD: 50.0,
};