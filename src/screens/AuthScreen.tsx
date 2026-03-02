import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useAuthStore } from '../stores/useAuthStore';
import { useLanguageStore } from '../stores/useLanguageStore';
import { t } from '../i18n/translations';
import { darkColors } from '../theme/colors';
import { useColors } from '../theme/useColors';

WebBrowser.maybeCompleteAuthSession();

const googleClientId = Constants.expoConfig?.extra?.googleClientId || '';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const { register, login, loginWithGoogle } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const lang = useLanguageStore((s) => s.language);
  const T = t(lang);

  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'kbzhu-tracker',
    path: 'redirect',
  });

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    },
    discovery
  );

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(T.common.error, T.auth.fieldsError);
      return;
    }
    if (mode === 'register' && !name.trim()) {
      Alert.alert(T.common.error, T.auth.nameError);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (e: any) {
      Alert.alert(T.common.error, e.message || T.auth.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      Alert.alert(
        T.auth.googleSetupTitle,
        T.auth.googleSetupMessage
      );
      return;
    }

    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.authentication) {
        await loginWithGoogle(
          result.authentication.idToken!,
          result.authentication.accessToken
        );
      }
    } catch (e: any) {
      Alert.alert(T.common.error, e.message || T.auth.genericError);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.headerSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>💪</Text>
            </View>
            <Text style={styles.appName}>FitAI</Text>
            <Text style={styles.subtitle}>
              {mode === 'login' ? T.auth.welcomeBack : T.auth.createAccount}
            </Text>
          </View>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && styles.modeActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>
                {T.auth.login}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'register' && styles.modeActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>
                {T.auth.register}
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <>
              <Text style={styles.label}>{T.auth.nameLabel}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={T.auth.namePlaceholder}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </>
          )}

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>{T.auth.passwordLabel}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'register' ? T.auth.passwordPlaceholderRegister : T.auth.passwordPlaceholderLogin}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'login' ? T.auth.loginButton : T.auth.registerButton}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{T.auth.or}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>{T.auth.googleLogin}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(c: typeof darkColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 24,
      paddingBottom: 40,
      justifyContent: 'center',
      flexGrow: 1,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 36,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(108, 92, 231, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    logoEmoji: {
      fontSize: 36,
    },
    appName: {
      fontSize: 36,
      fontWeight: '800',
      color: c.primary,
      marginBottom: 8,
      letterSpacing: -1,
    },
    subtitle: {
      fontSize: 16,
      color: c.textSecondary,
    },
    modeRow: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 4,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: c.border,
    },
    modeTab: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 11,
      alignItems: 'center',
    },
    modeActive: {
      backgroundColor: c.primary,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    modeText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textMuted,
    },
    modeTextActive: {
      color: '#FFFFFF',
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      marginBottom: 8,
      marginTop: 16,
      letterSpacing: 1.2,
    },
    input: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      fontSize: 16,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    primaryButton: {
      backgroundColor: c.primary,
      borderRadius: 14,
      padding: 17,
      alignItems: 'center',
      marginTop: 28,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 28,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: c.textMuted,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 15,
      borderWidth: 1,
      borderColor: c.borderLight,
      gap: 10,
    },
    googleIcon: {
      fontSize: 20,
      fontWeight: '700',
      color: '#4285F4',
    },
    googleText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
    },
  });
}
