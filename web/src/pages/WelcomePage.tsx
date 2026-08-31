import { Link } from "react-router-dom";
import "./WelcomePage.css";
import bannerImg from "../assets/banner.png";
import logoIcon from "../assets/logo-icon.png";

export function WelcomePage() {
    return (
        <div className="welcome-wrapper">
            {/* Dicionário de SVGs Globais */}
            <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
                <defs>
                    <symbol id="ic-search" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <circle cx="11" cy="11" r="6.5" />
                            <path d="M20 20l-4.5-4.5" />
                        </g>
                    </symbol>
                    <symbol id="ic-box" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2L12 3z" />
                            <path d="M4 7.2L12 11.4l8-4.2M12 11.4V21" />
                        </g>
                    </symbol>
                    <symbol id="ic-chart" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 20V10M12 20V4M20 20v-7" />
                        </g>
                    </symbol>
                    <symbol id="ic-users" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="8" r="3.2" />
                            <path d="M3.5 20c.6-3.6 3-5.6 5.5-5.6s4.9 2 5.5 5.6" />
                            <circle cx="17" cy="9" r="2.6" />
                            <path d="M15.8 14.6c2 .2 3.7 1.9 4.2 4.9" />
                        </g>
                    </symbol>
                    <symbol id="ic-check" viewBox="0 0 24 24">
                        <path d="M5 13l4.5 4.5L19 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </symbol>
                    <symbol id="ic-quote" viewBox="0 0 24 24">
                        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor" />
                        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor" />
                    </symbol>
                    <symbol id="ic-arrow" viewBox="0 0 24 24">
                        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </symbol>
                </defs>
            </svg>

            {/* NAV */}
            <nav className="nav">
                <div className="nav-inner">
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="nav-brand" style={{ textDecoration: 'none' }}>
                        <img src={logoIcon} alt="NŌTA Logo" />
                        <span className="word">NŌTA</span>
                    </Link>
                    <div className="nav-links">
                        <a href="#welcome">Benefícios</a>
                        <a href="#how">Como Funciona</a>
                        <a href="#historias">Histórias de Sucesso</a>
                    </div>
                    <div className="nav-actions">
                        <Link to="/login" className="btn-ghost-nav">Entrar</Link>
                        <Link to="/register" className="btn btn-primary">
                            Criar Conta Grátis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section className="hero">
                <div className="wrap">
                    <div className="hero-banner">
                        <img src={bannerImg} alt="Banner" />
                    </div>
                    <div className="hero-copy">
                        <p className="eyebrow">HUB DE LOJISTAS</p>
                        <h1>Sua perfumaria, com a inteligência de uma plataforma</h1>
                        <p className="lead">
                            Catálogo com dados olfativos prontos, gestão de pedidos simplificada e métricas que ajudam sua loja a vender mais — tudo em um só lugar, feito para quem vive de perfumaria.
                        </p>
                        <div className="hero-ctas">
                            <Link to="/register" className="btn btn-primary">
                                Criar conta gratuita
                                <svg><use href="#ic-arrow" /></svg>
                            </Link>
                            <Link to="/login" className="btn btn-outline">Fazer login</Link>
                        </div>
                        <div className="trust-row">
                            <span>
                                <svg viewBox="0 0 24 24"><use href="#ic-check" /></svg>
                                Sem cartão de crédito
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24"><use href="#ic-check" /></svg>
                                Configuração em minutos
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24"><use href="#ic-check" /></svg>
                                Suporte incluso
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS */}
            <div className="stats-band">
                <div className="wrap">
                    <div className="stats-grid">
                        <div>
                            <div className="stat-num">+2.400</div>
                            <div className="stat-lbl">Vendedores ativos</div>
                        </div>
                        <div>
                            <div className="stat-num">98%</div>
                            <div className="stat-lbl">Satisfação dos clientes</div>
                        </div>
                        <div>
                            <div className="stat-num">+180k</div>
                            <div className="stat-lbl">Pedidos processados</div>
                        </div>
                        <div>
                            <div className="stat-num">99.9%</div>
                            <div className="stat-lbl">Uptime garantido</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FEATURES */}
            <section className="section" id="welcome">
                <div className="wrap">
                    <div className="section-head">
                        <p className="eyebrow">POR QUE A NŌTA</p>
                        <h2>Feito para quem entende de perfumaria</h2>
                        <p>
                            Ferramentas pensadas para o dia a dia de quem vende fragrâncias de nicho, decants e criações autorais.
                        </p>
                    </div>
                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon navy">
                                <svg viewBox="0 0 24 24"><use href="#ic-search" /></svg>
                            </div>
                            <h3>Catálogo Inteligente</h3>
                            <p>Vincule produtos ao catálogo global NŌTA com notas, pirâmide olfativa e dados técnicos já prontos.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon olive">
                                <svg viewBox="0 0 24 24"><use href="#ic-box" /></svg>
                            </div>
                            <h3>Gestão de Pedidos</h3>
                            <p>Do pagamento à etiqueta de envio, acompanhe cada pedido em um painel único e organizado.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon terracotta">
                                <svg viewBox="0 0 24 24"><use href="#ic-chart" /></svg>
                            </div>
                            <h3>Métricas que Importam</h3>
                            <p>Faturamento, ticket médio e os perfumes que mais vendem — tudo em tempo real.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon navy">
                                <svg viewBox="0 0 24 24"><use href="#ic-users" /></svg>
                            </div>
                            <h3>Comunidade de Nicho</h3>
                            <p>Alcance um público apaixonado por perfumaria autoral, decants e fragrâncias exclusivas.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="section" id="how" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div className="section-head">
                        <p className="eyebrow">PROCESSO</p>
                        <h2>Comece a vender em três passos</h2>
                    </div>
                    <div className="how-wrap">
                        <div className="steps-row">
                            <div className="step">
                                <div className="step-num">1</div>
                                <h3>Crie sua conta</h3>
                                <p>Cadastre os dados da sua loja e configure pagamentos e frete em minutos.</p>
                            </div>
                            <div className="step">
                                <div className="step-num">2</div>
                                <h3>Monte seu catálogo</h3>
                                <p>Busque no catálogo global ou cadastre suas fragrâncias autorais e decants.</p>
                            </div>
                            <div className="step">
                                <div className="step-num">3</div>
                                <h3>Comece a vender</h3>
                                <p>Receba pedidos, acompanhe métricas e veja sua loja crescer no Hub.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIAL */}
            <section className="section" id="historias" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div className="testimonial-card">
                        <div className="quote-mark">
                            <svg viewBox="0 0 24 24" style={{ transform: "rotate(180deg)" }}><use href="#ic-quote" /></svg>
                        </div>
                        <blockquote>
                            "Desde que migrei para o NŌTA, meu ticket médio subiu 30%. A
                            plataforma entende o cliente antes mesmo dele perguntar."
                        </blockquote>
                        <div className="testimonial-who">
                            <div className="av">FL</div>
                            <div>
                                <div className="name">Fernanda Lima</div>
                                <div className="store">Ateliê Olfativo — loja parceira desde 2024</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div className="final-cta">
                        <h2>Pronta para elevar sua perfumaria?</h2>
                        <p>Sem taxa de adesão. Cancele quando quiser.</p>
                        <div className="hero-ctas">
                            <Link to="/register" className="btn btn-cream">
                                Criar minha conta grátis
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer>
                <div className="wrap">
                    <div className="footer-top" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingBottom: "48px" }}>
                        <div className="nav-brand" style={{ justifyContent: "center", marginBottom: "18px" }}>
                            <img src={logoIcon} alt="NŌTA Logo" style={{ width: "38px", height: "38px" }} />
                            <span className="word" style={{ color: "#fff", fontSize: "24px" }}>NŌTA</span>
                        </div>
                        <p style={{ color: "#9FADB8", maxWidth: "420px", fontSize: "14px", lineHeight: 1.6, margin: "0 auto" }}>
                            Plataforma de inteligência olfativa de luxo para lojistas de perfumaria de nicho, decants e marcas autorais.
                        </p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px", flexWrap: "wrap", gap: "16px" }}>
                        <p style={{ fontSize: "13px", color: "#6B7C8A", margin: 0 }}>
                            © {new Date().getFullYear()} NŌTA. Todos os direitos reservados.
                        </p>
                        <div style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
                            <a href="#privacy" style={{ color: "#9FADB8" }}>Privacy</a>
                            <a href="#terms" style={{ color: "#9FADB8" }}>Terms</a>
                            <a href="#contact" style={{ color: "#9FADB8" }}>Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
