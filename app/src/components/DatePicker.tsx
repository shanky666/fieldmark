import React from 'react';
import { View, Text, StyleSheet, Platform, TextInput } from 'react-native';
import { COLORS } from '../constants/colors';

interface DatePickerProps {
  label?: string;
  value: string; // Format: YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
}

export default function DatePicker({ label, value, onChange, placeholder = 'YYYY-MM-DD', minDate, maxDate }: DatePickerProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={minDate}
          max={maxDate}
          style={{
            height: '44px',
            width: '100%',
            borderRadius: '8px',
            border: `1px solid ${COLORS.border}`,
            paddingLeft: '12px',
            paddingRight: '12px',
            fontSize: '14px',
            color: COLORS.darkText,
            backgroundColor: COLORS.lightGray,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.lightText}
        value={value}
        onChangeText={onChange}
        keyboardType="numbers-and-punctuation"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.lightText,
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.darkText,
    backgroundColor: COLORS.lightGray,
  },
});
