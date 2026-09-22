import { useState, type FormEvent } from "react";

type OrderStatus = "PROCESSING" | "SHIPPED";

interface Order {
  id: string;
  customer: string;
  date: string;
  items: string;
  total: string;
  status: OrderStatus;
  carrier?: string;
  trackingCode?: string;
}

const initialOrders: Order[] = [
  {
    id: "#105",
    customer: "Mariana Costa",
    date: "Hoje, 10:42",
    items: "2 itens · Eclat No. 04",
    total: "R$ 358,00",
    status: "PROCESSING",
  },
  {
    id: "#104",
    customer: "Rafael Nogueira",
    date: "Hoje, 09:18",
    items: "1 item · Vetiver Serein",
    total: "R$ 189,00",
    status: "PROCESSING",
  },
  {
    id: "#103",
    customer: "Juliana Martins",
    date: "Ontem, 16:30",
    items: "1 item · Ambre Cendre",
    total: "R$ 245,00",
    status: "SHIPPED",
    carrier: "Correios",
    trackingCode: "BR123456789X",
  },
];

const statusStyles: Record<OrderStatus, string> = {
  PROCESSING: "bg-[#F5E7DE] text-[#7E4228]",
  SHIPPED: "bg-[#EDF0E7] text-[#454F3A]",
};

