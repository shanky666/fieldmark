import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
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
      setWorkersList(workers.filter((w: any) => !w.is_superuser)); // hide superadmins
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
        <Text style={styles.pageTitle}>Employee Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddWorker', { role: 'WORKER' })}>
          <Text style={styles.addBtnText}>+ Add Employee</Text>
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
                    <Text style={styles.actionBtnText}>View / Edit</Text>
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
    backgroundColor: '#F3FAF5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16241C',
  },
  addBtn: {
    backgroundColor: '#1F6B42',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    paddingBottom: 80,
  },
  emptyText: {
    textAlign: 'center',
    color: '#63796B',
    marginTop: 40,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  empBasic: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF6EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F6B42',
  },
  empName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16241C',
  },
  empDetails: {
    fontSize: 13,
    color: '#63796B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusActive: {
    backgroundColor: '#EAF6EE',
  },
  statusActiveText: {
    color: '#2F8F5B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusInactive: {
    backgroundColor: '#FDECEC',
  },
  statusInactiveText: {
    color: '#C24936',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  actionBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  suspendBtn: {
    backgroundColor: '#FDECEC',
  },
  suspendBtnText: {
    color: '#C24936',
  },
  activateBtn: {
    backgroundColor: '#EAF6EE',
  },
  activateBtnText: {
    color: '#1F6B42',
  }
});
