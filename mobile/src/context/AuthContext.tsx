import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, onRefreshFailure } from '../services/api';
import { getToken, saveToken, deleteToken } from '../utils/storage';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  olfactory_families: string[];
  preferred_notes: string[];
}

interface OlfactoryProfile {
  olfactory_families: string[];
  preferred_notes: string[];
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (data: any) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  updateOlfactoryProfile: (data: OlfactoryProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const formatUser = (userData: any): User | null => {
  if (!userData) return null;
  return {
    ...userData,
    olfactory_families: Array.isArray(userData?.olfactory_families)
      ? userData.olfactory_families
      : [],
    preferred_notes: Array.isArray(userData?.preferred_notes)
      ? userData.preferred_notes
      : [],
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    await deleteToken(ACCESS_TOKEN_KEY);
    await deleteToken(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const token = await getToken(ACCESS_TOKEN_KEY);
        if (token && active) {
          const userData = await authService.me();
          if (active) setUser(formatUser(userData));
        } else if (active) {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    restoreSession();

    const unsubscribe = onRefreshFailure(() => {
      signOut();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [signOut]);

  async function signIn(data: any) {
    const tokens = await authService.login(data);
    await saveToken(ACCESS_TOKEN_KEY, tokens.access);
    await saveToken(REFRESH_TOKEN_KEY, tokens.refresh);
    const userData = await authService.me();
    setUser(formatUser(userData));
  }

  async function signUp(data: any) {
    const response = await authService.register(data);

    if (response?.access && response?.refresh) {
      await saveToken(ACCESS_TOKEN_KEY, response.access);
      await saveToken(REFRESH_TOKEN_KEY, response.refresh);
      const userData = await authService.me();
      setUser(formatUser(userData));
    } else {
      await signIn({ email: data.email, password: data.password });
    }
  }

  async function signInWithGoogle(idToken: string) {
    const tokens = await authService.loginWithGoogle(idToken);
    await saveToken(ACCESS_TOKEN_KEY, tokens.access);
    await saveToken(REFRESH_TOKEN_KEY, tokens.refresh);
    const userData = await authService.me();
    setUser(formatUser(userData));
  }

  async function updateProfile(data: any) {
    const updatedUser = await authService.updateProfile(data);
    setUser((prev) => formatUser({ ...prev, ...updatedUser }));
  }

  async function updateOlfactoryProfile(data: OlfactoryProfile) {
    const response = await authService.updateOlfactoryProfile(data);
    setUser((prev) => {
      const merged = {
        ...prev,
        ...response,
        olfactory_families:
          Array.isArray(response?.olfactory_families) && response.olfactory_families.length > 0
            ? response.olfactory_families
            : data.olfactory_families,
        preferred_notes:
          Array.isArray(response?.preferred_notes) && response.preferred_notes.length > 0
            ? response.preferred_notes
            : data.preferred_notes,
      };
      return formatUser(merged);
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        updateOlfactoryProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);