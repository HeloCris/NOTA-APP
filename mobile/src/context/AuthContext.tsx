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
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  updateOlfactoryProfile: (data: OlfactoryProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async () => {
    await authService.logout();
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
          if (active) setUser(userData);
        }
      } catch {
        if (active) await signOut();
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
    setUser(userData);
  }

  async function signInWithGoogle(idToken: string) {
    const tokens = await authService.loginWithGoogle(idToken);
    await saveToken(ACCESS_TOKEN_KEY, tokens.access);
    await saveToken(REFRESH_TOKEN_KEY, tokens.refresh);
    const userData = await authService.me();
    setUser(userData);
  }

  async function updateProfile(data: any) {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
  }

  async function updateOlfactoryProfile(data: OlfactoryProfile) {
    const updatedUser = await authService.updateOlfactoryProfile(data);
    setUser(updatedUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        signIn,
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