import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { OrderCard } from "../../features/store/OrderCard";
import {
  storeOrderService,
  type StoreOrder,
  type StoreOrderStatus,
} from "../../services/storeOrderService";

type FilterKey =
  | "ALL"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "PAID", label: "Pagos" },
  { key: "PROCESSING", label: "Em Separação" },
  { key: "SHIPPED", label: "Enviados" },
  { key: "DELIVERED", label: "Entregues" },
  { key: "CANCELLED", label: "Cancelados" },
];

export function StoreOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [processingId, setProcessingId] = useState<number | null>(
    null,
  );

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await storeOrderService.getOrders();
      setOrders(data);
    } catch {
      setError(
        "Não foi possível carregar os pedidos. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    storeOrderService
      .getOrders()
      .then((data) => setOrders(data))
      .catch(() =>
        setError(
          "Não foi possível carregar os pedidos. Tente novamente.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const map: Record<FilterKey, number> = {
      ALL: orders.length,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const order of orders) {
      if (order.status in map) {
        map[order.status as Exclude<StoreOrderStatus, "PENDING">] += 1;
      }
    }
    return map;
  }, [orders]);

  const pendingDispatchCount = orders.filter(
    (order) =>
      order.status === "PAID" || order.status === "PROCESSING",
  ).length;
  const delayedCount = orders.filter(
    (order) => order.is_delayed,
  ).length;

  const visibleOrders =
    filter === "ALL"
      ? orders
      : orders.filter((order) => order.status === filter);

  const handleProcess = async (order: StoreOrder) => {
    setProcessingId(order.id);
    try {
      const updated =
        await storeOrderService.updateOrderStatus(
          order.id,
          "PROCESSING",
        );
      setOrders((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );
      toast.success(
        `Pedido #${order.id} movido para Em Separação.`,
      );
    } catch {
      toast.error(
        "Não foi possível atualizar o status do pedido.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen font-inter bg-app-canvas text-[#23282D]">
      <Toaster position="top-right" />

      <header className="h-[72px] bg-white border-b border-[#E6E1D2] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="font-jakarta text-[22px] font-extrabold tracking-[0.02em] text-[#354B5E]">
            NŌTA
          </span>
          <span className="text-[13px] font-bold text-[#5A6067]">
            Lojista · Pedidos
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/seller")}
          className="text-[13px] font-bold text-[#354B5E] hover:text-[#263847] transition-colors"
        >
          ← Voltar ao painel
        </button>
      </header>

      <main className="max-w-[1100px] mx-auto p-6 sm:p-8">
        <div className="mb-7">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#A85A38] mb-2">
            Operação ao Vivo
          </p>
          <h1 className="font-jakarta text-[27px] font-extrabold text-[#263847] mb-1">
            Pedidos da loja
          </h1>
          <p className="text-[13px] text-[#5A6067]">
            Acompanhe os pedidos recebidos, o prazo limite de despacho e
            inicie a separação dos pagamentos aprovados.
          </p>
        </div>

        {/* RF-12.7 — Cartões de alerta operacional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
          <div className="bg-[#354B5E] text-white p-5 rounded-[18px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#DCE5EA] mb-2">
              Despacho pendente
            </p>
            <p className="font-jakarta text-[30px] font-extrabold leading-none">
              {pendingDispatchCount}
            </p>
            <p className="text-[11.5px] text-[#DCE5EA]/80 mt-2">
              Pedidos aguardando separação/envio
            </p>
          </div>
          <div
            className={`p-5 rounded-[18px] border transition-colors ${
              delayedCount > 0
                ? "bg-[#FDF4F0] border-[#F0C4B0] text-[#7E2D11]"
                : "bg-white border-[#EFEBDD] text-[#23282D] shadow-[0_1px_3px_rgba(35,40,45,0.06)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.07em] mb-2 ${
                  delayedCount > 0
                    ? "text-[#BA1A1A]"
                    : "text-[#93927F]"
                }`}
              >
                SLA em atraso
              </p>
              {delayedCount > 0 && (
                <span className="text-[14px]">⚠️</span>
              )}
            </div>
            <p
              className={`font-jakarta text-[30px] font-extrabold leading-none ${
                delayedCount > 0 ? "text-[#BA1A1A]" : "text-[#23282D]"
              }`}
            >
              {delayedCount}
            </p>
            <p
              className={`text-[11.5px] mt-2 ${
                delayedCount > 0
                  ? "text-[#BA1A1A] font-medium"
                  : "text-[#5A6067]"
              }`}
            >
              {delayedCount === 0
                ? "Todos os pedidos no prazo"
                : "Priorize o despacho imediato"}
            </p>
          </div>
        </div>

        {/* RF-12.1 — Filtros por status */}
        <div className="flex items-center gap-2 bg-white border border-[#E6E1D2] rounded-full p-1 shadow-[0_1px_3px_rgba(35,40,45,0.06)] flex-wrap mb-6 w-fit max-w-full">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`px-4 py-2 rounded-full text-[12px] font-bold transition-colors ${
                filter === item.key
                  ? "bg-[#354B5E] text-white"
                  : "text-[#5A6067] hover:bg-[#F5F3E9]"
              }`}
            >
              {item.label} ({counts[item.key]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white border border-[#EFEBDD] rounded-[20px] py-16 text-center text-[13px] font-semibold text-[#5A6067]">
            Carregando pedidos...
          </div>
        ) : error ? (
          <div className="bg-white border border-[#F0C4B0] rounded-[20px] py-12 px-6 text-center">
            <p className="text-[13px] font-semibold text-[#BA1A1A] mb-4">
              {error}
            </p>
            <button
              type="button"
              onClick={loadOrders}
              className="bg-[#354B5E] text-white rounded-full px-6 py-2.5 text-[12.5px] font-bold hover:bg-[#263847] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="bg-white border border-[#EFEBDD] rounded-[20px] py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EFEBDD] flex items-center justify-center text-[22px] mb-3 text-[#93927F]">
              📦
            </div>
            <h2 className="font-jakarta font-bold text-[15px] text-[#23282D] mb-1">
              Nenhum pedido encontrado
            </h2>
            <p className="text-[13px] text-[#5A6067] max-w-[340px] mx-auto">
              {filter === "ALL"
                ? "Sua loja ainda não recebeu pedidos. Assim que um cliente finalizar uma compra, os dados aparecerão aqui."
                : "Não há pedidos para o filtro selecionado no momento."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onProcess={handleProcess}
                isProcessing={processingId === order.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
