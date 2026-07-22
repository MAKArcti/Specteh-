import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UserRole } from '@spectech/shared-types';
import React from 'react';
import { Text } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import FleetScreen from '@/screens/FleetScreen';
import MarketListScreen from '@/screens/MarketListScreen';
import OrdersListScreen from '@/screens/OrdersListScreen';
import ReportsScreen from '@/screens/ReportsScreen';
import EmptyState from '@/components/EmptyState';
import { colors } from '@/theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, string> = {
  Market: '🏬',
  Orders: '📋',
  Reports: '📝',
  Fleet: '🚚',
};

/**
 * Tabs are gated per the logged-in user's `roles` rather than assuming one
 * demo persona with all three (the prototype this is built from did assume
 * that) — a real account may hold only a subset.
 */
export default function MainTabs() {
  const { profile } = useAuth();
  const roles = profile?.roles ?? [];

  const showMarket = roles.includes(UserRole.CUSTOMER);
  const showOrders = roles.includes(UserRole.CUSTOMER);
  const showReports = roles.includes(UserRole.OPERATOR);
  const showFleet = roles.includes(UserRole.EQUIPMENT_OWNER);

  if (!showMarket && !showReports && !showFleet) {
    return <EmptyState text="Ваш обліковий запис не має жодної застосовної ролі." />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      {showMarket ? (
        <Tab.Screen name="Market" component={MarketListScreen} options={{ title: 'Маркет' }} />
      ) : null}
      {showOrders ? (
        <Tab.Screen name="Orders" component={OrdersListScreen} options={{ title: 'Замовлення' }} />
      ) : null}
      {showReports ? (
        <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Звіти' }} />
      ) : null}
      {showFleet ? (
        <Tab.Screen name="Fleet" component={FleetScreen} options={{ title: 'Техніка' }} />
      ) : null}
    </Tab.Navigator>
  );
}
