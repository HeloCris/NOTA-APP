import { useState } from "react";
import { AxiosError } from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "../../contexts/useAuth";
import type { RegisterPayload } from "../../types/auth";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

const registerSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "Informe seu nome."),
  last_name: z
    .string()
    .trim()
    .min(1, "Informe seu sobrenome."),
  phone: z
    .string()
    .trim()
    .min(1, "Informe seu telefone.")
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone inv\u00E1lido."),
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail v\u00E1lido."),
  password: z
    .string()
    .min(
      8,
      "A senha deve ter pelo menos 8 caracteres.",
    ),
});

function getRegisterErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{
    detail?: string;
    email?: string[];
  }>;

  return (
    axiosError.response?.data?.email?.[0] ??
    axiosError.response?.data?.detail ??
    "N\u00E3o foi poss\u00EDvel criar sua conta. Tente novamente."
  );
}

export function RegisterForm() {
  const { register: registerUser } = useAuth();

  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [serverError, setServerError] = useState<
    string | null
  >(null);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<RegisterPayload>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(payload: RegisterPayload) {
    setServerError(null);

    try {
      await registerUser(payload);

      navigate("/login", {
        replace: true,
        state: {
          successMessage:
            "Conta criada com sucesso. Fa\u00E7a login para continuar.",
        },
      });
    } catch (error) {
      setServerError(getRegisterErrorMessage(error));
    }
  }

  return (
    <div className="auth-form-container">
      <div className="auth-tabs">
        <Link to="/login">ENTRAR NA CONTA</Link>
        <Link to="/register" className="active">CRIAR CONTA</Link>
      </div>

      <div className="auth-header">
        <h1>Criar sua conta</h1>
        <p>Cadastre-se para começar a explorar o universo NŌTA e vender sua perfumaria de nicho.</p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="auth-form"
      >
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="first_name">Nome</label>
            <div className="input-wrapper">
              <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                placeholder="João"
                aria-invalid={Boolean(errors.first_name)}
                {...register("first_name")}
              />
            </div>
            {errors.first_name && (
              <p className="auth-form-error">{errors.first_name.message}</p>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="last_name">Sobrenome</label>
            <div className="input-wrapper">
              <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                id="last_name"
                type="text"
                autoComplete="family-name"
                placeholder="Silva"
                aria-invalid={Boolean(errors.last_name)}
                {...register("last_name")}
              />
            </div>
            {errors.last_name && (
              <p className="auth-form-error">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="phone">Telefone</label>
          <div className="input-wrapper">
            <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="11 99999-0000"
              aria-invalid={Boolean(errors.phone)}
              {...register("phone", {
                onChange: (e) => {
                  e.target.value = formatPhone(e.target.value);
                },
              })}
            />
          </div>
          {errors.phone && (
            <p className="auth-form-error">{errors.phone.message}</p>
          )}
        </div>

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
              placeholder="joao@email.com"
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
              autoComplete="new-password"
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
          <p style={{ fontSize: "11px", color: "#9FADB8", marginTop: "6px" }}>Mínimo de 8 caracteres</p>
          {errors.password && (
            <p className="auth-form-error" style={{ marginTop: "2px" }}>{errors.password.message}</p>
          )}
        </div>

        <div className="checkbox-group">
          <input type="checkbox" id="terms" required />
          <label htmlFor="terms">
            Concordo com os <Link to="/terms">Termos de Uso</Link> e a <Link to="/privacy">Política de Privacidade</Link> da NŌTA.
          </label>
        </div>

        {serverError && (
          <div className="auth-error">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-submit"
        >
          {isSubmitting ? "Criando conta..." : "CRIAR CONTA"}
        </button>
      </form>


      <div className="auth-footer">
        Já tem uma conta? <Link to="/login">Entrar</Link>
      </div>
    </div>
  );
}