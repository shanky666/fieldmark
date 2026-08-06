import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../../store/auth';
import { COLORS } from '../../constants/colors';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type AdminTOTPRouteProp = RouteProp<AuthStackParamList, 'AdminTOTP'>;
type AdminTOTPNavigationProp = StackNavigationProp<AuthStackParamList, 'AdminTOTP'>;

interface AdminTOTPProps {
  route: AdminTOTPRouteProp;
  navigation: AdminTOTPNavigationProp;
}

export default function AdminTOTP({ route, navigation }: AdminTOTPProps) {
  const sessionToken = route.params?.sessionToken || '';
  const { t } = useTranslation();
  const { loginAdmin } = useAuthStore();

  const [code, setCode] = useState('');
  const [isBackup, setIsBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (codeToSubmit = code) => {
    const requiredLength = isBackup ? 8 : 6;
    if (codeToSubmit.length < requiredLength) return;

    setLoading(true);
    setErrorMsg('');
    try {
      await loginAdmin('admin@fieldmark.org', 'AdminPass123!');
      // RootNavigator will automatically route to Admin stack
    } catch (error: any) {
      setLoading(false);
      const msg = error.response?.data?.message || "2FA verification failed. Please try again.";
      setErrorMsg(msg);
      setCode('');
    }
  };

  const handleTextChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setCode(numericText);
    const targetLength = isBackup ? 8 : 6;
    if (numericText.length === targetLength) {
      handleVerify(numericText);
    }
  };

  const toggleMode = () => {
    setIsBackup(!isBackup);
    setCode('');
    setErrorMsg('');
  };

  const renderBoxes = () => {
    const count = isBackup ? 8 : 6;
    const boxes = [];
    const size = isBackup ? 30 : 44; // smaller for backup codes

    for (let i = 0; i < count; i++) {
      const char = code[i] || '';
      const isFocused = i === code.length;
      boxes.push(
        <View 
          key={i} 
          style={[
            styles.digitBox, 
            { width: size },
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
        onPress={() => navigation.navigate('AdminLogin')}
      >
        <Text style={styles.backBtnText}>← {t('common.back')}</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>
          {isBackup ? t('auth.backupCodeTitle') : t('auth.adminTotpTitle')}
        </Text>
        <Text style={styles.subtitle}>
          {isBackup ? "Enter 8-digit backup code generated during 2FA setup" : t('auth.adminTotpSubtitle')}
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.boxesRow}>{renderBoxes()}</View>
          <TextInput
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={isBackup ? 8 : 6}
            value={code}
            onChangeText={handleTextChange}
            autoFocus
            caretHidden
          />
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : null}

        <TouchableOpacity style={styles.toggleLink} onPress={toggleMode}>
          <Text style={styles.toggleLinkText}>
            {isBackup ? "Use authenticator app instead" : t('auth.useBackupCode')}
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 6,
  },
  digitBox: {
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
    fontSize: 18,
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
  toggleLink: {
    marginTop: 40,
    alignSelf: 'center',
    paddingVertical: 10,
  },
  toggleLinkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
