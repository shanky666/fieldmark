import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiClient } from '../../api/client';
import { COLORS } from '../../constants/colors';

export default function Verify({ navigation }: any) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRecords();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/attendance/');
      let data = res.data.results || res.data || [];
      // Sort newest first
      data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecords(data);
    } catch (e) {
      console.warn("Failed to fetch attendance records", e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return '#2F8F5B';
      case 'PENDING': return '#1A6DB5';
      case 'FLAGGED': return '#E48900';
      case 'REJECTED': return '#C24936';
      default: return '#63796B';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Attendance Logs</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : records.length === 0 ? (
          <Text style={styles.emptyText}>No attendance records found.</Text>
        ) : (
          records.map((record) => {
            const checkIn = record.marked_at ? new Date(record.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const checkOut = record.check_out_at ? new Date(record.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

            return (
              <TouchableOpacity 
                key={record.id} 
                style={styles.card} 
                onPress={() => navigation.navigate('VerificationDetail', { recordId: record.id })}
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.empName}>{record.worker_name || `Worker #${record.worker}`}</Text>
                    <Text style={styles.dateText}>📅 {record.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>{record.status}</Text>
                  </View>
                </View>

                <View style={styles.divider} />
                
                <View style={styles.detailsRow}>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLbl}>Check-In</Text>
                    <Text style={styles.detailVal}>{checkIn}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLbl}>Check-Out</Text>
                    <Text style={styles.detailVal}>{checkOut}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLbl}>Worked Hrs</Text>
                    <Text style={styles.detailVal}>{record.duration_formatted || '--'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16241C',
  },
  content: {
    padding: 20,
    paddingBottom: 80,
  },
  emptyText: {
    textAlign: 'center',
    color: '#63796B',
    marginTop: 40,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  empName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16241C',
  },
  dateText: {
    fontSize: 13,
    color: '#63796B',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    alignItems: 'center',
    flex: 1,
  },
  detailLbl: {
    fontSize: 11,
    color: '#63796B',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16241C',
  },
});
