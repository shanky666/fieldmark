import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { COLORS } from '../constants/colors';

// Screens
import Dashboard from '../screens/admin/Dashboard';
import Verify from '../screens/admin/Verify';
import VerificationDetail from '../screens/admin/VerificationDetail';
import Workers from '../screens/admin/Workers';
import WorkerDetail from '../screens/admin/WorkerDetail';
import AddWorker from '../screens/admin/AddWorker';
import Reports from '../screens/admin/Reports';
import Settings from '../screens/admin/Settings';
import LeaveReview from '../screens/admin/LeaveReview';

export type AdminStackParamList = {
  AdminTabs: undefined;
  VerificationDetail: { recordId: number };
  WorkerDetail: { workerId: number };
  AddWorker: undefined;
};

const Stack = createStackNavigator<AdminStackParamList>();
const Tab = createBottomTabNavigator();

function TabBarIcon({ label, focused }: { label: string; focused: boolean }) {
  const color = focused ? COLORS.primary : COLORS.lightText;
  return (
    <Text style={{ color, fontSize: 18, fontWeight: focused ? 'bold' : 'normal' }}>
      {label}
    </Text>
  );
}

function AdminTabNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.lightText,
        tabBarStyle: { height: 60, paddingBottom: 8, backgroundColor: COLORS.white }
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={Dashboard} 
        options={{
          tabBarLabel: t('admin.dashboard'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="🏠" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="VerifyTab" 
        component={Verify} 
        options={{
          tabBarLabel: t('admin.verifyTab'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="👁️" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="WorkersTab" 
        component={Workers} 
        options={{
          tabBarLabel: t('admin.workersTab'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="👥" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="ReportsTab" 
        component={Reports} 
        options={{
          tabBarLabel: t('admin.reportsTab'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="📈" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="LeaveReviewTab" 
        component={LeaveReview} 
        options={{
          tabBarLabel: "Leaves",
          tabBarIcon: ({ focused }) => <TabBarIcon label="📅" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={Settings} 
        options={{
          tabBarLabel: t('admin.settingsTab'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="⚙️" focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
      <Stack.Screen name="VerificationDetail" component={VerificationDetail} />
      <Stack.Screen name="WorkerDetail" component={WorkerDetail} />
      <Stack.Screen name="AddWorker" component={AddWorker} />
    </Stack.Navigator>
  );
}
