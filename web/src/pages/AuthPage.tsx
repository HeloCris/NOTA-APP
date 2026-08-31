import { useLocation } from "react-router-dom";

import { AuthLayout } from "../components/auth/AuthLayout";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";

export function AuthPage() {
  const location = useLocation();

  const isRegisterPage =
    location.pathname === "/register";

  return (
    <AuthLayout>
      {isRegisterPage ? (
        <RegisterForm />
      ) : (
        <LoginForm />
      )}
    </AuthLayout>
  );
}