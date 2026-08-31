import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AxiosError } from "axios";

import {
  ACCESS_TOKEN_KEY,
  apiClient,
  REFRESH_TOKEN_KEY,
} from "../lib/apiClient";
import type {
  AuthContextValue,
  AuthenticatedUser,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
} from "../types/auth";

export const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    tokens.access,
  );

  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    tokens.refresh,
  );
}

function loadCurrentUserFromStorage(): Partial<AuthenticatedUser> | null {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthenticatedUser | null>(null);

  const [accessToken, setAccessToken] = useState<
    string | null
  >(() => localStorage.getItem(ACCESS_TOKEN_KEY));

  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredTokens();
    localStorage.removeItem("user");
    setAccessToken(null);
    setUser(null);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const storedAccessToken = localStorage.getItem(
      ACCESS_TOKEN_KEY,
    );

    if (!storedAccessToken) {
      setAccessToken(null);
      setUser(null);

      return null;
    }

    try {
      const response =
        await apiClient.get<AuthenticatedUser>(
          "/auth/me/",
        );

      setUser(response.data);
      setAccessToken(storedAccessToken);

      localStorage.setItem(
        "user",
        JSON.stringify(response.data),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401) {
        logout();
      }

      return null;
    }
  }, [logout]);

  useEffect(() => {
    async function initializeSession() {
      const stored = loadCurrentUserFromStorage();
      if (stored) {
        setUser(stored as AuthenticatedUser);
      }

      await loadCurrentUser();
      setIsLoading(false);
    }

    void initializeSession();
  }, [loadCurrentUser]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const tokenResponse =
        await apiClient.post<AuthTokens>(
          "/auth/token/",
          payload,
        );

      saveTokens(tokenResponse.data);

      setAccessToken(tokenResponse.data.access);

      const userResponse =
        await apiClient.get<AuthenticatedUser>(
          "/auth/me/",
        );

      setUser(userResponse.data);

      localStorage.setItem(
        "user",
        JSON.stringify(userResponse.data),
      );

      return userResponse.data;
    },
    [],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response =
        await apiClient.post<RegisterResponse>(
          "/auth/register/",
          payload,
        );

      return response.data;
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      register,
      logout,
    }),
    [
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}