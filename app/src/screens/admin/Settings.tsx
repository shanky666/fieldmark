import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, Alert, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';

export default function Settings() {
  const { logout } = useAuthStore();

  const [shifts, setShifts] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [gpsCheck, setGpsCheck] = useState(true);
  const [dupCheck, setDupCheck] = useState(true);
  const [speedCheck, setSpeedCheck] = useState(true);
  const [cutoffCheck, setCutoffCheck] = useState(false);
  const [deviceCheck, setDeviceCheck] = useState(true);

  const [morningReminder, setMorningReminder] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [contractAlerts, setContractAlerts] = useState(true);

  // Shift Modal State
  const [addShiftVisible, setAddShiftVisible] = useState(false);
  const [shiftName, setShiftName] = useState('');
  const [shiftStart, setShiftStart] = useState('09:00:00');
  const [shiftEnd, setShiftEnd] = useState('18:00:00');
  const [shiftCreating, setShiftCreating] = useState(false);

  // Zone Modal State
  const [addZoneVisible, setAddZoneVisible] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneRadius, setZoneRadius] = useState('500');
  const [zoneColor, setZoneColor] = useState('#3a7c3a');
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [zoneCreating, setZoneCreating] = useState(false);

  // Admin Modal State
  const [addAdminVisible, setAddAdminVisible] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminCreating, setAdminCreating] = useState(false);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    setLoadingData(true);
    try {
      const [shiftsRes, zonesRes] = await Promise.all([
        apiClient.get('/api/workers/shifts/'),
        apiClient.get('/api/workers/zones/')
      ]);
      const loadedShifts = shiftsRes.data.results || shiftsRes.data || [];
      const loadedZones = zonesRes.data.results || zonesRes.data || [];
      setShifts(loadedShifts);
      setZones(loadedZones);
      if (loadedShifts.length > 0 && !selectedShiftId) {
        setSelectedShiftId(loadedShifts[0].id);
      }
    } catch (e) {
      console.warn("Failed to load settings data", e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddShift = async () => {
    if (!shiftName.trim()) {
      Alert.alert('Required', 'Please enter a shift name.');
      return;
    }
    setShiftCreating(true);
    try {
      const res = await apiClient.post('/api/workers/shifts/', {
        name: shiftName.trim(),
        window_start: shiftStart.trim(),
        window_end: shiftEnd.trim(),
      });
      setAddShiftVisible(false);
      setShiftName('');
      setShifts(prev => [...prev, res.data]);
      if (!selectedShiftId) setSelectedShiftId(res.data.id);
      Alert.alert('Success', `Shift "${res.data.name}" added successfully.`);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create shift.');
    } finally {
      setShiftCreating(false);
    }
  };

  const handleDeleteShift = (shiftId: number, name: string) => {
    Alert.alert('Delete Shift', `Are you sure you want to delete shift "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/workers/shifts/${shiftId}/`);
            setShifts(prev => prev.filter(s => s.id !== shiftId));
            Alert.alert('Deleted', `Shift "${name}" deleted.`);
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.detail || 'Failed to delete shift.');
          }
        }
      }
    ]);
  };

  const handleAddZone = async () => {
    if (!zoneName.trim()) {
      Alert.alert('Required', 'Please enter a zone name.');
      return;
    }

    let targetShiftId = selectedShiftId;
    if (!targetShiftId && shifts.length > 0) {
      targetShiftId = shifts[0].id;
    }

    if (!targetShiftId) {
      Alert.alert('Shift Required', 'Please create a Shift first before adding a Zone.');
      return;
    }

    setZoneCreating(true);
    try {
      const res = await apiClient.post('/api/workers/zones/', {
        name: zoneName.trim(),
        center_lat: 12.9716,
        center_lng: 77.5946,
        radius_meters: parseFloat(zoneRadius) || 500.0,
        shift: targetShiftId,
        color_hex: zoneColor.trim() || '#3a7c3a'
      });
      setAddZoneVisible(false);
      setZoneName('');
      setZones(prev => [...prev, res.data]);
      Alert.alert('Success', `Zone "${res.data.name}" added successfully.`);
    } catch (e: any) {
      Alert.alert('Error', JSON.stringify(e.response?.data) || 'Failed to create zone.');
    } finally {
      setZoneCreating(false);
    }
  };

  const handleDeleteZone = (zoneId: number, name: string) => {
    Alert.alert('Delete Zone', `Are you sure you want to delete zone "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/workers/zones/${zoneId}/`);
            setZones(prev => prev.filter(z => z.id !== zoneId));
            Alert.alert('Deleted', `Zone "${name}" deleted.`);
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.detail || 'Failed to delete zone.');
          }
        }
      }
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Admin Portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
    ]);
  };

  const handleAddAdmin = async () => {
    if (!adminName.trim() || !adminPhone.trim() || !adminPassword.trim()) {
      Alert.alert('Required', 'Please fill all fields (Name, Phone, Password).');
      return;
    }
    setAdminCreating(true);
    try {
      const res = await apiClient.post('/api/auth/admin-register/', {
        name: adminName.trim(),
        phone: adminPhone.trim(),
        password: adminPassword.trim()
      });
      setAddAdminVisible(false);
      setAdminName(''); setAdminPhone(''); setAdminPassword('');
      Alert.alert('Success', `New Admin ${res.data?.admin?.admin_id || 'created'} successfully!`);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create new Admin.');
    } finally {
      setAdminCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Admin Settings</Text>

        {/* Shift Management */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Shift management</Text>
        </View>

        <View style={styles.groupCard}>
          {loadingData ? (
            <ActivityIndicator color="#2F8F5B" style={{ marginVertical: 14 }} />
          ) : shifts.length === 0 ? (
            <Text style={styles.emptyText}>No shifts configured. Tap below to add a shift.</Text>
          ) : (
            shifts.map((s, idx) => (
              <View key={s.id} style={[styles.itemRow, idx === shifts.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#DCEEE2' }]}>
                <Text style={styles.itemText}>🕒 {s.name} · {s.window_start?.substring(0, 5)}–{s.window_end?.substring(0, 5)}</Text>
                <TouchableOpacity onPress={() => handleDeleteShift(s.id, s.name)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <TouchableOpacity style={[styles.itemRow, { borderBottomWidth: 0 }]} onPress={() => setAddShiftVisible(true)}>
            <Text style={[styles.itemText, { color: '#2F8F5B', fontWeight: '700' }]}>+ Add new shift</Text>
          </TouchableOpacity>
        </View>

        {/* Zone Management */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Zone management</Text>
        </View>

        <View style={styles.groupCard}>
          {loadingData ? (
            <ActivityIndicator color="#2F8F5B" style={{ marginVertical: 14 }} />
          ) : zones.length === 0 ? (
            <Text style={styles.emptyText}>No geofence zones configured. Tap below to add a zone.</Text>
          ) : (
            zones.map((z, idx) => (
              <View key={z.id} style={[styles.itemRow, idx === zones.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#DCEEE2' }]}>
                <Text style={styles.itemText}>📍 {z.name} · {z.radius_meters || 500}m radius</Text>
                <TouchableOpacity onPress={() => handleDeleteZone(z.id, z.name)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <TouchableOpacity style={[styles.itemRow, { borderBottomWidth: 0 }]} onPress={() => setAddZoneVisible(true)}>
            <Text style={[styles.itemText, { color: '#2F8F5B', fontWeight: '700' }]}>+ Add new zone</Text>
          </TouchableOpacity>
        </View>

        {/* Anomaly Rules */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Anomaly detection rules</Text>
        </View>

        <View style={styles.groupCard}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>GPS mismatch check (100m)</Text>
            <Switch value={gpsCheck} onValueChange={setGpsCheck} trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }} thumbColor="#FFF" />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>Duplicate photo detection</Text>
            <Switch value={dupCheck} onValueChange={setDupCheck} trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }} thumbColor="#FFF" />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>Speed check (&gt;80km/h)</Text>
            <Switch value={speedCheck} onValueChange={setSpeedCheck} trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }} thumbColor="#FFF" />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>Cutoff pattern detection</Text>
            <Switch value={cutoffCheck} onValueChange={setCutoffCheck} trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }} thumbColor="#FFF" />
          </View>
          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.toggleText}>Device change alert</Text>
            <Switch value={deviceCheck} onValueChange={setDeviceCheck} trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }} thumbColor="#FFF" />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>

        <View style={styles.groupCard}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>Morning reminder to employees</Text>
            <Switch value={morningReminder} onValueChange={setMorningReminder} trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }} thumbColor="#FFF" />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>Weekly attendance summary</Text>
            <Switch value={weeklySummary} onValueChange={setWeeklySummary} trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }} thumbColor="#FFF" />
          </View>
          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.toggleText}>Contract expiry alerts</Text>
            <Switch value={contractAlerts} onValueChange={setContractAlerts} trackColor={{ false: '#DCEEE2', true: '#2F8F5B' }} thumbColor="#FFF" />
          </View>
        </View>

        {/* Admin Management */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Admin management</Text>
        </View>
        <View style={styles.groupCard}>
          <TouchableOpacity style={[styles.itemRow, { borderBottomWidth: 0 }]} onPress={() => setAddAdminVisible(true)}>
            <Text style={[styles.itemText, { color: '#2F8F5B', fontWeight: '700' }]}>+ Add new admin</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>🚪 Sign Out of Admin Portal</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Add Shift Modal */}
      <Modal visible={addShiftVisible} transparent animationType="slide" onRequestClose={() => setAddShiftVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Shift</Text>
            <Text style={styles.modalSub}>Configure a new work schedule window.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>SHIFT NAME</Text>
              <TextInput style={styles.input} placeholder="e.g. General Shift" placeholderTextColor="#9BAFA2" value={shiftName} onChangeText={setShiftName} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>WINDOW START</Text>
                <TextInput style={styles.input} placeholder="09:00:00" placeholderTextColor="#9BAFA2" value={shiftStart} onChangeText={setShiftStart} />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>WINDOW END</Text>
                <TextInput style={styles.input} placeholder="18:00:00" placeholderTextColor="#9BAFA2" value={shiftEnd} onChangeText={setShiftEnd} />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setAddShiftVisible(false)} disabled={shiftCreating}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, shiftCreating && { opacity: 0.7 }]} onPress={handleAddShift} disabled={shiftCreating}>
                <Text style={styles.btnPrimaryText}>{shiftCreating ? 'Creating...' : 'Create Shift'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Zone Modal */}
      <Modal visible={addZoneVisible} transparent animationType="slide" onRequestClose={() => setAddZoneVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Zone</Text>
            <Text style={styles.modalSub}>Define a new geofence location zone.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>ZONE NAME</Text>
              <TextInput style={styles.input} placeholder="e.g. Zone A (Facade)" placeholderTextColor="#9BAFA2" value={zoneName} onChangeText={setZoneName} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>GEOFENCE RADIUS (Meters)</Text>
              <TextInput style={styles.input} placeholder="500" placeholderTextColor="#9BAFA2" keyboardType="numeric" value={zoneRadius} onChangeText={setZoneRadius} />
            </View>

            {shifts.length > 0 && (
              <View style={styles.field}>
                <Text style={styles.label}>ATTACH TO SHIFT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {shifts.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.shiftChip, selectedShiftId === s.id && styles.shiftChipActive]}
                      onPress={() => setSelectedShiftId(s.id)}
                    >
                      <Text style={[styles.shiftChipText, selectedShiftId === s.id && styles.shiftChipTextActive]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setAddZoneVisible(false)} disabled={zoneCreating}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, zoneCreating && { opacity: 0.7 }]} onPress={handleAddZone} disabled={zoneCreating}>
                <Text style={styles.btnPrimaryText}>{zoneCreating ? 'Creating...' : 'Create Zone'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Admin Modal */}
      <Modal visible={addAdminVisible} transparent animationType="slide" onRequestClose={() => setAddAdminVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Admin</Text>
            <Text style={styles.modalSub}>Register a new Admin for the Portal.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput style={styles.input} placeholder="e.g. Ramesh Admin" placeholderTextColor="#9BAFA2" value={adminName} onChangeText={setAdminName} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <TextInput style={styles.input} placeholder="+91 98765 43210" placeholderTextColor="#9BAFA2" keyboardType="phone-pad" value={adminPhone} onChangeText={setAdminPhone} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>INITIAL PASSWORD</Text>
              <TextInput style={styles.input} placeholder="Enter a secure password" placeholderTextColor="#9BAFA2" value={adminPassword} onChangeText={setAdminPassword} secureTextEntry />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setAddAdminVisible(false)} disabled={adminCreating}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, adminCreating && { opacity: 0.7 }]} onPress={handleAddAdmin} disabled={adminCreating}>
                <Text style={styles.btnPrimaryText}>{adminCreating ? 'Creating...' : 'Create Admin'}</Text>
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
  sectionHead: {
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16241C',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DCEEE2',
  },
  itemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#16241C',
    flex: 1,
  },
  emptyText: {
    fontSize: 12.5,
    color: '#63796B',
    paddingVertical: 14,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C24936',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DCEEE2',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16241C',
  },
  signOutBtn: {
    backgroundColor: '#FBE5E1',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C24936',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10, 20, 14, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 1000,
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
  shiftChip: {
    borderWidth: 1.5,
    borderColor: '#DCEEE2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  shiftChipActive: {
    borderColor: '#2F8F5B',
    backgroundColor: '#EAF6EE',
  },
  shiftChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#63796B',
  },
  shiftChipTextActive: {
    color: '#1F6B42',
    fontWeight: '700',
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
