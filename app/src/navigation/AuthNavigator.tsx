import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import RoleSelect from '../screens/auth/RoleSelect';
import WorkerLogin from '../screens/auth/WorkerLogin';
import SupervisorLogin from '../screens/auth/SupervisorLogin';
import AdminLogin from '../screens/auth/AdminLogin';
import Register from '../screens/auth/Register';

export type AuthStackParamList = {
  RoleSelect: undefined;
  WorkerLogin: undefined;
  SupervisorLogin: undefined;
  AdminLogin: undefined;
  Register?: { role?: 'WORKER' | 'SUPERVISOR' };
  AdminTOTP?: { sessionToken: string };
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelect"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F3FAF5' }
      }}
    >
      <Stack.Screen name="RoleSelect" component={RoleSelect} />
      <Stack.Screen name="WorkerLogin" component={WorkerLogin} />
      <Stack.Screen name="SupervisorLogin" component={SupervisorLogin} />
      <Stack.Screen name="AdminLogin" component={AdminLogin} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}
