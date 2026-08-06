import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store/auth';

type SupervisorLoginNavProp = StackNavigationProp<AuthStackParamList, 'SupervisorLogin'>;

interface Props {
  navigation: SupervisorLoginNavProp;
}

export default function SupervisorLogin({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { loginSupervisor, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Supervisor ID or Phone number.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg('');
    try {
      await loginSupervisor(identifier.trim(), password.trim());
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.badgeIcon}>
              <Text style={styles.emoji}>📋</Text>
            </View>
            <Text style={styles.title}>Supervisor Login</Text>
            <Text style={styles.subtitle}>
              Enter your assigned Supervisor ID / Phone and Password
            </Text>
          </View>

          <View style={styles.form}>

            <View style={styles.field}>
              <Text style={styles.label}>SUPERVISOR ID OR PHONE</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. SUP-001 or 9876543210"
                placeholderTextColor="#9BAFA2"
                value={identifier}
                onChangeText={txt => { setIdentifier(txt); setErrorMsg(''); }}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#9BAFA2"
                value={password}
                onChangeText={txt => { setPassword(txt); setErrorMsg(''); }}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {errorMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.submitBtnText}>Sign In as Supervisor</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register', { role: 'SUPERVISOR' })}
            >
              <Text style={styles.registerText}>
                New Supervisor? <Text style={styles.registerTextBold}>Register Here</Text>
              </Text>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  content: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  backBtn: {
    marginBottom: 16,
  },
  backArrow: {
    fontSize: 16,
    color: '#2D5F3E',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2EFE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A3322',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#5C7365',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C7365',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#D0DDD5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A3322',
  },
  errorBox: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#C81E1E',
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#2D5F3E',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerText: {
    color: '#5C7365',
    fontSize: 14,
  },
  registerTextBold: {
    color: '#2D5F3E',
    fontWeight: 'bold',
  },
});
