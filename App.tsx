import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { useProfileStore } from './src/stores/useProfileStore';
import { useAuthStore } from './src/stores/useAuthStore';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOnboarded = useProfileStore((s) => s.profile.isOnboarded);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        {!isAuthenticated ? (
          <AuthScreen />
        ) : isOnboarded ? (
          <RootNavigator />
        ) : (
          <ProfileScreen isOnboarding />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
