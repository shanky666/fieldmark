/**
 * Offline queue sync utility.
 * expo-file-system and expo-notifications are native-only — guarded for web.
 */
import { Platform } from 'react-native';
import { useOfflineQueueStore } from '../store/offlineQueue';
import { apiClient } from '../api/client';

export async function syncOfflineQueue(): Promise<boolean> {
  const store = useOfflineQueueStore.getState();
  store.loadQueue();
  const queue = store.queue;

  if (queue.length === 0) {
    return false;
  }

  // Web: no file system or notifications — skip sync silently
  if (Platform.OS === 'web') {
    console.log('Offline sync skipped on web platform.');
    return false;
  }

  const FileSystem = require('expo-file-system');
  const Notifications = require('expo-notifications');

  console.log(`Starting sync for ${queue.length} offline records...`);
  let hasSyncedAny = false;

  for (const record of queue) {
    try {
      // Direct Render Upload: Read local offline photo as Base64
      let photoPayload: string = record.photo_local_uri;
      if (record.photo_local_uri && !record.photo_local_uri.startsWith('http') && !record.photo_local_uri.startsWith('data:')) {
        try {
          const base64Data = await FileSystem.readAsStringAsync(record.photo_local_uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          photoPayload = `data:image/jpeg;base64,${base64Data}`;
        } catch (readErr) {
          console.warn('Could not read offline record photo as Base64', readErr);
        }
      }

      // Post attendance check-in record directly to Render
      await apiClient.post('/api/attendance/', {
        latitude: record.latitude,
        longitude: record.longitude,
        photo_url: photoPayload,
        device_id: record.device_id,
        marked_at: record.marked_at,
        is_offline_submission: true,
        offline_queued_at: record.queued_at,
      });

      // 4. Delete successfully synced item from queue
      store.removeFromQueue(record.id);
      hasSyncedAny = true;

      // Send local success notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Attendance Synced ✓',
          body: 'Your offline attendance has been successfully submitted.',
          sound: true,
        },
        trigger: null,
      });
    } catch (error: any) {
      console.error(`Offline sync failed for record ${record.id}:`, error);
      const nextAttempt = record.sync_attempts + 1;
      const errorMsg = error.message || String(error);

      store.updateSyncAttempt(record.id, nextAttempt, errorMsg);

      if (nextAttempt >= 5) {
        try {
          await apiClient.post('/api/attendance/sync-failed/', {
            worker_id: record.device_id,
            queued_at: record.queued_at,
            error: errorMsg,
          });
        } catch (apiErr) {
          // ignore if API is unreachable
        }
      }
    }
  }

  return hasSyncedAny;
}
