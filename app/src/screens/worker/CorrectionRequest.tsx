import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import DatePicker from '../../components/DatePicker';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';

type CorrectionRequestNavigationProp = StackNavigationProp<WorkerStackParamList, 'CorrectionRequest'>;

interface CorrectionRequestProps {
  navigation: CorrectionRequestNavigationProp;
}

export default function CorrectionRequest({ navigation }: CorrectionRequestProps) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [reason, setReason] = useState<'NO_SIGNAL' | 'PHONE_DEAD' | 'EMERGENCY' | 'OTHER'>('NO_SIGNAL');
  const [dateStr, setDateStr] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get('/api/corrections/me/');
      setHistory(res.data);
    } catch (e) {
      console.error("Failed to load corrections history", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async () => {
    if (!dateStr || !detail) {
      Alert.alert(t('common.error'), "Please fill in all inputs.");
      return;
    }

    // Check date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      Alert.alert("Invalid Date", "Please enter date in YYYY-MM-DD format (e.g., 2026-07-28).");
      return;
    }

    if (detail.length < 20) {
      Alert.alert("Detail Too Short", "Please explain your reason with at least 20 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/api/corrections/', {
        date: dateStr,
        reason: reason,
        reason_detail: detail
      });
      
      Alert.alert(t('common.success'), "Correction request submitted successfully!");
      setDateStr('');
      setDetail('');
      fetchHistory(); // refresh list
    } catch (error: any) {
      console.error("Correction submit failed", error);
      const msg = error.response?.data?.message || "Failed to submit correction request. Check date.";
      Alert.alert(t('common.error'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getReasonLabel = (code: string) => {
    switch (code) {
      case 'NO_SIGNAL':
        return t('corrections.reasonNoSignal');
      case 'PHONE_DEAD':
        return t('corrections.reasonPhoneDead');
      case 'EMERGENCY':
        return t('corrections.reasonEmergency');
      case 'OTHER':
      default:
        return t('corrections.reasonOther');
    }
  };

  const renderHistoryItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyReason}>{getReasonLabel(item.reason)}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.historyDate}>Date: {item.date}</Text>
        <Text style={styles.historyDetail}>Detail: "{item.reason_detail}"</Text>
        {item.status === 'REJECTED' && item.rejection_note && (
          <Text style={styles.rejectionNote}>Rejection reason: {item.rejection_note}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('corrections.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 1. Request form card */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>{t('corrections.reasonPicker')}</Text>
          <View style={styles.pickerRow}>
            {(['NO_SIGNAL', 'PHONE_DEAD', 'EMERGENCY', 'OTHER'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.pill, reason === r && styles.activePill]}
                onPress={() => setReason(r)}
              >
                <Text style={[styles.pillLabel, reason === r && styles.activePillLabel]}>
                  {getReasonLabel(r)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <DatePicker
            label="Missed Date"
            value={dateStr}
            onChange={setDateStr}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.inputLabel}>Reason Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('corrections.detailPlaceholder')}
            placeholderTextColor={COLORS.lightText}
            multiline
            numberOfLines={3}
            value={detail}
            onChangeText={setDetail}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            disabled={submitting}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>{t('corrections.submitBtn')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. History list */}
        <Text style={styles.historyTitle}>{t('corrections.historyTitle')}</Text>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No previous correction requests.</Text>
            }
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    marginRight: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.lightText,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
  },
  activePill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillLabel: {
    fontSize: 11,
    color: COLORS.darkText,
    fontWeight: 'bold',
  },
  activePillLabel: {
    color: '#ffffff',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.darkText,
    backgroundColor: COLORS.lightGray,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 44,
  },
  btnDisabled: {
    backgroundColor: '#a8dba8',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginTop: 28,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyReason: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.lightText,
    marginVertical: 4,
  },
  historyDetail: {
    fontSize: 12,
    color: COLORS.darkText,
    fontStyle: 'italic',
  },
  rejectionNote: {
    color: COLORS.danger,
    fontSize: 11,
    marginTop: 6,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightText,
    fontSize: 13,
    marginTop: 10,
  },
});
