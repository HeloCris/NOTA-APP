import { useState } from "react";
import { useAuth } from "../contexts/useAuth";
import logoIcon from "../assets/logo-icon.png";
import { SvgDefs } from "../components/seller/SvgDefs";
import { DashboardTab } from "../components/seller/DashboardTab";
import { CatalogTab } from "../components/seller/CatalogTab";
import { SettingsTab } from "../components/seller/SettingsTab";

type TabType = "dashboard" | "catalog" | "metrics" | "messages" | "settings";

export function SellerHomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [storeActive, setStoreActive] = useState(true);

  const initial = user?.first_name?.charAt(0).toUpperCase() || "M";
  const storeName = "Maison d'Essence";

  const NavLink = ({ id, icon, label }: { id: TabType; icon: string; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-[11px] px-3 py-2.5 rounded-lg text-[13.5px] font-semibold transition-colors w-full text-left ${isActive ? "bg-[#E9EDF0] text-[#354B5E]" : "text-[#5A6067] hover:bg-[#EFEBDD] hover:text-[#23282D]"
          }`}
      >
        <svg className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${isActive ? "text-[#354B5E]" : "text-[#93927F]"}`}>
          <use href={icon} />
        </svg>
        {label}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen font-inter bg-app-canvas text-[#23282D]">
      <SvgDefs />

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-[250px] bg-white border-r border-[#E6E1D2] flex flex-col z-40">
        <div className="px-[18px] pt-[22px] pb-4 border-b border-[#EFEBDD]">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="NŌTA" className="w-8 h-8 rounded-full flex-shrink-0" />
            <div>
              <div className="font-jakarta text-[18px] font-extrabold tracking-[0.02em] leading-none text-[#354B5E]">NŌTA</div>
              <div className="text-[9.5px] tracking-[0.14em] uppercase text-[#7E4228] font-bold mt-[3px]">Seller Hub</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <NavLink id="dashboard" icon="#ic-grid" label="Dashboard" />
          <NavLink id="catalog" icon="#ic-flask" label="Meus Perfumes" />
          <NavLink id="metrics" icon="#ic-chart" label="Métricas" />
          <NavLink id="messages" icon="#ic-mail-nav" label="Mensagens" />
          <NavLink id="settings" icon="#ic-gear" label="Configurações" />
        </nav>

        <div className="flex items-center gap-2.5 px-4 py-3.5 border-t border-[#EFEBDD]">
          <div className="w-9 h-9 rounded-[10px] bg-[#354B5E] text-white flex items-center justify-center font-jakarta font-extrabold text-sm flex-shrink-0 overflow-hidden">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{storeName}</div>
            <div className="text-[10.5px] text-[#93927F]">Vendedor NŌTA</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[250px] flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-[66px] bg-white/92 backdrop-blur-[10px] border-b border-[#E6E1D2] flex items-center justify-between px-[30px] gap-5">
          <div className="flex-1 max-w-[400px] flex items-center gap-[9px] bg-app-canvas border border-[#E6E1D2] rounded-full px-4 py-[9px]">
            <svg className="w-4 h-4 text-[#93927F] flex-shrink-0"><use href="#ic-search" /></svg>
            <input type="text" placeholder="Buscar perfumes, pedidos ou clientes..." className="border-none bg-transparent outline-none text-[13px] font-inter w-full text-[#23282D] placeholder:text-[#93927F]" />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-[38px] h-[38px] rounded-full border border-[#E6E1D2] bg-white flex items-center justify-center text-[#5A6067]">
              <svg className="w-[17px] h-[17px]"><use href="#ic-bell" /></svg>
              <span className="absolute -top-[2px] -right-[2px] w-4 h-4 rounded-full bg-[#A85A38] text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white">3</span>
            </button>
            <div className="flex items-center gap-2.5 py-1.5 pl-1.5 pr-3.5 border border-[#E6E1D2] rounded-full">
              <div>
                <div className="text-[12px] font-bold text-[#23282D]">Loja Ativa</div>
                <div className="text-[10px] text-[#5C6B4E] font-semibold">Aceitando pedidos</div>
              </div>
              <div onClick={() => setStoreActive(!storeActive)} className={`w-[36px] h-[21px] rounded-full relative flex-shrink-0 cursor-pointer transition-colors duration-200 ${storeActive ? 'bg-[#5C6B4E]' : 'bg-[#D8D5CE]'}`}>
                <div className={`absolute top-[2px] w-[17px] h-[17px] rounded-full bg-white transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.25)] ${storeActive ? 'left-[17px]' : 'left-[2px]'}`}></div>
              </div>
            </div>
            <button onClick={() => setActiveTab('catalog')} className="font-jakarta font-bold text-[13px] rounded-full px-5 py-[11px] border-2 border-transparent inline-flex items-center gap-2 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-colors">
              <svg className="w-[15px] h-[15px]"><use href="#ic-plus" /></svg>
              Novo Perfume
            </button>
          </div>
        </header>

        <main className="p-[28px_30px_70px] max-w-[1420px]">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "catalog" && <CatalogTab />}
          {activeTab === "settings" && <SettingsTab />}

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
        </main>
      </div>
    </div>
  );
}