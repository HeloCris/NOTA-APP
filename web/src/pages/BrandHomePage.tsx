import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "../contexts/useAuth";
import logoIcon from "../assets/logo-icon.png";
import { SvgDefs } from "../components/seller/SvgDefs";
import { DashboardTab } from "../components/seller/DashboardTab";
import { CatalogTab } from "../components/seller/CatalogTab";
import { BrandPortfolioTab } from "../components/brand/BrandPortfolioTab";
import { BrandSettingsTab } from "../components/brand/BrandSettingsTab";
import { storeService } from "../services/storeService";
import { brandService } from "../services/brandService";
import { OrdersTab } from "../components/seller/OrdersTab";
import { StoreReviewsView } from "../components/seller/StoreReviewsView";
import { NotificationBell } from "../components/common/NotificationBell";
import { StoreMessages } from "../features/store/StoreMessages";
import { StoreCoupons } from "../features/store/StoreCoupons";
import { MarketMetricsSection } from "../features/store/MarketMetricsSection";
import type { Store } from "../types/store";
import type { Brand } from "../types/catalog";

type TabType = "dashboard" | "catalog" | "inventory" | "orders" | "coupons" | "reviews" | "metrics" | "messages" | "settings";

const VALID_TABS: TabType[] = ["dashboard", "catalog", "inventory", "orders", "coupons", "reviews", "metrics", "messages", "settings"];

