import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import "./WelcomePage.css";
import "./AuthPage.css";
import "./BrandOnboardingPage.css";
import logoIcon from "../assets/logo-icon.png";
import { useAuth } from "../contexts/useAuth";
import { brandService } from "../services/brandService";

type Step = 1 | 2 | 3 | 4;

interface FormData {
  brandName: string;
  contactName: string;
  email: string;
  phone: string;
  password?: string;
  cnpj: string;
  inpiCode: string;
  businessType: string;
  socialContract: File | null;
  inpiCertificate: File | null;
}

const STEPS = [
  { num: 1, label: "Dados da Marca" },
  { num: 2, label: "Dados Legais" },
  { num: 3, label: "Documentos" },
  { num: 4, label: "Confirmação" },
];

function formatCNPJ(value: string) {
  const nums = value.replace(/\D/g, "").slice(0, 14);
  return nums
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(value: string) {
  const nums = value.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 10) return nums.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return nums.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function BrandOnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>({
    brandName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
    cnpj: "",
    inpiCode: "",
    businessType: "marca_propria",
    socialContract: null,
    inpiCertificate: null,
  });
  const [dragOverSocial, setDragOverSocial] = useState(false);
  const [dragOverInpi, setDragOverInpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const socialContractInputRef = useRef<HTMLInputElement>(null);
  const inpiCertificateInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === "cnpj") formatted = formatCNPJ(value);
    if (name === "phone") formatted = formatPhone(value);
    setForm((prev) => ({ ...prev, [name]: formatted }));
  };

  const handleSocialContractChange = (file: File | null) => {
    if (!file) return;
    setForm((prev) => ({ ...prev, socialContract: file }));
  };

  const removeSocialContract = () => {
    setForm((prev) => ({ ...prev, socialContract: null }));
    if (socialContractInputRef.current) socialContractInputRef.current.value = "";
  };

  const handleInpiCertificateChange = (file: File | null) => {
    if (!file) return;
    setForm((prev) => ({ ...prev, inpiCertificate: file }));
  };

  const removeInpiCertificate = () => {
    setForm((prev) => ({ ...prev, inpiCertificate: null }));
    if (inpiCertificateInputRef.current) inpiCertificateInputRef.current.value = "";
  };

  async function submitBrandToApi(data: FormData) {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const cnpjRaw = data.cnpj.replace(/\D/g, "");
      const payload = new window.FormData(); // Native JS FormData

      payload.append("brand_name", data.brandName);
      payload.append("cnpj", cnpjRaw);
      payload.append("inpi_registration", data.inpiCode);
      
      // Anexar documentos separadamente
      if (data.socialContract) {
        payload.append("social_contract", data.socialContract);
      }
      if (data.inpiCertificate) {
        payload.append("inpi_certificate", data.inpiCertificate);
      }

      if (!isAuthenticated) {
        // Enviar os dados pessoais para o endpoint único de onboarding
        const names = data.contactName.trim().split(" ");
        const firstName = names[0];
        const lastName = names.slice(1).join(" ") || "Representante";

        payload.append("first_name", firstName);
        payload.append("last_name", lastName);
        payload.append("email", data.email);
        payload.append("phone", data.phone);
        payload.append("password", data.password || "");

        await brandService.onboarding(payload);
      } else {
        // Já logado, apenas cadastra a marca via register (com suporte a form-data)
        // Nota: O brandService.register deve enviar como form-data também se tivermos arquivos
        // Vamos usar a mesma lógica no apiClient passando payload. O axios converte FormData automaticamente.
        await brandService.register(payload as any); 
      }

      setStep(4);
    } catch (err) {
      const axiosErr = err as AxiosError<Record<string, string[] | string>>;
      const detail = axiosErr.response?.data;
      if (detail) {
        const msg = Object.values(detail).flat().join(" ");
        setServerError(msg || "Erro ao enviar solicitação. Tente novamente.");
      } else {
        setServerError("Erro de conexão. Verifique sua internet e tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    await submitBrandToApi(form);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const progress = ((step - 1) / 3) * 100;

  return (
    <div className="welcome-wrapper brand-onboarding-wrapper">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <Link
            to="/"
            className="nav-brand"
            style={{ textDecoration: "none" }}
          >
            <img src={logoIcon} alt="NŌTA Logo" />
            <span className="word">NŌTA</span>
          </Link>
          <div className="nav-links">
            <Link to="/#welcome">Benefícios</Link>
            <Link to="/#how">Como Funciona</Link>
            <Link to="/#historias">Histórias de Sucesso</Link>
            <Link to="/#marcas" className="nav-link-brand">
              <span className="nav-brand-badge">✦</span>
              Marcas Oficiais
            </Link>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="btn-ghost-nav">
              Entrar
            </Link>
            <Link to="/register" className="btn btn-primary">
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO BRAND */}
      <section className="brand-hero">
        <div className="wrap">
          <p className="eyebrow">BRAND HUB · MARCA OFICIAL</p>
          <h1>Cadastre sua marca na NŌTA</h1>
          <p className="brand-hero-sub">
            Torne-se uma marca oficial verificada. Venda diretamente para seus
            clientes com o selo <strong>Loja Oficial NŌTA</strong>.
          </p>
        </div>
      </section>

      {/* WIZARD */}
      <main className="brand-main">
        <div className="wrap">
          {step < 4 ? (
            <div className="brand-card">
              {/* Steps Header */}
              <div className="bo-steps">
                {STEPS.filter((s) => s.num < 4).map((s) => (
                  <div
                    key={s.num}
                    className={`bo-step ${step === s.num ? "active" : ""} ${step > s.num ? "done" : ""}`}
                  >
                    <div className="bo-step-circle">
                      {step > s.num ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4.5 4.5L19 8" />
                        </svg>
                      ) : (
                        s.num
                      )}
                    </div>
                    <span className="bo-step-label">{s.label}</span>
                  </div>
                ))}
                {/* Linhas entre steps */}
                <div className="bo-step-track">
                  <div
                    className="bo-step-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Formulário */}
              <form className="bo-form auth-form" onSubmit={handleSubmit}>
                {/* PASSO 1: Dados Básicos */}
                {step === 1 && (
                  <>
                    <div className="bo-form-header">
                      <h2>Dados da Marca</h2>
                      <p>Conte-nos sobre a sua marca de perfumaria.</p>
                    </div>

                    <div className="form-group">
                      <label htmlFor="brandName">Nome da Marca *</label>
                      <div className="input-wrapper">
                        <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                        </svg>
                        <input
                          id="brandName"
                          name="brandName"
                          type="text"
                          placeholder="Ex: Maison Noire Parfums"
                          value={form.brandName}
                          onChange={handleChange}
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="contactName">Nome do Representante *</label>
                      <div className="input-wrapper">
                        <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                        <input
                          id="contactName"
                          name="contactName"
                          type="text"
                          placeholder="Seu nome completo"
                          value={form.contactName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="email">E-mail Corporativo *</label>
                        <div className="input-wrapper">
                          <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M2 7l10 7L22 7" />
                          </svg>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="contato@suamarca.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Telefone *</label>
                        <div className="input-wrapper">
                          <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                          </svg>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={form.phone}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {!isAuthenticated && (
                      <div className="form-group">
                        <label htmlFor="password">Crie sua Senha de Acesso *</label>
                        <div className="input-wrapper">
                          <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                          <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                          />
                        </div>
                        <p className="bo-auth-hint" style={{ marginTop: '8px' }}>Essa senha será usada para você acessar o painel de vendas da sua marca.</p>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="businessType">Tipo de Negócio</label>
                      <div className="input-wrapper">
                        <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M9 5H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                          <rect x="9" y="3" width="6" height="4" rx="1" />
                        </svg>
                        <select
                          id="businessType"
                          name="businessType"
                          value={form.businessType}
                          onChange={handleChange}
                          className="bo-select"
                        >
                          <option value="marca_propria">Marca Própria / Autoral</option>
                          <option value="distribuidora">Distribuidora Oficial</option>
                          <option value="importadora">Importadora</option>
                          <option value="franquia">Franquia / Licenciada</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* PASSO 2: Dados Legais */}
                {step === 2 && (
                  <>
                    <div className="bo-form-header">
                      <h2>Dados Legais</h2>
                      <p>Informações para validar a autenticidade da sua marca.</p>
                    </div>

                    <div className="form-group">
                      <label htmlFor="cnpj">CNPJ da Empresa *</label>
                      <div className="input-wrapper">
                        <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M3 9h18M9 21V9" />
                        </svg>
                        <input
                          id="cnpj"
                          name="cnpj"
                          type="text"
                          placeholder="00.000.000/0001-00"
                          value={form.cnpj}
                          onChange={handleChange}
                          required
                          maxLength={18}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="inpiCode">Nº de Registro no INPI *</label>
                      <div className="input-wrapper">
                        <svg className="icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4l3 3" />
                        </svg>
                        <input
                          id="inpiCode"
                          name="inpiCode"
                          type="text"
                          placeholder="Ex: 825.934.220"
                          value={form.inpiCode}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="bo-info-card">
                      <div className="bo-info-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" />
                        </svg>
                      </div>
                      <div>
                        <strong>Por que pedimos o INPI?</strong>
                        <p>
                          O número de registro no INPI (Instituto Nacional da
                          Propriedade Industrial) confirma que você é o legítimo
                          titular da marca. Isso garante o Selo Oficial NŌTA
                          para a sua loja.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* PASSO 3: Documentos */}
                {step === 3 && (
                  <>
                    <div className="bo-form-header">
                      <h2>Documentos Comprobatórios</h2>
                      <p>
                        Envie os documentos necessários para a validação cadastral da sua marca (PDF, JPG ou PNG, máx. 10MB cada).
                      </p>
                    </div>

                    <div className="bo-docs-grid">
                      {/* Campo 1: Contrato Social */}
                      <div className="bo-doc-field">
                        <div className="bo-doc-field-header">
                          <div className="bo-doc-field-title">
                            <span className="bo-doc-badge-num">1</span>
                            <strong>Contrato Social da Empresa</strong>
                            <span className="bo-doc-tag required">Obrigatório</span>
                          </div>
                          <p className="bo-doc-field-desc">
                            Última alteração contratual consolidada, estatuto social ou requerimento de empresário / MEI.
                          </p>
                        </div>

                        {!form.socialContract ? (
                          <div
                            className={`bo-dropzone bo-dropzone-compact ${dragOverSocial ? "drag-active" : ""}`}
                            onClick={() => socialContractInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragOverSocial(true); }}
                            onDragLeave={() => setDragOverSocial(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverSocial(false);
                              if (e.dataTransfer.files?.[0]) {
                                handleSocialContractChange(e.dataTransfer.files[0]);
                              }
                            }}
                          >
                            <div className="bo-dropzone-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                              </svg>
                            </div>
                            <p className="bo-dropzone-text">
                              <strong>Clique para selecionar</strong> ou arraste o Contrato Social
                            </p>
                            <p className="bo-dropzone-hint">PDF, JPG ou PNG até 10MB</p>
                            <input
                              ref={socialContractInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: "none" }}
                              onChange={(e) => handleSocialContractChange(e.target.files?.[0] || null)}
                            />
                          </div>
                        ) : (
                          <div className="bo-file-card-success">
                            <div className="bo-file-icon success">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <path d="M9 15l2 2 4-4" />
                              </svg>
                            </div>
                            <div className="bo-file-info">
                              <span className="bo-file-name" title={form.socialContract.name}>
                                {form.socialContract.name}
                              </span>
                              <span className="bo-file-meta">
                                {(form.socialContract.size / 1024 / 1024).toFixed(2)} MB · Arquivo anexado
                              </span>
                            </div>
                            <div className="bo-file-actions">
                              <button
                                type="button"
                                className="bo-btn-file-replace"
                                onClick={() => socialContractInputRef.current?.click()}
                              >
                                Substituir
                              </button>
                              <button
                                type="button"
                                className="bo-file-remove"
                                onClick={removeSocialContract}
                                aria-label="Remover Contrato Social"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                            <input
                              ref={socialContractInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: "none" }}
                              onChange={(e) => handleSocialContractChange(e.target.files?.[0] || null)}
                            />
                          </div>
                        )}
                      </div>

                      {/* Campo 2: Certificado / Comprovante INPI */}
                      <div className="bo-doc-field">
                        <div className="bo-doc-field-header">
                          <div className="bo-doc-field-title">
                            <span className="bo-doc-badge-num">2</span>
                            <strong>Certificado ou Comprovante INPI</strong>
                            <span className="bo-doc-tag required">Obrigatório</span>
                          </div>
                          <p className="bo-doc-field-desc">
                            Certificado de registro da marca emitido pelo INPI, despacho de concessão ou protocolo do pedido.
                          </p>
                        </div>

                        {!form.inpiCertificate ? (
                          <div
                            className={`bo-dropzone bo-dropzone-compact ${dragOverInpi ? "drag-active" : ""}`}
                            onClick={() => inpiCertificateInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragOverInpi(true); }}
                            onDragLeave={() => setDragOverInpi(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverInpi(false);
                              if (e.dataTransfer.files?.[0]) {
                                handleInpiCertificateChange(e.dataTransfer.files[0]);
                              }
                            }}
                          >
                            <div className="bo-dropzone-icon inpi-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M9 12l2 2 4-4" />
                              </svg>
                            </div>
                            <p className="bo-dropzone-text">
                              <strong>Clique para selecionar</strong> ou arraste o Comprovante INPI
                            </p>
                            <p className="bo-dropzone-hint">PDF, JPG ou PNG até 10MB</p>
                            <input
                              ref={inpiCertificateInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: "none" }}
                              onChange={(e) => handleInpiCertificateChange(e.target.files?.[0] || null)}
                            />
                          </div>
                        ) : (
                          <div className="bo-file-card-success">
                            <div className="bo-file-icon success">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M9 12l2 2 4-4" />
                              </svg>
                            </div>
                            <div className="bo-file-info">
                              <span className="bo-file-name" title={form.inpiCertificate.name}>
                                {form.inpiCertificate.name}
                              </span>
                              <span className="bo-file-meta">
                                {(form.inpiCertificate.size / 1024 / 1024).toFixed(2)} MB · Arquivo anexado
                              </span>
                            </div>
                            <div className="bo-file-actions">
                              <button
                                type="button"
                                className="bo-btn-file-replace"
                                onClick={() => inpiCertificateInputRef.current?.click()}
                              >
                                Substituir
                              </button>
                              <button
                                type="button"
                                className="bo-file-remove"
                                onClick={removeInpiCertificate}
                                aria-label="Remover Comprovante INPI"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                            <input
                              ref={inpiCertificateInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: "none" }}
                              onChange={(e) => handleInpiCertificateChange(e.target.files?.[0] || null)}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bo-info-card" style={{ marginTop: "24px" }}>
                      <div className="bo-info-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div>
                        <strong>Seus dados estão seguros</strong>
                        <p>
                          Todos os documentos são criptografados e usados
                          exclusivamente para verificação da titularidade e autenticidade da sua marca.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* AÇÕES */}
                <div className="bo-actions">
                  {step > 1 && (
                    <button
                      type="button"
                      className="bo-btn-back"
                      onClick={goBack}
                      disabled={isSubmitting}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M19 12H5M11 6l-6 6 6 6" />
                      </svg>
                      Voltar
                    </button>
                  )}
                  <div style={{ flex: 1 }}>
                    {serverError && (
                      <div className="auth-error" style={{ marginBottom: "12px" }}>
                        {serverError}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="btn-submit bo-btn-next"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? (step < 3 ? "Aguarde..." : "Cadastrando...")
                        : step < 3
                          ? "Continuar"
                          : "Cadastrar Marca"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* STEP 4: SUCESSO */
            <div className="brand-card bo-success-card">
              <div className="bo-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h2>Solicitação Enviada!</h2>
              <p className="bo-success-text">
                Recebemos os dados da <strong>{form.brandName}</strong>. Nossa
                equipe irá analisar as informações e entrar em contato com{" "}
                <strong>{form.email}</strong> em até <strong>5 dias úteis</strong>.
              </p>
              <div className="bo-success-steps">
                <div className="bo-success-step">
                  <div className="bo-ss-num">1</div>
                  <div>
                    <strong>Análise Documental</strong>
                    <p>Nossa equipe valida o CNPJ e o registro no INPI.</p>
                  </div>
                </div>
                <div className="bo-success-step">
                  <div className="bo-ss-num">2</div>
                  <div>
                    <strong>Aprovação & Acesso</strong>
                    <p>Você recebe o e-mail com as credenciais do Brand Hub.</p>
                  </div>
                </div>
                <div className="bo-success-step">
                  <div className="bo-ss-num">3</div>
                  <div>
                    <strong>Ativação do Selo</strong>
                    <p>Sua marca aparece com o selo "Loja Oficial" na plataforma.</p>
                  </div>
                </div>
              </div>
              <div className="bo-success-actions">
                <Link to="/" className="btn btn-primary">
                  Voltar para o início
                </Link>
                <Link to="/login" className="btn btn-outline">
                  Fazer login
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER SIMPLES */}
      <footer className="bo-footer">
        <div className="wrap">
          <p>© {new Date().getFullYear()} NŌTA. Todos os direitos reservados.</p>
          <div>
            <a href="#privacy">Privacidade</a>
            <a href="#terms">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
