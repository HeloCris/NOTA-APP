import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ShippingModal } from "../../features/store/ShippingModal";
import {
  storeOrderService,
  type StoreOrder,
  type StoreOrderStatus,
} from "../../services/storeOrderService";

type FilterKey = "ALL" | "PROCESSING" | "DELAYED" | "SHIPPED";

const statusStyles: Record<StoreOrderStatus, string> = {
  PENDING: "bg-[#F5F3E9] text-[#5A6067]",
  PAID: "bg-[#E9EDF0] text-[#354B5E]",
  PROCESSING: "bg-[#F5E7DE] text-[#7E4228]",
  SHIPPED: "bg-[#EDF0E7] text-[#454F3A]",
  DELIVERED: "bg-[#F0F5EE] text-[#3A5C30]",
  CANCELLED: "bg-[#FDF4F0] text-[#BA1A1A]",
  CANCEL_REQUESTED: "bg-[#FFF3CD] text-[#856404] border-[#FFEEBA]",
  DELIVERY_DISPUTED: "bg-[#F8D7DA] text-[#721C24] border-[#F5C6CB]",
  REFUNDED: "bg-[#E2E3E5] text-[#383D41] border-[#D6D8DB]",
};

const statusLabels: Record<StoreOrderStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  PROCESSING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  CANCEL_REQUESTED: "Cancelamento Solicitado",
  DELIVERY_DISPUTED: "Entrega Contestada",
  REFUNDED: "Reembolsado",
};

