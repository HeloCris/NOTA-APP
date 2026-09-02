import type { ReactNode } from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../contexts/useAuth";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();

  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-canvas p-6">
        <p className="font-inter text-sm text-text-mineral">
          Carregando sessão...
        </p>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    // Redireciona para o dashboard correto conforme a role
    if (user.role === "CUSTOMER" || user.role === "SELLER") {
      return <Navigate to="/seller" replace />;
    }

    if (user.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }

    // Fallback genérico
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}