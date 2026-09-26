import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiClient } from '../../api/client';
import { COLORS } from '../../constants/colors';

export default function Verify({ navigation }: any) {
  const [groupedRecords, setGroupedRecords] = useState<{ worker_name: string, worker_id: number, records: any[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorker, setExpandedWorker] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRecords();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/attendance/');
      let data = res.data.results || res.data || [];
      
      // Group by worker
      const groups: Record<number, { worker_name: string, worker_id: number, records: any[] }> = {};
      data.forEach((r: any) => {
        if (!groups[r.worker]) {
          groups[r.worker] = { worker_name: r.worker_name || `Worker #${r.worker}`, worker_id: r.worker, records: [] };
        }
        groups[r.worker].records.push(r);
      });

      // Sort each worker's records by date (newest first)
      const sortedGroups = Object.values(groups).map(group => {
        group.records.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return group;
      });

      // Sort groups alphabetically
      sortedGroups.sort((a, b) => a.worker_name.localeCompare(b.worker_name));

      setGroupedRecords(sortedGroups);
    } catch (e) {
      console.warn("Failed to fetch attendance records", e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (recordId: number, action: 'approve' | 'reject') => {
    Alert.alert(
      action === 'approve' ? 'Approve Attendance' : 'Reject Attendance',
      `Are you sure you want to ${action} this record?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action === 'approve' ? 'Approve' : 'Reject', 
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await apiClient.patch(`/api/attendance/${recordId}/verify/`, {
                action: action,
                rejection_note: action === 'reject' ? 'Rejected by Admin' : ''
              });
              Alert.alert('Success', `Attendance ${action}d successfully.`);
              fetchRecords();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || `Failed to ${action} attendance.`);
            }
          }
        }
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PRESENT': return { bg: '#ECFDF5', text: '#059669' };
      case 'APPROVED': return { bg: '#ECFDF5', text: '#059669' };
      case 'PENDING': return { bg: '#EFF6FF', text: '#3B82F6' };
      case 'FLAGGED': return { bg: '#FFF7ED', text: '#EA580C' };
      case 'REJECTED': return { bg: '#FEF2F2', text: '#DC2626' };
      case 'ABSENT': return { bg: '#FEF2F2', text: '#DC2626' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const toggleExpand = (workerId: number) => {
    if (expandedWorker === workerId) {
      setExpandedWorker(null);
    } else {
      setExpandedWorker(workerId);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Attendance Directory</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.infoText}>Tap an employee to view their daily attendance history.</Text>
        
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : groupedRecords.length === 0 ? (
          <Text style={styles.emptyText}>No attendance records found.</Text>
        ) : (
          groupedRecords.map((group) => {
            const isExpanded = expandedWorker === group.worker_id;

            return (
              <View key={group.worker_id} style={styles.card}>
                <TouchableOpacity 
                  style={styles.cardTop} 
                  onPress={() => toggleExpand(group.worker_id)}
                >
                  <View style={styles.rowContent}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{group.worker_name.substring(0, 2).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.empName}>{group.worker_name}</Text>
                      <Text style={styles.dateText}>{group.records.length} records</Text>
                    </View>
                  </View>
                  <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.historyList}>
                    {group.records.map((record) => {
                      const checkIn = record.marked_at ? new Date(record.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                      const checkOut = record.check_out_at ? new Date(record.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                      const statusStyle = getStatusStyle(record.status);

                      return (
                        <TouchableOpacity 
                          key={record.id}
                          style={styles.historyRow}
                          onPress={() => navigation.navigate('VerificationDetail', { recordId: record.id })}
                        >
                          <View style={styles.historyMeta}>
                            <Text style={styles.historyDate}>{record.date}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                              <Text style={[styles.statusText, { color: statusStyle.text }]}>{record.status}</Text>
                            </View>
                          </View>
                          <View style={styles.historyDetails}>
                            <Text style={styles.historyTime}>In: {checkIn}</Text>
                            <Text style={styles.historyTime}>Out: {checkOut}</Text>
                            <Text style={styles.historyTime}>Hrs: {record.duration_formatted || '--'}</Text>
                          </View>

                          <View style={{ marginTop: 8 }}>
                            <Text style={{ fontSize: 12, color: '#64748B' }}>
                              📍 {record.village_visited || 'Location pending'}
                              {record.gps_match === 'MATCHED' ? ' (In Zone)' : ' (Outside Zone)'}
                            </Text>
                          </View>
                          
                          {record.status === 'PENDING' && (
                            <View style={{ flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }}>
                              <TouchableOpacity 
                                style={{ flex: 1, backgroundColor: '#FFFFFF', borderColor: '#DC2626', borderWidth: 1, borderRadius: 8, padding: 8, alignItems: 'center', marginRight: 6 }}
                                onPress={() => handleQuickAction(record.id, 'reject')}
                              >
                                <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 12 }}>Reject</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={{ flex: 1, backgroundColor: '#1F6B42', borderRadius: 8, padding: 8, alignItems: 'center', marginLeft: 6 }}
                                onPress={() => handleQuickAction(record.id, 'approve')}
                              >
                                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }}>Approve</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    backgroundColor: '#1F6B42',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoText: {
    color: '#64748B',
    marginBottom: 20,
    marginTop: 10,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 40,
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F3FAF5',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: 14,
    color: '#94A3B8',
  },
  historyList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 10,
  },
  historyRow: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyTime: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
});
