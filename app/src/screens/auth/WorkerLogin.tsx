import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store/auth';
import { firebasePhoneAuth } from '../../config/firebase';

type WorkerLoginNavProp = StackNavigationProp<AuthStackParamList, 'WorkerLogin'>;

interface Props {
  navigation: WorkerLoginNavProp;
}

export default function WorkerLogin({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');

  const { loginWorker, isLoading } = useAuthStore();

  // Normalize phone: if user types 10-digit number, prepend +91
  const normalizePhone = (raw: string) => {
    const cleaned = raw.trim().replace(/\s+/g, '');
    if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
    return cleaned;
  };

  const handleSendOtp = async () => {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setOtpError('Please enter your phone number.');
      return;
    }
    if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
      setOtpError('Enter a valid phone number (e.g. +91 98765 43210).');
      return;
    }

    setSendingOtp(true);
    setOtpError('');
    try {
      // Works on both Web (reCAPTCHA) and Android (native Play Services)
      await firebasePhoneAuth.sendPhoneOTP(normalizedPhone);
      setOtp('');
      setOtpSent(true);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('auth/invalid-phone-number')) {
        setOtpError('Invalid phone number format. Use E.164 format: +91XXXXXXXXXX');
      } else if (msg.includes('auth/too-many-requests')) {
        setOtpError('Too many OTP requests. Please wait and try again.');
      } else if (msg.includes('auth/operation-not-allowed')) {
        setOtpError('Phone authentication is not enabled. Contact support.');
      } else {
        setOtpError(`Failed to send OTP: ${msg}`);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndLogin = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }
    setOtpError('');
    try {
      // Get Firebase idToken (works on both Web and Android)
      const firebaseIdToken = await firebasePhoneAuth.confirmPhoneOTP(otp.trim());
      await loginWorker(normalizePhone(phone), otp.trim(), firebaseIdToken);
    } catch (e: any) {
      const msg = e?.message || e?.response?.data?.message || '';
      if (msg.includes('auth/invalid-verification-code') || msg.includes('invalid-verification-code')) {
        setOtpError('Incorrect OTP code. Please try again.');
      } else if (msg.includes('auth/code-expired') || msg.includes('auth/session-expired')) {
        setOtpError('OTP has expired. Please request a new code.');
      } else {
        setOtpError(e?.response?.data?.message || msg || 'Authentication failed. Please try again.');
      }
    }
  };

  const handleBack = () => {
    if (otpSent) {
      firebasePhoneAuth.reset();
      setOtpSent(false);
      setOtp('');
      setOtpError('');
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backArrow}>← {otpSent ? 'Change Number' : 'Back'}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.badgeIcon}>
              <Text style={styles.emoji}>👷</Text>
            </View>
            <Text style={styles.title}>Employee Login</Text>
            <Text style={styles.subtitle}>
              {otpSent
                ? `Enter the 6-digit code sent to ${normalizePhone(phone)}`
                : 'Enter your registered phone number to receive an OTP'}
            </Text>
          </View>

          <View style={styles.form}>

            {/* Step 1 – Phone number */}
            {!otpSent && (
              <View style={styles.field}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#9BAFA2"
                  value={phone}
                  onChangeText={txt => { setPhone(txt); setOtpError(''); }}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoComplete="tel"
                />
                <Text style={styles.hint}>Include country code, e.g. +91 for India</Text>
              </View>
            )}

            {/* Step 2 – OTP input */}
            {otpSent && (
              <View style={styles.field}>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor="#9BAFA2"
                  value={otp}
                  onChangeText={txt => { setOtp(txt.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>
            )}

            {/* Error message */}
            {otpError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {otpError}</Text>
              </View>
            ) : null}

            {/* Action buttons */}
            {!otpSent ? (
              <TouchableOpacity
                style={[styles.submitBtn, sendingOtp && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={sendingOtp}
              >
                {sendingOtp
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.submitBtnText}>Send OTP via Firebase</Text>}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.submitBtn, isLoading && styles.btnDisabled]}
                  onPress={handleVerifyAndLogin}
                  disabled={isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={styles.submitBtnText}>Verify OTP & Sign In</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={() => { firebasePhoneAuth.reset(); setOtpSent(false); setOtp(''); setOtpError(''); }}
                >
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Register link – shown only on step 1 */}
            {!otpSent && (
              <TouchableOpacity
                style={[styles.submitBtn, styles.registerBtn]}
                onPress={() => navigation.navigate('Register', { role: 'WORKER' })}
              >
                <Text style={[styles.submitBtnText, { color: '#2F8F5B' }]}>New Employee? Register Here</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footerInfo}>
            <Text style={styles.footerNote}>🔒 Secured by Firebase Phone Authentication</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3FAF5' },
  content: { paddingHorizontal: 24, paddingVertical: 24, flexGrow: 1, justifyContent: 'space-between' },
  backBtn: { paddingVertical: 8 },
  backArrow: { fontSize: 15, fontWeight: '600', color: '#2F8F5B' },
  header: { alignItems: 'center', marginVertical: 20 },
  badgeIcon: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: '#DCF2E3',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emoji: { fontSize: 28 },
  title: { fontSize: 24, fontWeight: '800', color: '#16241C' },
  subtitle: { fontSize: 13, color: '#63796B', textAlign: 'center', marginTop: 6, paddingHorizontal: 16 },
  form: {
    backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: '#DCEEE2',
    shadowColor: '#184A31', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 11, fontWeight: '700', color: '#63796B',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    borderWidth: 1.5, borderColor: '#DCEEE2', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: '#16241C', backgroundColor: '#FAFDFB',
  },
  otpInput: {
    fontSize: 22, letterSpacing: 8, textAlign: 'center',
    borderColor: '#2F8F5B', backgroundColor: '#F0FAF3', fontWeight: '700',
  },
  hint: { fontSize: 11, color: '#9BAFA2', marginTop: 4 },
  errorBox: {
    backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#FECACA', marginBottom: 12,
  },
  errorText: { color: '#DC2626', fontSize: 12, fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#2F8F5B', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: '#2F8F5B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  registerBtn: { backgroundColor: '#EAF6EE', marginTop: 12, shadowOpacity: 0 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  resendBtn: { alignSelf: 'center', marginTop: 14, paddingVertical: 4 },
  resendText: { fontSize: 13, color: '#2F8F5B', fontWeight: '600' },
  footerInfo: { alignItems: 'center', marginTop: 16 },
  footerNote: { fontSize: 12, color: '#9BAFA2', fontWeight: '500' },
});
