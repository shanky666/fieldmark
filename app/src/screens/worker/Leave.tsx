import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function Leave({ navigation }: any) {
  const [selectedType, setSelectedType] = useState('casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [balance, setBalance] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveData();
    const todayStr = new Date().toISOString().split('T')[0];
    setFromDate(todayStr);
    setToDate(todayStr);
  }, []);

  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      const [balRes, reqRes] = await Promise.all([
        apiClient.get('/api/leave/balance/me/'),
        apiClient.get('/api/leave/me/')
      ]);
      setBalance(balRes.data);
      setMyRequests(reqRes.data?.results || reqRes.data || []);
    } catch (e) {
      console.warn("Failed to fetch leave data", e);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
      });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setProofUri(result.assets[0].uri);
        setProofName(result.assets[0].name);
      }
    } catch (err) {
      console.warn("Document picker error:", err);
    }
  };

  const submitLeave = async () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please enter a brief reason for your leave request.');
      return;
    }

    if (!fromDate || !toDate) {
      Alert.alert('Date Required', 'Please enter both from and to dates.');
      return;
    }

    if (toDate < fromDate) {
      Alert.alert('Invalid Dates', 'To date cannot be before from date.');
      return;
    }

    if (!proofUri) {
      Alert.alert('Proof Required', 'Please upload a supporting document (PDF, JPG, PNG).');
      return;
    }

    const leaveTypeMap: Record<string, string> = {
      casual: 'CASUAL',
      sick: 'SICK',
      holiday: 'FIELD_HOLIDAY',
      unpaid: 'UNPAID',
    };

    setSubmitting(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('leave_type', leaveTypeMap[selectedType]);
      formData.append('start_date', fromDate);
      formData.append('end_date', toDate);
      formData.append('reason', reason.trim());

      const fileType = proofName?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
      formData.append('proof_document', {
        uri: proofUri,
        name: proofName || 'proof.jpg',
        type: fileType,
      } as any);

      await apiClient.post('/api/leave/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Leave request submitted for review.');

      setReason('');
      setProofUri(null);
      setProofName(null);
      fetchLeaveData();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error || 'Failed to submit leave request.';
      Alert.alert('Submission Notice', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Leave Module</Text>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Apply for Leave</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>LEAVE TYPE</Text>
          <View style={styles.typeGrid}>
            <TouchableOpacity style={[styles.typeBtn, selectedType === 'casual' && styles.typeBtnSel]} onPress={() => setSelectedType('casual')}>
              <Text style={[styles.typeBtnText, selectedType === 'casual' && styles.typeBtnTextSel]}>Casual</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, selectedType === 'sick' && styles.typeBtnSel]} onPress={() => setSelectedType('sick')}>
              <Text style={[styles.typeBtnText, selectedType === 'sick' && styles.typeBtnTextSel]}>Sick</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>START DATE (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>END DATE (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          <Text style={styles.label}>LEAVE REASON</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for leave..."
            multiline
          />

          <Text style={styles.label}>PROOF DOCUMENT (REQUIRED)</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
            <Text style={styles.uploadBtnText}>{proofName ? `📎 ${proofName}` : '📎 Upload PDF / JPG / PNG'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={submitLeave} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Leave Request</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Leave History</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#1F6B42" style={{ marginTop: 20 }} />
        ) : myRequests.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No leave requests found.</Text>
        ) : (
          myRequests.map((req, idx) => (
            <View key={req.id || idx} style={styles.historyCard}>
              <View style={styles.row}>
                <Text style={styles.historyDates}>{req.start_date} to {req.end_date}</Text>
                <View style={[
                  styles.badge, 
                  req.status === 'APPROVED' ? styles.badgeApproved : req.status === 'REJECTED' ? styles.badgeRejected : styles.badgePending
                ]}>
                  <Text style={styles.badgeText}>{req.status}</Text>
                </View>
              </View>
              <Text style={styles.historyType}>{req.leave_type}</Text>
              <Text style={styles.historyReason} numberOfLines={2}>Reason: {req.reason}</Text>
              {req.proof_document && (
                <Text style={styles.historyDoc}>📎 Document attached</Text>
              )}
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8F5' },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#1F6B42', marginBottom: 20 },
  sectionHead: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  
  formCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 30,
    borderWidth: 1, borderColor: '#E8F5E9', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#EEE', fontSize: 14, color: '#333'
  },
  typeGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  typeBtn: {
    flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 12, borderRadius: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#EEE'
  },
  typeBtnSel: { backgroundColor: '#E8F5E9', borderColor: '#1F6B42' },
  typeBtnText: { color: '#666', fontWeight: '600' },
  typeBtnTextSel: { color: '#1F6B42', fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  uploadBtn: {
    backgroundColor: '#FFF3E0', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#FFE0B2',
    alignItems: 'center', marginBottom: 24, marginTop: 4, borderStyle: 'dashed'
  },
  uploadBtnText: { color: '#E87722', fontWeight: 'bold', fontSize: 14 },
  
  submitBtn: { backgroundColor: '#1F6B42', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  historyCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEE'
  },
  historyDates: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  historyType: { fontSize: 12, color: '#1F6B42', fontWeight: '600', marginTop: 4 },
  historyReason: { fontSize: 13, color: '#666', marginTop: 8 },
  historyDoc: { fontSize: 12, color: '#E87722', marginTop: 8, fontStyle: 'italic' },
  
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeApproved: { backgroundColor: '#E8F5E9' },
  badgeRejected: { backgroundColor: '#FFEBEE' },
  badgePending: { backgroundColor: '#E3F2FD' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' }
});
