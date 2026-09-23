import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { apiClient } from '../../api/client';
import { COLORS } from '../../constants/colors';

export default function Salary() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalaryData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/workers/list/');
      let workersList = Array.isArray(res.data) ? res.data : res.data?.results || [];
      
      workersList = workersList.filter((w: any) => !w.is_superuser);
      
      const attRes = await apiClient.get('/api/attendance/');
      const allAttendance = attRes.data.results || attRes.data || [];

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const enrichedWorkers = workersList.map((worker: any) => {
        const workerAtt = allAttendance.filter((a: any) => {
          if (a.worker !== worker.id) return false;
          if (!a.date) return false;
          const d = new Date(a.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const presentDays = workerAtt.filter((a: any) => a.status === 'APPROVED' || a.status === 'PENDING').length;
        const absentDays = workerAtt.filter((a: any) => a.status === 'ABSENT' || a.status === 'REJECTED').length;
        
        let totalWorkedSeconds = 0;
        workerAtt.forEach((a: any) => {
          if (a.duration_formatted) {
            const parts = a.duration_formatted.match(/(\d+)h\s*(\d+)m/);
            if (parts) {
              totalWorkedSeconds += (parseInt(parts[1]) * 3600) + (parseInt(parts[2]) * 60);
            }
          }
        });

        const totalHours = Math.floor(totalWorkedSeconds / 3600);
        const totalMinutes = Math.floor((totalWorkedSeconds % 3600) / 60);

        return {
          ...worker,
          presentDays,
          absentDays,
          totalWorkedHoursFormatted: `${totalHours}h ${totalMinutes}m`
        };
      });

      setWorkers(enrichedWorkers);
    } catch (e) {
      console.error("Failed to load salary data", e);
      Alert.alert("Error", "Could not load salary data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Salary Tracking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Current Policy</Text>
          <Text style={styles.policyText}>Monthly Salary: ₹6,000</Text>
          <Text style={styles.policyText}>Required Duty: 8 hours/day</Text>
          <Text style={styles.policySubtext}>Only approved and pending records count towards paid present days.</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : workers.length === 0 ? (
          <Text style={styles.emptyText}>No employees found.</Text>
        ) : (
          workers.map((worker) => (
            <View key={worker.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.empName}>{worker.name || `Worker #${worker.id}`}</Text>
                  <Text style={styles.empId}>ID: {worker.employee_id || 'N/A'}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>₹6,000 / mo</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: '#059669' }]}>{worker.presentDays}</Text>
                  <Text style={styles.statLbl}>Present</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: '#DC2626' }]}>{worker.absentDays}</Text>
                  <Text style={styles.statLbl}>Absent</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: '#3B82F6' }]}>{worker.totalWorkedHoursFormatted}</Text>
                  <Text style={styles.statLbl}>Hours Worked</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16, backgroundColor: '#F8FAFC' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  content: { paddingHorizontal: 20, paddingBottom: 80 },
  policyCard: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  policyTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 12, textTransform: 'uppercase' },
  policyText: { fontSize: 15, color: '#0F172A', fontWeight: '700', marginBottom: 4 },
  policySubtext: { fontSize: 13, color: '#64748B', marginTop: 8, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 14, fontWeight: '500' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  empId: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCol: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLbl: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '700' },
});
