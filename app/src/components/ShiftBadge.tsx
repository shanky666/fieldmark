import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface ShiftBadgeProps {
  name: string;
  start: string;
  end: string;
}

export default function ShiftBadge({ name, start, end }: ShiftBadgeProps) {
  // Format times helper if they are HH:MM:SS
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        const hour = parseInt(parts[0]);
        const min = parts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${min} ${ampm}`;
      }
    } catch (e) {}
    return timeStr;
  };

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{name}: {formatTime(start)} – {formatTime(end)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.primary + '33',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
