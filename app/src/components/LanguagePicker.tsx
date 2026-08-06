import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/auth';
import { COLORS } from '../constants/colors';

const LANGUAGES = [
  { code: 'en', name: 'EN' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' }
];

export default function LanguagePicker() {
  const { language, setLanguage } = useAuthStore();

  return (
    <View style={styles.container}>
      {LANGUAGES.map((lang) => {
        const isActive = language.toLowerCase() === lang.code.toLowerCase();
        return (
          <TouchableOpacity
            key={lang.code}
            style={[styles.pill, isActive && styles.activePill]}
            onPress={() => setLanguage(lang.code)}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {lang.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
    justifyContent: 'center',
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    minHeight: 44, // Touch target guideline
  },
  activePill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    fontSize: 12,
    color: COLORS.darkText,
    fontWeight: '500',
  },
  activeLabel: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
