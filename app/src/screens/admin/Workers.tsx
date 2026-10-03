import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
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

  const handleDeleteWorker = async (workerId: number, name: string) => {
    Alert.alert(
      'Remove Personnel',
      `Are you sure you want to permanently delete ${name}? This will remove them from the dashboard.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/workers/list/${workerId}/`);
              fetchWorkers();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete personnel.');
            }
          }
        }
      ]
    );
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'STAFF'>('EMPLOYEE');

  const filteredWorkers = workersList.filter((w: any) => {
    const matchesSearch = w.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.phone?.includes(searchQuery) || 
                          w.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'STAFF' ? w.is_staff : !w.is_staff;
    return matchesSearch && matchesTab;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Personnel</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => navigation.navigate('AddWorker', { role: activeTab === 'STAFF' ? 'SUPERVISOR' : 'WORKER' })}
        >
          <Text style={styles.addBtnText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 4, marginBottom: 12 }}>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: activeTab === 'EMPLOYEE' ? '#FFFFFF' : 'transparent' }}
            onPress={() => setActiveTab('EMPLOYEE')}
          >
            <Text style={{ fontWeight: '600', color: activeTab === 'EMPLOYEE' ? COLORS.primary : '#64748B' }}>Employees</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: activeTab === 'STAFF' ? '#FFFFFF' : 'transparent' }}
            onPress={() => setActiveTab('STAFF')}
          >
            <Text style={{ fontWeight: '600', color: activeTab === 'STAFF' ? COLORS.primary : '#64748B' }}>Staff</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', color: '#0F172A' }}
          placeholder={`Search ${activeTab === 'STAFF' ? 'staff' : 'employees'}...`}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : filteredWorkers.length === 0 ? (
          <Text style={styles.emptyText}>No personnel found.</Text>
        ) : (
          filteredWorkers.map((worker) => {
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
                    style={[styles.actionBtn, styles.suspendBtn]} 
                    onPress={() => handleDeleteWorker(worker.id, displayName)}
                  >
                    <Text style={[styles.actionBtnText, styles.suspendBtnText]}>
                      Delete
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
