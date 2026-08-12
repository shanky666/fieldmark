import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';

export default function Settings() {
  const { logout } = useAuthStore();

  const [gpsCheck, setGpsCheck] = useState(true);
  const [dupCheck, setDupCheck] = useState(true);
  const [speedCheck, setSpeedCheck] = useState(true);
  const [cutoffCheck, setCutoffCheck] = useState(false);
  const [deviceCheck, setDeviceCheck] = useState(true);

  const [morningReminder, setMorningReminder] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [contractAlerts, setContractAlerts] = useState(true);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Admin Portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
    ]);
  };

  const [addAdminVisible, setAddAdminVisible] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminCreating, setAdminCreating] = useState(false);

  const handleAddAdmin = async () => {
    if (!adminName.trim() || !adminPhone.trim() || !adminPassword.trim()) {
      Alert.alert('Required', 'Please fill all fields (Name, Phone, Password).');
      return;
    }
    setAdminCreating(true);
    try {
      // Assuming apiClient has the interceptor to attach JWT token
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

        {/* Shifts */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Shift management</Text>
        </View>

        <View style={styles.groupCard}>
          <TouchableOpacity style={styles.itemRow}>
            <Text style={styles.itemText}>🕒 General Shift · 09:00–18:00</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.itemRow}>
            <Text style={styles.itemText}>🕒 Early Shift · 06:00–15:00</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.itemRow, { borderBottomWidth: 0 }]} onPress={() => Alert.alert('Add Shift', 'Configure new shift schedule.')}>
            <Text style={[styles.itemText, { color: '#2F8F5B', fontWeight: '700' }]}>+ Add new shift</Text>
          </TouchableOpacity>
        </View>

        {/* Zones */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Zone management</Text>
        </View>

        <View style={styles.groupCard}>
          <TouchableOpacity style={styles.itemRow}>
            <Text style={styles.itemText}>📍 Zone A · Facade A · 500m radius</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.itemRow}>
            <Text style={styles.itemText}>📍 Zone B · Facade B · 500m radius</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.itemRow}>
            <Text style={styles.itemText}>📍 Zone C · Block C · 500m radius</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.itemRow, { borderBottomWidth: 0 }]} onPress={() => Alert.alert('Add Zone', 'Define a new geofence zone.')}>
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

      {/* Add Admin Modal */}
      {addAdminVisible && (
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
      )}
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
  },
  arrow: {
    fontSize: 18,
    color: '#9BAFA2',
    fontWeight: '600',
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
