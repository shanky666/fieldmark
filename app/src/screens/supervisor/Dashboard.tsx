import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';

export default function Dashboard({ navigation }: any) {
  const { userProfile, logout } = useAuthStore();
  const [rounds, setRounds] = useState<any[]>([]);
  const [workerCount, setWorkerCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roundsRes, workersRes] = await Promise.all([
        apiClient.get('/api/rounds/'),
        apiClient.get('/api/workers/')
      ]);
      setRounds(roundsRes.data.results || roundsRes.data || []);
      const workersList = workersRes.data.results || workersRes.data || [];
      setWorkerCount(workersList.length);
    } catch (e) {
      console.warn("Failed to fetch supervisor dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const nameInitials = userProfile?.name
    ? userProfile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'SUP';

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.eyebrow}>Supervisor Portal</Text>
            <Text style={styles.pageTitle}>Site Field Rounds</Text>
            <Text style={styles.subTitle}>
              Zone: {userProfile?.zone_detail?.name || userProfile?.zone || 'Assigned Zone'} · {userProfile?.name || 'Supervisor'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{nameInitials}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Action Card */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Log Field Round</Text>
          <Text style={styles.actionSub}>Perform physical headcounts, geotag photos & log worker notes.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('LogFieldRound')}>
            <Text style={styles.actionBtnText}>+ Start New Field Round</Text>
          </TouchableOpacity>
        </View>

        {/* Team Presence Overview */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Zone Headcount</Text>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statTile}>
            <Text style={[styles.statNum, { color: '#2F8F5B' }]}>{workerCount}</Text>
            <Text style={styles.statLbl}>Assigned workers</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statNum, { color: '#1F6B42' }]}>{rounds.length}</Text>
            <Text style={styles.statLbl}>Field rounds logged</Text>
          </View>
        </View>

        {/* Recent Field Logs */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent field logs</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#B9791C" style={{ marginVertical: 20 }} />
        ) : rounds.length === 0 ? (
          <View style={styles.logCard}>
            <Text style={styles.logDesc}>No field rounds logged yet. Tap "+ Start New Field Round" to create one.</Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {rounds.slice(0, 5).map((r: any) => (
              <View key={r.id} style={styles.logCard}>
                <View style={styles.logTop}>
                  <Text style={styles.logZone}>📍 {r.zone_name || 'Site Zone'}</Text>
                  <Text style={styles.logTime}>{r.visited_at ? new Date(r.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</Text>
                </View>
                <Text style={styles.logDesc}>{r.notes || `Verified ${r.worker_count_observed || 0} workers present on site.`}</Text>
                <View style={styles.tagChip}>
                  <Text style={styles.tagChipText}>✓ Geotag verified</Text>
                </View>
              </View>
            ))}
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
  subTitle: {
    fontSize: 12.5,
    color: '#63796B',
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#B9791C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  actionCard: {
    backgroundColor: '#B9791C',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#B9791C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionSub: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    marginBottom: 14,
  },
  actionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B9791C',
  },
  sectionHead: {
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16241C',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 16,
    padding: 14,
  },
  statNum: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11.5,
    color: '#63796B',
    marginTop: 2,
  },
  logList: {
    gap: 10,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 16,
    padding: 14,
  },
  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logZone: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16241C',
  },
  logTime: {
    fontSize: 11,
    color: '#63796B',
  },
  logDesc: {
    fontSize: 12,
    color: '#63796B',
    lineHeight: 16,
  },
  tagChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCF2E3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 8,
  },
  tagChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1F6B42',
  },
});