export function OrdersTab() {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [orderToShip, setOrderToShip] = useState<Order | null>(null);
  const [carrier, setCarrier] = useState("Correios");
  const [trackingCode, setTrackingCode] = useState("");
  const [error, setError] = useState("");

  const visibleOrders = orders.filter((order) => (
    selectedStatus === "ALL" || order.status === selectedStatus
  ));

  function openShippingModal(order: Order) {
    setOrderToShip(order);
    setCarrier("Correios");
    setTrackingCode("");
    setError("");
  }

  function closeShippingModal() {
    setOrderToShip(null);
    setError("");
  }

  function confirmShipping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = trackingCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{6,}$/.test(normalizedCode)) {
      setError("Informe um código de rastreio com ao menos 6 caracteres alfanuméricos.");
      return;
    }

    if (!orderToShip) return;

    setOrders((currentOrders) => currentOrders.map((order) => (
      order.id === orderToShip.id
        ? { ...order, status: "SHIPPED", carrier, trackingCode: normalizedCode }
        : order
    )));
    closeShippingModal();
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-end justify-between gap-5 mb-7 flex-wrap">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#A85A38] mb-2">Operacao</p>
          <h1 className="font-jakarta text-[27px] font-extrabold text-[#263847] mb-1">Pedidos e expedição</h1>
          <p className="text-[13px] text-[#5A6067]">Acompanhe a separação e informe o rastreio das encomendas.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E6E1D2] rounded-full p-1 shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
          {([
            ["ALL", "Todos"],
            ["PROCESSING", "Em separação"],
            ["SHIPPED", "Enviados"],
          ] as const).map(([status, label]) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-full text-[12px] font-bold transition-colors ${selectedStatus === status ? "bg-[#354B5E] text-white" : "text-[#5A6067] hover:bg-[#F5F3E9]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#354B5E] text-white p-5 rounded-[18px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#DCE5EA] mb-2">Aguardando despacho</p>
          <p className="font-jakarta text-[30px] font-extrabold leading-none">{orders.filter((order) => order.status === "PROCESSING").length}</p>
        </div>
        <div className="bg-white border border-[#EFEBDD] p-5 rounded-[18px] shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#93927F] mb-2">Enviados hoje</p>
          <p className="font-jakarta text-[30px] font-extrabold leading-none text-[#454F3A]">{orders.filter((order) => order.status === "SHIPPED").length}</p>
        </div>
        <div className="bg-white border border-[#EFEBDD] p-5 rounded-[18px] shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#93927F] mb-2">Proximo corte</p>
          <p className="font-jakarta text-[22px] font-extrabold leading-none text-[#263847]">16:30</p>
        </div>
      </div>

      <div className="bg-white border border-[#EFEBDD] rounded-[20px] overflow-hidden shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
        <div className="px-6 py-5 border-b border-[#EFEBDD] flex items-center justify-between gap-4">
          <div>
            <h2 className="font-jakarta text-[17px] font-extrabold text-[#23282D]">Fila de pedidos</h2>
            <p className="text-[12px] text-[#93927F] mt-1">Dados demonstrativos para validação do fluxo de expedição.</p>
          </div>
          <span className="text-[12px] font-bold text-[#354B5E]">{visibleOrders.length} pedidos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-[#FCFBF7]">
                {['Pedido', 'Cliente', 'Itens', 'Total', 'Status', 'Acao'].map((label) => (
                  <th key={label} className="px-6 py-3 text-left text-[10.5px] uppercase tracking-[0.07em] text-[#93927F] font-bold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order.id} className="border-t border-[#EFEBDD] hover:bg-[#FBFAF6] transition-colors">
                  <td className="px-6 py-4"><p className="font-bold text-[13px] text-[#23282D]">{order.id}</p><p className="text-[11px] text-[#93927F] mt-1">{order.date}</p></td>
                  <td className="px-6 py-4 text-[13px] font-semibold text-[#23282D]">{order.customer}</td>
                  <td className="px-6 py-4 text-[12px] text-[#5A6067]">{order.items}</td>
                  <td className="px-6 py-4 text-[13px] font-bold text-[#23282D]">{order.total}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${statusStyles[order.status]}`}>
                      {order.status === "PROCESSING" ? "Em separação" : "Enviado"}
                    </span>
                    {order.trackingCode && <p className="text-[11px] font-semibold text-[#5C6B4E] mt-2">{order.carrier}: {order.trackingCode}</p>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {order.status === "PROCESSING" ? (
                      <button type="button" onClick={() => openShippingModal(order)} className="inline-flex items-center gap-2 bg-[#A85A38] text-white rounded-full px-4 py-2 text-[12px] font-bold hover:bg-[#8F492D] transition-colors">
                        <svg className="w-4 h-4"><use href="#ic-box" /></svg>
                        Despachar pedido
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#5C6B4E]"><svg className="w-4 h-4"><use href="#ic-check" /></svg> Rastreio informado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {orderToShip && (
        <div className="fixed inset-0 z-50 bg-[#23282D]/45 p-5 flex items-center justify-center" role="presentation" onMouseDown={closeShippingModal}>
          <form className="w-full max-w-[460px] bg-white rounded-[20px] shadow-2xl" onSubmit={confirmShipping} onMouseDown={(event) => event.stopPropagation()}>
            <div className="p-6 border-b border-[#EFEBDD] flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#A85A38] mb-2">Expedição</p>
                <h2 className="font-jakarta text-[21px] font-extrabold text-[#263847]">Despachar pedido {orderToShip.id}</h2>
                <p className="text-[12px] text-[#5A6067] mt-2">Informe os dados fornecidos pela transportadora.</p>
              </div>
              <button type="button" onClick={closeShippingModal} title="Fechar modal" className="w-9 h-9 rounded-full text-[#5A6067] hover:bg-[#F5F3E9] text-[24px] leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-5">
              <label className="block text-[12px] font-bold text-[#354B5E]">Transportadora
                <select value={carrier} onChange={(event) => setCarrier(event.target.value)} className="mt-2 w-full border border-[#E6E1D2] rounded-[10px] px-3 py-3 bg-white text-[13px] text-[#23282D] outline-none focus:border-[#354B5E]">
                  <option>Correios</option>
                  <option>Jadlog</option>
                  <option>Loggi</option>
                  <option>Outro</option>
                </select>
              </label>
              <label className="block text-[12px] font-bold text-[#354B5E]">Código de rastreio
                <input autoFocus value={trackingCode} onChange={(event) => { setTrackingCode(event.target.value); setError(""); }} placeholder="Ex.: BR123456789X" className={`mt-2 w-full border rounded-[10px] px-3 py-3 text-[13px] text-[#23282D] outline-none ${error ? "border-[#BA1A1A] bg-[#FFF8F7]" : "border-[#E6E1D2] focus:border-[#354B5E]"}`} />
              </label>
              {error && <p role="alert" className="text-[12px] font-semibold text-[#BA1A1A]">{error}</p>}
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button type="button" onClick={closeShippingModal} className="px-5 py-2.5 rounded-full border border-[#E6E1D2] text-[12px] font-bold text-[#5A6067] hover:bg-[#F5F3E9]">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 rounded-full bg-[#354B5E] text-white text-[12px] font-bold hover:bg-[#263847]">Confirmar envio</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}