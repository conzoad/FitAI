import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { useProfileStore } from './src/stores/useProfileStore';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const isOnboarded = useProfileStore((s) => s.profile.isOnboarded);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        {isOnboarded ? <RootNavigator /> : <ProfileScreen isOnboarding />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
