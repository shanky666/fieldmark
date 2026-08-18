import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

export default function Leave({ navigation }: any) {
  const { workerId } = useAuthStore();
  const [selectedType, setSelectedType] = useState('casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic state
  const [balance, setBalance] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveData();
    // Default from/to date to today YYYY-MM-DD
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

    const leaveTypeMap: Record<string, string> = {
      casual: 'CASUAL',
      sick: 'SICK',
      holiday: 'FIELD_HOLIDAY',
      unpaid: 'UNPAID',
    };

    setSubmitting(true);
    try {
      await apiClient.post('/api/leave/', {
        leave_type: leaveTypeMap[selectedType],
        start_date: fromDate,
        end_date: toDate,
        reason: reason.trim(),
      });

      Alert.alert(
        'Success',
        'Leave request submitted for review.'
      );

      setReason('');
      fetchLeaveData();
    } catch (e: any) {
      console.error('[LEAVE] Submit failed:', e?.response?.data || e?.message || e);
      const data = e?.response?.data;
      let msg = 'Failed to submit leave request. Please try again.';
      if (data?.detail) {
        msg = data.detail;
      } else if (typeof data?.error === 'string') {
        msg = data.error;
      } else if (data && typeof data === 'object') {
        const errors: string[] = [];
        Object.keys(data).forEach((key) => {
          const val = data[key];
          if (Array.isArray(val)) {
            errors.push(`${key.replace('_', ' ')}: ${val.join(', ')}`);
          } else if (typeof val === 'string') {
            errors.push(val);
          }
        });
        if (errors.length > 0) msg = errors.join('\n');
      } else if (e?.message) {
        msg = e.message;
      }

      Alert.alert('Submission Notice', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const casualLeft = balance ? Math.max(0, (balance.casual_total || 12) - (balance.casual_used || 0)) : '--';
  const sickLeft = balance ? Math.max(0, (balance.sick_total || 6) - (balance.sick_used || 0)) : '--';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Leave Requests</Text>

        {/* Quota Grid */}
        <View style={styles.statGrid}>
          <View style={styles.statTile}>
            <Text style={[styles.statNum, { color: '#2F8F5B' }]}>{casualLeft}</Text>
            <Text style={styles.statLbl}>Casual left</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statNum, { color: '#6E56A6' }]}>{sickLeft}</Text>
            <Text style={styles.statLbl}>Sick left</Text>
          </View>
        </View>

        {/* Apply for Leave Card */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Apply for leave</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>LEAVE TYPE</Text>
          <View style={styles.typeGrid}>
            <TouchableOpacity 
              style={[styles.typeBtn, selectedType === 'casual' && styles.typeBtnSel]}
              onPress={() => setSelectedType('casual')}
            >
              <Text style={[styles.typeBtnText, selectedType === 'casual' && styles.typeBtnTextSel]}>🌿 Casual</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeBtn, selectedType === 'sick' && styles.typeBtnSel]}
              onPress={() => setSelectedType('sick')}
            >
              <Text style={[styles.typeBtnText, selectedType === 'sick' && styles.typeBtnTextSel]}>🤒 Sick</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeBtn, selectedType === 'holiday' && styles.typeBtnSel]}
              onPress={() => setSelectedType('holiday')}
            >
              <Text style={[styles.typeBtnText, selectedType === 'holiday' && styles.typeBtnTextSel]}>🌾 Field holiday</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeBtn, selectedType === 'unpaid' && styles.typeBtnSel]}
              onPress={() => setSelectedType('unpaid')}
            >
              <Text style={[styles.typeBtnText, selectedType === 'unpaid' && styles.typeBtnTextSel]}>📋 Unpaid</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldFlex}>
              <Text style={styles.label}>FROM DATE</Text>
              <TextInput style={styles.input} value={fromDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9BAFA2" onChangeText={setFromDate} />
            </View>
            <View style={styles.fieldFlex}>
              <Text style={styles.label}>TO DATE</Text>
              <TextInput style={styles.input} value={toDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9BAFA2" onChangeText={setToDate} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>REASON</Text>
            <TextInput 
              style={[styles.input, styles.textarea]} 
              placeholder="Briefly describe your reason…" 
              placeholderTextColor="#9BAFA2"
              multiline
              numberOfLines={3}
              value={reason}
              onChangeText={setReason}
            />
          </View>

          <TouchableOpacity style={[styles.btnPrimary, submitting && { opacity: 0.7 }]} onPress={submitLeave} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* My Requests List */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>My requests</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#2F8F5B" style={{ marginVertical: 20 }} />
        ) : myRequests.length === 0 ? (
          <View style={styles.reqCard}>
            <Text style={{ color: '#63796B', fontSize: 13, textAlign: 'center', paddingVertical: 10 }}>
              No leave requests submitted yet.
            </Text>
          </View>
        ) : (
          myRequests.map((r: any) => (
            <View key={r.id} style={styles.reqCard}>
              <View style={styles.reqTop}>
                <View>
                  <Text style={styles.reqName}>{r.leave_type} · {r.start_date}</Text>
                  <Text style={styles.reqMeta}>To {r.end_date} · Submitted {r.created_at?.substring(0, 10) || r.start_date}</Text>
                </View>
                <View style={[
                  styles.badgeApproved, 
                  r.status === 'PENDING' && { backgroundColor: '#FBEDD3' },
                  r.status === 'REJECTED' && { backgroundColor: '#FBE5E1' }
                ]}>
                  <Text style={[
                    styles.badgeApprovedText,
                    r.status === 'PENDING' && { color: '#B9791C' },
                    r.status === 'REJECTED' && { color: '#C24936' }
                  ]}>{r.status}</Text>
                </View>
              </View>
              <View style={styles.reqBody}>
                <Text style={styles.reqBodyText}>{r.reason}</Text>
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
  statGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 16,
    padding: 14,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11.5,
    color: '#63796B',
    marginTop: 2,
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
  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEEE2',
    borderRadius: 22,
    padding: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#63796B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: '#DCEEE2',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeBtnSel: {
    borderColor: '#2F8F5B',
    backgroundColor: '#DCF2E3',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#63796B',
  },
  typeBtnTextSel: {
    color: '#1F6B42',
    fontWeight: '700',
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
    marginBottom: 14,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#DCEEE2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#16241C',
    backgroundColor: '#FFFFFF',
  },
  textarea: {
    height: 70,
    textAlignVertical: 'top',
  },
  btnPrimary: {
    backgroundColor: '#2F8F5B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
    alignItems: 'flex-start',
  },
  reqName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16241C',
  },
  reqMeta: {
    fontSize: 11,
    color: '#63796B',
    marginTop: 2,
  },
  badgeApproved: {
    backgroundColor: '#DCF2E3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeApprovedText: {
    color: '#1F6B42',
    fontSize: 10.5,
    fontWeight: '700',
  },
  reqBody: {
    backgroundColor: '#F3FAF5',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  reqBodyText: {
    fontSize: 12,
    color: '#63796B',
  },
});
