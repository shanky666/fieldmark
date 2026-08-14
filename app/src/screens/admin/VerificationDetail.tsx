import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../constants/colors';
import { CONFIG } from '../../constants/config';
import { apiClient } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import AnomalyChips from '../../components/AnomalyChips';
import { haversineDistance } from '../../utils/haversine';
import { AdminStackParamList } from '../../navigation/AdminNavigator';

type VerificationDetailRouteProp = RouteProp<AdminStackParamList, 'VerificationDetail'>;
type VerificationDetailNavigationProp = StackNavigationProp<AdminStackParamList, 'VerificationDetail'>;

interface VerificationDetailProps {
  route: VerificationDetailRouteProp;
  navigation: VerificationDetailNavigationProp;
}

export default function VerificationDetail({ route, navigation }: VerificationDetailProps) {
  const { recordId } = route.params;
  const { t } = useTranslation();

  const [record, setRecord] = useState<any>(null);
  const [roundMatch, setRoundMatch] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRecordDetails = async () => {
    try {
      // 1. Fetch record
      const res = await apiClient.get(`/api/attendance/${recordId}/`);
      const rec = res.data;
      setRecord(rec);

      // 2. Fetch supervisor rounds for the same zone and date to cross check
      if (rec.worker_detail?.zone_detail?.id) {
        const roundRes = await apiClient.get(
          `/api/rounds/?zone=${rec.worker_detail.zone_detail.id}&date=${rec.date}`
        );
        
        if (roundRes.data.length > 0) {
          // Look if worker is in the observed IDs list
          const round = roundRes.data[0];
          const wasObserved = round.observed_worker_ids?.includes(rec.worker_detail.id);
          setRoundMatch({
            supervisorName: round.supervisor_detail?.name || 'Supervisor',
            time: new Date(round.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            observed: wasObserved
          });
        }
      }
    } catch (e) {
      console.error("Failed to load audit verification details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordDetails();
  }, [recordId]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/api/attendance/${recordId}/approve/`);
      Alert.alert(t('common.success'), "Record approved successfully.");
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('common.error'), "Failed to approve record.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      Alert.alert(t('common.error'), "Please provide a rejection reason note.");
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.post(`/api/attendance/${recordId}/reject/`, {
        rejection_note: rejectionNote
      });
      Alert.alert(t('common.success'), "Record rejected successfully.");
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('common.error'), "Failed to reject record.");
    } finally {
      setActionLoading(false);
    }
  };

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
        <Text style={styles.errorText}>Audit record not found.</Text>
      </View>
    );
  }

  // EXIF delta calculation
  let deltaText = 'N/A';
  let deltaColor = COLORS.lightText;
  let hasDeltaWarning = false;

  if (record.latitude && record.longitude && record.exif_lat && record.exif_lng) {
    const deltaMeters = haversineDistance(
      record.latitude,
      record.longitude,
      record.exif_lat,
      record.exif_lng
    );
    deltaText = `${deltaMeters.toFixed(1)} meters`;
    
    if (deltaMeters > 100) {
      deltaColor = COLORS.danger;
      hasDeltaWarning = true;
    } else {
      deltaColor = COLORS.accent;
    }
  }

  const rawUrl = record.photo_url || record.photo;
  let photoUri: string | null = null;
  if (rawUrl) {
    if (rawUrl.startsWith('data:')) {
      photoUri = rawUrl;
    } else if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      if (rawUrl.startsWith('https://') && (rawUrl.includes('192.168.') || rawUrl.includes('10.0.') || rawUrl.includes('127.0.0.1') || rawUrl.includes('localhost'))) {
        photoUri = rawUrl.replace('https://', 'http://');
      } else {
        photoUri = rawUrl;
      }
    } else if (rawUrl.startsWith('/')) {
      photoUri = `${CONFIG.API_BASE_URL}${rawUrl}`;
    } else {
      photoUri = `${CONFIG.API_BASE_URL}/media/${rawUrl.replace(/^media\//, '')}`;
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Audit</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Photo view */}
        <View style={styles.imageCard}>
          <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
        </View>

        {/* Worker & Shift Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.workerName}>{record.worker_name || record.worker_detail?.name || `Worker #${record.worker}`}</Text>
              <Text style={styles.employeeId}>Employee ID: {record.worker_employee_id || record.worker_detail?.employee_id || 'N/A'}</Text>
              <Text style={styles.employeeId}>Zone: {record.zone_name || record.worker_detail?.zone_detail?.name || 'Assigned Zone'}</Text>
            </View>
            <StatusBadge status={record.status} />
          </View>

          <View style={styles.divider} />

          {/* Timing & Working Duration */}
          <Text style={styles.label}>Attendance Timings & Duration</Text>
          <View style={styles.gpsGrid}>
            <View style={styles.gpsCell}>
              <Text style={styles.gpsCellTitle}>CHECK-IN TIME</Text>
              <Text style={styles.gpsCellVal}>
                {record.marked_at ? new Date(record.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </Text>
              <Text style={styles.gpsCellValText}>{record.date}</Text>
            </View>
            <View style={styles.gpsCell}>
              <Text style={styles.gpsCellTitle}>CHECK-OUT TIME</Text>
              <Text style={styles.gpsCellVal}>
                {record.check_out_at ? new Date(record.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still Checked In'}
              </Text>
              <Text style={styles.gpsCellValText}>
                {record.check_out_at ? new Date(record.check_out_at).toLocaleDateString() : 'In Progress'}
              </Text>
            </View>
          </View>
          <Text style={styles.deltaLabel}>
            Total Working Duration: <Text style={[styles.deltaVal, { color: COLORS.primary }]}>{record.duration_formatted || '--'}</Text>
          </Text>

          <View style={styles.divider} />

          {/* Verification & System Identifiers */}
          <Text style={styles.label}>Device & Submission Metadata</Text>
          <View style={styles.gpsGrid}>
            <View style={styles.gpsCell}>
              <Text style={styles.gpsCellTitle}>DEVICE ID</Text>
              <Text style={[styles.gpsCellVal, { fontSize: 10 }]}>{record.device_id || 'N/A'}</Text>
            </View>
            <View style={styles.gpsCell}>
              <Text style={styles.gpsCellTitle}>LIVENESS VERIFICATION</Text>
              <Text style={[styles.gpsCellVal, { color: record.liveness_passed !== false ? COLORS.accent : COLORS.danger }]}>
                {record.liveness_passed !== false ? '✓ Passed' : '⚠ Flagged'}
              </Text>
            </View>
          </View>
          <Text style={styles.deltaLabel}>
            Submission Mode: <Text style={styles.deltaVal}>{record.is_offline_submission ? `Offline Sync (Queued: ${record.offline_queued_at || 'N/A'})` : 'Online Real-time'}</Text>
          </Text>

          {record.verified_by_name && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.deltaLabel}>
                Verified By: <Text style={styles.deltaVal}>{record.verified_by_name} at {record.verified_at ? new Date(record.verified_at).toLocaleString() : 'N/A'}</Text>
              </Text>
            </View>
          )}

          {record.rejection_note && (
            <View style={{ marginTop: 6, backgroundColor: '#FBE5E1', padding: 8, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: COLORS.danger, fontWeight: 'bold' }}>Rejection Reason: {record.rejection_note}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Anomaly flags */}
          <Text style={styles.label}>Triggered Anomalies</Text>
          {record.anomaly_flags && record.anomaly_flags.length > 0 ? (
            <AnomalyChips flags={record.anomaly_flags} />
          ) : (
            <Text style={styles.okText}>✓ No anomalies triggered</Text>
          )}

          <View style={styles.divider} />

          {/* GPS Auditing Row */}
          <Text style={styles.label}>{t('admin.gpsComparison')}</Text>
          <View style={styles.gpsGrid}>
            <View style={styles.gpsCell}>
              <Text style={styles.gpsCellTitle}>{t('admin.deviceCoords')}</Text>
              <Text style={styles.gpsCellVal}>Lat: {record.latitude?.toFixed(5)}</Text>
              <Text style={styles.gpsCellVal}>Lng: {record.longitude?.toFixed(5)}</Text>
            </View>
            <View style={styles.gpsCell}>
              <Text style={styles.gpsCellTitle}>{t('admin.exifCoords')}</Text>
              {record.exif_lat ? (
                <View>
                  <Text style={styles.gpsCellVal}>Lat: {record.exif_lat.toFixed(5)}</Text>
                  <Text style={styles.gpsCellVal}>Lng: {record.exif_lng.toFixed(5)}</Text>
                </View>
              ) : (
                <Text style={styles.gpsCellValText}>No EXIF metadata</Text>
              )}
            </View>
          </View>
          <Text style={styles.deltaLabel}>
            {t('admin.deltaDistance')} <Text style={[styles.deltaVal, { color: deltaColor }]}>{deltaText}</Text>
          </Text>

          <View style={styles.divider} />

          {/* Supervisor Cross Check */}
          <Text style={styles.label}>{t('admin.supervisorCross')}</Text>
          {roundMatch ? (
            <View style={[styles.roundBox, roundMatch.observed ? styles.roundObserved : styles.roundAbsent]}>
              <Text style={styles.roundBoxText}>
                {`${roundMatch.supervisorName} logged at ${roundMatch.time} - ${roundMatch.observed ? 'observed ✓' : 'NOT observed ❌'}`}
              </Text>
            </View>
          ) : (
            <Text style={styles.gpsCellValText}>{t('admin.noRound')}</Text>
          )}
        </View>

        {/* Audit Actions Bar */}
        {record.status === 'PENDING' || record.status === 'FLAGGED' ? (
          <View style={[styles.card, styles.actionCard]}>
            <Text style={styles.label}>Process Verification Decisions</Text>
            <TextInput
              style={styles.input}
              placeholder={t('admin.rejectionPlaceholder')}
              placeholderTextColor={COLORS.lightText}
              value={rejectionNote}
              onChangeText={setRejectionNote}
            />
            
            <View style={styles.actionBtnRow}>
              <TouchableOpacity 
                style={[styles.btn, styles.btnReject]}
                onPress={handleReject}
                disabled={actionLoading}
              >
                <Text style={styles.btnTextReject}>{t('admin.reject')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, styles.btnApprove]}
                onPress={handleApprove}
                disabled={actionLoading}
              >
                <Text style={styles.btnTextApprove}>{t('admin.approve')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
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
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  employeeId: {
    fontSize: 11,
    color: COLORS.lightText,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.lightText,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  okText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  gpsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: 4,
  },
  gpsCell: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gpsCellTitle: {
    fontSize: 10,
    color: COLORS.lightText,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gpsCellVal: {
    fontSize: 12,
    color: COLORS.darkText,
    fontFamily: 'monospace',
  },
  gpsCellValText: {
    fontSize: 12,
    color: COLORS.lightText,
    fontStyle: 'italic',
  },
  deltaLabel: {
    fontSize: 12,
    color: COLORS.darkText,
    marginTop: 8,
    fontWeight: '500',
  },
  deltaVal: {
    fontWeight: 'bold',
  },
  roundBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  roundObserved: {
    backgroundColor: COLORS.accent + '11',
    borderColor: COLORS.accent,
  },
  roundAbsent: {
    backgroundColor: COLORS.danger + '11',
    borderColor: COLORS.danger,
  },
  roundBoxText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionCard: {
    backgroundColor: '#fffbeb', // Light warning yellow highlight
    borderColor: '#f59e0b',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.darkText,
    backgroundColor: COLORS.white,
    marginVertical: 10,
  },
  actionBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 6,
  },
  btn: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 44,
  },
  btnReject: {
    borderColor: COLORS.danger,
    borderWidth: 1,
    backgroundColor: COLORS.white,
  },
  btnApprove: {
    backgroundColor: COLORS.primary,
  },
  btnTextReject: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnTextApprove: {
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
