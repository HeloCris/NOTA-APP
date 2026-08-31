import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuth } from "../contexts/useAuth";
import logoIcon from "../assets/logo-icon.png";
import { SvgDefs } from "../components/seller/SvgDefs";
import { DashboardTab } from "../components/seller/DashboardTab";
import { CatalogTab } from "../components/seller/CatalogTab";
import { SettingsTab } from "../components/seller/SettingsTab";
import { storeService } from "../services/storeService";
import type { Store } from "../types/store";

type TabType = "dashboard" | "catalog" | "metrics" | "messages" | "settings";

export function SellerHomePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [store, setStore] = useState<Store | null>(null);

  const fetchStore = async () => {
    try {
      const data = await storeService.getStoreMe();
      setStore(data);
    } catch (error) {
      console.error("Erro ao carregar loja:", error);
    }
  };

  useEffect(() => {
    fetchStore();
  }, []);

  const storeActive = store?.is_active ?? false;
  const storeName = store?.name || user?.first_name || "Carregando...";
  const initial = storeName.charAt(0).toUpperCase();

  const NavLink = ({ id, icon, label }: { id: TabType; icon: string; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center justify-center gap-[12px] px-3 py-3 rounded-lg text-[15px] font-semibold transition-colors w-full ${isActive ? "bg-[#E9EDF0] text-[#354B5E]" : "text-[#5A6067] hover:bg-[#EFEBDD] hover:text-[#23282D]"
          }`}
      >
        <svg className={`w-[20px] h-[20px] flex-shrink-0 transition-colors ${isActive ? "text-[#354B5E]" : "text-[#93927F]"}`}>
          <use href={icon} />
        </svg>
        <span className="flex-1 text-left">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen font-inter bg-app-canvas text-[#23282D]">
      <Toaster position="top-right" />
      <SvgDefs />

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-[250px] bg-white border-r border-[#E6E1D2] flex flex-col z-40">
        <div className="px-[18px] h-[100px] flex items-center justify-center border-b border-[#EFEBDD]">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="NŌTA" className="w-14 h-14 rounded-full flex-shrink-0" />
            <div className="font-jakarta text-[27px] font-extrabold tracking-[0.02em] leading-none text-[#354B5E]">NŌTA</div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-5 flex flex-col justify-center gap-4.5 overflow-y-auto">
          <NavLink id="dashboard" icon="#ic-grid" label="Dashboard" />
          <NavLink id="catalog" icon="#ic-flask" label="Meus Perfumes" />
          <NavLink id="metrics" icon="#ic-chart" label="Métricas" />
          <NavLink id="messages" icon="#ic-mail-nav" label="Mensagens" />
          <NavLink id="settings" icon="#ic-gear" label="Configurações" />
        </nav>

        <div className="flex items-center gap-3 px-4 py-4 border-t border-[#EFEBDD]">
          <div className="w-10 h-10 rounded-[10px] bg-[#354B5E] text-white flex items-center justify-center font-jakarta font-extrabold text-[15px] flex-shrink-0 overflow-hidden">
            {store?.logo_url ? (
              <img src={store.logo_url} alt={storeName} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="text-[13.5px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{storeName}</div>
            <div className="text-[11px] text-[#93927F]">Loja NŌTA</div>
          </div>
          <button 
            onClick={logout} 
            title="Sair"
            className="w-[32px] h-[32px] rounded-lg flex flex-shrink-0 items-center justify-center text-[#93927F] hover:bg-[#F5F3E9] hover:text-[#A24726] transition-colors"
          >
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[250px] flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-[100px] bg-white/92 backdrop-blur-[10px] border-b border-[#E6E1D2] flex items-center justify-between px-[30px] gap-5">
          <div className="flex-1 max-w-[400px] flex items-center gap-[9px] bg-app-canvas border border-[#E6E1D2] rounded-full px-4 py-[9px]">
            <svg className="w-5 h-5 text-[#93927F] flex-shrink-0"><use href="#ic-search" /></svg>
            <input type="text" placeholder="Buscar perfumes, pedidos ou clientes..." className="border-none bg-transparent outline-none text-[14px] font-inter w-full text-[#23282D] placeholder:text-[#93927F]" />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-[46px] h-[46px] rounded-full border border-[#E6E1D2] bg-white flex items-center justify-center text-[#5A6067]">
              <svg className="w-[22px] h-[22px]"><use href="#ic-bell" /></svg>
              <span className="absolute -top-[2px] -right-[2px] w-[18px] h-[18px] rounded-full bg-[#A85A38] text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white">3</span>
            </button>
            
            {store && (
              <div className={`h-[36px] px-[18px] rounded-full flex items-center gap-[8px] border font-inter font-bold text-[13px] ${
                store.vacation_mode ? 'bg-[#FDF4F0] border-[#F0C4B0] text-[#7E2D11]' :
                storeActive ? 'bg-[#F0F5EE] border-[#B8CFAF] text-[#3A5C30]' : 'bg-[#F5F3F0] border-[#E6E1D2] text-[#5A6067]'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  store.vacation_mode ? 'bg-[#A24726]' :
                  storeActive ? 'bg-[#5C6B4E]' : 'bg-[#93927F]'
                }`}></span>
                {store.vacation_mode ? 'Loja de Férias' : storeActive ? 'Loja Ativa' : 'Loja Pausada'}
              </div>
            )}

            <button onClick={() => setActiveTab('catalog')} className="font-jakarta font-bold text-[14px] rounded-full px-6 py-[13px] border-2 border-transparent inline-flex items-center gap-2.5 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-colors">
              <svg className="w-[18px] h-[18px]"><use href="#ic-plus" /></svg>
              Novo Perfume
            </button>
          </div>
        </header>

        <main className="p-[28px_30px_70px] max-w-[1420px]">
          {activeTab === "settings" ? (
            <SettingsTab store={store} onStoreUpdated={fetchStore} />
          ) : !store ? (
            <div className="flex flex-col items-center justify-center py-[100px] animate-in fade-in zoom-in-95 duration-300">
              <div className="w-[88px] h-[88px] bg-[#F5F3E9] rounded-[24px] flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-[42px] h-[42px] text-[#354B5E]"><use href="#ic-gear" /></svg>
              </div>
              <h2 className="font-jakarta text-[26px] font-extrabold text-[#263847] mb-2">Bem-vindo(a) ao NŌTA Seller Hub!</h2>
              <p className="text-[#5A6067] text-[14px] max-w-[480px] text-center mb-8 leading-[1.6]">
                Para acessar o dashboard, gerenciar produtos e visualizar métricas, você precisa configurar o perfil da sua loja pela primeira vez.
              </p>
              <button
                onClick={() => setActiveTab("settings")}
                className="font-jakarta font-bold text-[14px] rounded-full px-8 py-3.5 bg-[#354B5E] text-white hover:bg-[#263847] transition-colors shadow-sm"
              >
                Configurar Minha Loja
              </button>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && <DashboardTab store={store} />}
              {activeTab === "catalog" && <CatalogTab store={store} />}

              {/* Placeholders for Metrics and Messages */}
              {(activeTab === "metrics" || activeTab === "messages") && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
                    <div>
                      <h1 className="text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em]">{activeTab === 'metrics' ? 'Métricas' : 'Mensagens'}</h1>
                      <p className="text-[13px] text-[#5A6067] m-0">Em construção. Funcionalidades avançadas chegando em breve.</p>
                    </div>
                  </div>
                  <div className="bg-white border border-dashed border-[#E6E1D2] rounded-[20px] py-[70px] px-[30px] text-center">
                    <div className="w-[56px] h-[56px] rounded-2xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center mx-auto mb-5">
                      <svg className="w-[26px] h-[26px]"><use href={activeTab === 'metrics' ? "#ic-chart" : "#ic-inbox"} /></svg>
                    </div>
                    <h3 className="text-[18px] font-extrabold text-[#23282D] mb-2">Página em desenvolvimento</h3>
                    <p className="text-[13px] text-[#5A6067] max-w-[360px] mx-auto leading-[1.6]">As atualizações para este módulo estarão disponíveis na próxima versão do Seller Hub.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}