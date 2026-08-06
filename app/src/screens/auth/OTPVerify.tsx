import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../../store/auth';
import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type OTPVerifyRouteProp = RouteProp<AuthStackParamList, 'OTPVerify'>;
type OTPVerifyNavigationProp = StackNavigationProp<AuthStackParamList, 'OTPVerify'>;

interface OTPVerifyProps {
  route: OTPVerifyRouteProp;
  navigation: OTPVerifyNavigationProp;
}

export default function OTPVerify({ route, navigation }: OTPVerifyProps) {
  const phone = route.params?.phone || '';
  const { t } = useTranslation();
  const { loginWorker } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');

  // Count down timer
  useEffect(() => {
    if (resendTimer === 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = async (codeToSubmit = otp) => {
    if (codeToSubmit.length < 6) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      await loginWorker(phone, codeToSubmit);
      // RootNavigator will automatically react to auth store state change and route
    } catch (error: any) {
      setLoading(false);
      const msg = error.response?.data?.message || t('auth.verificationFailed');
      setErrorMsg(msg);
      setOtp(''); // reset
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    
    setErrorMsg('');
    setResendTimer(60);
    try {
      await apiClient.post('/api/auth/send-otp/', { phone });
      Alert.alert(t('common.success'), "A new verification code has been sent.");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to resend code.";
      setErrorMsg(msg);
    }
  };

  const handleTextChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setOtp(numericText);
    if (numericText.length === 6) {
      handleVerify(numericText);
    }
  };

  // Render 6 boxes
  const renderBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const char = otp[i] || '';
      const isFocused = i === otp.length;
      boxes.push(
        <View 
          key={i} 
          style={[
            styles.digitBox, 
            char ? styles.digitBoxFilled : null,
            isFocused ? styles.digitBoxActive : null
          ]}
        >
          <Text style={styles.digitText}>{char}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backBtnText}>← {t('common.back')}</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.otpVerifyTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.otpSentText', { phone })}</Text>

        <View style={styles.inputContainer}>
          {/* Overlay text inputs on top of styled boxes */}
          <View style={styles.boxesRow}>{renderBoxes()}</View>
          <TextInput
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={handleTextChange}
            autoFocus
            caretHidden
          />
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : null}

        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.timerText}>
              {t('auth.resendTimer', { seconds: resendTimer })}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>{t('auth.resendCode')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
    paddingTop: 44,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 40,
  },
  inputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: 50,
    opacity: 0,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
  },
  digitBox: {
    width: 44,
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBoxFilled: {
    borderColor: COLORS.primary,
  },
  digitBoxActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.secondary,
  },
  digitText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  loader: {
    marginTop: 30,
  },
  resendRow: {
    marginTop: 40,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    color: COLORS.lightText,
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
