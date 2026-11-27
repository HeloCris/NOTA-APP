import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "../contexts/useAuth";
import logoIcon from "../assets/logo-icon.png";
import { SvgDefs } from "../components/seller/SvgDefs";
import { DashboardTab } from "../components/seller/DashboardTab";
import { CatalogTab } from "../components/seller/CatalogTab";
import { SettingsTab } from "../components/seller/SettingsTab";
import { OrdersTab } from "../components/seller/OrdersTab";
import { StoreCoupons } from "../features/store/StoreCoupons";
import { StoreReviewsView } from "../components/seller/StoreReviewsView";
import { NotificationBell } from "../components/common/NotificationBell";
import { StoreMessages } from "../features/store/StoreMessages";
import { MarketMetricsSection } from "../features/store/MarketMetricsSection";
import { storeService } from "../services/storeService";
import type { Store } from "../types/store";

type TabType = "dashboard" | "catalog" | "orders" | "coupons" | "reviews" | "metrics" | "messages" | "settings";

const VALID_TABS: TabType[] = ["dashboard", "catalog", "orders", "coupons", "reviews", "metrics", "messages", "settings"];

export function SellerHomePage() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "dashboard"
  );
  const [store, setStore] = useState<Store | null>(null);
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
        onClick={() => changeTab(id)}
        className={`flex items-center gap-[11px] px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors w-full cursor-pointer ${isActive
          ? "bg-[#E9EDF0] text-[#354B5E]"
          : "text-[#5A6067] hover:bg-[#EFEBDD] hover:text-[#23282D]"
          }`}
      >
        <svg
          className={`w-[19px] h-[19px] flex-shrink-0 transition-colors ${isActive ? "text-[#354B5E]" : "text-[#93927F]"
            }`}
        >
          <use href={icon} />
        </svg>
        <span className="flex-1 text-left truncate">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen font-inter bg-app-canvas text-[#23282D]">
      <Toaster position="top-right" />
      <SvgDefs />

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-[230px] xl:w-[250px] bg-white border-r border-[#E6E1D2] flex flex-col z-40">
        <div className="px-[18px] h-[76px] flex-shrink-0 flex items-center justify-center border-b border-[#EFEBDD]">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="NŌTA" className="w-11 h-11 rounded-full flex-shrink-0" />
            <div className="font-jakarta text-[24px] font-extrabold tracking-[0.02em] leading-none text-[#354B5E]">
              NŌTA
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3.5 py-3 flex flex-col justify-start gap-1 overflow-y-auto">
          <div className="my-auto flex flex-col gap-1.5 w-full">
            <NavLink id="dashboard" icon="#ic-grid" label="Dashboard" />
            <NavLink id="catalog" icon="#ic-flask" label="Meus Perfumes" />
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
              <img src={store.logo_url} alt={storeName} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="text-[13px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">
              {storeName}
            </div>
            <div className="text-[11px] text-[#93927F]">Loja NŌTA</div>
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
          <div className="flex-1" />

          <div className="flex items-center gap-3 flex-shrink-0">
            <NotificationBell />

            {store && (
              <div
                className={`h-[34px] px-[15px] rounded-full flex items-center gap-[7px] border font-inter font-bold text-[12.5px] whitespace-nowrap ${store.vacation_mode
                  ? "bg-[#FDF4F0] border-[#F0C4B0] text-[#7E2D11]"
                  : storeActive
                    ? "bg-[#F0F5EE] border-[#B8CFAF] text-[#3A5C30]"
                    : "bg-[#F5F3F0] border-[#E6E1D2] text-[#5A6067]"
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${store.vacation_mode
                    ? "bg-[#A24726]"
                    : storeActive
                      ? "bg-[#5C6B4E]"
                      : "bg-[#93927F]"
                    }`}
                ></span>
                {store.vacation_mode ? "Loja de Férias" : storeActive ? "Loja Ativa" : "Loja Pausada"}
              </div>
            )}

            <button
              onClick={() => changeTab("catalog")}
              className="font-jakarta font-bold text-[13.5px] rounded-full px-5 py-[10px] border-2 border-transparent inline-flex items-center gap-2 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-colors cursor-pointer"
            >
              <svg className="w-[16px] h-[16px]">
                <use href="#ic-plus" />
              </svg>
              Novo Perfume
            </button>
          </div>
        </header>

        <main className="p-6 xl:p-[28px_30px_70px] w-full max-w-[1420px] mx-auto">
          {activeTab === "settings" ? (
            <SettingsTab store={store} onStoreUpdated={fetchStore} />
          ) : !store ? (
            <div className="flex flex-col items-center justify-center py-[100px] animate-in fade-in zoom-in-95 duration-300">
              <div className="w-[88px] h-[88px] bg-[#F5F3E9] rounded-[24px] flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-[42px] h-[42px] text-[#354B5E]">
                  <use href="#ic-gear" />
                </svg>
              </div>
              <h2 className="font-jakarta text-[26px] font-extrabold text-[#263847] mb-2">
                Bem-vindo(a) ao NŌTA Seller Hub!
              </h2>
              <p className="text-[#5A6067] text-[14px] max-w-[480px] text-center mb-8 leading-[1.6]">
                Para acessar o dashboard, gerenciar produtos e visualizar métricas, você precisa configurar o perfil da sua loja pela primeira vez.
              </p>
              <button
                onClick={() => changeTab("settings")}
                className="font-jakarta font-bold text-[14px] rounded-full px-8 py-3.5 bg-[#354B5E] text-white hover:bg-[#263847] transition-colors shadow-sm cursor-pointer"
              >
                Configurar Minha Loja
              </button>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardTab store={store} onOpenReviews={() => changeTab("reviews")} />
              )}
              {activeTab === "catalog" && <CatalogTab key={searchTerm} store={store} initialSearch={searchTerm} />}
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