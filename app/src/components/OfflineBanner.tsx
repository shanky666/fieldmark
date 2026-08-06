import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useOfflineQueueStore } from '../store/offlineQueue';
import { COLORS } from '../constants/colors';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useNetworkStatus();
  const { queueCount } = useOfflineQueueStore();

  if (isOnline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{t('worker.offlineBanner')}</Text>
      {queueCount > 0 && (
        <Text style={styles.subtext}>
          {t('worker.queuedSubmissions', { count: queueCount })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtext: {
    color: '#333333',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
});
