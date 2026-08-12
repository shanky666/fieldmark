import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Load translation configuration
import './src/locales/i18n';

import { useOfflineQueueStore } from './src/store/offlineQueue';
import { syncOfflineQueue } from './src/utils/syncQueue';
import RootNavigator from './src/navigation/RootNavigator';

const BACKGROUND_SYNC_TASK = 'FIELDMARK_SYNC_TASK';

// Register background fetch task — native only with safety try/catch
if (Platform.OS !== 'web') {
  try {
    const TaskManager = require('expo-task-manager');
    const BackgroundFetch = require('expo-background-fetch');

    if (TaskManager?.defineTask && BackgroundFetch) {
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        try {
          const hasSynced = await syncOfflineQueue();
          return hasSynced
            ? BackgroundFetch.BackgroundFetchResult.NewData
            : BackgroundFetch.BackgroundFetchResult.NoData;
        } catch (error) {
          console.error('Background sync task failed', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    }
  } catch (e) {
    console.warn('Background sync task defineTask skipped:', e);
  }
}

async function registerBackgroundSync() {
  if (Platform.OS === 'web') return;

  try {
    const BackgroundFetch = require('expo-background-fetch');
    if (!BackgroundFetch?.getStatusAsync) return;

    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      console.warn('Background fetch is restricted or denied on this device');
      return;
    }
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnDatabaseLaunch: true,
    });
    console.log('Background sync task registered successfully.');
  } catch (err) {
    console.warn('Background sync task registration failed', err);
  }
}

export default function App() {
  const { initDb } = useOfflineQueueStore();

  useEffect(() => {
    try {
      // 1. Initialize SQLite tables (no-op on web / gracefully handled)
      initDb();
    } catch (e) {
      console.warn('initDb error', e);
    }

    try {
      // 2. Register background task (no-op on web / gracefully handled)
      registerBackgroundSync();
    } catch (e) {
      console.warn('registerBackgroundSync error', e);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
