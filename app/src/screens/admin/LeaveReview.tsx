import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { apiClient } from '../../api/client';
import { COLORS } from '../../constants/colors';
import { CONFIG } from '../../constants/config';
import StatusBadge from '../../components/StatusBadge';

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

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.empName}>{item.worker_detail?.name || 'Employee'}</Text>
                    <Text style={styles.leaveType}>{item.leave_type.replace('_', ' ')} LEAVE</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <View style={styles.divider} />
                
                <Text style={styles.detailLbl}>DATES</Text>
                <Text style={styles.detailVal}>
                  {item.start_date} to {item.end_date} ({daysCount} day{daysCount > 1 ? 's' : ''})
                </Text>

                {item.reason ? (
                  <>
                    <Text style={[styles.detailLbl, { marginTop: 12 }]}>REASON</Text>
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
  container: { flex: 1, backgroundColor: '#F3FAF5' },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#16241C' },
  content: { padding: 20, paddingBottom: 80 },
  emptyText: { textAlign: 'center', color: '#63796B', marginTop: 40, fontSize: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  empName: { fontSize: 16, fontWeight: 'bold', color: '#16241C' },
  leaveType: { fontSize: 12, color: '#1F6B42', fontWeight: 'bold', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  detailLbl: { fontSize: 11, color: '#63796B', fontWeight: 'bold', marginBottom: 4 },
  detailVal: { fontSize: 14, color: '#16241C', fontWeight: '600' },
  reasonVal: { fontSize: 14, color: '#475569', fontStyle: 'italic' },
  docBtn: { marginTop: 16, backgroundColor: '#EAF6EE', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  docBtnText: { color: '#1F6B42', fontWeight: 'bold', fontSize: 13 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#FDECEC', marginRight: 8 },
  rejectBtnText: { color: '#C24936', fontWeight: 'bold' },
  approveBtn: { backgroundColor: '#1F6B42', marginLeft: 8 },
  approveBtnText: { color: '#FFFFFF', fontWeight: 'bold' }
});
