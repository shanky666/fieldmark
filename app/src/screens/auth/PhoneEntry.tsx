import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../../store/auth';
import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import LanguagePicker from '../../components/LanguagePicker';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type PhoneEntryNavigationProp = StackNavigationProp<AuthStackParamList, 'PhoneEntry'>;

interface PhoneEntryProps {
  navigation: PhoneEntryNavigationProp;
}

export default function PhoneEntry({ navigation }: PhoneEntryProps) {
  const { t } = useTranslation();
  const { isLoading } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendOtp = async () => {
    setErrorMsg('');
    
    // Simple validation
    if (!phone || phone.length < 10) {
      setErrorMsg(t('auth.verificationFailed'));
      return;
    }

    const fullPhone = `+91${phone}`;
    setLocalLoading(true);
    try {
      await apiClient.post('/api/auth/send-otp/', { phone: fullPhone });
      setLocalLoading(false);
      navigation.navigate('OTPVerify', { phone: fullPhone });
    } catch (error: any) {
      setLocalLoading(false);
      const msg = error.response?.data?.message || t('auth.verificationFailed');
      setErrorMsg(msg);
    }
  };

  const isBtnDisabled = phone.length < 10 || localLoading;

  return (
    <View style={styles.container}>
      {/* Language Picker on top right */}
      <View style={styles.header}>
        <LanguagePicker />
      </View>

      <View style={styles.content}>
        {/* Leaf Logo representation */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🍃</Text>
          <Text style={styles.logoText}>{t('auth.phoneEntryTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.phoneEntrySubtitle')}</Text>
        </View>

        {/* Input Form card */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.prefixBox}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('auth.phonePlaceholder')}
              placeholderTextColor={COLORS.lightText}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
            />
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity 
            style={[styles.btn, isBtnDisabled && styles.btnDisabled]} 
            onPress={handleSendOtp}
            disabled={isBtnDisabled}
          >
            {localLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.btnText}>{t('auth.sendOtp')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Admin portal redirect */}
        <TouchableOpacity 
          style={styles.adminLink} 
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Text style={styles.adminLinkText}>{t('auth.adminLink')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
  },
  header: {
    alignItems: 'flex-end',
    paddingTop: 44,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 54,
    color: COLORS.primary,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.lightText,
    marginBottom: 8,
    textTransform: 'uppercase',
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
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.darkText,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  btn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 44,
  },
  btnDisabled: {
    backgroundColor: '#a8dba8',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  adminLink: {
    marginTop: 24,
    alignSelf: 'center',
    paddingVertical: 10,
  },
  adminLinkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
