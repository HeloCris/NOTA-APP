import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import logoIcon from "../../assets/logo-icon.png";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <nav className="nav">
          <div className="nav-inner">
              <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
                  <img src={logoIcon} alt="NŌTA Logo" />
                  <span className="word">NŌTA</span>
              </Link>
              <div className="nav-links">
                  <Link to="/#welcome">Benefícios</Link>
                  <Link to="/#how">Como Funciona</Link>
                  <Link to="/#historias">Histórias de Sucesso</Link>
              </div>
              <div className="nav-actions">
                  <Link to="/login" className="btn-ghost-nav">Entrar</Link>
                  <Link to="/register" className="btn btn-primary">
                      Criar Conta Grátis
                  </Link>
              </div>
          </div>
      </nav>

      <main className="auth-main">
        <section className="auth-card">
          <Link to="/" className="auth-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Voltar para o site
          </Link>

          <div className="auth-brand">
            <img src={logoIcon} alt="NŌTA Logo" />
            <span>NŌTA</span>
          </div>

          {children}
        </section>
      </main>
    </>
  );
}