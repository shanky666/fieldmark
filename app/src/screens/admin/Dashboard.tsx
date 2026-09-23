import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';
import { COLORS } from '../../constants/colors';

export default function Dashboard({ navigation }: any) {
  const { logout } = useAuthStore();

  const [totalWorkers, setTotalWorkers] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [attRes, workersRes, leaveRes] = await Promise.all([
        apiClient.get('/api/attendance/'),
        apiClient.get('/api/workers/'),
        apiClient.get('/api/leave/')
      ]);
      
      const records = attRes.data.results || attRes.data || [];
      const workers = workersRes.data.results || workersRes.data || [];
      const leaves = leaveRes.data.results || leaveRes.data || [];

      const activeWorkers = workers.filter((w: any) => !w.is_staff && !w.is_superuser);
      const total = activeWorkers.length || workers.length;
      
      const present = records.filter((r: any) => r.status === 'APPROVED' || r.status === 'PENDING').length;
      const absent = Math.max(0, total - present);
      const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;

      setTotalWorkers(total);
      setPresentCount(present);
      setAbsentCount(absent);
      setPendingLeaveCount(pendingLeaves);

    } catch (e) {
      console.warn("Failed to fetch admin dashboard records", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        logout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
      ]);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Admin Dashboard</Text>
          <Text style={styles.dateChipText}>{todayStr}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WorkersTab')}>
              <Text style={styles.cardValue}>{totalWorkers}</Text>
              <Text style={styles.cardLabel}>Total Employees</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VerifyTab')}>
              <Text style={[styles.cardValue, { color: '#1F6B42' }]}>{presentCount}</Text>
              <Text style={styles.cardLabel}>Present Today</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VerifyTab')}>
              <Text style={[styles.cardValue, { color: '#C24936' }]}>{absentCount}</Text>
              <Text style={styles.cardLabel}>Absent Today</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LeaveReviewTab')}>
              <Text style={[styles.cardValue, { color: '#E48900' }]}>{pendingLeaveCount}</Text>
              <Text style={styles.cardLabel}>Pending Leaves</Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 24,
    fontWeight: '800',
    color: '#16241C',
  },
  dateChipText: {
    fontSize: 14,
    color: '#63796B',
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: '#FDECEC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#C24936',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#16241C',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#63796B',
    textAlign: 'center',
    fontWeight: '600',
  }
});
