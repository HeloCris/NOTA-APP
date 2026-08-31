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
    <>
      <nav
        aria-label="Navega\u00E7\u00E3o de autentica\u00E7\u00E3o"
        className="mb-10 flex gap-6 border-b border-border-sandstone pb-4"
      >
        <Link
          to="/login"
          className="-mb-[18px] pb-4 font-inter text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant transition-colors hover:text-primary"
        >
          Entrar na conta
        </Link>

        <span className="-mb-[18px] border-b-2 border-primary pb-4 font-inter text-xs font-semibold uppercase tracking-[0.05em] text-primary">
          Criar conta
        </span>
      </nav>

      <header className="mb-8">
        <h1 className="mb-2 font-jakarta text-2xl font-semibold leading-8 text-primary">
          Criar sua conta
        </h1>

        <p className="font-inter text-sm leading-5 text-text-mineral">
          Cadastre-se para come\u00E7ar a explorar o universo
          N\u00D4TA.
        </p>
      </header>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <label
            htmlFor="first_name"
            className="block font-inter text-xs font-semibold uppercase tracking-[0.05em] text-primary"
          >
            Nome
          </label>

          <input
            id="first_name"
            type="text"
            autoComplete="given-name"
            placeholder="Jose"
            aria-invalid={Boolean(errors.first_name)}
            className="w-full rounded-md border border-border-sandstone bg-surface-porcelain px-4 py-3 font-inter text-base text-on-surface outline-none transition-shadow placeholder:text-text-mineral focus:border-primary focus:ring-1 focus:ring-primary"
            {...register("first_name")}
          />

          {errors.first_name && (
            <p
              role="alert"
              className="font-inter text-sm text-error"
            >
              {errors.first_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="last_name"
            className="block font-inter text-xs font-semibold uppercase tracking-[0.05em] text-primary"
          >
            Sobrenome
          </label>

          <input
            id="last_name"
            type="text"
            autoComplete="family-name"
            placeholder="Silva"
            aria-invalid={Boolean(errors.last_name)}
            className="w-full rounded-md border border-border-sandstone bg-surface-porcelain px-4 py-3 font-inter text-base text-on-surface outline-none transition-shadow placeholder:text-text-mineral focus:border-primary focus:ring-1 focus:ring-primary"
            {...register("last_name")}
          />

          {errors.last_name && (
            <p
              role="alert"
              className="font-inter text-sm text-error"
            >
              {errors.last_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block font-inter text-xs font-semibold uppercase tracking-[0.05em] text-primary"
          >
            Telefone
          </label>

          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(99) 99999-9999"
            aria-invalid={Boolean(errors.phone)}
            className="w-full rounded-md border border-border-sandstone bg-surface-porcelain px-4 py-3 font-inter text-base text-on-surface outline-none transition-shadow placeholder:text-text-mineral focus:border-primary focus:ring-1 focus:ring-primary"
            {...register("phone", {
              onChange: (e) => {
                e.target.value = formatPhone(e.target.value);
              },
            })}
          />

          {errors.phone && (
            <p
              role="alert"
              className="font-inter text-sm text-error"
            >
              {errors.phone.message}
            </p>
          )}
        </div>

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
            placeholder="joao@email.com"
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
              autoComplete="new-password"
              placeholder="Minimo de 8 caracteres"
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
            ? "Criando conta..."
            : "Criar conta"}
        </button>
      </form>
    </>
  );
}