import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface MetricCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  color?: string;
}

export default function MetricCard({ label, value, sublabel, color }: MetricCardProps) {
  const highlightColor = color || COLORS.primary;

  return (
    <View style={styles.card}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <Text style={[styles.value, { color: highlightColor }]}>{value}</Text>
      {sublabel ? (
        <Text style={styles.sublabel} numberOfLines={1}>{sublabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: '45%',
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
    margin: 4,
  },
  label: {
    fontSize: 11,
    color: COLORS.lightText,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  sublabel: {
    fontSize: 10,
    color: COLORS.lightText,
  },
});
