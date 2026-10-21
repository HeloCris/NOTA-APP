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
};

const STATUS_STYLES: Record<StoreOrder["status"], string> = {
  PENDING: "bg-[#F5F3E9] text-[#5A6067] border-[#EFEBDD]",
  PAID: "bg-[#E9EDF0] text-[#354B5E] border-[#D5DEE5]",
  PROCESSING: "bg-[#F5E7DE] text-[#7E4228] border-[#EAD2C4]",
  SHIPPED: "bg-[#EDF0E7] text-[#454F3A] border-[#D6DCCB]",
  DELIVERED: "bg-[#F0F5EE] text-[#3A5C30] border-[#B8CFAF]",
  CANCELLED: "bg-[#FDF4F0] text-[#BA1A1A] border-[#F0C4B0]",
};

const URGENCY_LABELS: Record<UrgencyStatus, string> = {
  ON_TIME: "No prazo",
  DUE_TODAY: "Vence hoje",
  DELAYED: "Em atraso ⚠️",
};

const URGENCY_STYLES: Record<UrgencyStatus, string> = {
  ON_TIME:
    "bg-[#F0F5EE] border-[#B8CFAF] text-[#3A5C30]",
  DUE_TODAY:
    "bg-[#FFF9E6] border-[#F0D58A] text-[#8C6D1F]",
  DELAYED:
    "bg-[#FDF4F0] border-[#F0C4B0] text-[#BA1A1A] font-bold",
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

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function formatAddress(
  address: StoreOrderShippingAddress | null,
): string {
  if (!address) return "—";
  const line1 = [address.street, address.number]
    .filter(Boolean)
    .join(", ");
  const line2 = [address.neighborhood, address.city, address.state]
    .filter(Boolean)
    .join(" - ");
  return [line1, line2].filter(Boolean).join(" | ") || "—";
}

interface OrderCardProps {
  order: StoreOrder;
  onProcess?: (order: StoreOrder) => void;
  onShip?: (order: StoreOrder) => void;
  isProcessing?: boolean;
  isShipping?: boolean;
}

export function OrderCard({
  order,
  onProcess,
  onShip,
  isProcessing = false,
  isShipping = false,
}: OrderCardProps) {
  const canStartProcessing = order.status === "PAID";
  const canShip = order.status === "PROCESSING";

  return (
    <article
      data-testid={`order-card-${order.id}`}
      className="bg-white border border-[#EFEBDD] rounded-[18px] p-6 shadow-[0_1px_3px_rgba(35,40,45,0.06)]"
    >
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
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border ${URGENCY_STYLES[order.urgency_status]}`}
            >
              {URGENCY_LABELS[order.urgency_status]}
            </span>
          )}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${STATUS_STYLES[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>

      <ul className="border-t border-[#F5F3E9] pt-3 mb-4 space-y-1.5">
        {order.items.length === 0 ? (
          <li className="text-[12px] text-[#93927F]">
            Nenhum item registrado.
          </li>
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

      {canStartProcessing && (
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onProcess?.(order)}
          className="inline-flex items-center gap-2 bg-[#354B5E] text-white rounded-full px-5 py-2.5 text-[12.5px] font-bold hover:bg-[#263847] transition-colors disabled:opacity-60"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 3h3M10.5 3v6.5L5.8 18a2 2 0 0 0 1.7 3h9a2 2 0 0 0 1.7-3l-4.7-8.5V3" />
          </svg>
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
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h13m0 0-4-4m4 4-4 4M16 5h2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2" />
          </svg>
          {isShipping ? "Despachando..." : "Despachar Pedido"}
        </button>
      )}

      {order.status === "SHIPPED" && order.tracking_code && (
        <div className="border-t border-[#F5F3E9] pt-4 text-[12.5px] text-[#454F3A]">
          <span className="font-bold">Rastreio:</span> {order.tracking_code}
          {order.carrier ? ` · ${order.carrier}` : ""}
        </div>
      )}
    </article>
  );
}
