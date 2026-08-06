import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';

interface StatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();

  const getStyle = () => {
    switch (status) {
      case 'APPROVED':
        return { bg: COLORS.accent + '22', text: COLORS.accent, label: t('common.approved') };
      case 'REJECTED':
        return { bg: COLORS.danger + '22', text: COLORS.danger, label: t('common.rejected') };
      case 'FLAGGED':
        return { bg: COLORS.warning + '22', text: '#d97706', label: t('common.flagged') }; // Amber
      case 'PENDING':
      default:
        return { bg: '#e0e0e0', text: '#555555', label: t('common.pending') };
    }
  };

  const config = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
