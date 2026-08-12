import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { apiClient } from '../../api/client';

export default function Verify({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed' | 'flagged' | 'done'>('pending');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [targetRecord, setTargetRecord] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/attendance/');
      setRecords(res.data.results || res.data || []);
    } catch (e) {
      console.warn("Failed to fetch verification queue", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOne = async (record: any) => {
    try {
      await apiClient.patch(`/api/attendance/${record.id}/verify/`, {
        action: 'approve'
      });
      // Update item state immediately
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: 'APPROVED' } : r));
      Alert.alert('Approved', `✓ ${record.worker_name || 'Worker'} — attendance verified`);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to approve attendance');
    }
  };

  const handleBulkApprove = async () => {
    try {
      const res = await apiClient.post('/api/attendance/bulk-approve/');
      const count = res.data.approved_count || 0;
      Alert.alert('Bulk Approved', `✓ ${count} eligible submissions approved in bulk`);
      fetchRecords();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Bulk approval failed');
    }
  };

  const openReject = (record: any) => {
    setTargetRecord(record);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!targetRecord) return;
    try {
      await apiClient.patch(`/api/attendance/${targetRecord.id}/verify/`, {
        action: 'reject',
        rejection_note: rejectReason.trim() || 'Verification rejected by administrator'
      });
      // Update state immediately so item moves out of pending/flagged queue
      setRecords(prev => prev.map(r => r.id === targetRecord.id ? { ...r, status: 'REJECTED' } : r));
      setRejectModalVisible(false);
      Alert.alert('Rejected', `✗ ${targetRecord.worker_name || 'Worker'} attendance rejected`);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to reject attendance');
    }
  };

  const pendingList = records.filter(r => r.status === 'PENDING');
  const activeList = records.filter(r => !r.check_out_at); // Currently checked in
  const completedList = records.filter(r => !!r.check_out_at); // Checked out
  const flaggedList = records.filter(r => r.status === 'FLAGGED' || (r.anomaly_flags && r.anomaly_flags.length > 0));
  const approvedList = records.filter(r => r.status === 'APPROVED');

  const displayedList = activeTab === 'pending' 
    ? pendingList 
    : activeTab === 'active'
    ? activeList
    : activeTab === 'completed'
    ? completedList
    : activeTab === 'flagged' 
    ? flaggedList 
    : approvedList;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Verify Attendance</Text>

        {/* Tab Pill Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={styles.atabs}>
            <TouchableOpacity 
              style={[styles.atab, activeTab === 'pending' && styles.atabActive]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.atabText, activeTab === 'pending' && styles.atabTextActive]}>
                Pending ({pendingList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.atab, activeTab === 'active' && styles.atabActive]}
              onPress={() => setActiveTab('active')}
            >
              <Text style={[styles.atabText, activeTab === 'active' && styles.atabTextActive]}>
                Checked In ({activeList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.atab, activeTab === 'completed' && styles.atabActive]}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[styles.atabText, activeTab === 'completed' && styles.atabTextActive]}>
                Checked Out ({completedList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.atab, activeTab === 'flagged' && styles.atabActive]}
              onPress={() => setActiveTab('flagged')}
            >
              <Text style={[styles.atabText, activeTab === 'flagged' && styles.atabTextActive]}>
                Flagged ({flaggedList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.atab, activeTab === 'done' && styles.atabActive]}
              onPress={() => setActiveTab('done')}
            >
              <Text style={[styles.atabText, activeTab === 'done' && styles.atabTextActive]}>
                Approved ({approvedList.length})
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bulk Approve Banner */}
        {activeTab === 'pending' && pendingList.length > 0 && (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkText}>✓ {pendingList.length} pending for approval</Text>
            <TouchableOpacity style={styles.bulkBtn} onPress={handleBulkApprove}>
              <Text style={styles.bulkBtnText}>Approve eligible</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Verification Cards */}
        {loading ? (
          <ActivityIndicator color="#2F8F5B" style={{ marginVertical: 40 }} />
        ) : displayedList.length === 0 ? (
          <View style={styles.vCard}>
            <Text style={{ textAlign: 'center', color: '#63796B', paddingVertical: 20 }}>
              No {activeTab} attendance records found.
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {displayedList.map(item => {
              const initials = item.worker_name
                ? item.worker_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                : 'EMP';

              const checkInStr = item.marked_at ? new Date(item.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
              const checkOutStr = item.check_out_at ? new Date(item.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress';
              const durationStr = item.duration_formatted || '--';

              return (
                <View key={item.id} style={styles.vCard}>
                  <View style={styles.vTop}>
                    <View style={[styles.vThumb, { backgroundColor: item.status === 'APPROVED' ? '#2F8F5B' : item.status === 'FLAGGED' ? '#C24936' : '#1A6DB5' }]}>
                      <Text style={styles.vThumbText}>{initials}</Text>
                    </View>
                    <TouchableOpacity style={styles.vInfo} onPress={() => navigation.navigate('VerificationDetail', { recordId: item.id })}>
                      <Text style={styles.vName}>{item.worker_name || item.worker_detail?.name || `Worker #${item.worker}`}</Text>
                      <Text style={styles.vMeta}>
                        ID: {item.worker_employee_id || item.worker_detail?.employee_id || 'N/A'} · {item.zone_name || 'Zone'} · {item.date}
                      </Text>
                      
                      <Text style={[styles.vMeta, { color: '#16241C', fontWeight: '600', marginTop: 4 }]}>
                        In: {checkInStr}  |  Out: {checkOutStr}  |  Duration: {durationStr}
                      </Text>

                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        {item.gps_match === 'MATCHED' ? (
                          <View style={styles.gpsPillOk}>
                            <Text style={styles.gpsPillOkText}>✓ In zone</Text>
                          </View>
                        ) : (
                          <View style={styles.gpsPillBad}>
                            <Text style={styles.gpsPillBadText}>⚠ GPS review</Text>
                          </View>
                        )}

                        <View style={[styles.gpsPillOk, { backgroundColor: item.check_out_at ? '#DCF2E3' : '#FBEDD3' }]}>
                          <Text style={[styles.gpsPillOkText, { color: item.check_out_at ? '#1F6B42' : '#B9791C' }]}>
                            {item.check_out_at ? 'Checked Out' : 'Checked In'}
                          </Text>
                        </View>
                      </View>

                      {item.anomaly_flags && item.anomaly_flags.length > 0 && (
                        <View style={styles.flagChipRow}>
                          {item.anomaly_flags.map((flag: string, idx: number) => (
                            <View key={idx} style={styles.flagChip}>
                              <Text style={styles.flagChipText}>{flag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {(item.status === 'PENDING' || item.status === 'FLAGGED') && (
                    <View style={styles.actRow}>
                      <TouchableOpacity style={styles.actBtnApprove} onPress={() => handleApproveOne(item)}>
                        <Text style={styles.actBtnApproveText}>✓ Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actBtnReject} onPress={() => openReject(item)}>
                        <Text style={styles.actBtnRejectText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* Reject Reason Modal Sheet */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Reject Submission</Text>
            <Text style={styles.modalSub}>Add reason for {targetRecord?.worker_name || 'worker'}. They will be notified.</Text>

            <TextInput
              style={styles.textarea}
              placeholder="e.g. Photo not clear, GPS outside zone…"
              placeholderTextColor="#9BAFA2"
              multiline
              numberOfLines={3}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setRejectModalVisible(false)}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnRed} onPress={confirmReject}>
                <Text style={styles.btnRedText}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3FAF5',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16241C',
    marginBottom: 14,
  },
  atabs: {
    flexDirection: 'row',
    backgroundColor: '#EAF6EE',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  atab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  atabActive: {
    backgroundColor: '#2F8F5B',
  },
  atabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#63796B',
  },
  atabTextActive: {
    color: '#FFFFFF',
  },
  bulkBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DCF2E3',
    borderWidth: 1,
    borderColor: '#B9DCC4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  bulkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F6B42',
  },
  bulkBtn: {
    backgroundColor: '#2F8F5B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bulkBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  cardList: {
    gap: 10,
  },
  vCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 16,
    padding: 14,
  },
  vTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  vThumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vThumbText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  vInfo: {
    flex: 1,
  },
  vName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16241C',
  },
  vMeta: {
    fontSize: 11,
    color: '#63796B',
    marginTop: 2,
  },
  gpsPillOk: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCF2E3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  gpsPillOkText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1F6B42',
  },
  gpsPillBad: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBE5E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  gpsPillBadText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C24936',
  },
  flagChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  flagChip: {
    backgroundColor: '#FBEDD3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  flagChipText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#B9791C',
  },
  actRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actBtnApprove: {
    flex: 1,
    backgroundColor: '#DCF2E3',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  actBtnApproveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F6B42',
  },
  actBtnReject: {
    flex: 1,
    backgroundColor: '#FBE5E1',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  actBtnRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C24936',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 14, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#F3FAF5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#DCEEE2',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16241C',
  },
  modalSub: {
    fontSize: 12.5,
    color: '#63796B',
    marginTop: 2,
    marginBottom: 14,
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: '#DCEEE2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#16241C',
    backgroundColor: '#FFFFFF',
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  btnGhost: {
    flex: 1,
    backgroundColor: '#EAF6EE',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16241C',
  },
  btnRed: {
    flex: 1,
    backgroundColor: '#FBE5E1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnRedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C24936',
  },
});


