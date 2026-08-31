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
    <>
      <nav
        aria-label="Navegação de autenticação"
        className="mb-10 flex gap-6 border-b border-border-sandstone pb-4"
      >
        <span className="-mb-[18px] border-b-2 border-primary pb-4 font-inter text-xs font-semibold uppercase tracking-[0.05em] text-primary">
          Entrar na conta
        </span>

        <Link
          to="/register"
          className="-mb-[18px] pb-4 font-inter text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant transition-colors hover:text-primary"
        >
          Criar conta
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="mb-2 font-jakarta text-2xl font-semibold leading-8 text-primary">
          Bem-vindo de volta
        </h1>

        <p className="font-inter text-sm leading-5 text-text-mineral">
          Acesse sua conta NŌTA para gerenciar inventário
          e pedidos.
        </p>
      </header>

      {successMessage && (
        <div className="mb-6 rounded-md border border-secondary bg-surface-container-low px-4 py-3 font-inter text-sm text-secondary">
          {successMessage}
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block font-inter text-xs font-semibold uppercase tracking-[0.05em] text-primary"
          >
            E-mail
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="contato@suamarca.com"
            aria-invalid={Boolean(errors.email)}
            className="w-full rounded-md border border-border-sandstone bg-surface-porcelain px-4 py-3 font-inter text-base text-on-surface outline-none transition-shadow placeholder:text-text-mineral focus:border-primary focus:ring-1 focus:ring-primary"
            {...register("email")}
          />

          {errors.email && (
            <p
              role="alert"
              className="font-inter text-sm text-error"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block font-inter text-xs font-semibold uppercase tracking-[0.05em] text-primary"
          >
            Senha
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
              className="w-full rounded-md border border-border-sandstone bg-surface-porcelain py-3 pl-4 pr-20 font-inter text-base text-on-surface outline-none transition-shadow placeholder:text-text-mineral focus:border-primary focus:ring-1 focus:ring-primary"
              {...register("password")}
            />

            <button
              type="button"
              onClick={() => {
                setShowPassword((current) => !current);
              }}
              aria-label={
                showPassword
                  ? "Ocultar senha"
                  : "Mostrar senha"
              }
              className="absolute inset-y-0 right-0 flex items-center px-4 font-inter text-xs font-semibold uppercase tracking-[0.05em] text-text-mineral transition-colors hover:text-primary"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {errors.password && (
            <p
              role="alert"
              className="font-inter text-sm text-error"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-sandstone bg-surface-container-low px-3 py-1.5">
            <span
              aria-hidden="true"
              className="text-sm text-secondary"
            >
              ✦
            </span>

            <span className="font-inter text-xs font-semibold uppercase tracking-[0.05em] text-secondary">
              Comunidade NŌTA
            </span>
          </div>
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-md border border-error bg-error-container px-4 py-3 font-inter text-sm text-error"
          >
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 w-full rounded-md bg-primary py-4 font-inter text-xs font-semibold uppercase tracking-[0.05em] text-surface-porcelain transition-colors hover:bg-on-primary-fixed-variant disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Acessando..."
            : "Acessar NŌTA"}
        </button>
      </form>
    </>
  );
}