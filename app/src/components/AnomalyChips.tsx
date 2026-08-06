import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface AnomalyChipsProps {
  flags: string[];
}

export default function AnomalyChips({ flags }: AnomalyChipsProps) {
  if (!flags || flags.length === 0) {
    return null;
  }

  const getLabelAndColor = (flag: string) => {
    switch (flag) {
      case 'EXIF_MISMATCH':
        return { label: '⚠️ EXIF GPS mismatch', color: COLORS.danger };
      case 'OUTSIDE_ZONE':
        return { label: '📍 Outside zone boundary', color: '#d97706' }; // Amber
      case 'SPEED_VIOLATION':
        return { label: '⚡ Speed violation', color: COLORS.danger };
      case 'DUPLICATE_PHOTO':
        return { label: '📷 Duplicate photo hash', color: COLORS.danger };
      case 'DEVICE_CHANGE':
        return { label: '📱 Device swapped', color: '#d97706' };
      case 'CUTOFF_PATTERN':
        return { label: '⏳ Cutoff pattern', color: '#d97706' };
      case 'CLIENT_LIVENESS_WARN':
        return { label: '🖥️ Screen reflection detected', color: '#d97706' };
      default:
        return { label: `🚩 ${flag}`, color: COLORS.lightText };
    }
  };

  return (
    <View style={styles.container}>
      {flags.map((flag, idx) => {
        const config = getLabelAndColor(flag);
        return (
          <View key={`${flag}-${idx}`} style={[styles.chip, { borderColor: config.color }]}>
            <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
