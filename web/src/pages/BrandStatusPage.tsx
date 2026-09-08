import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { brandService } from "../services/brandService";
import { AxiosError } from "axios";
import { AuthLayout } from "../components/auth/AuthLayout";
import logoTransp from "../assets/logo-icon-fundoTransp.png";
import "./WelcomePage.css";
import "./AuthPage.css";

function formatCNPJ(value: string) {
  const nums = value.replace(/\D/g, "").slice(0, 14);
  return nums
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function BrandStatusPage() {
  const [cnpj, setCnpj] = useState("");
  const [inpi, setInpi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; status: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await brandService.status(cnpj.replace(/\D/g, ""), inpi);
      setResult(res.data);
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>;
      if (axiosErr.response?.data?.detail) {
        setError(axiosErr.response.data.detail);
      } else {
        setError("Erro de conexão. Verifique sua internet.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = () => {
    if (!result) return null;

    if (result.status === "PENDING") {
      return (
        <div className="status-alert warning" style={{ padding: 16, backgroundColor: "var(--cream)", border: "1px solid var(--olive)", borderRadius: 8, marginTop: 16 }}>
          <h4 style={{ color: "var(--olive)", marginBottom: 8 }}>Em Análise</h4>
          <p style={{ color: "var(--gray-800)", fontSize: 14 }}>A solicitação da marca <strong>{result.name}</strong> está em análise por nossa equipe. O prazo é de cerca de 5 dias úteis.</p>
        </div>
      );
    }
    if (result.status === "APPROVED") {
      return (
        <div className="status-alert success" style={{ padding: 16, backgroundColor: "#E8F5E9", border: "1px solid #4CAF50", borderRadius: 8, marginTop: 16 }}>
          <h4 style={{ color: "#2E7D32", marginBottom: 8 }}>Aprovada!</h4>
          <p style={{ color: "var(--gray-800)", fontSize: 14 }}>A marca <strong>{result.name}</strong> foi aprovada. Você já pode fazer login na plataforma.</p>
          <Link to="/login" className="btn-submit" style={{ marginTop: 12, display: "inline-block", textAlign: "center", textDecoration: "none" }}>Fazer Login</Link>
        </div>
      );
    }
    if (result.status === "REJECTED") {
      return (
        <div className="status-alert error" style={{ padding: 16, backgroundColor: "#FFEBEE", border: "1px solid #F44336", borderRadius: 8, marginTop: 16 }}>
          <h4 style={{ color: "#C62828", marginBottom: 8 }}>Rejeitada</h4>
          <p style={{ color: "var(--gray-800)", fontSize: 14 }}>A solicitação da marca <strong>{result.name}</strong> foi rejeitada. Verifique seus dados ou entre em contato com o suporte.</p>
        </div>
      );
    }
    return null;
  };

  const brandHeader = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "12px",
        marginBottom: "32px",
      }}
    >
      {/* NŌTA Logo & Nome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <img
          src={logoTransp}
          alt="NŌTA Logo"
          style={{ height: "36px", width: "auto", objectFit: "contain" }}
        />
        <span
          style={{
            fontFamily: 'var(--headline, "Plus Jakarta Sans", sans-serif)',
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--navy-deep, #263847)",
            letterSpacing: "-0.3px",
          }}
        >
          NŌTA
        </span>
      </div>

      {/* Título principal: Marcas Oficiais (Maior que o NŌTA) */}
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: "var(--terracotta, #A85A38)",
          margin: 0,
          marginBottom: "8px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          letterSpacing: "-0.5px",
        }}
      >
        <span style={{ fontSize: "18px", lineHeight: 1 }}>✦</span>
        Marcas Oficiais
      </h1>

      {/* Subtítulo */}
      <p style={{ color: "var(--gray-600)", fontSize: "15px", margin: 0 }}>
        Acompanhe sua solicitação
      </p>
    </div>
  );

  return (
    <div className="welcome-wrapper auth-wrapper">
      <AuthLayout
        customBrand={brandHeader}
        cardStyle={{ maxWidth: "560px", padding: "52px 48px" }}
      >
        <div className="bo-content">
          <form onSubmit={handleSubmit} className="auth-form bo-form">
            <div className="form-group">
              <label htmlFor="cnpj">CNPJ *</label>
              <div className="input-wrapper">
                <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
                <input
                  id="cnpj"
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="inpi">Código INPI (Registro) *</label>
              <div className="input-wrapper">
                <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input
                  id="inpi"
                  type="text"
                  placeholder="Nº de Registro"
                  value={inpi}
                  onChange={(e) => setInpi(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="auth-error" style={{ marginBottom: "12px" }}>
                {error}
              </div>
            )}

            {renderStatus()}

            {!result && (
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button type="submit" className="btn-submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? "Buscando..." : "Consultar"}
                </button>
              </div>
            )}
          </form>
        </div>
      </AuthLayout>
    </div>
  );
}
