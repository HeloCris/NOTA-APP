import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../services/api';
import { getToken, saveToken, deleteToken } from '../utils/storage';

interface User {
  id: number;
  email: string;
  first_name: string;
  role: string;
  olfactory_families: string[];
  preferred_notes: string[];
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  signIn: (data: any) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const token = await getToken(ACCESS_TOKEN_KEY);
      if (token) {
        const userData = await authService.me();
        setUser(userData);
      }
    } catch (error) {
      await signOut();
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(data: any) {
    const tokens = await authService.login(data);
    await saveToken(ACCESS_TOKEN_KEY, tokens.access);
    await saveToken(REFRESH_TOKEN_KEY, tokens.refresh);
    const userData = await authService.me();
    setUser(userData);
  }

  async function signInWithGoogle(idToken: string) {
    const tokens = await authService.googleAuth(idToken);
    await saveToken(ACCESS_TOKEN_KEY, tokens.access);
    await saveToken(REFRESH_TOKEN_KEY, tokens.refresh);
    const userData = await authService.me();
    setUser(userData);
  }

  async function updateProfile(data: { olfactory_families: string[], preferred_notes: string[] }) {
    const updatedUser = await authService.updateOlfactoryProfile(data);
    setUser(updatedUser);
  }

  async function signOut() {
    await deleteToken(ACCESS_TOKEN_KEY);
    await deleteToken(REFRESH_TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);