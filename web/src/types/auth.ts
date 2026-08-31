export type UserRole =
  | "ADMIN"
  | "SELLER"
  | "CUSTOMER";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  first_name: string;
  role: "CUSTOMER";
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  store_id: number | null;
}

export interface AuthContextValue {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    payload: LoginPayload,
  ) => Promise<AuthenticatedUser>;
  register: (
    payload: RegisterPayload,
  ) => Promise<RegisterResponse>;
  logout: () => void;
}