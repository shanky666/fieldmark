import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../store/auth';

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

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>🚪 Sign Out of Admin Portal</Text>
        </TouchableOpacity>

      </ScrollView>
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
});
