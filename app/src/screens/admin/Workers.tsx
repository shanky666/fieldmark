import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiClient } from '../../api/client';
import { COLORS } from '../../constants/colors';

export default function Workers({ navigation }: any) {
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchWorkers();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/workers/list/');
      let workers = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.results) ? res.data.results : [];
      setWorkersList(workers.filter((w: any) => !w.is_superuser));
    } catch (e: any) {
      console.error('Failed to load employees', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (workerId: number, currentStatus: boolean, name: string) => {
    Alert.alert(
      currentStatus ? 'Suspend Employee' : 'Activate Employee',
      `Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: currentStatus ? 'Suspend' : 'Activate', 
          style: currentStatus ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await apiClient.patch(`/api/workers/list/${workerId}/`, { is_active: !currentStatus });
              fetchWorkers();
            } catch (e) {
              Alert.alert('Error', 'Failed to change status.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Employees</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddWorker', { role: 'WORKER' })}>
          <Text style={styles.addBtnText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : workersList.length === 0 ? (
          <Text style={styles.emptyText}>No employees found.</Text>
        ) : (
          workersList.map((worker) => {
            const displayName = worker.name || 'Worker';
            const initials = displayName.substring(0, 2).toUpperCase();
            const isActive = worker.is_active !== false;

            return (
              <View key={worker.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.empBasic}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View>
                      <Text style={styles.empName}>{displayName}</Text>
                      <Text style={styles.empDetails}>ID: {worker.employee_id || worker.id}</Text>
                      <Text style={styles.empDetails}>{worker.phone}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, isActive ? styles.statusActiveText : styles.statusInactiveText]}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('WorkerDetail', { workerId: worker.id })}>
                    <Text style={styles.actionBtnText}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, isActive ? styles.suspendBtn : styles.activateBtn]} 
                    onPress={() => handleToggleStatus(worker.id, isActive, displayName)}
                  >
                    <Text style={[styles.actionBtnText, isActive ? styles.suspendBtnText : styles.activateBtnText]}>
                      {isActive ? 'Suspend' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: '#F8FAFC',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  addBtn: {
    backgroundColor: '#1F6B42',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  empBasic: {
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
  empDetails: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusActiveText: {
    color: '#059669',
  },
  statusInactive: {
    backgroundColor: '#FEF2F2',
  },
  statusInactiveText: {
    color: '#DC2626',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  actionBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  suspendBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FECACA',
  },
  suspendBtnText: {
    color: '#DC2626',
  },
  activateBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A7F3D0',
  },
  activateBtnText: {
    color: '#059669',
  }
});
