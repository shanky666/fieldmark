import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Modal, KeyboardAvoidingView, TextInput, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';

export default function Home({ navigation }: any) {
  const { userProfile } = useAuthStore();
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [workedHours, setWorkedHours] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Pending');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [checkoutRecordId, setCheckoutRecordId] = useState<number | null>(null);

  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [panchayatVisited, setPanchayatVisited] = useState('');
  const [ficVisited, setFicVisited] = useState('');
  const [membersAttended, setMembersAttended] = useState('');
  const [purposeOfVisit, setPurposeOfVisit] = useState('');
  const [workDetailsText, setWorkDetailsText] = useState('');

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/attendance/today/');
      const record = res.data?.id ? res.data : (res.data?.today_record || null);

      if (record) {
        setCheckoutRecordId(record.id);
        setStatus(record.status);
        setWorkDetailsText(record.work_details || '');
        
        const checkIn = new Date(record.marked_at);
        setCheckInTime(checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        if (record.check_out_at) {
          const checkOut = new Date(record.check_out_at);
          setCheckOutTime(checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setIsCheckedIn(false);
          setIsCompletedToday(true);
        } else {
          setCheckOutTime(null);
          setIsCheckedIn(true);
          setIsCompletedToday(false);
        }
        
        setWorkedHours(record.duration_formatted || '--');
      } else {
        setCheckInTime(null);
        setCheckOutTime(null);
        setWorkedHours(null);
        setIsCheckedIn(false);
        setIsCompletedToday(false);
      }
    } catch (error) {
      console.error('Failed to load today attendance:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTodayAttendance();
    }, [fetchTodayAttendance])
  );

  const handleCheckoutPress = () => {
    setCheckoutModalVisible(true);
  };

  const performCheckout = async () => {
    if (!panchayatVisited.trim() || !ficVisited.trim() || !membersAttended.trim() || !purposeOfVisit.trim()) {
      Alert.alert("Required Fields", "Please fill in all the required field visit details.");
      return;
    }

    try {
      const res = await apiClient.post('/api/attendance/checkout/', {
        panchayat_visited: panchayatVisited.trim(),
        fic_visited: ficVisited.trim(),
        members_attended: parseInt(membersAttended.trim()) || 0,
        purpose_of_visit: purposeOfVisit.trim(),
        work_details: workDetailsText.trim()
      });
      
      const checkOutDate = new Date(res.data.check_out_at);
      setCheckOutTime(checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setWorkedHours(res.data.duration_formatted);
      setIsCheckedIn(false);
      setIsCompletedToday(true);
      setCheckoutModalVisible(false);

      Alert.alert("Success", "Checked out successfully and details saved.");
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to check out. Please try again.';
      Alert.alert('Checkout Error', msg);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.logoText}>ATIA FIELD STAFF</Text>
            <Text style={styles.dateText}>{todayStr}</Text>
            <Text style={styles.empName}>{userProfile?.name}</Text>
            <Text style={styles.empId}>ID: {userProfile?.employee_id}</Text>
          </View>
          

        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>TODAY'S ATTENDANCE</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Check-In</Text>
              <Text style={styles.val}>{checkInTime || '--:--'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Check-Out</Text>
              <Text style={styles.val}>{checkOutTime || '--:--'}</Text>
            </View>
          </View>
          
          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Worked Hours</Text>
              <Text style={styles.val}>{workedHours || '--'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Required</Text>
              <Text style={styles.val}>8 Hours</Text>
            </View>
          </View>
          
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.val, { color: status === 'ABSENT' ? '#D32F2F' : '#1F6B42' }]}>{status}</Text>
          </View>
        </View>

        {!isCheckedIn && !isCompletedToday && (
          <TouchableOpacity 
            style={styles.checkInBtn} 
            onPress={() => navigation.navigate('MarkAttendance')}
          >
            <Text style={styles.checkInBtnText}>CHECK IN</Text>
          </TouchableOpacity>
        )}

        {isCheckedIn && (
          <View style={styles.checkoutContainer}>
            <Text style={styles.checkoutLabel}>CHECK-OUT</Text>
            <Text style={styles.checkoutSub}>End Today's Attendance</Text>
            <Text style={styles.checkoutWindow}>Checkout window: 4:50 PM – 5:20 PM</Text>
            <TouchableOpacity 
              style={styles.checkOutBtn} 
              onPress={handleCheckoutPress}
            >
              <Text style={styles.checkOutBtnText}>CHECK OUT</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.navGrid}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('HistoryTab' as any)}>
            <Text style={styles.navBtnText}>ATTENDANCE HISTORY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('LeaveTab' as any)}>
            <Text style={styles.navBtnText}>LEAVE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('SalaryTab' as any)}>
            <Text style={styles.navBtnText}>SALARY / SUMMARY</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal visible={checkoutModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Field Visit Details</Text>
              <Text style={styles.modalSub}>Required before check-out.</Text>
              
              <Text style={styles.inputLabel}>Panchayat Visited *</Text>
              <TextInput style={styles.textInput} placeholder="Enter Panchayat name" value={panchayatVisited} onChangeText={setPanchayatVisited} />
              
              <Text style={styles.inputLabel}>FIC Visited *</Text>
              <TextInput style={styles.textInput} placeholder="Enter FIC name" value={ficVisited} onChangeText={setFicVisited} />
              
              <Text style={styles.inputLabel}>Members Attended *</Text>
              <TextInput style={styles.textInput} placeholder="Number of members" keyboardType="number-pad" value={membersAttended} onChangeText={setMembersAttended} />
              
              <Text style={styles.inputLabel}>Purpose of Visit *</Text>
              <TextInput style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]} placeholder="Describe the purpose" multiline value={purposeOfVisit} onChangeText={setPurposeOfVisit} />
              
              <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
              <TextInput style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]} placeholder="Any other details..." multiline value={workDetailsText} onChangeText={setWorkDetailsText} />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCheckoutModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={performCheckout}>
                  <Text style={styles.submitBtnText}>Submit & Check-Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8F5' },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  bellBtn: { padding: 8, position: 'absolute', right: 0, top: 0 },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E87722' },
  logoText: { fontSize: 18, fontWeight: '900', color: '#1F6B42', marginBottom: 4 },
  dateText: { fontSize: 14, color: '#666', marginBottom: 8 },
  empName: { fontSize: 22, fontWeight: '700', color: '#333' },
  empId: { fontSize: 14, color: '#666', marginTop: 2 },
  
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F6B42', marginBottom: 16, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  label: { fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: '600' },
  val: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  checkInBtn: {
    backgroundColor: '#1F6B42',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  checkInBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  checkoutContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  checkoutLabel: { fontSize: 18, fontWeight: '900', color: '#E87722', marginBottom: 4 },
  checkoutSub: { fontSize: 14, color: '#E87722', marginBottom: 8, fontWeight: '600' },
  checkoutWindow: { fontSize: 12, color: '#E87722', marginBottom: 16, fontStyle: 'italic' },
  checkOutBtn: {
    backgroundColor: '#E87722',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  checkOutBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  navGrid: { gap: 12 },
  navBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8F5E9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  navBtnText: { color: '#1F6B42', fontWeight: '700', fontSize: 14 },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#333', marginBottom: 4, fontWeight: '600' },
  textInput: {
    backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#EEE', fontSize: 14, color: '#333', marginBottom: 12
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12 },
  cancelBtnText: { color: '#666', fontWeight: '600', fontSize: 16 },
  submitBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: '#1F6B42', borderRadius: 12 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
