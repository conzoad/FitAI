import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthUser {
  email: string;
  name: string;
  provider: 'email' | 'google';
  uid: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string, accessToken: string | null) => Promise<void>;
  logout: () => Promise<void>;
  _initAuthListener: () => () => void;
}

function mapFirebaseUser(fbUser: FirebaseUser): AuthUser {
  const isGoogle = fbUser.providerData.some(
    (p) => p.providerId === 'google.com'
  );
  return {
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.email || '',
    provider: isGoogle ? 'google' : 'email',
    uid: fbUser.uid,
  };
}

function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Пользователь с таким email уже существует';
    case 'auth/user-not-found':
      return 'Пользователь не найден';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Неверный пароль';
    case 'auth/weak-password':
      return 'Пароль должен быть не менее 6 символов';
    case 'auth/invalid-email':
      return 'Некорректный email';
    case 'auth/too-many-requests':
      return 'Слишком много попыток. Попробуйте позже';
    case 'auth/network-request-failed':
      return 'Ошибка сети. Проверьте подключение к интернету';
    default:
      return error?.message || 'Что-то пошло не так';
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  register: async (email: string, password: string, name: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );
      await updateProfile(userCredential.user, { displayName: name });
      set({
        user: {
          email: normalizedEmail,
          name,
          provider: 'email',
          uid: userCredential.user.uid,
        },
        isAuthenticated: true,
      });
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  login: async (email: string, password: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );
      set({
        user: mapFirebaseUser(userCredential.user),
        isAuthenticated: true,
      });
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  loginWithGoogle: async (idToken: string, accessToken: string | null) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      set({
        user: mapFirebaseUser(userCredential.user),
        isAuthenticated: true,
      });
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  logout: async () => {
    await signOut(auth);
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  _initAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        set({
          user: mapFirebaseUser(fbUser),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });
    return unsubscribe;
  },
}));
