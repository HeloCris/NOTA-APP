import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/useAuth";

export function CustomerHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <main className="min-h-screen bg-app-canvas p-6 sm:p-8">
      <section className="mx-auto max-w-3xl rounded-xl border border-border-sandstone bg-surface-porcelain p-8 shadow-auth">
        <p className="font-inter text-sm text-text-mineral">
          Comunidade NŌTA
        </p>

        <h1 className="mt-2 font-jakarta text-2xl font-semibold text-primary">
          Olá, {user?.first_name}
        </h1>

        <p className="mt-4 font-inter text-sm text-on-surface-variant">
          Seu perfil é CUSTOMER.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 rounded-md bg-primary px-5 py-3 font-inter text-xs font-semibold uppercase tracking-[0.05em] text-surface-porcelain transition-colors hover:bg-on-primary-fixed-variant"
        >
          Sair
        </button>
      </section>
    </main>
  );
}