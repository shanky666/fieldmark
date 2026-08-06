import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/auth';
import { COLORS } from '../constants/colors';

// Navigators
import AuthNavigator from './AuthNavigator';
import WorkerNavigator from './WorkerNavigator';
import SupervisorNavigator from './SupervisorNavigator';
import AdminNavigator from './AdminNavigator';

export default function RootNavigator() {
  const { isAuthenticated, isLoading, role, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary || '#2F8F5B'} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : role === 'ADMIN' ? (
        <AdminNavigator />
      ) : role === 'SUPERVISOR' ? (
        <SupervisorNavigator />
      ) : (
        <WorkerNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F3FAF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
