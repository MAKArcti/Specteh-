import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import RootNavigator from '@/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
