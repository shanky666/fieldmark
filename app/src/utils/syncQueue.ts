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
      // 1. Get S3 pre-signed upload URL
      const presignResponse = await apiClient.post('/api/s3/presign/', {
        filename: 'offline_attendance.jpg',
        content_type: 'image/jpeg',
      });
      const { upload_url, s3_key } = presignResponse.data;

      // 2. Upload file via binary PUT
      const uploadResult = await FileSystem.uploadAsync(upload_url, record.photo_local_uri, {
        httpMethod: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      if (uploadResult.status !== 200 && uploadResult.status !== 201) {
        throw new Error(`S3 upload failed with status ${uploadResult.status}`);
      }

      // 3. Post attendance check-in record
      await apiClient.post('/api/attendance/', {
        latitude: record.latitude,
        longitude: record.longitude,
        photo_url: s3_key,
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
