import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { apiClient } from '../../api/client';
import { COLORS } from '../../constants/colors';

export default function Salary() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalaryData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/workers/');
      let workersList = res.data.results || res.data || [];
      
      // Filter out admins/staff to only show actual employees
      workersList = workersList.filter((w: any) => !w.is_staff && !w.is_superuser);
      
      // Fetch attendance for all workers to calculate days
      const attRes = await apiClient.get('/api/attendance/');
      const allAttendance = attRes.data.results || attRes.data || [];

      // Calculate stats per worker
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
            // duration_formatted usually like "8h 30m"
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
        <Text style={styles.pageTitle}>Salary & Attendance Summary</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Current Policy</Text>
          <Text style={styles.policyText}>Monthly Salary: ₹6,000</Text>
          <Text style={styles.policyText}>Required Duty: 8 hours/day</Text>
          <Text style={styles.policySubtext}>* Only approved and pending records count towards Present days. Leaves must be approved to count as paid.</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
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
                  <Text style={styles.statVal}>{worker.presentDays}</Text>
                  <Text style={styles.statLbl}>Present</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{worker.absentDays}</Text>
                  <Text style={styles.statLbl}>Absent</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{worker.totalWorkedHoursFormatted}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F3FAF5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16241C',
  },
  content: {
    padding: 20,
    paddingBottom: 80,
  },
  policyCard: {
    backgroundColor: '#EAF6EE',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6E5D0',
    marginBottom: 20,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F6B42',
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: '#16241C',
    fontWeight: '600',
    marginBottom: 4,
  },
  policySubtext: {
    fontSize: 12,
    color: '#63796B',
    marginTop: 8,
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
    alignItems: 'center',
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16241C',
  },
  empId: {
    fontSize: 13,
    color: '#63796B',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#FDECEC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#C24936',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F6B42',
  },
  statLbl: {
    fontSize: 12,
    color: '#63796B',
    marginTop: 2,
  },
});
