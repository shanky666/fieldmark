import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store/auth';

type RegisterNavProp = StackNavigationProp<AuthStackParamList, 'Register'>;
type RegisterRouteProp = RouteProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterNavProp;
  route: RegisterRouteProp;
}

export default function Register({ navigation, route }: Props) {
  const initialRole = route.params?.role || 'WORKER';
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'WORKER' | 'SUPERVISOR'>(initialRole);
  
  const { registerUser, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your Full Name');
      return;
    }
    if (!employeeId.trim()) {
      Alert.alert('Required', 'Please enter your Employee ID (e.g. EMP-101)');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your Phone Number');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Required', 'Please enter a Password');
      return;
    }

    try {
      await registerUser({
        name: name.trim(),
        employee_id: employeeId.trim(),
        phone: phone.trim(),
        password: password.trim(),
        role: role
      });
      Alert.alert('Success', 'Account registered successfully!');
    } catch (e: any) {
      const errMsg = e.response?.data?.message || e.message || 'Registration failed. Please check inputs.';
      Alert.alert('Registration Error', errMsg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>← Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.badgeIcon}>
              <Text style={styles.emoji}>📝</Text>
            </View>
            <Text style={styles.title}>Register Account</Text>
            <Text style={styles.subtitle}>Enter your details and Employee ID to register for FieldMark</Text>
          </View>

          <View style={styles.form}>
            
            {/* Role selector */}
            <Text style={styles.label}>SELECT ROLE</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'WORKER' && styles.roleBtnActive]}
                onPress={() => setRole('WORKER')}
              >
                <Text style={[styles.roleBtnText, role === 'WORKER' && styles.roleBtnTextActive]}>👷 Employee</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleBtn, role === 'SUPERVISOR' && styles.roleBtnActive]}
                onPress={() => setRole('SUPERVISOR')}
              >
                <Text style={[styles.roleBtnText, role === 'SUPERVISOR' && styles.roleBtnTextActive]}>📋 Supervisor</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#9BAFA2"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>EMPLOYEE ID (REQUIRED)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. EMP-1042 or SUP-201"
                placeholderTextColor="#9BAFA2"
                value={employeeId}
                onChangeText={setEmployeeId}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor="#9BAFA2"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Create password"
                placeholderTextColor="#9BAFA2"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Register & Save to Database</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerInfo}>
            <Text style={styles.footerNote}>🔒 Secured & Verified by FieldMark Database</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3FAF5',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backBtn: {
    paddingVertical: 8,
    marginBottom: 10,
  },
  backArrow: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F8F5B',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#DCF2E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16241C',
  },
  subtitle: {
    fontSize: 13,
    color: '#63796B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCEEE2',
    shadowColor: '#184A31',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: '#FAFDFB',
    borderWidth: 1.5,
    borderColor: '#DCEEE2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: '#DCF2E3',
    borderColor: '#2F8F5B',
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
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#63796B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#DCEEE2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#16241C',
    backgroundColor: '#FAFDFB',
  },
  submitBtn: {
    backgroundColor: '#2F8F5B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#2F8F5B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerNote: {
    fontSize: 12,
    color: '#9BAFA2',
    fontWeight: '500',
  },
});
