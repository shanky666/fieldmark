import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';

export default function Dashboard({ navigation }: any) {
  const { userProfile, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/attendance/');
      setRecords(res.data.results || res.data || []);
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

  const handleApprovePending = async (recordId: number, name: string) => {
    try {
      await apiClient.patch(`/api/attendance/${recordId}/verify/`, { action: 'approve' });
      Alert.alert('Approved', `✓ ${name} attendance approved`);
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: 'APPROVED' } : r));
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to approve attendance');
    }
  };

  const presentCount = records.filter(r => r.status === 'APPROVED').length;
  const pendingRecords = records.filter(r => r.status === 'PENDING' || r.status === 'FLAGGED');
  const pendingCount = pendingRecords.length;

  const filteredCheckIns = records.filter(item => {
    const nameStr = item.worker_name || `Worker #${item.worker}`;
    return nameStr.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.eyebrow}>Overview</Text>
            <Text style={styles.pageTitle}>Employee Attendance</Text>
            <View style={styles.dateChip}>
              <Text style={styles.dateChipText}>📅 {todayStr}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>ADM</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Scrollable KPI Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiScroll}>
          <View style={[styles.kpi, styles.kPresent]}>
            <Text style={[styles.kpiNum, { color: '#1F6B42' }]}>{presentCount}</Text>
            <Text style={[styles.kpiLbl, { color: '#1F6B42' }]}>Present</Text>
          </View>
          <View style={[styles.kpi, styles.kPending]}>
            <Text style={[styles.kpiNum, { color: '#1A6DB5' }]}>{pendingCount}</Text>
            <Text style={[styles.kpiLbl, { color: '#1A6DB5' }]}>Pending</Text>
          </View>
          <View style={[styles.kpi, styles.kPresent, { backgroundColor: '#EAF6EE' }]}>
            <Text style={[styles.kpiNum, { color: '#2F8F5B' }]}>{records.length}</Text>
            <Text style={[styles.kpiLbl, { color: '#2F8F5B' }]}>Total Logs</Text>
          </View>
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search employee, team, or site…"
            placeholderTextColor="#9BAFA2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Live Check-ins Section */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Live check-ins</Text>
          <TouchableOpacity onPress={() => navigation.navigate('WorkersTab')}>
            <Text style={styles.linkSm}>View all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#2F8F5B" style={{ marginVertical: 20 }} />
        ) : filteredCheckIns.length === 0 ? (
          <View style={styles.empRow}>
            <Text style={{ color: '#63796B', fontSize: 13 }}>No live check-in logs recorded today.</Text>
          </View>
        ) : (
          <View style={styles.empList}>
            {filteredCheckIns.slice(0, 5).map(e => {
              const initials = e.worker_name
                ? e.worker_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                : 'EMP';

              return (
                <TouchableOpacity key={e.id} style={styles.empRow} onPress={() => navigation.navigate('VerifyTab')}>
                  <View style={[styles.thumb, { backgroundColor: e.status === 'APPROVED' ? '#2F8F5B' : '#B9791C' }]}>
                    <Text style={styles.thumbText}>{initials}</Text>
                  </View>
                  <View style={styles.empInfo}>
                    <Text style={styles.empName}>{e.worker_name || `Worker #${e.worker}`}</Text>
                    <Text style={styles.empRole}>{e.zone_name || 'Assigned Zone'}</Text>
                  </View>
                  <View style={styles.empRight}>
                    <View style={[
                      styles.badge, 
                      e.status === 'APPROVED' ? styles.badgePresent : styles.badgeLate
                    ]}>
                      <Text style={
                        e.status === 'APPROVED' ? styles.badgePresentText : styles.badgeLateText
                      }>{e.status}</Text>
                    </View>
                    <Text style={styles.etime}>{e.marked_at ? new Date(e.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : e.date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Pending Verifications Quick Section */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Pending verifications</Text>
          <TouchableOpacity onPress={() => navigation.navigate('VerifyTab')}>
            <Text style={styles.linkSm}>Review all</Text>
          </TouchableOpacity>
        </View>

        {pendingRecords.length === 0 ? (
          <View style={styles.vCard}>
            <Text style={{ textAlign: 'center', color: '#63796B', fontSize: 13, paddingVertical: 10 }}>
              ✓ All attendance verifications are up to date!
            </Text>
          </View>
        ) : (
          <View style={styles.vCard}>
            <View style={styles.vTop}>
              <View style={styles.vThumb}>
                <Text style={styles.vThumbText}>
                  {pendingRecords[0].worker_name
                    ? pendingRecords[0].worker_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'P'}
                </Text>
              </View>
              <View style={styles.vInfo}>
                <Text style={styles.vName}>{pendingRecords[0].worker_name || `Worker #${pendingRecords[0].worker}`}</Text>
                <Text style={styles.vMeta}>{pendingRecords[0].zone_name || 'Assigned Zone'} · {pendingRecords[0].date}</Text>
                <View style={styles.gpsPillOk}>
                  <Text style={styles.gpsPillOkText}>✓ Pending Admin Verification</Text>
                </View>
              </View>
            </View>
            <View style={styles.actRow}>
              <TouchableOpacity style={styles.actBtnView} onPress={() => navigation.navigate('VerifyTab')}>
                <Text style={styles.actBtnViewText}>View All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actBtnApprove} 
                onPress={() => handleApprovePending(pendingRecords[0].id, pendingRecords[0].worker_name || 'Worker')}
              >
                <Text style={styles.actBtnApproveText}>✓ Approve</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#9BAFA2',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 3,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16241C',
  },
  dateChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16241C',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6E56A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  kpiScroll: {
    gap: 10,
    paddingBottom: 6,
  },
  kpi: {
    minWidth: 100,
    borderRadius: 16,
    padding: 14,
  },
  kPresent: { backgroundColor: '#DCF2E3' },
  kLate: { backgroundColor: '#FBEDD3' },
  kAbsent: { backgroundColor: '#FBE5E1' },
  kLeave: { backgroundColor: '#EAE3F7' },
  kPending: { backgroundColor: '#E3F0FC' },
  kpiNum: {
    fontSize: 24,
    fontWeight: '800',
  },
  kpiLbl: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
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
    marginTop: 16,
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
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16241C',
  },
  linkSm: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2F8F5B',
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
  badgePresent: { backgroundColor: '#DCF2E3' },
  badgePresentText: { color: '#1F6B42', fontSize: 10.5, fontWeight: '700' },
  badgeLate: { backgroundColor: '#FBEDD3' },
  badgeLateText: { color: '#B9791C', fontSize: 10.5, fontWeight: '700' },
  badgeAbsent: { backgroundColor: '#FBE5E1' },
  badgeAbsentText: { color: '#C24936', fontSize: 10.5, fontWeight: '700' },
  etime: {
    fontSize: 11,
    color: '#63796B',
    marginTop: 4,
  },
  vCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 16,
    padding: 14,
  },
  vTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vThumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2F8F5B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vThumbText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  vInfo: {
    flex: 1,
  },
  vName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16241C',
  },
  vMeta: {
    fontSize: 11,
    color: '#63796B',
    marginTop: 2,
  },
  gpsPillOk: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCF2E3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  gpsPillOkText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1F6B42',
  },
  actRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actBtnView: {
    flex: 1,
    backgroundColor: '#E3F0FC',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actBtnViewText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1A6DB5',
  },
  actBtnApprove: {
    flex: 1,
    backgroundColor: '#DCF2E3',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actBtnApproveText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1F6B42',
  },
});
