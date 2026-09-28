import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Text, ScrollView } from 'react-native';

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
import AdminGrievances from '../screens/admin/Grievances';
import AdminGrievanceDetail from '../screens/admin/AdminGrievanceDetail';
export type AdminStackParamList = {
  AdminTabs: undefined;
  VerificationDetail: { recordId: number };
  WorkerDetail: { workerId: number };
  AddWorker: { role?: 'WORKER' | 'SUPERVISOR' } | undefined;
  AddSupervisor: { role?: 'WORKER' | 'SUPERVISOR' } | undefined;
  LeaveReview: undefined;
  AdminGrievances: undefined;
  AdminGrievanceDetail: { threadId: string; employeeName: string };
};

const Stack = createStackNavigator<AdminStackParamList>();
const Tab = createBottomTabNavigator();

import { MaterialCommunityIcons } from '@expo/vector-icons';

function AdminTabNavigator() {
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
          if (route.name === 'DashboardTab') iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          else if (route.name === 'WorkersTab') iconName = focused ? 'account-group' : 'account-group-outline';
          else if (route.name === 'VerifyTab') iconName = focused ? 'clipboard-check' : 'clipboard-check-outline';
          else if (route.name === 'ReportsTab') iconName = focused ? 'file-chart' : 'file-chart-outline';
          else if (route.name === 'SettingsTab') iconName = focused ? 'cog' : 'cog-outline';
          
          return <MaterialCommunityIcons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={Dashboard} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="WorkersTab" component={Workers} options={{ tabBarLabel: "Employees" }} />
      <Tab.Screen name="VerifyTab" component={Verify} options={{ tabBarLabel: "Attendance" }} />
      <Tab.Screen name="ReportsTab" component={Reports} options={{ tabBarLabel: "Reports" }} />
      <Tab.Screen name="SettingsTab" component={Settings} options={{ tabBarLabel: "Settings" }} />
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
      <Stack.Screen name="AddSupervisor" component={AddWorker} initialParams={{ role: 'SUPERVISOR' }} />
      <Stack.Screen name="LeaveReview" component={LeaveReview} />
      <Stack.Screen name="AdminGrievances" component={AdminGrievances} />
      <Stack.Screen name="AdminGrievanceDetail" component={AdminGrievanceDetail} />
    </Stack.Navigator>
  );
}
