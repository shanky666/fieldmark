import { Platform } from 'react-native';

const env = process.env as any;

const getApiBaseUrl = () => {
  if (env.EXPO_PUBLIC_API_URL) {
    return env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

export const CONFIG = {
  // Resolves backend address based on running environment
  API_BASE_URL: getApiBaseUrl(),
  DEFAULT_ACCURACY_THRESHOLD_METERS: 20,
  GPS_MISMATCH_THRESHOLD_METERS: 100,
  LIVENESS_BLUR_THRESHOLD: 50.0
};
