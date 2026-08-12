import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { AdminStackParamList } from '../../navigation/AdminNavigator';

type AddWorkerScreenNavProp = StackNavigationProp<AdminStackParamList, 'AddWorker'>;

interface AddWorkerProps {
  navigation: AddWorkerScreenNavProp;
}

export default function AddWorker({ navigation }: AddWorkerProps) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [workerType, setWorkerType] = useState<'PERMANENT' | 'CONTRACTOR' | 'SEASONAL'>('PERMANENT');
  
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');
  const [loadingZones, setLoadingZones] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await apiClient.get('/api/workers/zones/');
        const loadedZones = res.data.results || res.data || [];
        setZones(loadedZones);
        if (loadedZones.length > 0) {
          setSelectedZoneId(loadedZones[0].id);
        }
      } catch (e) {
        console.error("Failed to load zones", e);
      } finally {
        setLoadingZones(false);
      }
    };
    fetchZones();
  }, []);

  const handleRegister = async () => {
    if (!name || !phone || !selectedZoneId || !password) {
      Alert.alert(t('common.error'), "Please fill in all required fields (Name, Phone, Zone, Password).");
      return;
    }

    // Phone format
    if (phone.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10 digit phone number.");
      return;
    }
    const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

    // Date formats validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (contractStart && !dateRegex.test(contractStart)) {
      Alert.alert("Invalid Date", "Contract start must match YYYY-MM-DD format.");
      return;
    }
    if (contractEnd && !dateRegex.test(contractEnd)) {
      Alert.alert("Invalid Date", "Contract end must match YYYY-MM-DD format.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/api/workers/list/', {
        username: fullPhone, // matches USERNAME_FIELD phone requirements
        name,
        phone: fullPhone,
        employee_id: employeeId,
        worker_type: workerType,
        assigned_zone: selectedZoneId,
        password,
        contract_start_date: contractStart || null,
        contract_end_date: contractEnd || null
      });

      Alert.alert(t('common.success'), "Worker registered successfully.");
      navigation.goBack();
    } catch (e: any) {
      console.error("Worker register error", e);
      const msg = e.response?.data?.message || "Failed to register worker. Check employee ID or phone uniqueness.";
      Alert.alert(t('common.error'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingZones) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.addWorker')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {/* Name */}
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Worker Full Name"
            placeholderTextColor={COLORS.lightText}
            value={name}
            onChangeText={setName}
          />

          {/* Phone */}
          <Text style={styles.label}>Phone Number (10 Digits) *</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.prefixBox}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="9999999999"
              placeholderTextColor={COLORS.lightText}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Initial Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Set a password for the worker"
            placeholderTextColor={COLORS.lightText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Employee ID */}
          <Text style={styles.label}>Employee ID (Optional, Auto-generated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. FM-1049"
            placeholderTextColor={COLORS.lightText}
            value={employeeId}
            onChangeText={setEmployeeId}
          />

          {/* Worker Type */}
          <Text style={styles.label}>{t('admin.workerType')}</Text>
          <View style={styles.typeRow}>
            {(['PERMANENT', 'CONTRACTOR', 'SEASONAL'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pill, workerType === type && styles.activePill]}
                onPress={() => setWorkerType(type)}
              >
                <Text style={[styles.pillLabel, workerType === type && styles.activePillLabel]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Assigned Zone */}
          <Text style={styles.label}>Assigned Zone *</Text>
          <View style={styles.typeRow}>
            {zones.map((z) => (
              <TouchableOpacity
                key={z.id}
                style={[styles.pill, selectedZoneId === z.id && styles.activePill]}
                onPress={() => setSelectedZoneId(z.id)}
              >
                <Text style={[styles.pillLabel, selectedZoneId === z.id && styles.activePillLabel]}>
                  {z.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contract Start Date */}
          <Text style={styles.label}>{t('admin.contractStart')} (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.lightText}
            value={contractStart}
            onChangeText={setContractStart}
          />

          {/* Contract End Date */}
          <Text style={styles.label}>{t('admin.contractEnd')} (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.lightText}
            value={contractEnd}
            onChangeText={setContractEnd}
          />

          <TouchableOpacity
            style={[styles.btn, submitting && styles.btnDisabled]}
            disabled={submitting}
            onPress={handleRegister}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.btnText}>Register Worker</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 12,
    minHeight: 44,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.lightText,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.darkText,
    backgroundColor: COLORS.lightGray,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  prefixBox: {
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    height: 44,
    justifyContent: 'center',
  },
  prefixText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  phoneInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.darkText,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillLabel: {
    fontSize: 11,
    color: COLORS.darkText,
    fontWeight: 'bold',
  },
  activePillLabel: {
    color: '#ffffff',
  },
  btn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 44,
  },
  btnDisabled: {
    backgroundColor: '#a8dba8',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0faf0',
  },
});
