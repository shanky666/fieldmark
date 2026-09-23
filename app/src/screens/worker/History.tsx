import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Image, Alert, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';
import { CONFIG } from '../../constants/config';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function History() {
  const { workerId } = useAuthStore();
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchHistoryAndStats();
  }, [selectedDate]);

  const fetchHistoryAndStats = async () => {
    setLoading(true);
    try {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const [historyRes, statsRes] = await Promise.all([
        apiClient.get(`/api/attendance/me/?month=${yyyy}-${mm}`),
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

  const downloadCSV = async () => {
    if (history.length === 0) {
      Alert.alert('No Data', 'No attendance records available to download.');
      return;
    }

    try {
      const header = 'Date,Check-In,Check-Out,Duration,Status,Panchayat,FIC,Members,Purpose\n';
      const rows = history.map(item => {
        const checkIn = item.marked_at ? new Date(item.marked_at).toLocaleTimeString() : '--';
        const checkOut = item.check_out_at ? new Date(item.check_out_at).toLocaleTimeString() : '--';
        return `${item.date},${checkIn},${checkOut},${item.duration_formatted || '--'},${item.status},"${item.panchayat_visited || ''}","${item.fic_visited || ''}","${item.members_attended || ''}","${item.purpose_of_visit || ''}"`;
      }).join('\n');

      const csvData = header + rows;
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const fileUri = FileSystem.documentDirectory + `attendance_history_${yyyy}_${mm}.csv`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvData, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sharing Unavailable', 'Unable to share or save the file on this device.');
      }
    } catch (error) {
      console.error('Download failed', error);
      Alert.alert('Error', 'Failed to generate CSV file.');
    }
  };

  const presentCount = stats?.days_present ?? history.filter(h => h.status === 'APPROVED').length;
  const pendingCount = stats?.days_pending ?? history.filter(h => h.status === 'PENDING').length;
  const absentCount = stats?.days_absent ?? history.filter(h => h.status === 'REJECTED').length;
  const attendanceRate = stats?.approval_rate_pct ?? (history.length > 0 ? Math.round((presentCount / history.length) * 100) : 100);

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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }} style={{ padding: 8 }}>
              <Text style={{ fontSize: 18, color: '#1F6B42', fontWeight: 'bold' }}>{"<"}</Text>
            </TouchableOpacity>
            
            <Text style={[styles.sectionTitle, { marginHorizontal: 8, marginBottom: 0 }]}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            
            <TouchableOpacity onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }} style={{ padding: 8 }}>
              <Text style={{ fontSize: 18, color: '#1F6B42', fontWeight: 'bold' }}>{">"}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={downloadCSV} style={{ backgroundColor: '#1F6B42', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Download CSV</Text>
          </TouchableOpacity>
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
                    {item.work_details ? (
                      <Text style={{ fontSize: 12, color: '#63796B', marginTop: 4, fontStyle: 'italic' }}>
                        Notes: {item.work_details}
                      </Text>
                    ) : null}
                    
                    {item.panchayat_visited ? (
                      <View style={{ marginTop: 8, padding: 8, backgroundColor: '#E8F5E9', borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: '#1F6B42', fontWeight: 'bold' }}>Field Visit Details:</Text>
                        <Text style={{ fontSize: 11, color: '#333' }}>Panchayat: {item.panchayat_visited}</Text>
                        <Text style={{ fontSize: 11, color: '#333' }}>FIC: {item.fic_visited}</Text>
                        <Text style={{ fontSize: 11, color: '#333' }}>Members: {item.members_attended}</Text>
                        <Text style={{ fontSize: 11, color: '#333' }}>Purpose: {item.purpose_of_visit}</Text>
                      </View>
                    ) : null}
                    
                    {item.photo_url ? (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 11, color: '#63796B', marginBottom: 4, fontWeight: 'bold' }}>Attendance Photo:</Text>
                        <View style={{ height: 100, width: 100, borderRadius: 8, overflow: 'hidden', backgroundColor: '#E8F5E9' }}>
                          <Image 
                            source={{ uri: String(item.photo_url).startsWith('http') ? item.photo_url : `${CONFIG.API_BASE_URL.replace(/\/+$/, '')}${item.photo_url.startsWith('/') ? '' : '/'}${item.photo_url}` }} 
                            style={{ width: '100%', height: '100%' }} 
                            resizeMode="cover" 
                          />
                        </View>
                      </View>
                    ) : null}
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
