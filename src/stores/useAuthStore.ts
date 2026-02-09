import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface AuthUser {
  email: string;
  name: string;
  provider: 'email' | 'google';
}

interface StoredCredential {
  email: string;
  passwordHash: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  storedCredentials: StoredCredential[];
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (email: string, name: string) => void;
  logout: () => void;
}

async function hashPassword(password: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      storedCredentials: [],

      register: async (email: string, password: string, name: string) => {
        const { storedCredentials } = get();
        const normalizedEmail = email.toLowerCase().trim();

        if (storedCredentials.some((c) => c.email === normalizedEmail)) {
          throw new Error('Пользователь с таким email уже существует');
        }

        if (password.length < 6) {
          throw new Error('Пароль должен быть не менее 6 символов');
        }

        const passwordHash = await hashPassword(password);

        set({
          user: { email: normalizedEmail, name, provider: 'email' },
          isAuthenticated: true,
          storedCredentials: [
            ...storedCredentials,
            { email: normalizedEmail, passwordHash, name },
          ],
        });
      },

      login: async (email: string, password: string) => {
        const { storedCredentials } = get();
        const normalizedEmail = email.toLowerCase().trim();
        const credential = storedCredentials.find((c) => c.email === normalizedEmail);

        if (!credential) {
          throw new Error('Пользователь не найден');
        }

        const passwordHash = await hashPassword(password);
        if (passwordHash !== credential.passwordHash) {
          throw new Error('Неверный пароль');
        }

        set({
          user: { email: normalizedEmail, name: credential.name, provider: 'email' },
          isAuthenticated: true,
        });
      },

      loginWithGoogle: (email: string, name: string) => {
        set({
          user: { email, name, provider: 'google' },
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
