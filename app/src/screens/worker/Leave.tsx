import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function Leave({ navigation }: any) {
  const [selectedType, setSelectedType] = useState('casual');
  const [fromDate, setFromDate] = useState('2026-07-30');
  const [toDate, setToDate] = useState('2026-07-30');
  const [reason, setReason] = useState('');

  const submitLeave = () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please enter a brief reason for your leave request.');
      return;
    }
    Alert.alert('Success', '✓ Leave request submitted to supervisor for review');
    setReason('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Leave Requests</Text>

        {/* Quota Grid */}
        <View style={styles.statGrid}>
          <View style={styles.statTile}>
            <Text style={[styles.statNum, { color: '#2F8F5B' }]}>8</Text>
            <Text style={styles.statLbl}>Casual left</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statNum, { color: '#6E56A6' }]}>6</Text>
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
              <TextInput style={styles.input} value={fromDate} onChangeText={setFromDate} />
            </View>
            <View style={styles.fieldFlex}>
              <Text style={styles.label}>TO DATE</Text>
              <TextInput style={styles.input} value={toDate} onChangeText={setToDate} />
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

          <TouchableOpacity style={styles.btnPrimary} onPress={submitLeave}>
            <Text style={styles.btnPrimaryText}>Submit Request</Text>
          </TouchableOpacity>
        </View>

        {/* My Requests List */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>My requests</Text>
        </View>

        <View style={styles.reqCard}>
          <View style={styles.reqTop}>
            <View>
              <Text style={styles.reqName}>Casual leave · 26 Jul</Text>
              <Text style={styles.reqMeta}>1 day · Submitted 24 Jul</Text>
            </View>
            <View style={styles.badgeApproved}>
              <Text style={styles.badgeApprovedText}>Approved</Text>
            </View>
          </View>
          <View style={styles.reqBody}>
            <Text style={styles.reqBodyText}>Family function</Text>
          </View>
        </View>

        <View style={styles.reqCard}>
          <View style={styles.reqTop}>
            <View>
              <Text style={styles.reqName}>Sick leave · 18–19 Jul</Text>
              <Text style={styles.reqMeta}>2 days · Submitted 17 Jul</Text>
            </View>
            <View style={styles.badgeApproved}>
              <Text style={styles.badgeApprovedText}>Approved</Text>
            </View>
          </View>
          <View style={styles.reqBody}>
            <Text style={styles.reqBodyText}>Fever, doctor advised rest</Text>
          </View>
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
