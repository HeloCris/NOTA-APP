import { useLocation } from "react-router-dom";

import { AuthLayout } from "../components/auth/AuthLayout";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import "./WelcomePage.css";
import "./AuthPage.css";

export function AuthPage() {
  const location = useLocation();

  const isRegisterPage =
    location.pathname === "/register";

  return (
    <div className="welcome-wrapper auth-wrapper">
      <AuthLayout>
        {isRegisterPage ? (
          <RegisterForm />
        ) : (
          <LoginForm />
        )}
      </AuthLayout>
    </div>
  );
}