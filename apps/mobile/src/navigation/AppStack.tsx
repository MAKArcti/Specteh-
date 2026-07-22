import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AddEquipmentScreen from '@/screens/AddEquipmentScreen';
import AssignOrderScreen from '@/screens/AssignOrderScreen';
import ChatScreen from '@/screens/ChatScreen';
import CreateOrderScreen from '@/screens/CreateOrderScreen';
import EquipmentDetailScreen from '@/screens/EquipmentDetailScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import OrderDetailScreen from '@/screens/OrderDetailScreen';
import PassportScreen from '@/screens/PassportScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ReportCreateScreen from '@/screens/ReportCreateScreen';
import MainTabs from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Detail/secondary screens live as siblings of the Tabs screen in this one
 * stack (rather than nested per-tab stacks) so a `navigate('OrderDetail', …)`
 * call from inside any tab bubbles up to here automatically — React
 * Navigation resolves an unmatched screen name by walking up to the parent
 * navigator, which is exactly the "push on top, tab bar disappears" behavior
 * the prototype wants.
 */
export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} />
      <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="AssignOrder" component={AssignOrderScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="AddEquipment" component={AddEquipmentScreen} />
      <Stack.Screen name="Passport" component={PassportScreen} />
      <Stack.Screen name="ReportCreate" component={ReportCreateScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
