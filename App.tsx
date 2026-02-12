import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
  const isLoading = useAuthStore((s) => s.isLoading);
  const isOnboarded = useProfileStore((s) => s.profile.isOnboarded);

  useEffect(() => {
    const unsubscribe = useAuthStore.getState()._initAuthListener();
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

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
