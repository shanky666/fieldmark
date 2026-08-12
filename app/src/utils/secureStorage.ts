/**
 * Cross-platform secure storage utility.
 * - On native (iOS/Android): uses expo-secure-store (encrypted keychain/keystore)
 * - On web: falls back to localStorage (no encryption, acceptable for dev/demo)
 */
import { Platform } from 'react-native';

let SecureStore: typeof import('expo-secure-store') | null = null;

if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('Failed to require expo-secure-store', e);
  }
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web' || !SecureStore) {
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('SecureStore.getItemAsync failed:', e);
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web' || !SecureStore) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('SecureStore.setItemAsync failed:', e);
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      } catch {}
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web' || !SecureStore) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('SecureStore.deleteItemAsync failed:', e);
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      } catch {}
    }
  },
};
