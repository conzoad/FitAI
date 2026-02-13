import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { useProfileStore } from './src/stores/useProfileStore';
import { useAuthStore } from './src/stores/useAuthStore';
import { useThemeStore } from './src/stores/useThemeStore';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import { useColors } from './src/theme/useColors';
import { loadFromFirestoreIfEmpty, startSyncListeners } from './src/services/firestoreSync';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const uid = useAuthStore((s) => s.user?.uid);
  const isOnboarded = useProfileStore((s) => s.profile.isOnboarded);
  const hasHydrated = useProfileStore((s) => s._hasHydrated);
  const syncCleanupRef = useRef<(() => void) | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const colors = useColors();

  useEffect(() => {
    const unsubscribe = useAuthStore.getState()._initAuthListener();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !hasHydrated || !uid) {
      if (syncCleanupRef.current) {
        syncCleanupRef.current();
        syncCleanupRef.current = null;
      }
      return;
    }

    let cancelled = false;

    (async () => {
      await loadFromFirestoreIfEmpty(uid);
      if (!cancelled) {
        syncCleanupRef.current = startSyncListeners(uid);
      }
    })();

    return () => {
      cancelled = true;
      if (syncCleanupRef.current) {
        syncCleanupRef.current();
        syncCleanupRef.current = null;
      }
    };
  }, [isAuthenticated, hasHydrated, uid]);

  const statusBarStyle = theme === 'light' ? 'dark' : theme === 'dark' ? 'light' : 'auto';

  if (isLoading || !hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={statusBarStyle} />
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
