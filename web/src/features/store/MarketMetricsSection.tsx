import React, { useState, useEffect, useCallback, useRef } from "react";
import type { MarketMetricsData } from "../../types/marketMetrics";
import { storeService } from "../../services/storeService";
import { StoreAnalyticsSection } from "./StoreAnalyticsSection";

interface MarketMetricsSectionProps {
  onGoToProducts?: (term?: string) => void;
}

export const MarketMetricsSection: React.FC<MarketMetricsSectionProps> = ({
  onGoToProducts,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"market" | "store">("market");
  const [data, setData] = useState<MarketMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await storeService.getMarketMetrics();
      if (isMountedRef.current) {
        setData(result);
      }
    } catch {
      if (isMountedRef.current) {
        setError("Não foi possível carregar os dados de mercado. Verifique sua conexão e tente novamente.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchMetrics();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchMetrics]);

  const summary = data?.summary;
  const familyDemand = data?.family_demand ?? [];
  const topNotes = data?.top_notes_demand ?? [];
  const thermometer = data?.format_thermometer;
  const catalogComparison = data?.catalog_price_comparison ?? [];
  const trendingProducts = data?.trending_products ?? [];

  const decantShare = thermometer?.decants?.sales_share_pct ?? 0;
  const bottleShare = thermometer?.bottles?.sales_share_pct ?? 0;

  return (
    <div className="space-y-[22px] animate-in fade-in slide-in-from-bottom-2 duration-300 font-inter text-[#23282D] min-w-0">
      {/* Cabeçalho Principal + Seletor de Sub-Abas */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-2 min-w-0">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5C6B4E] mb-1.5">
            Inteligência Olfativa · Ecossistema NŌTA
          </p>
          <h1 className="font-jakarta text-[24px] xl:text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em]">
            Métricas & Inteligência
          </h1>
          <p className="text-[13px] text-[#5A6067] m-0">
            Analise tendências olfativas anônimas da plataforma, preferência por notas e o comportamento de vendas.
          </p>
        </div>

        {/* Sub-navegação em Pílula seguindo o Design System NŌTA (responsiva ao zoom) */}
        <div className="inline-flex items-center gap-1 bg-white border border-[#E6E1D2] rounded-full p-1 shadow-[0_1px_3px_rgba(35,40,45,0.06)] self-start lg:self-auto flex-shrink-0 max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("market")}
            className={`px-3.5 xl:px-4 py-2 rounded-full text-[12px] xl:text-[12.5px] font-jakarta font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${activeSubTab === "market"
              ? "bg-[#354B5E] text-white shadow-sm"
              : "text-[#5A6067] hover:bg-[#F5F3E9] hover:text-[#23282D]"
              }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 3 3 5-6" />
            </svg>
            <span>Inteligência de Mercado</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("store")}
            className={`px-3.5 xl:px-4 py-2 rounded-full text-[12px] xl:text-[12.5px] font-jakarta font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${activeSubTab === "store"
              ? "bg-[#354B5E] text-white shadow-sm"
              : "text-[#5A6067] hover:bg-[#F5F3E9] hover:text-[#23282D]"
              }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Desempenho da Minha Loja</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Condicional: Loja (Em breve) vs Mercado */}
      {activeSubTab === "store" ? (
        <StoreAnalyticsSection onGoToProducts={onGoToProducts} />
      ) : (
        <div className="space-y-[22px]">
          {/* Alerta de Erro */}
          {error && (
            <div className="bg-[#FEF0EB] border border-[#F5C9B3] rounded-[16px] p-[18px_22px] flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#FBEEE7] text-[#A24726] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-[13.5px] font-semibold text-[#7E4228] m-0">{error}</p>
              </div>
              <button
                type="button"
                onClick={fetchMetrics}
                className="px-4 py-2 rounded-full text-[12.5px] font-jakarta font-bold bg-[#A24726] text-white hover:bg-[#7E2D11] transition-colors cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* 1. Linha de 4 KPIs Superiores (Mesmo padrão visual do DashboardTab) */}
          <section
            aria-label="Indicadores Macro de Mercado"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]"
          >
            {/* KPI 1: Família #1 */}
            <div className="bg-white border border-[#EFEBDD] rounded-[18px] p-5 relative overflow-hidden shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#354B5E] to-transparent" />
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center bg-[#E9EDF0] text-[#354B5E]">
                  <svg className="w-[19px] h-[19px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
                  </svg>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-[3px] rounded-full bg-[#E9EDF0] text-[#354B5E]">
                  Família Líder
                </span>
              </div>
              {isLoading ? (
                <div className="h-7 w-32 bg-[#F5F3E9] rounded-lg animate-pulse my-1" />
              ) : (
                <div className="font-jakarta text-[24px] font-extrabold text-[#23282D] leading-[1.15]">
                  {summary?.top_family_name || "—"}
                </div>
              )}
              <div className="text-[12px] text-[#5A6067] mt-1.5 font-semibold">
                Família #1 na NŌTA
              </div>
              <div className="text-[11px] text-[#93927F] mt-2">
                Líder de preferência nos perfis olfativos
              </div>
            </div>

            {/* KPI 2: Nota mais desejada */}
            <div className="bg-white border border-[#EFEBDD] rounded-[18px] p-5 relative overflow-hidden shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#5C6B4E] to-transparent" />
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center bg-[#EDF0E7] text-[#454F3A]">
                  <svg className="w-[19px] h-[19px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-[3px] rounded-full bg-[#EDF0E7] text-[#454F3A]">
                  Destaque Olfativo
                </span>
              </div>
              {isLoading ? (
                <div className="h-7 w-32 bg-[#F5F3E9] rounded-lg animate-pulse my-1" />
              ) : (
                <div className="font-jakarta text-[24px] font-extrabold text-[#23282D] leading-[1.15]">
                  {summary?.top_note_name || "—"}
                </div>
              )}
              <div className="text-[12px] text-[#5A6067] mt-1.5 font-semibold">
                Nota mais desejada
              </div>
              <div className="text-[11px] text-[#93927F] mt-2">
                Ingrediente mais buscado pelos clientes
              </div>
            </div>

            {/* KPI 3: Força dos Decants */}
            <div className="bg-white border border-[#EFEBDD] rounded-[18px] p-5 relative overflow-hidden shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#354B5E] to-transparent" />
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center bg-[#E9EDF0] text-[#354B5E]">
                  <svg className="w-[19px] h-[19px]">
                    <use href="#ic-flask" />
                  </svg>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-[3px] rounded-full bg-[#F5F3E9] text-[#5A6067]">
                  ≤ 15ml
                </span>
              </div>
              {isLoading ? (
                <div className="h-7 w-24 bg-[#F5F3E9] rounded-lg animate-pulse my-1" />
              ) : (
                <div className="font-jakarta text-[24px] font-extrabold text-[#23282D] leading-[1.15]">
                  {summary ? `${summary.decant_sales_share_pct}%` : "—"}
                </div>
              )}
              <div className="text-[12px] text-[#5A6067] mt-1.5 font-semibold">
                Força dos Decants (≤15ml)
              </div>
              <div className="text-[11px] text-[#93927F] mt-2">
                Valor médio:{" "}
                <strong className="text-[#23282D] font-bold">
                  {thermometer?.decants?.avg_ticket ? `R$ ${thermometer.decants.avg_ticket}` : "—"}
                </strong>
              </div>
            </div>

            {/* KPI 4: Catálogo no Ecossistema */}
            <div className="bg-white border border-[#EFEBDD] rounded-[18px] p-5 relative overflow-hidden shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#A85A38] to-transparent" />
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center bg-[#F5E7DE] text-[#7E4228]">
                  <svg className="w-[19px] h-[19px]">
                    <use href="#ic-box" />
                  </svg>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-[3px] rounded-full bg-[#FBEEE7] text-[#A24726]">
                  Plataforma
                </span>
              </div>
              {isLoading ? (
                <div className="h-7 w-28 bg-[#F5F3E9] rounded-lg animate-pulse my-1" />
              ) : (
                <div className="font-jakarta text-[24px] font-extrabold text-[#23282D] leading-[1.15]">
                  {summary?.total_active_catalog_products != null
                    ? `${summary.total_active_catalog_products} perfumes`
                    : "—"}
                </div>
              )}
              <div className="text-[12px] text-[#5A6067] mt-1.5 font-semibold">
                Catálogo Global NŌTA
              </div>
              <div className="text-[11px] text-[#93927F] mt-2">
                {summary?.my_store_products_count != null
                  ? `${summary.my_store_products_count} ${
                      summary.my_store_products_count === 1
                        ? "perfume ativo na sua loja"
                        : "perfumes ativos na sua loja"
                    }`
                  : "Fragrâncias aprovadas na plataforma"}
              </div>
            </div>
          </section>

          {/* 2. Grid Central: Mapa de Demanda por Família Olfativa + Top 10 Notas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-[22px]">
            {/* Mapa de Demanda por Família Olfativa (7 colunas) */}
            <section
              aria-label="Mapa de Demanda por Família Olfativa"
              className="lg:col-span-7 bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between p-[22px_24px_16px] border-b border-[#EFEBDD] gap-4">
                  <div>
                    <h2 className="font-jakarta text-[16.5px] font-extrabold text-[#23282D] m-0">
                      Mapa de Demanda por Família Olfativa
                    </h2>
                    <p className="text-[12.5px] text-[#93927F] mt-0.5 m-0">
                      Distribuição de preferência declarada nos perfis olfativos ativos
                    </p>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.05em] px-3 py-1 rounded-full bg-[#F5F3E9] border border-[#E6E1D2] text-[#5A6067] flex-shrink-0">
                    Preferência %
                  </span>
                </div>

                <div className="p-[22px_24px]">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 w-32 bg-[#F5F3E9] rounded animate-pulse" />
                          <div className="h-2.5 w-full bg-[#F5F3E9] rounded-full animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : !error && familyDemand.length === 0 ? (
                    <div className="py-12 text-center text-[#93927F] text-[13px] border-2 border-dashed border-[#E6E1D2] rounded-2xl">
                      Nenhum dado de preferência olfativa registrado ainda.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {familyDemand.map((item, idx) => {
                        const barColors = [
                          "bg-[#354B5E]",
                          "bg-[#5C6B4E]",
                          "bg-[#4A6274]",
                          "bg-[#7E4228]",
                          "bg-[#6E7E85]",
                          "bg-[#8B947E]",
                          "bg-[#A24726]",
                        ];
                        const barClass = barColors[idx % barColors.length];
                        return (
                          <div key={item.family} className="space-y-2">
                            <div className="flex items-center justify-between text-[13px] gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <span className="font-jakarta font-bold text-[#23282D]">
                                  {item.family}
                                </span>
                                <span className="text-[11.5px] text-[#93927F] font-medium">
                                  · {item.catalog_products_count}{" "}
                                  {item.catalog_products_count === 1
                                    ? "fragrância no catálogo"
                                    : "fragrâncias no catálogo"}
                                </span>
                              </div>
                              <span
                                className={`font-jakarta font-extrabold text-[13px] px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                                  item.share_pct > 0
                                    ? "text-[#354B5E] bg-[#E9EDF0]"
                                    : "text-[#93927F] bg-[#F5F3E9]"
                                }`}
                              >
                                {item.share_pct}%
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-[#F5F3E9] rounded-full overflow-hidden border border-[#EFEBDD]">
                              {item.share_pct > 0 && (
                                <div
                                  className={`h-full ${barClass} rounded-full transition-all duration-500`}
                                  style={{ width: `${Math.min(Math.max(item.share_pct, 0), 100)}%` }}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-[24px] py-[14px] bg-[#FBFAF6] border-t border-[#EFEBDD] text-[12px] text-[#5A6067] flex items-center justify-between gap-2 flex-wrap">
                <span>Amostra anônima de clientes com perfil olfativo configurado</span>
                <span className="font-jakarta font-bold text-[#23282D]">
                  Total: {summary?.total_customers_with_profile ?? "—"}{" "}
                  {summary?.total_customers_with_profile === 1 ? "perfil" : "perfis"}
                </span>
              </div>
            </section>

            {/* Top 10 Notas Olfativas Mais Buscadas (5 colunas) */}
            <section
              aria-label="Top 10 Notas Olfativas Mais Buscadas"
              className="lg:col-span-5 bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between p-[22px_24px_16px] border-b border-[#EFEBDD] gap-4">
                  <div>
                    <h2 className="font-jakarta text-[16.5px] font-extrabold text-[#23282D] m-0">
                      10 Notas Mais Desejadas
                    </h2>
                    <p className="text-[12.5px] text-[#93927F] mt-0.5 m-0">
                      Acordes e matérias-primas mais favoritados
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-[11px] bg-[#EDF0E7] text-[#454F3A] flex items-center justify-center flex-shrink-0">
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>

                <div className="p-[18px_24px]">
                  {isLoading ? (
                    <div className="space-y-2.5">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-9 bg-[#F5F3E9] rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : !error && topNotes.length === 0 ? (
                    <div className="py-12 text-center text-[#93927F] text-[13px] border-2 border-dashed border-[#E6E1D2] rounded-2xl">
                      Nenhuma nota registrada nos perfis de usuários.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {topNotes.slice(0, 10).map((noteItem, idx) => {
                        const rankBadgeStyle =
                          idx === 0
                            ? "bg-[#354B5E] text-white"
                            : idx === 1
                              ? "bg-[#5C6B4E] text-white"
                              : idx === 2
                                ? "bg-[#7E4228] text-white"
                                : "bg-[#E9EDF0] text-[#354B5E]";

                        return (
                          <div
                            key={noteItem.note}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-[13px] bg-[#FBFAF6] border border-[#EFEBDD] hover:border-[#E6E1D2] hover:bg-[#F5F3E9]/60 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-jakarta font-extrabold flex-shrink-0 ${rankBadgeStyle}`}
                              >
                                {idx + 1}
                              </span>
                              <span className="text-[13px] font-semibold text-[#23282D] truncate">
                                {noteItem.note}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5 flex-shrink-0">
                              <div className="w-16 h-1.5 bg-[#EFEBDD] rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className="h-full bg-[#354B5E] rounded-full"
                                  style={{ width: `${Math.min(noteItem.share_pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-[12px] font-jakarta font-extrabold text-[#354B5E] min-w-[36px] text-right">
                                {noteItem.share_pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-[24px] py-[14px] bg-[#FBFAF6] border-t border-[#EFEBDD] text-[12px] text-[#5A6067] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#354B5E] flex-shrink-0">
                  <use href="#ic-lightbulb" />
                </svg>
                <span>Priorize estas notas ao selecionar novos decants e frascos para a vitrine.</span>
              </div>
            </section>
          </div>

          {/* 3. Termômetro de Formatos: Decants (<=15ml) vs Frascos (>15ml) */}
          <section
            aria-label="Termômetro de Formatos: Decants vs Frascos"
            className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-[22px_24px_16px] border-b border-[#EFEBDD] gap-3">
              <div>
                <h2 className="font-jakarta text-[16.5px] font-extrabold text-[#23282D] m-0">
                  Termômetro de Formatos na Plataforma
                </h2>
                <p className="text-[12.5px] text-[#93927F] mt-0.5 m-0">
                  Proporção de unidades vendidas e valor médio entre Decants (≤15ml) e Frascos (&gt;15ml)
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#354B5E] bg-[#E9EDF0] px-3 py-1 rounded-full self-start sm:self-auto">
                Divisão de Volume Vendido
              </span>
            </div>

            <div className="p-[22px_24px] space-y-5">
              {/* Barra Segmentada Clean */}
              <div className="space-y-2.5">
                <div className="h-8 w-full rounded-xl overflow-hidden flex bg-[#F5F3E9] p-1 border border-[#E6E1D2]">
                  {isLoading || !thermometer ? (
                    <div className="h-full w-full bg-[#F5F3E9] rounded-lg animate-pulse" />
                  ) : (
                    <>
                      {decantShare > 0 && (
                        <div
                          className="h-full shrink-0 bg-[#354B5E] text-white text-[11px] font-jakarta font-bold flex items-center justify-center transition-all duration-500"
                          style={{ width: `${Math.min(decantShare, 100)}%` }}
                          title={`Decants: ${decantShare}% das vendas`}
                        >
                          {decantShare >= 15 && `Decants · ${decantShare}%`}
                        </div>
                      )}
                      {bottleShare > 0 && (
                        <div
                          className="h-full shrink-0 bg-[#5C6B4E] text-white text-[11px] font-jakarta font-bold flex items-center justify-center transition-all duration-500"
                          style={{ width: `${Math.min(bottleShare, 100)}%` }}
                          title={`Frascos: ${bottleShare}% das vendas`}
                        >
                          {bottleShare >= 15 && `Frascos · ${bottleShare}%`}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between text-[12px] text-[#5A6067] px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#354B5E]" />
                    <span>
                      Decants (≤15ml):{" "}
                      <strong className="font-jakarta text-[#23282D]">
                        {thermometer?.decants?.sales_share_pct ?? "—"}%
                      </strong>{" "}
                      das unidades
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5C6B4E]" />
                    <span>
                      Frascos (&gt;15ml):{" "}
                      <strong className="font-jakarta text-[#23282D]">
                        {thermometer?.bottles?.sales_share_pct ?? "—"}%
                      </strong>{" "}
                      das unidades
                    </span>
                  </div>
                </div>
              </div>

              {/* Dois Cards Comparativos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
                {/* Card Decants */}
                <div className="p-5 rounded-[16px] bg-[#FBFAF6] border border-[#EFEBDD] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EFEBDD]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center flex-shrink-0">
                        <svg className="w-[18px] h-[18px]">
                          <use href="#ic-flask" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-jakarta text-[14px] font-extrabold text-[#23282D] block">
                          Decants & Amostras (≤15ml)
                        </span>
                        <span className="text-[11.5px] text-[#93927F]">
                          Experimentação e descoberta olfativa
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-[#E6E1D2] text-[#5A6067]">
                      {thermometer?.decants?.active_offers_count ?? "—"} ofertas
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#93927F] block">
                        Unidades Vendidas
                      </span>
                      <strong className="font-jakarta text-[22px] font-extrabold text-[#23282D] mt-1 block">
                        {thermometer?.decants?.units_sold ?? "—"} un
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#93927F] block">
                        Valor Médio
                      </span>
                      <strong className="font-jakarta text-[22px] font-extrabold text-[#354B5E] mt-1 block">
                        {thermometer?.decants?.avg_ticket
                          ? `R$ ${thermometer.decants.avg_ticket}`
                          : "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Frascos */}
                <div className="p-5 rounded-[16px] bg-[#FBFAF6] border border-[#EFEBDD] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EFEBDD]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#EDF0E7] text-[#454F3A] flex items-center justify-center flex-shrink-0">
                        <svg className="w-[18px] h-[18px]">
                          <use href="#ic-box" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-jakarta text-[14px] font-extrabold text-[#23282D] block">
                          Frascos Completos (&gt;15ml)
                        </span>
                        <span className="text-[11.5px] text-[#93927F]">
                          Fidelização e recompras de assinatura
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-[#E6E1D2] text-[#5A6067]">
                      {thermometer?.bottles?.active_offers_count ?? "—"} ofertas
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#93927F] block">
                        Unidades Vendidas
                      </span>
                      <strong className="font-jakarta text-[22px] font-extrabold text-[#23282D] mt-1 block">
                        {thermometer?.bottles?.units_sold ?? "—"} un
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#93927F] block">
                        Valor Médio
                      </span>
                      <strong className="font-jakarta text-[22px] font-extrabold text-[#454F3A] mt-1 block">
                        {thermometer?.bottles?.avg_ticket
                          ? `R$ ${thermometer.bottles.avg_ticket}`
                          : "—"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Grid de Tabelas: Radar de Competitividade do Meu Catálogo + Top 5 Perfumes em Alta */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-[22px]">
            {/* Tabela de Competitividade do Meu Catálogo por Perfume + Volumetria (6 colunas) */}
            <section
              aria-label="Radar de Competitividade do Meu Catálogo"
              className="lg:col-span-6 bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] flex flex-col justify-between overflow-hidden min-w-0"
            >
              <div>
                <div className="flex items-center justify-between p-[22px_24px_16px] border-b border-[#EFEBDD] gap-4">
                  <div className="min-w-0">
                    <h2 className="font-jakarta text-[16.5px] font-extrabold text-[#23282D] m-0">
                      Competitividade do Meu Catálogo
                    </h2>
                    <p className="text-[12.5px] text-[#93927F] mt-0.5 m-0">
                      Seu preço vs. ofertas do mesmo perfume em Lojas Oficiais e Lojistas
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-[11px] bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center flex-shrink-0">
                    <svg className="w-[18px] h-[18px]">
                      <use href="#ic-coupon" />
                    </svg>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#EFEBDD] bg-[#FBFAF6]">
                        <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_18px]">
                          Perfume & Volume
                        </th>
                        <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_12px] text-right whitespace-nowrap">
                          Menor / Média
                        </th>
                        <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_12px] text-right whitespace-nowrap">
                          Meu Preço
                        </th>
                        <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_18px_12px_12px] text-right">
                          Posição
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEBDD] text-[13px]">
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-[#93927F]">
                            Analisando competitividade do seu catálogo...
                          </td>
                        </tr>
                      ) : !error && catalogComparison.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-10 px-6 text-center text-[#93927F]">
                            Cadastre ofertas na aba &quot;Meus Perfumes&quot; para comparar seus preços por volumetria com o mercado.
                          </td>
                        </tr>
                      ) : (
                        catalogComparison.map((item) => {
                          const badgeMap: Record<
                            string,
                            { label: string; className: string }
                          > = {
                            lowest: {
                              label: "Menor preço",
                              className:
                                "bg-[#F0F5EE] text-[#3A5C30] border-[#B8CFAF]",
                            },
                            competitive: {
                              label: "Competitivo",
                              className:
                                "bg-[#E9EDF0] text-[#354B5E] border-[#C9D3DC]",
                            },
                            above_market: {
                              label: "Acima da média",
                              className:
                                "bg-[#FBEEE7] text-[#A24726] border-[#F0C4B0]",
                            },
                            exclusive: {
                              label: "Oferta única",
                              className:
                                "bg-[#F5F3E9] text-[#5C6B4E] border-[#E6E1D2]",
                            },
                          };
                          const badge =
                            badgeMap[item.position] ?? badgeMap.competitive;

                          return (
                            <tr
                              key={item.store_product_id}
                              className="hover:bg-[#FBFAF6] transition-colors"
                            >
                              <td className="p-[14px_18px] align-middle">
                                <div className="flex items-center gap-2">
                                  <span className="font-jakarta font-bold text-[#23282D] text-[13.5px]">
                                    {item.product_name}
                                  </span>
                                  <span
                                    className={`text-[10.5px] font-jakarta font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                                      item.is_decant
                                        ? "bg-[#E9EDF0] text-[#354B5E]"
                                        : "bg-[#EDF0E7] text-[#454F3A]"
                                    }`}
                                  >
                                    {item.volume_ml}ml
                                  </span>
                                </div>
                                <div className="text-[11.5px] text-[#93927F] mt-0.5 truncate">
                                  {item.brand_name}
                                </div>
                                <div className="mt-0.5">
                                  {item.sellers_count <= 1 ? (
                                    <span className="text-[11px] font-medium text-[#93927F] whitespace-nowrap">
                                      Só na sua loja
                                    </span>
                                  ) : (
                                    <span className="text-[11.5px] font-jakarta font-bold text-[#354B5E] whitespace-nowrap">
                                      {item.sellers_count - 1 === 1
                                        ? "Você + 1 loja vendendo"
                                        : `Você + ${item.sellers_count - 1} lojas vendendo`}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-[14px_12px] text-right whitespace-nowrap align-middle">
                                <div className="text-[12.5px] font-semibold text-[#23282D]">
                                  R$ {item.market_min_price}
                                </div>
                                <div className="text-[11px] text-[#93927F]">
                                  méd. R$ {item.market_avg_price}
                                </div>
                              </td>
                              <td className="p-[14px_12px] text-right font-jakarta font-extrabold text-[#23282D] whitespace-nowrap align-middle">
                                R$ {item.my_price}
                              </td>
                              <td className="p-[14px_18px_14px_12px] text-right whitespace-nowrap align-middle">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-jakarta font-bold border ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-[24px] py-[14px] bg-[#FBFAF6] border-t border-[#EFEBDD] text-[12px] text-[#5A6067] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#354B5E] flex-shrink-0">
                  <use href="#ic-lightbulb" />
                </svg>
                <span>
                  Compara seus perfumes com todas as ofertas ativas de Lojas Oficiais e Lojistas no NŌTA.
                </span>
              </div>
            </section>

            {/* Tabela de Top 5 Perfumes em Alta na Plataforma (6 colunas) */}
            <section
              aria-label="Top 5 Perfumes em Alta na Plataforma NŌTA"
              className="lg:col-span-6 bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between p-[22px_24px_16px] border-b border-[#EFEBDD] gap-4">
                  <div>
                    <h2 className="font-jakarta text-[16.5px] font-extrabold text-[#23282D] m-0">
                      Perfumes Mais Vendidos
                    </h2>
                    <p className="text-[12.5px] text-[#93927F] mt-0.5 m-0">
                      Fragrâncias com maior saída em todo o ecossistema NŌTA
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-[11px] bg-[#F5E7DE] text-[#7E4228] flex items-center justify-center flex-shrink-0">
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#EFEBDD] bg-[#FBFAF6]">
                        <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_12px_12px_20px] whitespace-nowrap">
                          #
                        </th>
                        <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_12px]">
                          Perfume & Marca
                        </th>
                        <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_12px] text-right whitespace-nowrap">
                          Vendas
                        </th>
                        <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_12px] text-right whitespace-nowrap">
                          A partir de
                        </th>
                        <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_20px_12px_12px] text-right whitespace-nowrap">
                          Situação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEBDD] text-[13px]">
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-[#93927F]">
                            Carregando produtos em alta...
                          </td>
                        </tr>
                      ) : !error && trendingProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-[#93927F]">
                            Nenhum perfume publicado ainda.
                          </td>
                        </tr>
                      ) : (
                        trendingProducts.slice(0, 5).map((item, idx) => (
                          <tr key={item.id} className="hover:bg-[#FBFAF6] transition-colors">
                            <td className="p-[14px_12px_14px_20px] font-jakarta font-extrabold text-[#93927F] whitespace-nowrap align-middle">
                              #{idx + 1}
                            </td>
                            <td className="p-[14px_12px] align-middle">
                              <div className="font-jakarta font-bold text-[#23282D] text-[13.5px]">
                                {item.name}
                              </div>
                              <div className="text-[11.5px] text-[#93927F] mt-0.5">
                                {item.brand_name}
                              </div>
                              <div className="text-[11px] font-semibold text-[#5C6B4E] mt-0.5">
                                {item.olfactory_family}
                              </div>
                            </td>
                            <td className="p-[14px_12px] text-right font-semibold text-[#5A6067] whitespace-nowrap align-middle">
                              {item.sold_count} un
                            </td>
                            <td className="p-[14px_12px] text-right font-jakarta font-extrabold text-[#23282D] whitespace-nowrap align-middle">
                              {item.min_market_price ? `R$ ${item.min_market_price}` : "—"}
                            </td>
                            <td className="p-[14px_20px_14px_12px] text-right whitespace-nowrap align-middle">
                              {item.in_my_catalog ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F0F5EE] border border-[#B8CFAF] text-[#3A5C30] whitespace-nowrap">
                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>No catálogo</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FDF4F0] border border-[#F0C4B0] text-[#A24726] whitespace-nowrap">
                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>Oportunidade</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-[24px] py-[14px] bg-[#FBFAF6] border-t border-[#EFEBDD] text-[12px] text-[#5A6067] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#354B5E] flex-shrink-0">
                  <use href="#ic-lightbulb" />
                </svg>
                <span>Perfumes marcados como &quot;Oportunidade&quot; possuem alta procura e ainda não estão na sua vitrine.</span>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketMetricsSection;
