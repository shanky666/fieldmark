import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../constants/colors';
import { CONFIG } from '../../constants/config';
import { apiClient } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import AnomalyChips from '../../components/AnomalyChips';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';

type HistoryDetailRouteProp = RouteProp<WorkerStackParamList, 'HistoryDetail'>;
type HistoryDetailNavigationProp = StackNavigationProp<WorkerStackParamList, 'HistoryDetail'>;

interface HistoryDetailProps {
  route: HistoryDetailRouteProp;
  navigation: HistoryDetailNavigationProp;
}

export default function HistoryDetail({ route, navigation }: HistoryDetailProps) {
  const { recordId } = route.params;
  const { t } = useTranslation();
  
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await apiClient.get(`/api/attendance/${recordId}/`);
        setRecord(res.data);
      } catch (e) {
        console.error("Failed to load history record details", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [recordId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Record not found.</Text>
      </View>
    );
  }

  const formattedTime = record.marked_at 
    ? new Date(record.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const photoUri = record.photo_url?.startsWith('http') 
    ? record.photo_url 
    : `${CONFIG.API_BASE_URL}/media/${record.photo_url}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Detail</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Large Photo */}
        <View style={styles.imageCard}>
          <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.dateLabel}>{record.date}</Text>
            <StatusBadge status={record.status} />
          </View>
          
          <View style={styles.divider} />

          <Text style={styles.label}>Time Marked</Text>
          <Text style={styles.value}>{formattedTime}</Text>

          <Text style={styles.label}>Device Reported GPS Coordinates</Text>
          <Text style={styles.value}>
            Lat: {record.latitude.toFixed(5)}, Lng: {record.longitude.toFixed(5)}
          </Text>

          <Text style={styles.label}>Zone Assigned</Text>
          <Text style={styles.value}>
            {record.worker_detail?.zone_detail?.name || 'N/A'} (GPS match: {record.gps_match})
          </Text>

          {/* Anomaly chips */}
          {record.anomaly_flags && record.anomaly_flags.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Security Flags</Text>
              <AnomalyChips flags={record.anomaly_flags} />
            </View>
          )}

          {/* Rejection block */}
          {record.status === 'REJECTED' && record.rejection_note && (
            <View style={styles.rejectionBox}>
              <Text style={styles.rejectionBoxTitle}>Rejection Note</Text>
              <Text style={styles.rejectionBoxText}>{record.rejection_note}</Text>
            </View>
          )}
        </View>

        {/* Raise correction CTA if rejected */}
        {record.status === 'REJECTED' && (
          <TouchableOpacity 
            style={styles.correctionBtn}
            onPress={() => navigation.navigate('CorrectionRequest')}
          >
            <Text style={styles.correctionBtnText}>{t('worker.raiseCorrection')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 12,
    minHeight: 44,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  imageCard: {
    backgroundColor: '#000000',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.lightText,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: COLORS.darkText,
    fontWeight: '500',
  },
  rejectionBox: {
    backgroundColor: COLORS.danger + '11',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  rejectionBoxTitle: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rejectionBoxText: {
    color: COLORS.danger,
    fontSize: 12,
  },
  correctionBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 44,
  },
  correctionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0faf0',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.danger,
    marginTop: 100,
  },
});
