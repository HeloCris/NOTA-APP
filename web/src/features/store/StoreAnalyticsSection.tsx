import React, { useCallback, useEffect, useRef, useState } from "react";
import { storeService } from "../../services/storeService";
import type {
  AnalyticsPeriod,
  CatalogGap,
  StoreAnalyticsData,
} from "../../types/storeAnalytics";

interface StoreAnalyticsSectionProps {
  onGoToProducts?: (term?: string) => void;
}

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "all", label: "Todo o período" },
];

const brl = (value: string | number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const KpiCard: React.FC<{
  title: string;
  value: string;
  detail: string;
  icon: string;
}> = ({ title, value, detail, icon }) => (
  <div className="relative bg-white border border-[#EFEBDD] rounded-[18px] p-5 overflow-hidden shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#354B5E] to-transparent" />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-jakarta text-[11px] font-bold tracking-[0.06em] uppercase text-[#93927F] m-0">
          {title}
        </p>
        <p className="font-jakarta text-[25px] font-extrabold text-[#263847] m-0 mt-2 truncate">
          {value}
        </p>
        <p className="text-[12px] text-[#5A6067] m-0 mt-1.5 leading-[1.45]">{detail}</p>
      </div>
      <div className="w-[38px] h-[38px] rounded-[11px] bg-[#F5F3E9] text-[#354B5E] flex items-center justify-center flex-shrink-0">
        <svg className="w-[19px] h-[19px]"><use href={icon} /></svg>
      </div>
    </div>
  </div>
);

const GapCard: React.FC<{ gap: CatalogGap; onGoToProducts?: (term?: string) => void }> = ({
  gap,
  onGoToProducts,
}) => {
  const isFamily = gap.type === "family";
  const suggestions = gap.suggested_products.slice(0, 2);

  return (
    <div className="rounded-[16px] border border-[#F0C4B0] bg-[#FFFCFA] p-[18px_20px] flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.05em] px-2.5 py-1 rounded-full bg-[#FDF0E9] text-[#A24726]">
              <svg className="w-3.5 h-3.5"><use href="#ic-lightbulb" /></svg>
              {isFamily ? "Família descoberta" : "Nota em alta descoberta"}
            </span>
            <span className="text-[11px] font-bold text-[#A24726]">
              {gap.customer_demand_pct}% dos clientes
            </span>
          </div>
          <h4 className="font-jakarta text-[17px] font-extrabold text-[#23282D] m-0 mt-2">
            {gap.name}
          </h4>
          <p className="text-[12.5px] text-[#5A6067] m-0 mt-1">
            Sua loja possui {gap.my_active_offers_count} ofertas ativas com{" "}
            {isFamily ? "esta família" : "esta nota"} no estoque.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onGoToProducts?.(gap.name)}
          className="px-4 py-2 rounded-full text-[12px] font-jakarta font-bold bg-[#A24726] text-white hover:bg-[#7E2D11] transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
        >
          Ofertar na minha loja
          <svg className="w-3.5 h-3.5"><use href="#ic-plus" /></svg>
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#5A6067]">
          <span className="font-semibold">Sugestões do catálogo:</span>
          {suggestions.map((product) => (
            <span
              key={product.id}
              className="px-2.5 py-1 rounded-full bg-white border border-[#E6E1D2] text-[#354B5E] font-semibold"
            >
              {product.name} · {product.brand_name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const StoreAnalyticsSection: React.FC<StoreAnalyticsSectionProps> = ({
  onGoToProducts,
}) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [data, setData] = useState<StoreAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await storeService.getStoreAnalytics(period);
      if (isMountedRef.current) {
        setData(result);
      }
    } catch {
      if (isMountedRef.current) {
        setError("Não foi possível carregar o desempenho da sua loja. Tente novamente.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [period]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAnalytics();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAnalytics]);

  const funnel = data?.funnel;
  const mix = data?.format_mix;
  const coupons = data?.coupons_performance;
  const gaps = data?.catalog_gaps ?? [];
  const offers = data?.top_store_offers ?? [];

  return (
    <div className="space-y-[22px] animate-in fade-in duration-300 font-inter text-[#23282D] min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5C6B4E] mb-1.5">
            Inteligência Interna · Sua Loja
          </p>
          <h2 className="font-jakarta text-[24px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em]">
            Desempenho da Minha Loja
          </h2>
          <p className="text-[13px] text-[#5A6067] m-0">
            Funil de conversão, mix de formatos, cupons e oportunidades de estoque.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-1 bg-[#F5F3E9] border border-[#E6E1D2] rounded-full p-[3px] self-start sm:self-auto flex-shrink-0"
          role="group"
          aria-label="Período do analytics"
        >
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              aria-pressed={period === option.value}
              className={`px-3.5 py-2 rounded-full text-[12px] font-jakarta font-bold transition-all whitespace-nowrap cursor-pointer ${
                period === option.value
                  ? "bg-white text-[#263847] shadow-[0_1px_3px_rgba(35,40,45,0.08)]"
                  : "text-[#5A6067] hover:text-[#23282D]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF0EB] border border-[#F5C9B3] rounded-[16px] p-[18px_22px] flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[13.5px] font-semibold text-[#7E4228] m-0">{error}</p>
          <button
            type="button"
            onClick={() => void fetchAnalytics()}
            className="px-4 py-2 rounded-full text-[12.5px] font-jakarta font-bold bg-[#A24726] text-white hover:bg-[#7E2D11] transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <section aria-label="Cards de Funil e Fidelização" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
        {isLoading || !funnel || !coupons ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[142px] bg-white border border-[#EFEBDD] rounded-[18px] p-5">
              <div className="h-3 w-28 bg-[#F5F3E9] rounded animate-pulse" />
              <div className="h-8 w-20 bg-[#F5F3E9] rounded animate-pulse mt-4" />
              <div className="h-3 w-40 bg-[#F5F3E9] rounded animate-pulse mt-3" />
            </div>
          ))
        ) : (
          <>
            <KpiCard
              title="Visualizações da Vitrine"
              value={String(funnel.store_views)}
              detail={`${funnel.paid_orders_count} pedidos pagos no período`}
              icon="#ic-chart"
            />
            <KpiCard
              title="Comunidade NŌTA"
              value={String(funnel.followers_count)}
              detail={`+${funnel.new_followers_in_period} novos seguidores no período`}
              icon="#ic-coupon"
            />
            <KpiCard
              title="Taxa de Conversão"
              value={`${String(funnel.conversion_rate_pct).replace(".", ",")}%`}
              detail="Pedidos pagos sobre visualizações da vitrine"
              icon="#ic-grid"
            />
            <KpiCard
              title="Receita com Cupons"
              value={brl(coupons.revenue_with_coupon)}
              detail={`${coupons.orders_with_coupon} pedidos · ${coupons.active_coupons_count} cupons ativos`}
              icon="#ic-lightbulb"
            />
          </>
        )}
      </section>

      <section
        aria-label="Mix de Formatos da Loja"
        className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] overflow-hidden"
      >
        <div className="p-[20px_24px] border-b border-[#EFEBDD]">
          <h3 className="font-jakarta text-[16.5px] font-extrabold text-[#23282D] m-0">
            Mix de Receita da Loja
          </h3>
          <p className="text-[12.5px] text-[#93927F] m-0 mt-0.5">
            Decants (≤15ml) e frascos completos (&gt;15ml) vendidos no período.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#EFEBDD]">
          <div className="p-[20px_24px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#93927F] m-0">
              Decants · ≤15ml
            </p>
            <p className="font-jakarta text-[22px] font-extrabold text-[#354B5E] m-0 mt-2">
              {mix ? brl(mix.decants_revenue) : "—"}
            </p>
            <p className="text-[12.5px] text-[#5A6067] m-0 mt-1">
              {mix?.decants_units_sold ?? 0} unidades vendidas
            </p>
          </div>
          <div className="p-[20px_24px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#93927F] m-0">
              Frascos · &gt;15ml
            </p>
            <p className="font-jakarta text-[22px] font-extrabold text-[#5C6B4E] m-0 mt-2">
              {mix ? brl(mix.bottles_revenue) : "—"}
            </p>
            <p className="text-[12.5px] text-[#5A6067] m-0 mt-1">
              {mix?.bottles_units_sold ?? 0} unidades vendidas
            </p>
          </div>
        </div>
      </section>

      <section
        aria-label="Diagnóstico de Oportunidades de Estoque"
        className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] overflow-hidden"
      >
        <div className="p-[20px_24px] border-b border-[#EFEBDD] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-jakarta text-[16.5px] font-extrabold text-[#23282D] m-0">
              Diagnóstico de Gap de Catálogo
            </h3>
            <p className="text-[12.5px] text-[#93927F] m-0 mt-0.5">
              Cruzamos o perfil olfativo dos clientes NŌTA com o seu estoque ativo.
            </p>
          </div>
          {coupons?.top_coupon_code && (
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] px-3 py-1 rounded-full bg-[#F0F5EE] border border-[#B8CFAF] text-[#3A5C30]">
              Cupom campeão: {coupons.top_coupon_code}
            </span>
          )}
        </div>
        <div className="p-[20px_24px] space-y-3">
          {isLoading ? (
            <div className="h-[110px] bg-[#F5F3E9] rounded-2xl animate-pulse" />
          ) : !error && gaps.length === 0 ? (
            <div className="py-10 text-center text-[#5C6B4E] text-[13px] border-2 border-dashed border-[#E6E1D2] rounded-2xl">
              Nenhum gap de catálogo identificado. Seu estoque cobre as preferências mais buscadas!
            </div>
          ) : (
            gaps.map((gap) => (
              <GapCard key={`${gap.type}-${gap.name}`} gap={gap} onGoToProducts={onGoToProducts} />
            ))
          )}
        </div>
      </section>

      <section
        aria-label="Ranking das Ofertas Campeãs da Loja"
        className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] overflow-hidden"
      >
        <div className="p-[20px_24px] border-b border-[#EFEBDD]">
          <h3 className="font-jakarta text-[16.5px] font-extrabold text-[#23282D] m-0">
            Ranking das Ofertas Campeãs da Loja
          </h3>
          <p className="text-[12.5px] text-[#93927F] m-0 mt-0.5">
            Por volumetria, com estoque restante e receita acumulada.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FBFAF6]">
                <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold px-5 py-3">#</th>
                <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold px-5 py-3">Perfume / Marca</th>
                <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold px-5 py-3">Formato</th>
                <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold px-5 py-3">Estoque</th>
                <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold px-5 py-3">Vendidos</th>
                <th className="text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold px-5 py-3">Receita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEBDD] text-[13px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#93927F]">
                    Carregando ofertas...
                  </td>
                </tr>
              ) : !error && offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#93927F]">
                    Nenhuma venda registrada no período selecionado.
                  </td>
                </tr>
              ) : (
                offers.map((offer, index) => (
                  <tr key={offer.store_product_id} className="hover:bg-[#FBFAF6]">
                    <td className="px-5 py-3 font-jakarta font-extrabold text-[#93927F]">{index + 1}</td>
                    <td className="px-5 py-3">
                      <span className="font-jakarta font-bold text-[#23282D] block">{offer.product_name}</span>
                      <span className="text-[11.5px] text-[#93927F]">{offer.brand_name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${
                          offer.is_decant
                            ? "bg-[#FFF4E5] text-[#8A5B22]"
                            : "bg-[#E9EDF0] text-[#354B5E]"
                        }`}
                      >
                        {offer.is_decant ? "🧪" : "🍾"} {offer.volume_ml}ml
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#5A6067]">{offer.stock_quantity} un</td>
                    <td className="px-5 py-3 font-semibold text-[#354B5E]">{offer.units_sold} un</td>
                    <td className="px-5 py-3 font-jakarta font-extrabold text-[#263847]">
                      {brl(offer.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
