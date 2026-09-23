import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image, Alert, TextInput } from 'react-native';
import { apiClient } from '../../api/client';
import { CONFIG } from '../../constants/config';
import { COLORS } from '../../constants/colors';

export default function VerificationDetail({ route, navigation }: any) {
  const { recordId } = route.params;
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  useEffect(() => {
    fetchRecord();
  }, [recordId]);

  const fetchRecord = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/attendance/${recordId}/`);
      setRecord(res.data);
    } catch (e) {
      console.warn("Failed to load record details", e);
      Alert.alert('Error', "Could not load verification details");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionNote.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }
    setUpdating(true);
    try {
      await apiClient.patch(`/api/attendance/${recordId}/verify/`, {
        action,
        rejection_note: rejectionNote.trim()
      });
      Alert.alert('Success', `Attendance ${action}d successfully`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || `Failed to ${action} attendance`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED': return { bg: '#ECFDF5', text: '#059669' };
      case 'PENDING': return { bg: '#EFF6FF', text: '#3B82F6' };
      case 'FLAGGED': return { bg: '#FFF7ED', text: '#EA580C' };
      case 'REJECTED': return { bg: '#FEF2F2', text: '#DC2626' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  if (loading || !record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const rawUrl = record.photo_url || record.check_in_photo;
  let photoUri: string | null = null;
  if (rawUrl) {
    if (rawUrl.startsWith('http')) {
      photoUri = rawUrl;
    } else {
      photoUri = `${CONFIG.API_BASE_URL}/media/${rawUrl.replace(/^media\//, '')}`;
    }
  }

  const checkInTime = record.marked_at ? new Date(record.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const checkOutTime = record.check_out_at ? new Date(record.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still Checked In';
  const statusStyle = getStatusStyle(record.status);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Attendance Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageCard}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }]}>
              <Text style={{ color: '#94A3B8' }}>📷 No Photo Available</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.workerName}>{record.worker_name || `Worker #${record.worker}`}</Text>
              <Text style={styles.employeeId}>ID: {record.worker_employee_id || 'N/A'}</Text>
              <Text style={styles.employeeId}>Date: {record.date}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{record.status}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Timings</Text>
          <View style={styles.grid}>
            <View style={styles.cell}>
              <Text style={styles.cellTitle}>CHECK-IN</Text>
              <Text style={styles.cellVal}>{checkInTime}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellTitle}>CHECK-OUT</Text>
              <Text style={styles.cellVal}>{checkOutTime}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellTitle}>DURATION</Text>
              <Text style={styles.cellVal}>{record.duration_formatted || '--'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Location</Text>
          <View style={styles.grid}>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text style={styles.cellTitle}>GPS COORDINATES</Text>
              <Text style={styles.cellVal}>
                {record.latitude && record.longitude ? `📍 ${record.latitude.toFixed(5)}, ${record.longitude.toFixed(5)}` : 'Location pending'}
              </Text>
            </View>
          </View>

          {record.check_out_at && (
            <>
              <View style={styles.divider} />
              <Text style={styles.label}>Checkout Details</Text>
              
              <View style={styles.grid}>
                <View style={styles.cell}>
                  <Text style={styles.cellTitle}>PANCHAYAT VISITED</Text>
                  <Text style={styles.cellVal}>{record.panchayat_visited || 'N/A'}</Text>
                </View>
                <View style={styles.cell}>
                  <Text style={styles.cellTitle}>FIC VISITED</Text>
                  <Text style={styles.cellVal}>{record.fic_visited || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.grid}>
                <View style={styles.cell}>
                  <Text style={styles.cellTitle}>MEMBERS ATTENDED</Text>
                  <Text style={styles.cellVal}>{record.members_attended !== null ? record.members_attended : 'N/A'}</Text>
                </View>
                <View style={styles.cell}>
                  <Text style={styles.cellTitle}>PURPOSE OF VISIT</Text>
                  <Text style={styles.cellVal}>{record.purpose_of_visit || 'N/A'}</Text>
                </View>
              </View>

              {record.work_details ? (
                <View style={[styles.grid, { marginTop: 10 }]}>
                  <View style={[styles.cell, { width: '100%' }]}>
                    <Text style={styles.cellTitle}>WORK DETAILS</Text>
                    <Text style={[styles.cellVal, { fontWeight: '500', color: '#475569' }]}>{record.work_details}</Text>
                  </View>
                </View>
              ) : null}
            </>
          )}

        </View>

        {(record.status === 'PENDING' || record.status === 'FLAGGED') && (
          <View style={styles.card}>
            <Text style={styles.label}>Review Actions</Text>
            <TextInput
              style={styles.input}
              placeholder="Reason for rejection (if rejecting)"
              placeholderTextColor="#94A3B8"
              value={rejectionNote}
              onChangeText={setRejectionNote}
            />
            
            <View style={styles.actionBtnRow}>
              <TouchableOpacity 
                style={[styles.btn, styles.btnReject]}
                disabled={updating}
                onPress={() => handleAction('reject')}
              >
                <Text style={styles.btnRejectText}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.btn, styles.btnApprove]}
                disabled={updating}
                onPress={() => handleAction('approve')}
              >
                {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnApproveText}>Approve</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16, backgroundColor: '#F8FAFC' },
  backBtn: { paddingVertical: 8, paddingRight: 12 },
  backText: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginLeft: 8 },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  imageCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  image: { width: '100%', height: 280 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  workerName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  employeeId: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  label: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 16, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 4 },
  cell: { width: '48%', marginBottom: 12 },
  cellTitle: { fontSize: 11, color: '#64748B', fontWeight: '800', marginBottom: 4 },
  cellVal: { fontSize: 15, color: '#0F172A', fontWeight: '700' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 14, fontSize: 14, color: '#0F172A', marginBottom: 16 },
  actionBtnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnApprove: { backgroundColor: '#0F172A', marginLeft: 8 },
  btnApproveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  btnReject: { backgroundColor: '#FFFFFF', borderColor: '#FECACA', borderWidth: 1, marginRight: 8 },
  btnRejectText: { color: '#DC2626', fontWeight: '700', fontSize: 14 }
});
