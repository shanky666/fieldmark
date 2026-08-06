import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store/auth';

type AdminLoginNavProp = StackNavigationProp<AuthStackParamList, 'AdminLogin'>;

interface Props {
  navigation: AdminLoginNavProp;
}

export default function AdminLogin({ navigation }: Props) {
  const [email, setEmail] = useState('admin@fieldmark.org');
  const [password, setPassword] = useState('AdminPass123!');
  const { loginAdmin, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter Administrator email and password');
      return;
    }
    try {
      await loginAdmin(email.trim(), password.trim());
    } catch (e: any) {
      Alert.alert('Authentication Failed', e.message || 'Invalid administrator credentials');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.badgeIcon}>
            <Text style={styles.emoji}>🗂</Text>
          </View>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Administrator Firebase Login for Management & Reports</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Admin Email</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@fieldmark.org"
              placeholderTextColor="#9BAFA2"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor="#9BAFA2"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In as Admin</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerNote}>🔒 Secure Login powered by Firebase Auth</Text>
        </View>

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
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backArrow: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6E56A6',
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#EAE3F7',
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
  field: {
    marginBottom: 16,
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
    backgroundColor: '#6E56A6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#6E56A6',
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
    marginTop: 12,
  },
  footerNote: {
    fontSize: 12,
    color: '#9BAFA2',
    fontWeight: '500',
  },
});
