import { useState } from "react";
import type {
  StoreOrder,
  StoreOrderShippingAddress,
  UrgencyStatus,
} from "../../services/storeOrderService";

const STATUS_LABELS: Record<StoreOrder["status"], string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  PROCESSING: "Em Separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  CANCEL_REQUESTED: "Cancelamento Solicitado",
  DELIVERY_DISPUTED: "Entrega Contestada",
  REFUNDED: "Reembolsado",
};

const STATUS_STYLES: Record<StoreOrder["status"], string> = {
  PENDING: "bg-[#F5F3E9] text-[#5A6067] border-[#EFEBDD]",
  PAID: "bg-[#E9EDF0] text-[#354B5E] border-[#D5DEE5]",
  PROCESSING: "bg-[#F5E7DE] text-[#7E4228] border-[#EAD2C4]",
  SHIPPED: "bg-[#EDF0E7] text-[#454F3A] border-[#D6DCCB]",
  DELIVERED: "bg-[#F0F5EE] text-[#3A5C30] border-[#B8CFAF]",
  CANCELLED: "bg-[#FDF4F0] text-[#BA1A1A] border-[#F0C4B0]",
  CANCEL_REQUESTED: "bg-[#FFF3CD] text-[#856404] border-[#FFEEBA]",
  DELIVERY_DISPUTED: "bg-[#F8D7DA] text-[#721C24] border-[#F5C6CB]",
  REFUNDED: "bg-[#E2E3E5] text-[#383D41] border-[#D6D8DB]",
};

const URGENCY_LABELS: Record<UrgencyStatus, string> = {
  ON_TIME: "No prazo",
  DUE_TODAY: "Vence hoje",
  DELAYED: "Em atraso ⚠️",
};

const URGENCY_STYLES: Record<UrgencyStatus, string> = {
  ON_TIME: "bg-[#F0F5EE] border-[#B8CFAF] text-[#3A5C30]",
  DUE_TODAY: "bg-[#FFF9E6] border-[#F0D58A] text-[#8C6D1F]",
  DELAYED: "bg-[#FDF4F0] border-[#F0C4B0] text-[#BA1A1A] font-bold",
};

