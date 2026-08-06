import { secureStorage } from './secureStorage';

export async function getUniqueDeviceId(): Promise<string> {
  const secureKey = 'fieldmark_device_id';
  try {
    let deviceId = await secureStorage.getItem(secureKey);
    if (!deviceId) {
      // Generate a persistent pseudorandom ID representing this device
      deviceId = 'FM-' +
        Math.random().toString(36).substring(2, 10).toUpperCase() + '-' +
        Math.random().toString(36).substring(2, 10).toUpperCase();

      await secureStorage.setItem(secureKey, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Failed to retrieve or generate device ID', error);
    return 'FM-UNKNOWN-FALLBACK-ID';
  }
}
