import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/auth';

// Navigators
import AuthNavigator from './AuthNavigator';
import WorkerNavigator from './WorkerNavigator';
import SupervisorNavigator from './SupervisorNavigator';
import AdminNavigator from './AdminNavigator';
import SplashScreen from '../screens/SplashScreen';

export default function RootNavigator() {
  const { isAuthenticated, isLoading, role, loadSession } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Start session load
    loadSession();
    
    // Ensure splash screen shows for at least 1.8 seconds to see animation
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || showSplash) {
    return <SplashScreen />;
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