function formatBRL(value: string | number): string {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function formatAddress(address: StoreOrderShippingAddress | null): string {
  if (!address) return "—";
  const line1 = [address.street, address.number].filter(Boolean).join(", ");
  const line2 = [address.neighborhood, address.city, address.state]
    .filter(Boolean)
    .join(" - ");
  return [line1, line2].filter(Boolean).join(" | ") || "—";
}

interface OrderCardProps {
  order: StoreOrder;
  onProcess?: (order: StoreOrder) => void;
  onShip?: (order: StoreOrder) => void;
  onRespondCancel?: (order: StoreOrder, approve: boolean, reason?: string) => void;
  isProcessing?: boolean;
  isShipping?: boolean;
}

export function OrderCard({
  order,
  onProcess,
  onShip,
  onRespondCancel,
  isProcessing = false,
  isShipping = false,
}: OrderCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const canStartProcessing = order.status === "PAID";
  const canShip = order.status === "PROCESSING";
  const isCancelRequested = order.status === "CANCEL_REQUESTED";

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    onRespondCancel?.(order, false, rejectReason);
    setShowRejectModal(false);
    setRejectReason("");
  };

  return (
    <article
      data-testid={`order-card-${order.id}`}
      className="bg-white border border-[#EFEBDD] rounded-[18px] p-6 shadow-[0_1px_3px_rgba(35,40,45,0.06)]"
    >
      {/* Banner de alerta para mudança de endereço */}
      {order.address_changed && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#FFF9E6] border border-[#F0D58A] px-3 py-2 text-[12px] font-bold text-[#8C6D1F]">
          <span>⚠️</span>
          <span>
            Endereço alterado pelo cliente após a realização do pedido. Verifique a nova etiqueta de envio.
          </span>
        </div>
      )}

      {/* Banner de alerta para solicitação de cancelamento */}
      {isCancelRequested && (
        <div className="mb-4 rounded-lg bg-[#FFF3CD] border border-[#FFEEBA] p-3 text-[12px] text-[#856404]">
          <p className="font-bold">⚠️ O cliente solicitou o cancelamento deste pedido.</p>
          {order.cancel_reason && (
            <p className="mt-1 italic">"Motivo: {order.cancel_reason}"</p>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="font-jakarta text-[16px] font-extrabold text-[#23282D]">
            Pedido #{order.id} — {order.customer_name}
          </h3>
          <p className="text-[12px] text-[#93927F] mt-1">
            {formatDateTime(order.created_at)} · Despacho até{" "}
            {formatDate(order.dispatch_deadline)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {order.urgency_status && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border ${
                URGENCY_STYLES[order.urgency_status]
              }`}
            >
              {URGENCY_LABELS[order.urgency_status]}
            </span>
          )}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${
              STATUS_STYLES[order.status] || "bg-[#EFEBDD] text-[#23282D]"
            }`}
          >
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
      </div>

      <ul className="border-t border-[#F5F3E9] pt-3 mb-4 space-y-1.5">
        {order.items.length === 0 ? (
          <li className="text-[12px] text-[#93927F]">Nenhum item registrado.</li>
        ) : (
          order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between text-[13px] text-[#374151]"
            >
              <span>
                {item.quantity}x {item.product_name}
              </span>
              <span className="font-semibold text-[#23282D]">
                {formatBRL(item.unit_price)}
              </span>
            </li>
          ))
        )}
      </ul>

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#F5F3E9] pt-3 mb-5">
        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.07em] font-bold text-[#93927F]">
            Endereço de entrega
          </dt>
          <dd className="text-[12.5px] text-[#23282D] mt-1">
            {formatAddress(order.shipping_address)}
          </dd>
        </div>
        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.07em] font-bold text-[#93927F]">
            Frete
          </dt>
          <dd className="text-[12.5px] text-[#23282D] mt-1">
            {order.shipping_service || "—"}
            {order.shipping_cost && (
              <span className="text-[#5A6067]">
                {" "}
                ({formatBRL(order.shipping_cost)})
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.07em] font-bold text-[#93927F]">
            Total
          </dt>
          <dd className="text-[13.5px] font-extrabold text-[#23282D] mt-1">
            {formatBRL(order.total_amount)}
          </dd>
        </div>
      </dl>

      {/* Ações conforme o Status do Pedido */}
      {canStartProcessing && (
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onProcess?.(order)}
          className="inline-flex items-center gap-2 bg-[#354B5E] text-white rounded-full px-5 py-2.5 text-[12.5px] font-bold hover:bg-[#263847] transition-colors disabled:opacity-60"
        >
          {isProcessing ? "Processando..." : "Iniciar Separação"}
        </button>
      )}

      {canShip && (
        <button
          type="button"
          disabled={isShipping}
          onClick={() => onShip?.(order)}
          className="inline-flex items-center gap-2 bg-[#A85A38] text-white rounded-full px-5 py-2.5 text-[12.5px] font-bold hover:bg-[#873F25] transition-colors disabled:opacity-60"
        >
          {isShipping ? "Despachando..." : "Despachar Pedido"}
        </button>
      )}

      {isCancelRequested && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onRespondCancel?.(order, true)}
            className="bg-[#BA1A1A] text-white rounded-full px-4 py-2 text-[12px] font-bold hover:bg-[#961515] transition-colors"
          >
            Aprovar Cancelamento
          </button>
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="bg-[#EFEBDD] text-[#23282D] rounded-full px-4 py-2 text-[12px] font-bold hover:bg-[#E2DDD0] transition-colors"
          >
            Recusar Cancelamento
          </button>
        </div>
      )}

      {order.status === "SHIPPED" && order.tracking_code && (
        <div className="border-t border-[#F5F3E9] pt-4 text-[12.5px] text-[#454F3A]">
          <span className="font-bold">Rastreio:</span> {order.tracking_code}
          {order.carrier ? ` · ${order.carrier}` : ""}
        </div>
      )}

      {/* Modal de recusa de cancelamento pelo lojista */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg">
            <h4 className="font-jakarta text-[16px] font-bold text-[#23282D] mb-2">
              Motivo da Recusa do Cancelamento
            </h4>
            <p className="text-[12.5px] text-[#5A6067] mb-4">
              Informe a justificativa para o cliente. O pedido retornará ao fluxo de preparação/envio.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: O pedido já foi embalado e coletado pela transportadora."
              className="w-full h-24 p-3 border border-[#E8E4D8] rounded-xl text-[13px] text-[#23282D] focus:outline-none focus:border-[#354B5E] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-full text-[12px] font-bold text-[#5A6067] bg-[#F4F1EA]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-full text-[12px] font-bold text-white bg-[#354B5E] disabled:opacity-50"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}