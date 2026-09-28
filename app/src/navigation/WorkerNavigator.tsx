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
  MessagesTab: undefined;
  HistoryDetail: { recordId: number };
  NewGrievance: undefined;
  GrievanceThread: { threadId: string; supervisorName: string };
};

const Stack = createStackNavigator<WorkerStackParamList>();
const Tab = createBottomTabNavigator();

import { MaterialCommunityIcons } from '@expo/vector-icons';

function WorkerTabNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1C7541',
        tabBarInactiveTintColor: '#A0B0A7',
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 10, 
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2EBE5',
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'LeaveTab') iconName = focused ? 'calendar-plus' : 'calendar-blank-outline';
          else if (route.name === 'HistoryTab') iconName = focused ? 'clock-time-four' : 'clock-time-four-outline';
          else if (route.name === 'MessagesTab') iconName = focused ? 'message-text' : 'message-text-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'account' : 'account-outline';
          
          return <MaterialCommunityIcons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={Home} options={{ tabBarLabel: t('worker.home') || 'Home' }} />
      <Tab.Screen name="LeaveTab" component={Leave} options={{ tabBarLabel: t('worker.leave') || 'Leave' }} />
      <Tab.Screen name="HistoryTab" component={History} options={{ tabBarLabel: t('worker.history') || 'History' }} />
      <Tab.Screen name="MessagesTab" component={GrievanceInbox} options={{ tabBarLabel: 'Grievance' }} />
      <Tab.Screen name="ProfileTab" component={Profile} options={{ tabBarLabel: t('worker.profile') || 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function WorkerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkerTabs" component={WorkerTabNavigator} />
      <Stack.Screen name="MarkAttendance" component={MarkAttendance} />
      <Stack.Screen name="CorrectionRequest" component={CorrectionRequest} />
      <Stack.Screen name="MessagesTab" component={GrievanceInbox} />
      <Stack.Screen name="HistoryDetail" component={HistoryDetail} />
      <Stack.Screen name="NewGrievance" component={NewGrievance} />
      <Stack.Screen name="GrievanceThread" component={GrievanceThread} />
    </Stack.Navigator>
  );
}
