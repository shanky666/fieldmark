import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';

interface ContractWarningProps {
  contractEndDate: string | null;
}

export default function ContractWarning({ contractEndDate }: ContractWarningProps) {
  const { t } = useTranslation();

  if (!contractEndDate) {
    return null;
  }

  const today = new Date();
  const endDate = new Date(contractEndDate);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0 || diffDays > 30) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        ⚠️ {t('profile.contractExpiryWarning', { days: diffDays })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.warning + '22',
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  text: {
    color: '#d97706', // dark amber
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
