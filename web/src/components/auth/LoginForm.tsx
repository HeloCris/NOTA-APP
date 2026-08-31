import { useState } from "react";
import { AxiosError } from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "../../contexts/useAuth";
import type {
  LoginPayload,
  UserRole,
} from "../../types/auth";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail válido."),
  password: z
    .string()
    .min(1, "Informe sua senha."),
});

function getRedirectPath(role: UserRole) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "SELLER") {
    return "/seller";
  }

  return "/customer";
}

function getLoginErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{
    detail?: string;
  }>;

  return (
    axiosError.response?.data?.detail ??
    "Não foi possível acessar sua conta. Tente novamente."
  );
}

export function LoginForm() {
  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] =
    useState(false);

  const [serverError, setServerError] = useState<
    string | null
  >(null);

  const successMessage =
    (
      location.state as {
        successMessage?: string;
      } | null
    )?.successMessage ?? null;

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(payload: LoginPayload) {
    setServerError(null);

    try {
      const user = await login(payload);

      navigate(getRedirectPath(user.role), {
        replace: true,
      });
    } catch (error) {
      setServerError(getLoginErrorMessage(error));
    }
  }

  return (
    <div className="auth-form-container">
      <div className="auth-tabs">
        <Link to="/login" className="active">ENTRAR NA CONTA</Link>
        <Link to="/register">CRIAR CONTA</Link>
      </div>

      <div className="auth-header">
        <h1>Bem-vindo de volta</h1>
        <p>Acesse sua conta NŌTA para gerenciar catálogo, pedidos e métricas da sua loja.</p>
      </div>

      {successMessage && (
        <div className="auth-error" style={{ background: '#E8F5E9', borderColor: '#81C784', color: '#2E7D32' }}>
          {successMessage}
        </div>
      )}

      {serverError && (
        <div className="auth-error">
          {serverError}
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="auth-form"
      >
        <div className="form-group">
          <label htmlFor="email">E-mail</label>
          <div className="input-wrapper">
            <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="contato@suamarca.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="auth-form-error">{errors.email.message}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <div className="input-wrapper">
            <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <button
              type="button"
              className="btn-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="auth-form-error">{errors.password.message}</p>
          )}
          <Link to="/forgot-password" className="forgot-link">Esqueci minha senha</Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-submit"
        >
          {isSubmitting ? "Acessando..." : "ENTRAR"}
        </button>
      </form>

      <div className="auth-divider">OU</div>

      <button type="button" className="btn-google">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
        Continuar com Google
      </button>



      <div className="auth-footer">
        Ainda não vende na NŌTA? <Link to="/register">Criar conta</Link>
      </div>
    </div>
  );
}