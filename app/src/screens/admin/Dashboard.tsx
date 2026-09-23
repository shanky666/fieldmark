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
        apiClient.get('/api/workers/list/'),
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
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.pageTitle}>Administrator</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>Today: {todayStr}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            {/* Total Employees */}
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WorkersTab')}>
              <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.iconText, { color: '#3B82F6' }]}>👥</Text>
              </View>
              <Text style={styles.cardValue}>{totalWorkers}</Text>
              <Text style={styles.cardLabel}>Total Employees</Text>
            </TouchableOpacity>

            {/* Present Today */}
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VerifyTab')}>
              <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.iconText, { color: '#10B981' }]}>✓</Text>
              </View>
              <Text style={styles.cardValue}>{presentCount}</Text>
              <Text style={styles.cardLabel}>Present Today</Text>
            </TouchableOpacity>

            {/* Absent Today */}
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VerifyTab')}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.iconText, { color: '#EF4444' }]}>✕</Text>
              </View>
              <Text style={styles.cardValue}>{absentCount}</Text>
              <Text style={styles.cardLabel}>Absent Today</Text>
            </TouchableOpacity>

            {/* Pending Leaves */}
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LeaveReviewTab')}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF7ED' }]}>
                <Text style={[styles.iconText, { color: '#F97316' }]}>⏳</Text>
              </View>
              <Text style={styles.cardValue}>{pendingLeaveCount}</Text>
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
    backgroundColor: '#F8FAFC', // light grayish blue bg
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
  greeting: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  logoutText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dateContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '900',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  }
});