export function OrdersTab() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("ALL");
  const [orderToShip, setOrderToShip] = useState<StoreOrder | null>(null);
  
  // Estados para o Modal de Resposta de Cancelamento
  const [cancelModalOrder, setCancelModalOrder] = useState<StoreOrder | null>(null);
  const [cancelRejectReason, setCancelRejectReason] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setLoadError("");
    try {
      setOrders(await storeOrderService.getOrders());
    } catch {
      setLoadError("Não foi possível carregar os pedidos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const delayedCount = orders.filter((order) => order.is_delayed).length;
  const processingCount = orders.filter((order) => order.status === "PROCESSING").length;
  const shippedCount = orders.filter((order) => order.status === "SHIPPED").length;

  const visibleOrders = orders.filter((order) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "PROCESSING") return order.status === "PROCESSING";
    if (selectedFilter === "DELAYED") return order.is_delayed;
    if (selectedFilter === "SHIPPED") return order.status === "SHIPPED";
    return true;
  });

  function openShippingModal(order: StoreOrder) {
    setOrderToShip(order);
  }

  function closeShippingModal() {
    setOrderToShip(null);
  }

  async function startProcessing(order: StoreOrder) {
    setBusyId(order.id);
    try {
      const updated = await storeOrderService.updateOrderStatus(order.id, "PROCESSING");
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(`Pedido #${order.id} movido para Em Separação.`);
    } catch {
      toast.error("Não foi possível atualizar o status do pedido.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmShipping(carrier: string, trackingCode: string) {
    if (!orderToShip) return;
    setBusyId(orderToShip.id);
    try {
      const updated = await storeOrderService.shipOrder(orderToShip.id, {
        carrier,
        tracking_code: trackingCode,
      });
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      closeShippingModal();
      toast.success(`Pedido #${updated.id} despachado com sucesso.`);
    } catch {
      toast.error("Não foi possível despachar o pedido.");
    } finally {
      setBusyId(null);
    }
  }

  // Ação: Responder à Solicitação de Cancelamento
  async function handleRespondCancel(approve: boolean) {
    if (!cancelModalOrder) return;
    if (!approve && !cancelRejectReason.trim()) {
      toast.error("Atenção: Informe o motivo da recusa.");
      return;
    }

    setBusyId(cancelModalOrder.id);
    try {
      await storeOrderService.respondCancelRequest(
        cancelModalOrder.id,
        approve,
        approve ? undefined : cancelRejectReason.trim()
      );

      if (approve) {
        toast.success(`Solicitação APROVADA. Pedido #${cancelModalOrder.id} foi cancelado.`);
      } else {
        toast.success(`Solicitação RECUSADA. Pedido #${cancelModalOrder.id} retornou para Em Separação.`);
      }

      setCancelModalOrder(null);
      setCancelRejectReason("");
      await loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Não foi possível processar a resposta de cancelamento.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-end justify-between gap-5 mb-7 flex-wrap">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#A85A38] mb-2">
            Operação ao Vivo
          </p>
          <h1 className="font-jakarta text-[27px] font-extrabold text-[#263847] mb-1">
            Pedidos e expedição
          </h1>
          <p className="text-[13px] text-[#5A6067]">
            Acompanhe prazos de despacho, pedidos em atraso e informe o rastreio aos clientes.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E6E1D2] rounded-full p-1 shadow-[0_1px_3px_rgba(35,40,45,0.06)] flex-wrap">
          {(
            [
              ["ALL", "Todos"],
              ["PROCESSING", `Aguardando (${processingCount})`],
              ["DELAYED", `Em atraso (${delayedCount})`],
              ["SHIPPED", `Enviados (${shippedCount})`],
            ] as const
          ).map(([filterKey, label]) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setSelectedFilter(filterKey)}
              className={`px-4 py-2 rounded-full text-[12px] font-bold transition-colors ${
                selectedFilter === filterKey
                  ? filterKey === "DELAYED" && delayedCount > 0
                    ? "bg-[#BA1A1A] text-white"
                    : "bg-[#354B5E] text-white"
                  : filterKey === "DELAYED" && delayedCount > 0
                  ? "text-[#BA1A1A] hover:bg-[#FDF4F0]"
                  : "text-[#5A6067] hover:bg-[#F5F3E9]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas ao vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#354B5E] text-white p-5 rounded-[18px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#DCE5EA] mb-2">
            Aguardando despacho
          </p>
          <p className="font-jakarta text-[30px] font-extrabold leading-none">
            {processingCount}
          </p>
          <p className="text-[11.5px] text-[#DCE5EA]/80 mt-2">
            Separação e empacotamento
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
                delayedCount > 0 ? "text-[#BA1A1A]" : "text-[#93927F]"
              }`}
            >
              Prazo Expirado / Atraso
            </p>
            {delayedCount > 0 && <span className="text-[14px]">⚠️</span>}
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
              delayedCount > 0 ? "text-[#BA1A1A] font-medium" : "text-[#5A6067]"
            }`}
          >
            {delayedCount === 0 ? "Todos os pedidos no prazo" : "Exigem despacho imediato"}
          </p>
        </div>

        <div className="bg-white border border-[#EFEBDD] p-5 rounded-[18px] shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#93927F] mb-2">
            Enviados com sucesso
          </p>
          <p className="font-jakarta text-[30px] font-extrabold leading-none text-[#454F3A]">
            {shippedCount}
          </p>
          <p className="text-[11.5px] text-[#5A6067] mt-2">
            Rastreio fornecido ao cliente
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[20px] border border-[#EFEBDD] bg-white py-16 text-center text-[13px] text-[#5A6067]">
          Carregando pedidos...
        </div>
      ) : loadError ? (
        <div className="rounded-[20px] border border-[#F0C4B0] bg-white px-6 py-12 text-center">
          <p className="mb-4 text-[13px] font-semibold text-[#BA1A1A]">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="rounded-full bg-[#354B5E] px-5 py-2.5 text-[12px] font-bold text-white"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#EFEBDD] rounded-[20px] overflow-hidden shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
          <div className="px-6 py-5 border-b border-[#EFEBDD] flex items-center justify-between gap-4">
            <div>
              <h2 className="font-jakarta text-[17px] font-extrabold text-[#23282D]">
                Fila de pedidos
              </h2>
              <p className="text-[12px] text-[#93927F] mt-1">
                Gerencie a preparação, confira o prazo limite de envio e informe o código de rastreamento.
              </p>
            </div>
            <span className="text-[12px] font-bold text-[#354B5E]">
              {visibleOrders.length} {visibleOrders.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>
          <div className="overflow-x-auto">
            {visibleOrders.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EFEBDD] flex items-center justify-center text-[22px] mb-3 text-[#93927F]">
                  📦
                </div>
                <h3 className="font-jakarta font-bold text-[15px] text-[#23282D] mb-1">
                  Nenhum pedido encontrado
                </h3>
                <p className="text-[13px] text-[#5A6067] max-w-[340px]">
                  {selectedFilter === "ALL"
                    ? "Sua loja ainda não recebeu pedidos. Assim que um cliente finalizar uma compra, os dados aparecerão aqui para separação e despacho."
                    : "Não há pedidos para a categoria selecionada no momento."}
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[840px] border-collapse">
                <thead>
                  <tr className="bg-[#FCFBF7]">
                    {[
                      "Pedido",
                      "Cliente",
                      "Prazo de Despacho",
                      "Itens",
                      "Total",
                      "Status",
                      "Ação",
                    ].map((label) => (
                      <th
                        key={label}
                        className="px-6 py-3 text-left text-[10.5px] uppercase tracking-[0.07em] text-[#93927F] font-bold"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => {
                    return (
                      <tr
                        key={order.id}
                        className="border-t border-[#EFEBDD] hover:bg-[#FBFAF6] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/seller/orders/${order.id}`)}
                            className="font-bold text-[13px] text-[#354B5E] hover:underline cursor-pointer text-left"
                          >
                            #{order.id}
                          </button>
                          <p className="text-[11px] text-[#93927F] mt-1">
                            {new Date(order.created_at).toLocaleDateString("pt-BR")}
                          </p>
                          {order.address_changed && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-[#8C6D1F] bg-[#FFF9E6] border border-[#F0D58A] px-1.5 py-0.5 rounded">
                              ⚠️ Endereço alterado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[13px] font-semibold text-[#23282D]">
                          {order.customer_name}
                          {order.shipping_service && (
                            <p className="text-[11px] text-[#5A6067] font-normal mt-0.5">
                              {order.shipping_service}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {order.dispatch_deadline ? (
                            <div className="space-y-1">
                              <p className="text-[12px] font-bold text-[#23282D]">
                                {order.dispatch_deadline}
                              </p>
                              {order.urgency_status && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] border border-[#B8CFAF] bg-[#F0F5EE] text-[#3A5C30]">
                                  {order.urgency_status === "DELAYED"
                                    ? "Atrasado"
                                    : order.urgency_status === "DUE_TODAY"
                                    ? "Vence hoje"
                                    : "No prazo"}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#93927F]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[12px] text-[#5A6067]">
                          {order.items.length} item(ns)
                        </td>
                        <td className="px-6 py-4 text-[13px] font-bold text-[#23282D]">
                          {Number(order.total_amount).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${
                              statusStyles[order.status] || "bg-[#EFEBDD] text-[#23282D]"
                            }`}
                          >
                            {statusLabels[order.status] || order.status}
                          </span>
                          {order.tracking_code && (
                            <p className="text-[11px] font-semibold text-[#5C6B4E] mt-2">
                              {order.carrier}: {order.tracking_code}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {order.status === "PAID" ? (
                            <button
                              type="button"
                              disabled={busyId === order.id}
                              onClick={() => void startProcessing(order)}
                              className="inline-flex items-center gap-2 bg-[#354B5E] text-white rounded-full px-4 py-2 text-[12px] font-bold hover:bg-[#263847] disabled:opacity-60 transition-colors"
                            >
                              Iniciar separação
                            </button>
                          ) : order.status === "PROCESSING" ? (
                            <button
                              type="button"
                              onClick={() => openShippingModal(order)}
                              className="inline-flex items-center gap-2 bg-[#A85A38] text-white rounded-full px-4 py-2 text-[12px] font-bold hover:bg-[#8F492D] transition-colors"
                            >
                              Despachar pedido
                            </button>
                          ) : order.status === "CANCEL_REQUESTED" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCancelModalOrder(order);
                                setCancelRejectReason("");
                              }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#856404] bg-[#FFF3CD] border border-[#FFEEBA] px-3 py-1.5 rounded-full hover:bg-[#FFE8A1] transition-colors cursor-pointer"
                            >
                              ⚠️ Responder solicitação
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate(`/seller/orders/${order.id}`)}
                              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#354B5E] hover:underline"
                            >
                              Ver detalhes &rarr;
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal de Despacho */}
      {orderToShip && (
        <ShippingModal
          order={orderToShip}
          isSubmitting={busyId === orderToShip.id}
          onCancel={closeShippingModal}
          onSubmit={(carrier, code) => void confirmShipping(carrier, code)}
        />
      )}

      {/* Modal de Resposta de Cancelamento */}
      {cancelModalOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex justify-center items-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full space-y-4 shadow-xl border border-[#E6E1D2]">
            <div className="flex items-center justify-between border-b border-[#EFEBDD] pb-3">
              <h3 className="font-jakarta font-extrabold text-[16px] text-[#23282D]">
                Solicitação de Cancelamento — Pedido #{cancelModalOrder.code || cancelModalOrder.id}
              </h3>
              <button
                onClick={() => setCancelModalOrder(null)}
                className="text-[#93927F] hover:text-[#23282D] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-[12.5px] text-[#5A6067] leading-relaxed">
              O cliente solicitou o cancelamento do pedido que está atualmente em separação. Escolha se deseja aprovar ou recusar o pedido:
            </p>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.05em] text-[#8C6D1F]">
                Motivo da Recusa (obrigatório se for recusar):
              </label>
              <input
                type="text"
                placeholder="Ex: Pedido já embalado e separado para a transportadora."
                value={cancelRejectReason}
                onChange={(e) => setCancelRejectReason(e.target.value)}
                className="w-full border border-[#E6E1D2] p-2.5 text-[12.5px] rounded-xl focus:outline-none focus:border-[#A85A38] bg-[#FAF8F5]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFEBDD]">
              <button
                type="button"
                disabled={busyId === cancelModalOrder.id}
                onClick={() => handleRespondCancel(false)}
                className="px-4 py-2 text-[12px] text-white bg-[#BA1A1A] hover:bg-[#9E1414] rounded-full font-bold transition-colors disabled:opacity-60"
              >
                Recusar Cancelamento
              </button>

              <button
                type="button"
                disabled={busyId === cancelModalOrder.id}
                onClick={() => handleRespondCancel(true)}
                className="px-4 py-2 text-[12px] text-white bg-[#3A5C30] hover:bg-[#2E4A26] rounded-full font-bold transition-colors disabled:opacity-60"
              >
                Aprovar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}