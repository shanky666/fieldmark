import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { apiClient } from '../../api/client';
import { COLORS } from '../../constants/colors';
import { CONFIG } from '../../constants/config';

export default function LeaveReview() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/leave/');
      let data = res.data.results || res.data || [];
      data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLeaves(data);
    } catch (e) {
      console.error('Failed to fetch leave requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleReview = async (id: number, action: 'approve' | 'reject') => {
    setSubmitting(true);
    try {
      await apiClient.patch(`/api/leave/${id}/review/`, {
        action,
        rejection_note: action === 'reject' ? 'Rejected by Administrator' : ''
      });
      Alert.alert('Success', `Leave request ${action}d successfully.`);
      fetchLeaves();
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Review failed';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openDocument = (docPath: string) => {
    const url = docPath.startsWith('http') ? docPath : `${CONFIG.API_BASE_URL}${docPath}`;
    Linking.openURL(url);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Leave Requests</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : leaves.length === 0 ? (
          <Text style={styles.emptyText}>No leave requests found.</Text>
        ) : (
          leaves.map((item) => {
            const startDate = new Date(item.start_date);
            const endDate = new Date(item.end_date);
            const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
            const statusStyle = getStatusStyle(item.status);

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.empName}>{item.worker_detail?.name || 'Employee'}</Text>
                    <Text style={styles.leaveType}>{item.leave_type.replace('_', ' ')} LEAVE</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.divider} />
                
                <Text style={styles.detailLbl}>DATES</Text>
                <Text style={styles.detailVal}>
                  {item.start_date} to {item.end_date} ({daysCount} day{daysCount > 1 ? 's' : ''})
                </Text>

                {item.reason ? (
                  <>
                    <Text style={[styles.detailLbl, { marginTop: 16 }]}>REASON</Text>
                    <Text style={styles.reasonVal}>"{item.reason}"</Text>
                  </>
                ) : null}

                {item.proof_document ? (
                  <TouchableOpacity style={styles.docBtn} onPress={() => openDocument(item.proof_document)}>
                    <Text style={styles.docBtnText}>📎 View Proof Document</Text>
                  </TouchableOpacity>
                ) : null}

                {item.status === 'PENDING' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.btn, styles.rejectBtn]}
                      disabled={submitting}
                      onPress={() => handleReview(item.id, 'reject')}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.approveBtn]}
                      disabled={submitting}
                      onPress={() => handleReview(item.id, 'approve')}
                    >
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16, backgroundColor: '#F8FAFC' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 14, fontWeight: '500' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  empName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  leaveType: { fontSize: 12, color: '#3B82F6', fontWeight: '700', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  detailLbl: { fontSize: 11, color: '#64748B', fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
  detailVal: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
  reasonVal: { fontSize: 14, color: '#475569', fontStyle: 'italic', fontWeight: '500' },
  docBtn: { marginTop: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, alignSelf: 'flex-start' },
  docBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FECACA', marginRight: 8 },
  rejectBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  approveBtn: { backgroundColor: '#0F172A', marginLeft: 8 },
  approveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 }
});
