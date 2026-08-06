import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { COLORS } from '../constants/colors';

// Screens
import Home from '../screens/worker/Home';
import MarkAttendance from '../screens/worker/MarkAttendance';
import CorrectionRequest from '../screens/worker/CorrectionRequest';
import Leave from '../screens/worker/Leave';
import History from '../screens/worker/History';
import HistoryDetail from '../screens/worker/HistoryDetail';
import GrievanceInbox from '../screens/worker/GrievanceInbox';
import NewGrievance from '../screens/worker/NewGrievance';
import GrievanceThread from '../screens/worker/GrievanceThread';
import Profile from '../screens/worker/Profile';

export type WorkerStackParamList = {
  WorkerTabs: undefined;
  MarkAttendance: undefined;
  CorrectionRequest: undefined;
  HistoryDetail: { recordId: number };
  NewGrievance: undefined;
  GrievanceThread: { threadId: string; supervisorName: string };
};

const Stack = createStackNavigator<WorkerStackParamList>();
const Tab = createBottomTabNavigator();

function TabBarIcon({ label, focused }: { label: string; focused: boolean }) {
  const color = focused ? COLORS.primary : COLORS.lightText;
  return (
    <Text style={{ color, fontSize: 18, fontWeight: focused ? 'bold' : 'normal' }}>
      {label}
    </Text>
  );
}

function WorkerTabNavigator() {
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
        name="HomeTab" 
        component={Home} 
        options={{
          tabBarLabel: t('worker.home'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="🏠" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="LeaveTab" 
        component={Leave} 
        options={{
          tabBarLabel: t('worker.leave'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="📅" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="HistoryTab" 
        component={History} 
        options={{
          tabBarLabel: t('worker.history'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="📊" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="MessagesTab" 
        component={GrievanceInbox} 
        options={{
          tabBarLabel: t('worker.messages'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="💬" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={Profile} 
        options={{
          tabBarLabel: t('worker.profile'),
          tabBarIcon: ({ focused }) => <TabBarIcon label="👤" focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function WorkerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkerTabs" component={WorkerTabNavigator} />
      <Stack.Screen name="MarkAttendance" component={MarkAttendance} />
      <Stack.Screen name="CorrectionRequest" component={CorrectionRequest} />
      <Stack.Screen name="HistoryDetail" component={HistoryDetail} />
      <Stack.Screen name="NewGrievance" component={NewGrievance} />
      <Stack.Screen name="GrievanceThread" component={GrievanceThread} />
    </Stack.Navigator>
  );
}
