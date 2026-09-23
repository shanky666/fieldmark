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
            value={csvStartDate}
            onChangeText={setCsvStartDate}
          />
          
          <Text style={styles.label}>End Date (YYYY-MM-DD) - Optional</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2024-01-31"
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16241C',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#63796B',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F6B42',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#1F6B42',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
