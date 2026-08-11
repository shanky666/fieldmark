import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  return 'https://fieldmark-ne9z.onrender.com';
};

export const CONFIG = {
  API_BASE_URL: getApiBaseUrl(),
  DEFAULT_ACCURACY_THRESHOLD_METERS: 20,
  GPS_MISMATCH_THRESHOLD_METERS: 100,
  LIVENESS_BLUR_THRESHOLD: 50.0
};