export function BrandHomePage() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "dashboard"
  );
  const [brand, setBrand] = useState<Brand | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchTerm = searchParams.get("q") ?? "";

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const goToCatalog = (term?: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "catalog");
    if (term) {
      next.set("q", term);
    } else {
      next.delete("q");
    }
    setActiveTab("catalog");
    setSearchParams(next);
  };

  const changeTab = (tab: TabType) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    next.delete("q");
    setActiveTab(tab);
    setSearchParams(next);
  };

  const handleTopSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("topSearch");
    const value = input instanceof HTMLInputElement ? input.value : "";
    goToCatalog(value.trim() || undefined);
  };

  const fetchBrandAndStore = async () => {
    try {
      setIsLoading(true);
      const brandData = await brandService.getBrandMe();
      setBrand(brandData.data);

      if (brandData.data.d2c_store) {
        const storeData = await storeService.getStoreMe();
        setStore(storeData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados da marca:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandAndStore();
  }, []);

  const storeActive = store?.is_active ?? false;
  const displayName = brand?.name || user?.first_name || "Carregando...";
  const initial = displayName.charAt(0).toUpperCase();

  const NavLink = ({ id, icon, label }: { id: TabType; icon: string; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => changeTab(id)}
        className={`flex items-center gap-[11px] px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors w-full cursor-pointer ${isActive ? "bg-[#E9EDF0] text-[#354B5E]" : "text-[#5A6067] hover:bg-[#EFEBDD] hover:text-[#23282D]"
          }`}
      >
        <svg className={`w-[19px] h-[19px] flex-shrink-0 transition-colors ${isActive ? "text-[#354B5E]" : "text-[#93927F]"}`}>
          <use href={icon} />
        </svg>
        <span className="flex-1 text-left truncate">{label}</span>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-canvas p-6">
        <span className="w-8 h-8 border-4 border-[#354B5E]/30 border-t-[#354B5E] rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-inter bg-app-canvas text-[#23282D]">
      <Toaster position="top-right" />
      <SvgDefs />

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-[230px] xl:w-[250px] bg-white border-r border-[#E6E1D2] flex flex-col z-40">
        <div className="px-[18px] h-[76px] flex-shrink-0 flex items-center justify-center border-b border-[#EFEBDD]">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="NŌTA" className="w-11 h-11 rounded-full flex-shrink-0" />
            <div className="font-jakarta text-[24px] font-extrabold tracking-[0.02em] leading-none text-[#354B5E]">NŌTA</div>
          </div>
        </div>

        <nav className="flex-1 px-3.5 py-3 flex flex-col justify-start gap-1 overflow-y-auto">
          <div className="my-auto flex flex-col gap-1 w-full">
            <NavLink id="dashboard" icon="#ic-grid" label="Dashboard" />
            <NavLink id="catalog" icon="#ic-flask" label="Meus Perfumes" />
            <NavLink id="inventory" icon="#ic-box" label="Estoque & Vendas" />
            <NavLink id="orders" icon="#ic-box" label="Pedidos" />
            <NavLink id="coupons" icon="#ic-coupon" label="Cupons" />
            <NavLink id="metrics" icon="#ic-chart" label="Métricas" />
            <NavLink id="messages" icon="#ic-mail-nav" label="Mensagens" />
            <NavLink id="settings" icon="#ic-gear" label="Configurações" />
          </div>
        </nav>

        <div className="flex items-center gap-3 px-4 py-3.5 border-t border-[#EFEBDD] flex-shrink-0">
          <div className="w-9 h-9 rounded-[10px] bg-[#354B5E] text-white flex items-center justify-center font-jakarta font-extrabold text-[14px] flex-shrink-0 overflow-hidden">
            {store?.logo_url ? (
              <img src={store.logo_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-[3px]">
              <div className="text-[13px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</div>
              {store?.is_official && (
                <svg className="w-3.5 h-3.5 text-[#1D9BF0] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.733 2.73 1.83 3.395-.084.288-.13.593-.13.905 0 2.21 1.71 3.998 3.918 3.998.47 0 .92-.084 1.336-.25C8.98 21.585 10.29 22.5 11.8 22.5c1.51 0 2.818-.915 3.338-2.25.416.165.866.25 1.336.25 2.21 0 3.918-1.79 3.918-4 0-.312-.046-.617-.13-.905 1.097-.665 1.83-1.935 1.83-3.395zM10.98 16.99L7.22 13.23l1.96-1.96 1.8 1.8 5.8-5.8 1.96 1.96-7.76 7.76z"/></svg>
              )}
            </div>
            <div className="text-[11px] text-[#93927F]">Marca Oficial</div>
          </div>
          <button 
            onClick={logout} 
            title="Sair"
            className="w-[32px] h-[32px] rounded-lg flex flex-shrink-0 items-center justify-center text-[#93927F] hover:bg-[#F5F3E9] hover:text-[#A24726] transition-colors cursor-pointer"
          >
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[230px] xl:ml-[250px] flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-[76px] bg-white/92 backdrop-blur-[10px] border-b border-[#E6E1D2] flex items-center justify-between px-6 xl:px-[30px] gap-4">
          <form
            onSubmit={handleTopSearch}
            role="search"
            className="relative w-[190px] lg:w-[260px] xl:w-[320px] flex-shrink-0"
          >
            <svg className="w-4 h-4 text-[#93927F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <use href="#ic-search" />
            </svg>
            <input
              key={searchTerm}
              type="search"
              name="topSearch"
              defaultValue={searchTerm}
              placeholder="Buscar perfume ou marca..."
              aria-label="Buscar perfume ou marca"
              className="w-full border border-[#E6E1D2] bg-white rounded-xl pl-9 pr-4 py-[9px] text-[12.5px] text-[#23282D] outline-none focus:border-[#354B5E]"
            />
          </form>

          <div className="flex items-center gap-3 flex-shrink-0">
            <NotificationBell />
            
            <div className={`h-[34px] px-[15px] rounded-full flex items-center gap-[7px] border font-inter font-bold text-[12.5px] whitespace-nowrap ${
              store?.vacation_mode ? 'bg-[#FDF4F0] border-[#F0C4B0] text-[#7E2D11]' :
              storeActive ? 'bg-[#F0F5EE] border-[#B8CFAF] text-[#3A5C30]' : 'bg-[#F5F3F0] border-[#E6E1D2] text-[#5A6067]'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                store?.vacation_mode ? 'bg-[#A24726]' :
                storeActive ? 'bg-[#5C6B4E]' : 'bg-[#93927F]'
              }`}></span>
              {store?.vacation_mode ? 'Loja de Férias' : storeActive ? 'Loja Ativa' : 'Loja Inativa'}
            </div>

            <button onClick={() => changeTab('catalog')} className="font-jakarta font-bold text-[13.5px] rounded-full px-5 py-[10px] border-2 border-transparent inline-flex items-center gap-2 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-colors cursor-pointer">
              <svg className="w-[16px] h-[16px]"><use href="#ic-plus" /></svg>
              Novo Perfume
            </button>
          </div>
        </header>

        <main className="p-6 xl:p-[28px_30px_70px] w-full max-w-[1420px] mx-auto">
          {activeTab === "settings" ? (
            <BrandSettingsTab brand={brand} store={store} onStoreUpdated={fetchBrandAndStore} />
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardTab store={store} onOpenReviews={() => changeTab("reviews")} />
              )}
              {activeTab === "catalog" && <BrandPortfolioTab key={searchTerm} initialSearch={searchTerm} />}
              {activeTab === "inventory" && (
                store ? (
                  <CatalogTab key={searchTerm} store={store} initialSearch={searchTerm} />
                ) : (
                  <div className="bg-white border border-[#E6E1D2] rounded-[20px] py-[60px] px-[30px] text-center max-w-xl mx-auto shadow-sm">
                    <div className="w-[64px] h-[64px] rounded-2xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center mx-auto mb-4">
                      <svg className="w-[32px] h-[32px]"><use href="#ic-box" /></svg>
                    </div>
                    <h3 className="text-[20px] font-extrabold text-[#23282D] mb-2 font-jakarta">Ative sua Loja Oficial</h3>
                    <p className="text-[13.5px] text-[#5A6067] leading-[1.6] mb-6">
                      Para precificar perfumes, adicionar volumetrias (como decants de 5ml, 10ml, 15ml ou frascos 50ml/100ml) e vender direto para os clientes NŌTA com o selo oficial, ative sua loja.
                    </p>
                    <button
                      onClick={() => changeTab("settings")}
                      className="font-jakarta font-bold text-[14px] rounded-full px-6 py-3 bg-[#354B5E] text-white hover:bg-[#263847] transition-colors"
                    >
                      Ir para Configurações e Ativar Loja
                    </button>
                  </div>
                )
              )}
              {activeTab === "orders" && <OrdersTab />}
              {activeTab === "coupons" && <StoreCoupons />}
              {activeTab === "reviews" && (
                <StoreReviewsView store={store} onBack={() => changeTab("dashboard")} />
              )}

              {activeTab === "messages" && <StoreMessages />}

              {activeTab === "metrics" && <MarketMetricsSection onGoToProducts={goToCatalog} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
