import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import DealListScreen from '@/screens/DealListScreen';
import LoginScreen from '@/screens/LoginScreen';
import PendingReportsScreen from '@/screens/PendingReportsScreen';
import ReportSubmissionScreen from '@/screens/ReportSubmissionScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={token ? 'DealList' : 'Login'}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DealList" component={DealListScreen} options={{ title: 'My Deals' }} />
      <Stack.Screen
        name="ReportSubmission"
        component={ReportSubmissionScreen}
        options={{ title: 'Submit Report' }}
      />
      <Stack.Screen
        name="PendingReports"
        component={PendingReportsScreen}
        options={{ title: 'Pending Reports' }}
      />
    </Stack.Navigator>
  );
}
