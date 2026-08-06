import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { COLORS } from '../constants/colors';

interface BulkApproveButtonProps {
  eligibleCount: number;
  onSuccess: () => void;
}

export default function BulkApproveButton({ eligibleCount, onSuccess }: BulkApproveButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleBulkApprove = () => {
    if (eligibleCount === 0) {
      Alert.alert(t('common.info' as any) || "Information", "No eligible records found for bulk approval.");
      return;
    }

    Alert.alert(
      t('common.confirm'),
      `Are you sure you want to approve all ${eligibleCount} eligible records (GPS matched, in shift window, with no anomalies)?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await apiClient.post('/api/attendance/bulk-approve/');
              Alert.alert(t('common.success'), `Successfully approved ${res.data.approved_count} records.`);
              onSuccess();
            } catch (e) {
              console.error("Bulk approve failed", e);
              Alert.alert(t('common.error'), "Failed to complete bulk approval. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.button, eligibleCount === 0 && styles.disabled]} 
      onPress={handleBulkApprove}
      disabled={loading || eligibleCount === 0}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text style={styles.text}>{t('admin.bulkApprove', { count: eligibleCount })}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    minHeight: 44, // Meets touch target minimum
  },
  disabled: {
    backgroundColor: '#a8dba8', // Muted green
  },
  text: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
