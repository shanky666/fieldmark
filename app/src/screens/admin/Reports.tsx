import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../../store/auth';
import { secureStorage } from '../../utils/secureStorage';
import { apiClient } from '../../api/client';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave' | 'corrections'>('attendance');
  const [csvModalVisible, setCsvModalVisible] = useState(false);
  const [csvRole, setCsvRole] = useState<'All' | 'Employee' | 'Supervisor'>('All');
  const [csvZone, setCsvZone] = useState('');
  const [csvStartDate, setCsvStartDate] = useState('');
  const [csvEndDate, setCsvEndDate] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);

  const exportReport = (type: string) => {
    if (type === 'Attendance CSV') {
      setCsvModalVisible(true);
    } else {
      Alert.alert('Export Triggered', `📥 ${type} is preparing for download.`);
    }
  };

  const handleDownloadCSV = async () => {
    setCsvLoading(true);
    try {
      let query = `?role=${csvRole}`;
      if (csvZone.trim()) query += `&zone=${encodeURIComponent(csvZone.trim())}`;
      if (csvStartDate.trim()) query += `&start_date=${encodeURIComponent(csvStartDate.trim())}`;
      if (csvEndDate.trim()) query += `&end_date=${encodeURIComponent(csvEndDate.trim())}`;

      const apiUrl = apiClient.defaults.baseURL || 'http://10.0.2.2:8000';
      const fullUrl = `${apiUrl}/api/attendance/csv-report/${query}`;
      
      const fileUri = FileSystem.documentDirectory + 'Attendance_History.csv';
      const token = await secureStorage.getItem('access_token');
      const downloadRes = await FileSystem.downloadAsync(
        fullUrl,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (downloadRes.status !== 200) {
        Alert.alert('Download Failed', 'Could not generate or download the CSV.');
        return;
      }

      setCsvModalVisible(false);
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Reports & Analytics</Text>

        {/* Atabs */}
        <View style={styles.atabs}>
          <TouchableOpacity 
            style={[styles.atab, activeTab === 'attendance' && styles.atabActive]}
            onPress={() => setActiveTab('attendance')}
          >
            <Text style={[styles.atabText, activeTab === 'attendance' && styles.atabTextActive]}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.atab, activeTab === 'leave' && styles.atabActive]}
            onPress={() => setActiveTab('leave')}
          >
            <Text style={[styles.atabText, activeTab === 'leave' && styles.atabTextActive]}>Leave</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.atab, activeTab === 'corrections' && styles.atabActive]}
            onPress={() => setActiveTab('corrections')}
          >
            <Text style={[styles.atabText, activeTab === 'corrections' && styles.atabTextActive]}>Corrections</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'attendance' && (
          <View>
            {/* Bar Chart Visualizer Card */}
            <View style={styles.chartCard}>
              <Text style={styles.eyebrow}>THIS WEEK</Text>
              <Text style={styles.chartTitle}>Attendance Rate</Text>
              
              <View style={styles.reportBars}>
                <View style={styles.barCol}>
                  <Text style={styles.pct}>88%</Text>
                  <View style={[styles.bar, { height: '88%' }]} />
                  <Text style={styles.day}>M</Text>
                </View>
                <View style={styles.barCol}>
                  <Text style={styles.pct}>92%</Text>
                  <View style={[styles.bar, { height: '92%' }]} />
                  <Text style={styles.day}>T</Text>
                </View>
                <View style={styles.barCol}>
                  <Text style={styles.pct}>80%</Text>
                  <View style={[styles.bar, { height: '80%', backgroundColor: '#B9791C' }]} />
                  <Text style={styles.day}>W</Text>
                </View>
                <View style={styles.barCol}>
                  <Text style={styles.pct}>95%</Text>
                  <View style={[styles.bar, { height: '95%' }]} />
                  <Text style={styles.day}>T</Text>
                </View>
                <View style={styles.barCol}>
                  <Text style={styles.pct}>90%</Text>
                  <View style={[styles.bar, { height: '90%' }]} />
                  <Text style={styles.day}>F</Text>
                </View>
                <View style={styles.barCol}>
                  <Text style={styles.pct}>74%</Text>
                  <View style={[styles.bar, { height: '74%', backgroundColor: '#B9791C' }]} />
                  <Text style={styles.day}>S</Text>
                </View>
              </View>
            </View>

            {/* Site Summary List */}
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Site-wise summary</Text>
            </View>

            <View style={styles.miniHistory}>
              <View style={styles.miniRow}>
                <View style={[styles.statusDot, { backgroundColor: '#2F8F5B' }]} />
                <View style={styles.miniInfo}>
                  <Text style={styles.miniDay}>Facade A</Text>
                  <Text style={styles.miniHours}>96% attendance · 42 employees</Text>
                </View>
              </View>

              <View style={styles.miniRow}>
                <View style={[styles.statusDot, { backgroundColor: '#2F8F5B' }]} />
                <View style={styles.miniInfo}>
                  <Text style={styles.miniDay}>Facade B</Text>
                  <Text style={styles.miniHours}>91% attendance · 24 employees</Text>
                </View>
              </View>

              <View style={styles.miniRow}>
                <View style={[styles.statusDot, { backgroundColor: '#B9791C' }]} />
                <View style={styles.miniInfo}>
                  <Text style={styles.miniDay}>Block C</Text>
                  <Text style={styles.miniHours}>78% attendance · 31 employees</Text>
                </View>
              </View>
            </View>

            {/* Export Buttons */}
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Export</Text>
            </View>

            <View style={styles.exportList}>
              <TouchableOpacity style={styles.exportBtn} onPress={() => exportReport('Attendance CSV')}>
                <Text style={styles.exportBtnText}>📥 Export Attendance CSV</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'leave' && (
          <View>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Pending Leave Requests</Text>
            </View>

            <View style={styles.reqCard}>
              <View style={styles.reqTop}>
                <View>
                  <Text style={styles.reqName}>Farah Sheikh</Text>
                  <Text style={styles.reqMeta}>Casual · 1 day · 30 Jul</Text>
                </View>
                <View style={styles.badgePending}>
                  <Text style={styles.badgePendingText}>Pending</Text>
                </View>
              </View>
              <Text style={styles.reqBodyText}>Family function — requesting one day casual leave</Text>
              <View style={styles.actRow}>
                <TouchableOpacity style={styles.actBtnApprove} onPress={() => Alert.alert('Approved', '✓ Farah Sheikh leave approved')}>
                  <Text style={styles.actBtnApproveText}>✓ Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'corrections' && (
          <View>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Attendance Correction Requests</Text>
            </View>

            <View style={styles.reqCard}>
              <View style={styles.reqTop}>
                <View>
                  <Text style={styles.reqName}>Deepak Rao</Text>
                  <Text style={styles.reqMeta}>Correction · 23 Jul 2026</Text>
                </View>
                <View style={styles.badgePending}>
                  <Text style={styles.badgePendingText}>Pending</Text>
                </View>
              </View>
              <Text style={styles.reqBodyText}>No network signal at site gate — was present from 09:00 AM but could not check in on time.</Text>
              <View style={styles.actRow}>
                <TouchableOpacity style={styles.actBtnApprove} onPress={() => Alert.alert('Approved', '✓ Deepak Rao correction approved')}>
                  <Text style={styles.actBtnApproveText}>✓ Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Download CSV Modal */}
      {csvModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Download CSV Report</Text>
            <Text style={styles.modalSub}>Filter attendance records for download.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>ROLE</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['All', 'Employee', 'Supervisor'].map(r => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.roleBtn, csvRole === r && styles.roleBtnActive]}
                    onPress={() => setCsvRole(r as any)}
                  >
                    <Text style={[styles.roleBtnText, csvRole === r && styles.roleBtnTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>ZONE (Optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. Zone A" placeholderTextColor="#9BAFA2" value={csvZone} onChangeText={setCsvZone} />
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldFlex}>
                <Text style={styles.label}>START DATE</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9BAFA2" value={csvStartDate} onChangeText={setCsvStartDate} />
              </View>
              <View style={styles.fieldFlex}>
                <Text style={styles.label}>END DATE</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9BAFA2" value={csvEndDate} onChangeText={setCsvEndDate} />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setCsvModalVisible(false)} disabled={csvLoading}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, csvLoading && { opacity: 0.7 }]} onPress={handleDownloadCSV} disabled={csvLoading}>
                {csvLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Download CSV</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
    marginBottom: 14,
  },
  atabs: {
    flexDirection: 'row',
    backgroundColor: '#EAF6EE',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  atab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  atabActive: {
    backgroundColor: '#2F8F5B',
  },
  atabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#63796B',
  },
  atabTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 22,
    padding: 18,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9BAFA2',
    letterSpacing: 0.8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16241C',
    marginTop: 2,
    marginBottom: 14,
  },
  reportBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    height: 120,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: '#2F8F5B',
  },
  pct: {
    fontSize: 10,
    fontWeight: '700',
    color: '#63796B',
  },
  day: {
    fontSize: 10.5,
    color: '#9BAFA2',
    fontWeight: '600',
  },
  sectionHead: {
    marginTop: 20,
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
  exportList: {
    gap: 8,
  },
  exportBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exportBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16241C',
  },
  reqCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  reqTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reqName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16241C',
  },
  reqMeta: {
    fontSize: 11,
    color: '#63796B',
    marginTop: 2,
  },
  badgePending: {
    backgroundColor: '#FBEDD3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgePendingText: {
    color: '#B9791C',
    fontSize: 10.5,
    fontWeight: '700',
  },
  reqBodyText: {
    fontSize: 12,
    color: '#63796B',
    backgroundColor: '#F3FAF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  actRow: {
    marginTop: 10,
  },
  actBtnApprove: {
    backgroundColor: '#DCF2E3',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  actBtnApproveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F6B42',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10, 20, 14, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalSheet: {
    backgroundColor: '#F3FAF5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#DCEEE2',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16241C',
  },
  modalSub: {
    fontSize: 12.5,
    color: '#63796B',
    marginTop: 2,
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  fieldFlex: {
    flex: 1,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#63796B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#DCEEE2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#16241C',
    backgroundColor: '#FFFFFF',
  },
  roleBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#DCEEE2',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleBtnActive: {
    borderColor: '#2F8F5B',
    backgroundColor: '#EAF6EE',
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#63796B',
  },
  roleBtnTextActive: {
    color: '#1F6B42',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  btnGhost: {
    flex: 1,
    backgroundColor: '#EAF6EE',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16241C',
  },
  btnPrimary: {
    flex: 1.5,
    backgroundColor: '#2F8F5B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
