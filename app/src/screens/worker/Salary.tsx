import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { apiClient } from '../../api/client';

export default function Salary() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/attendance/me/');
      setHistory(res.data || []);
    } catch (e) {
      console.warn("Failed to load attendance history", e);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthRecords = history.filter(r => r.date.startsWith(currentMonthStr));

  const totalWorkingDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const presentDays = monthRecords.filter(r => r.status === 'APPROVED' || r.status === 'PENDING').length;
  const absentDays = monthRecords.filter(r => r.status === 'REJECTED' || r.status === 'ABSENT').length;
  const totalRequiredHours = totalWorkingDays * 8;
  
  const totalWorkedSeconds = monthRecords.reduce((acc, r) => acc + (r.duration_seconds || 0), 0);
  const totalWorkedHours = (totalWorkedSeconds / 3600).toFixed(1);
  const shortfallHours = Math.max(0, (presentDays * 8) - (totalWorkedSeconds / 3600)).toFixed(1);
  
  const monthlySalary = 6000;
  const calculatedSalary = Math.round((presentDays / totalWorkingDays) * monthlySalary);

  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Salary & Summary</Text>
        <Text style={styles.subtitle}>{currentMonthYear}</Text>

        {loading ? (
          <ActivityIndicator color="#1F6B42" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.card}>
            <View style={styles.salaryHeader}>
              <Text style={styles.salaryTitle}>Calculated Salary</Text>
              <Text style={styles.salaryAmount}>₹{calculatedSalary.toLocaleString()}</Text>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Monthly Base Salary</Text>
              <Text style={styles.value}>₹6,000</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Required Duty</Text>
              <Text style={styles.value}>8 Hours / Day</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.row}>
              <Text style={styles.label}>Total Working Days</Text>
              <Text style={styles.value}>{totalWorkingDays}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Present Days</Text>
              <Text style={styles.value}>{presentDays}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Absent Days</Text>
              <Text style={styles.value}>{absentDays}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.row}>
              <Text style={styles.label}>Total Required Hours</Text>
              <Text style={styles.value}>{totalRequiredHours}h</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Total Worked Hours</Text>
              <Text style={styles.value}>{totalWorkedHours}h</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Shortfall Hours (Present Days)</Text>
              <Text style={styles.value}>{shortfallHours}h</Text>
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
    backgroundColor: '#F4F8F5',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F6B42',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  salaryHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  salaryTitle: {
    fontSize: 14,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
  },
  salaryAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1F6B42',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8F5E9',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#111',
    fontWeight: '700',
  }
});
