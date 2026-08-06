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

// Register background fetch task — native only
if (Platform.OS !== 'web') {
  const TaskManager = require('expo-task-manager');
  const BackgroundFetch = require('expo-background-fetch');

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

async function registerBackgroundSync() {
  if (Platform.OS === 'web') return;

  const BackgroundFetch = require('expo-background-fetch');
  try {
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
    // 1. Initialize SQLite tables (no-op on web)
    initDb();

    // 2. Register background task (no-op on web)
    registerBackgroundSync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
