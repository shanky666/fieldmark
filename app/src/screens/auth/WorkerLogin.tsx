import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  ImageBackground, Image
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store/auth';

type WorkerLoginNavProp = StackNavigationProp<AuthStackParamList, 'WorkerLogin'>;

interface Props {
  navigation: WorkerLoginNavProp;
}

export default function WorkerLogin({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { loginWorker, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Employee ID or Phone number.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg('');
    try {
      await loginWorker(identifier.trim(), password.trim());
    } catch (e: any) {
      let msg = 'Invalid credentials. Please check your details and try again.';
      if (e?.response?.data) {
        const d = e.response.data;
        msg = d.message || d.detail || (d.non_field_errors && d.non_field_errors[0]) || d.error || msg;
      }
      setErrorMsg(msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Top Decorative Leaves (Placeholder) */}
          <View style={styles.topDecorationLeft} />
          <View style={styles.topDecorationRight} />

          <View style={styles.content}>
            
            {/* Logo Area */}
            <View style={styles.logoContainer}>
              <View style={styles.logoRow}>
                <Text style={styles.logoAtia}>Atia</Text>
                <Text style={styles.leafIcon}>🌿</Text> 
              </View>
              <View style={styles.logoDividerContainer}>
                <View style={styles.logoDivider} />
                <Text style={styles.logoSub}>
                  FARMER PRODUCER{'\n'}COMPANY LIMITED
                </Text>
                <View style={styles.logoDivider} />
              </View>
            </View>

            {/* Title & Subtitle */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Field Staff Attendance App</Text>
              <Text style={styles.subtitle}>Track   •   Monitor   •   Empower</Text>
            </View>

            {/* Login Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Employee ID / Mobile Number"
                  placeholderTextColor="#8F9B94"
                  value={identifier}
                  onChangeText={txt => { setIdentifier(txt); setErrorMsg(''); }}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#8F9B94"
                  value={password}
                  onChangeText={txt => { setPassword(txt); setErrorMsg(''); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={styles.submitBtnContent}>
                    <Text style={styles.submitBtnText}>Login</Text>
                    <Text style={styles.submitBtnArrow}>→</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={[styles.forgotText, { color: '#2F8F5B', fontWeight: 'bold' }]}>Create Employee</Text>
                </TouchableOpacity>
              </View>
              
            </View>
          </View>
        </ScrollView>
        
        {/* Bottom Agricultural Landscape & SFAC Branding */}
        <View style={styles.footerContainer}>
          <View style={styles.footerBgShape}>
            <View style={styles.sfacContainer}>
              <Text style={styles.sfacLogo}>🌱 SFAC</Text>
              <View style={styles.sfacDivider} />
              <View>
                <Text style={styles.sfacSupported}>Supported by</Text>
                <Text style={styles.sfacTitle}>SFAC</Text>
                <Text style={styles.sfacScheme}>under 10K FPO Scheme</Text>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topDecorationLeft: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 100,
    height: 100,
    backgroundColor: '#E8F5E9',
    borderRadius: 50,
    opacity: 0.5,
  },
  topDecorationRight: {
    position: 'absolute',
    top: 20,
    right: -30,
    width: 80,
    height: 120,
    backgroundColor: '#E8F5E9',
    borderBottomLeftRadius: 60,
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoAtia: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#0A5D31',
    fontStyle: 'italic',
    letterSpacing: -2,
    lineHeight: 70,
  },
  leafIcon: {
    fontSize: 32,
    marginLeft: -10,
    marginTop: -20,
  },
  logoDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
  },
  logoDivider: {
    height: 2,
    backgroundColor: '#F2A900',
    flex: 1,
    marginHorizontal: 10,
    maxWidth: 50,
  },
  logoSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A5D31',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A5D31',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7B8D83',
    fontWeight: '500',
  },
  form: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2EBE5',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  inputIcon: {
    fontSize: 18,
    color: '#0A5D31',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A3322',
  },
  eyeIconBtn: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
    color: '#7B8D83',
  },
  errorBox: {
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#C81E1E',
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#1C7541',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1C7541',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  submitBtnArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    marginLeft: 10,
    marginTop: -2,
  },
  forgotBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotText: {
    color: '#1C7541',
    fontSize: 14,
    fontWeight: '500',
  },
  addEmployeeBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
  addEmployeeText: {
    color: '#F2A900',
    fontSize: 15,
    fontWeight: '700',
  },
  footerContainer: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  footerBgShape: {
    width: '100%',
    backgroundColor: '#E8F5E9',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    borderTopWidth: 4,
    borderTopColor: '#F2A900',
  },
  sfacContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sfacLogo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A5D31',
  },
  sfacDivider: {
    width: 1.5,
    height: 35,
    backgroundColor: '#A3C4B1',
    marginHorizontal: 16,
  },
  sfacSupported: {
    fontSize: 10,
    color: '#5C7365',
    fontWeight: '500',
  },
  sfacTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A5D31',
    marginVertical: 1,
  },
  sfacScheme: {
    fontSize: 10,
    color: '#5C7365',
    fontWeight: '500',
  },
});
