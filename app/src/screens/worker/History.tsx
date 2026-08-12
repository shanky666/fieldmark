import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';

export default function History() {
  const { workerId } = useAuthStore();
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistoryAndStats();
  }, []);

  const fetchHistoryAndStats = async () => {
    setLoading(true);
    try {
      const [historyRes, statsRes] = await Promise.all([
        apiClient.get('/api/attendance/me/'),
        workerId ? apiClient.get(`/api/workers/list/${workerId}/stats/`) : Promise.resolve({ data: null })
      ]);
      setHistory(historyRes.data || []);
      setStats(statsRes.data);
    } catch (e) {
      console.warn("Failed to load attendance history & stats", e);
    } finally {
      setLoading(false);
    }
  };

  const presentCount = stats?.days_present ?? history.filter(h => h.status === 'APPROVED').length;
  const pendingCount = stats?.days_pending ?? history.filter(h => h.status === 'PENDING').length;
  const absentCount = stats?.days_absent ?? history.filter(h => h.status === 'REJECTED').length;
  const attendanceRate = stats?.approval_rate_pct ?? (history.length > 0 ? Math.round((presentCount / history.length) * 100) : 100);

  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Attendance History</Text>

        {/* Statistics Grid */}
        <View style={styles.statGrid}>
          <View style={styles.statTile}>
            <Text style={[styles.statNum, { color: '#2F8F5B' }]}>{presentCount}</Text>
            <Text style={styles.statLbl}>Days present</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statNum, { color: '#1A6DB5' }]}>{pendingCount}</Text>
            <Text style={styles.statLbl}>Days pending</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statNum, { color: '#C24936' }]}>{absentCount}</Text>
            <Text style={styles.statLbl}>Days absent</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statNum, { color: '#6E56A6' }]}>{attendanceRate}%</Text>
            <Text style={styles.statLbl}>Approval rate</Text>
          </View>
        </View>

        {/* Monthly History Section */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{currentMonthYear}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#2F8F5B" style={{ marginVertical: 20 }} />
        ) : history.length === 0 ? (
          <View style={styles.miniRow}>
            <Text style={{ color: '#63796B', fontSize: 13, textAlign: 'center', flex: 1 }}>
              No attendance records logged for this period.
            </Text>
          </View>
        ) : (
          <View style={styles.miniHistory}>
            {history.map((item) => {
              const [year, month, day] = item.date.split('-');
              const localDate = new Date(Number(year), Number(month) - 1, Number(day));
              const dateStr = localDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

              let checkInStr = '--:--';
              if (item.marked_at) {
                checkInStr = new Date(item.marked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              }

              let checkOutStr = 'Still checked in';
              if (item.check_out_at) {
                checkOutStr = new Date(item.check_out_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              }

              const durationStr = item.duration_formatted || '';
              const isApproved = item.status === 'APPROVED';
              const isPending = item.status === 'PENDING';

              return (
                <View key={item.id} style={styles.miniRow}>
                  <View style={[
                    styles.statusDot, 
                    { backgroundColor: isApproved ? '#2F8F5B' : isPending ? '#1A6DB5' : '#C24936' }
                  ]} />
                  <View style={styles.miniInfo}>
                    <Text style={styles.miniDay}>{dateStr}</Text>
                    <Text style={styles.miniHours}>
                      {checkInStr} – {checkOutStr} {durationStr ? `· ${durationStr}` : ''}
                    </Text>
                  </View>
                  <View style={[
                    styles.badge, 
                    isApproved ? styles.badgePresent : isPending ? styles.badgeLate : styles.badgeAbsent
                  ]}>
                    <Text style={
                      isApproved ? styles.badgePresentText : isPending ? styles.badgeLateText : styles.badgeAbsentText
                    }>
                      {item.status}
                    </Text>
                  </View>
                </View>
              );
            })}
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
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16241C',
    marginBottom: 16,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 16,
    padding: 14,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16241C',
  },
  statLbl: {
    fontSize: 11.5,
    color: '#63796B',
    marginTop: 2,
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
  miniHistory: {
    gap: 8,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 15,
    padding: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  miniInfo: {
    flex: 1,
  },
  miniDay: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16241C',
  },
  miniHours: {
    fontSize: 11.5,
    color: '#63796B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgePresent: {
    backgroundColor: '#DCF2E3',
  },
  badgePresentText: {
    color: '#1F6B42',
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeLate: {
    backgroundColor: '#E3F0FC',
  },
  badgeLateText: {
    color: '#1A6DB5',
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeAbsent: {
    backgroundColor: '#FBE5E1',
  },
  badgeAbsentText: {
    color: '#C24936',
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeLeave: {
    backgroundColor: '#EAE3F7',
  },
  badgeLeaveText: {
    color: '#6E56A6',
    fontSize: 10.5,
    fontWeight: '700',
  },
});
