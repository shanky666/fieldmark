import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { COLORS } from '../constants/colors';

// Screens
import Dashboard from '../screens/supervisor/Dashboard';
import FieldRounds from '../screens/supervisor/FieldRounds';
import LogFieldRound from '../screens/supervisor/LogFieldRound';
import Messages from '../screens/supervisor/Messages';
import Team from '../screens/supervisor/Team';
import GrievanceThread from '../screens/worker/GrievanceThread'; // Reuse thread
import HistoryDetail from '../screens/worker/HistoryDetail'; // Reuse detail

export type SupervisorStackParamList = {
  SupervisorTabs: undefined;
  LogFieldRound: undefined;
  GrievanceThread: { threadId: string; supervisorName: string };
  WorkerHistoryView: { workerId: number; name: string };
  HistoryDetail: { recordId: number };
};

const Stack = createStackNavigator<SupervisorStackParamList>();
const Tab = createBottomTabNavigator();

function TabBarIcon({ label, focused }: { label: string; focused: boolean }) {
  const color = focused ? COLORS.primary : COLORS.lightText;
  return (
    <Text style={{ color, fontSize: 18, fontWeight: focused ? 'bold' : 'normal' }}>
      {label}
    </Text>
  );
}

function SupervisorTabNavigator() {
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
          tabBarLabel: t('supervisor.dashboard'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="📊" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="RoundsTab" 
        component={FieldRounds} 
        options={{
          tabBarLabel: t('supervisor.rounds'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="🚶" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="MessagesTab" 
        component={Messages} 
        options={{
          tabBarLabel: t('supervisor.messages'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="💬" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="TeamTab" 
        component={Team} 
        options={{
          tabBarLabel: t('supervisor.team'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="👥" focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function SupervisorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SupervisorTabs" component={SupervisorTabNavigator} />
      <Stack.Screen name="LogFieldRound" component={LogFieldRound} />
      <Stack.Screen name="GrievanceThread" component={GrievanceThread} />
      <Stack.Screen name="HistoryDetail" component={HistoryDetail} />
    </Stack.Navigator>
  );
}
