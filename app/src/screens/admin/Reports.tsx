import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { apiClient } from '../../api/client';
import { secureStorage } from '../../utils/secureStorage';

export default function Reports() {
  const [csvRole, setCsvRole] = useState<'All' | 'Employee' | 'Supervisor'>('All');
  const [csvStartDate, setCsvStartDate] = useState('');
  const [csvEndDate, setCsvEndDate] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);

  const handleDownloadCSV = async () => {
    setCsvLoading(true);
    try {
      let query = `?role=${csvRole}`;
      if (csvStartDate.trim()) query += `&start_date=${encodeURIComponent(csvStartDate.trim())}`;
      if (csvEndDate.trim()) query += `&end_date=${encodeURIComponent(csvEndDate.trim())}`;

      const baseUrl = (apiClient.defaults.baseURL || 'http://10.0.2.2:8000').replace(/\/+$/, '');
      const fullUrl = `${baseUrl}/api/attendance/csv-report/${query}`;
      
      const fileUri = FileSystem.documentDirectory + 'Attendance_History.csv';
      const token = await secureStorage.getItem('access_token');
      const downloadRes = await FileSystem.downloadAsync(
        fullUrl,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (downloadRes.status !== 200) {
        Alert.alert('Download Failed', `Could not generate or download the CSV. (Status ${downloadRes.status})`);
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        Alert.alert('Saved', 'CSV saved to device storage.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An error occurred while downloading.');
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Export Attendance CSV</Text>
          <Text style={styles.cardDesc}>Download a complete spreadsheet of employee attendance, including check-in/out times, hours, and status.</Text>
          
          <Text style={styles.label}>Start Date (YYYY-MM-DD) - Optional</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2024-01-01"
            placeholderTextColor="#94A3B8"
            value={csvStartDate}
            onChangeText={setCsvStartDate}
          />
          
          <Text style={styles.label}>End Date (YYYY-MM-DD) - Optional</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2024-01-31"
            placeholderTextColor="#94A3B8"
            value={csvEndDate}
            onChangeText={setCsvEndDate}
          />

          <TouchableOpacity style={styles.btn} onPress={handleDownloadCSV} disabled={csvLoading}>
            {csvLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Download CSV Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16, backgroundColor: '#1F6B42' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  content: { paddingHorizontal: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#64748B', marginBottom: 24, fontWeight: '500', lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 15, color: '#0F172A' },
  btn: { backgroundColor: '#1F6B42', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 }
});
