import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { apiClient } from '../../api/client';

export default function Workers({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('all');

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [role, setRole] = useState('WORKER');
  const [initialPassword, setInitialPassword] = useState('');

  const [workersList, setWorkersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);

    try {
      console.log('[WORKERS] Calling /api/workers/list/');

      const res = await apiClient.get('/api/workers/list/');

      console.log('[WORKERS] STATUS:', res.status);
      console.log('[WORKERS] DATA TYPE:', typeof res.data);
      console.log('[WORKERS] DATA:', JSON.stringify(res.data));

      console.log('[WORKERS] ARRAY LENGTH:', Array.isArray(res.data) ? res.data.length : -1);
      setWorkersList(
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
            ? res.data.results
            : []
      );

    } catch (e: any) {
      console.error('[WORKERS] ERROR:', e?.message);
      console.error('[WORKERS] RESPONSE:', e?.response?.status);
      console.error('[WORKERS] DATA:', JSON.stringify(e?.response?.data));
    } finally {
      setLoading(false);
    }
  };

  const saveNewWorker = async () => {
    if (!fname.trim()) {
      Alert.alert('Required', 'Please enter first name.');
      return;
    }
    if (!initialPassword.trim()) {
      Alert.alert('Required', 'Please enter an Initial Password.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter Phone Number.');
      return;
    }

    try {
      await apiClient.post('/api/auth/register/', {
        name: `${fname.trim()} ${lname.trim()}`.trim(),
        employee_id: employeeIdInput.trim() || undefined,
        phone: phone.trim(),
        role: role,
        password: initialPassword.trim()
      });

      setAddModalVisible(false);
      setFname(''); setLname(''); setPhone(''); setEmployeeIdInput(''); setInitialPassword('');
      Alert.alert('Worker Added', `✓ ${fname} registered in database.`);
      fetchWorkers();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to add worker to database.');
    }
  };

  const filteredWorkers = workersList.filter(w => {
    const nameStr = w.name || `${w.first_name || ''} ${w.last_name || ''}`;
    const matchesQuery = `${nameStr} ${w.employee_id || ''} ${w.zone || ''} ${w.role || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedZoneFilter === 'all') return matchesQuery;
    if (selectedZoneFilter === 'inactive') return matchesQuery && w.is_active === false;
    return matchesQuery && (w.assigned_zone_name === selectedZoneFilter || w.zone === selectedZoneFilter);
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Employees</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{workersList.length} total</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or zone…"
            placeholderTextColor="#9BAFA2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {['all', 'Facade A', 'Facade B', 'Block C', 'inactive'].map(chip => (
            <TouchableOpacity 
              key={chip} 
              style={[styles.zoneChip, selectedZoneFilter === chip && styles.zoneChipSel]}
              onPress={() => setSelectedZoneFilter(chip)}
            >
              <Text style={[styles.zoneChipText, selectedZoneFilter === chip && styles.zoneChipTextSel]}>
                {chip === 'all' ? 'All' : chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Worker List */}
        {loading ? (
          <ActivityIndicator color="#2F8F5B" style={{ marginVertical: 30 }} />
        ) : filteredWorkers.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#63796B', marginVertical: 30 }}>No registered workers found.</Text>
        ) : (
          <View style={styles.empList}>
            {filteredWorkers.map(e => {
              const displayName = e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Worker';
              const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              const isStaff = e.is_staff || e.role === 'Supervisor';
              const isActive = e.is_active !== false;

              return (
                <TouchableOpacity key={e.id} style={styles.empRow} onPress={() => navigation.navigate('WorkerDetail', { workerId: e.id })}>
                  <View style={[styles.thumb, { backgroundColor: isStaff ? '#B9791C' : '#2F8F5B' }]}>
                    <Text style={styles.thumbText}>{initials}</Text>
                  </View>
                  <View style={styles.empInfo}>
                    <Text style={styles.empName}>{displayName}</Text>
                    <Text style={styles.empRole}>{e.assigned_zone_name || e.zone || 'Site'} · {isStaff ? 'Supervisor' : 'Employee'}</Text>
                  </View>
                  <View style={styles.empRight}>
                    <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                      <Text style={isActive ? styles.badgeActiveText : styles.badgeInactiveText}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    <Text style={styles.eid}>{e.employee_id || e.eid || `ID #${e.id}`}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* Floating Action Button (+) */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Worker Sheet Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Employee</Text>
            <Text style={styles.modalSub}>Register a new employee into the database.</Text>

            <View style={styles.fieldRow}>
              <View style={styles.fieldFlex}>
                <Text style={styles.label}>FIRST NAME</Text>
                <TextInput style={styles.input} placeholder="Rajan" placeholderTextColor="#9BAFA2" value={fname} onChangeText={setFname} />
              </View>
              <View style={styles.fieldFlex}>
                <Text style={styles.label}>LAST NAME</Text>
                <TextInput style={styles.input} placeholder="Patil" placeholderTextColor="#9BAFA2" value={lname} onChangeText={setLname} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>EMPLOYEE ID (OPTIONAL, AUTO-GENERATED)</Text>
              <TextInput style={styles.input} placeholder="e.g. EMP-1042" placeholderTextColor="#9BAFA2" value={employeeIdInput} onChangeText={setEmployeeIdInput} autoCapitalize="characters" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <TextInput style={styles.input} placeholder="+91 98765 43210" placeholderTextColor="#9BAFA2" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>DESIGNATION / ROLE</Text>
              <TextInput style={styles.input} placeholder="Technician, Mason, Engineer" placeholderTextColor="#9BAFA2" value={role} onChangeText={setRole} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>INITIAL PASSWORD</Text>
              <TextInput style={styles.input} placeholder="Enter a password" placeholderTextColor="#9BAFA2" value={initialPassword} onChangeText={setInitialPassword} secureTextEntry />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={saveNewWorker}>
                <Text style={styles.btnPrimaryText}>Save Employee</Text>
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
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16241C',
  },
  totalBadge: {
    backgroundColor: '#DCF2E3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  totalBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1F6B42',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#16241C',
  },
  chipScroll: {
    gap: 6,
    marginBottom: 16,
  },
  zoneChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  zoneChipSel: {
    backgroundColor: '#DCF2E3',
    borderColor: '#DCF2E3',
  },
  zoneChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#63796B',
  },
  zoneChipTextSel: {
    color: '#1F6B42',
    fontWeight: '700',
  },
  empList: {
    gap: 9,
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 16,
    padding: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumbText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  empInfo: {
    flex: 1,
  },
  empName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16241C',
  },
  empRole: {
    fontSize: 11.5,
    color: '#63796B',
    marginTop: 2,
  },
  empRight: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeActive: { backgroundColor: '#DCF2E3' },
  badgeActiveText: { color: '#1F6B42', fontSize: 10.5, fontWeight: '700' },
  badgeInactive: { backgroundColor: '#FBE5E1' },
  badgeInactiveText: { color: '#C24936', fontSize: 10.5, fontWeight: '700' },
  eid: {
    fontSize: 11,
    color: '#63796B',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2F8F5B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F6B42',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
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
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  fieldFlex: {
    flex: 1,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#63796B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#DCEEE2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#16241C',
    backgroundColor: '#FFFFFF',
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
  btnPrimary: {
    flex: 1.5,
    backgroundColor: '#2F8F5B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

