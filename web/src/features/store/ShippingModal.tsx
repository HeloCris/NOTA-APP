import { useState } from "react";
import type { StoreOrder } from "../../services/storeOrderService";

interface ShippingModalProps {
  order: StoreOrder;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (carrier: string, trackingCode: string) => void;
}

const SUGGESTED_CARRIERS = ["Correios SEDEX", "Correios PAC", "Jadlog", "Azul Cargo", "Loggi"];

export function ShippingModal({
  order,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: ShippingModalProps) {
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [trackingCode, setTrackingCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCarrier = carrier.trim();
    const normalizedTrackingCode = trackingCode.trim();
    if (!normalizedCarrier) {
      setError("Informe a transportadora.");
      return;
    }
    if (normalizedTrackingCode.length < 6 || !/^[a-z0-9]+$/i.test(normalizedTrackingCode)) {
      setError("O código deve ter pelo menos 6 caracteres alfanuméricos.");
      return;
    }
    setError("");
    onSubmit(normalizedCarrier, normalizedTrackingCode);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#23282D]/50 backdrop-blur-[3px] p-4 animate-in fade-in duration-200"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipping-modal-title"
        className="w-full max-w-[480px] rounded-[22px] bg-white border border-[#E6E1D2] p-6 sm:p-7 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#EFEBDD] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM3 5h11v10H3V5zm11 3h4l3 4v3h-7V8z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5C6B4E]">
                Expedição & Rastreamento
              </p>
              <h2 id="shipping-modal-title" className="font-jakarta text-[20px] font-extrabold text-[#263847]">
                Despachar Pedido #{order.id}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[18px] leading-none text-[#93927F] hover:text-[#263847] hover:bg-[#F5F3E9] transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {order.customer_name && (
          <div className="mb-4 rounded-xl bg-[#FBFAF6] border border-[#EFEBDD] px-4 py-3 flex items-center justify-between text-[12.5px]">
            <div>
              <span className="text-[#93927F] block text-[11px] font-semibold uppercase tracking-wider">
                Destinatário
              </span>
              <strong className="text-[#23282D] font-jakarta">{order.customer_name}</strong>
            </div>
            {order.shipping_service && (
              <span className="px-2.5 py-1 rounded-full bg-[#E9EDF0] text-[#354B5E] font-jakarta font-bold text-[11px]">
                Frete: {order.shipping_service}
              </span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-bold text-[#23282D]">
              Transportadora
              <input
                value={carrier}
                onChange={(event) => setCarrier(event.target.value)}
                placeholder="Ex: Correios, Jadlog, Azul Cargo"
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D2] bg-[#FAF8F5] px-3.5 py-2.5 text-[13.5px] font-normal text-[#23282D] outline-none focus:border-[#354B5E] focus:bg-white transition-colors"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTED_CARRIERS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setCarrier(suggestion)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                    carrier === suggestion
                      ? "bg-[#354B5E] text-white border-[#354B5E]"
                      : "bg-[#FBFAF6] text-[#5A6067] border-[#E6E1D2] hover:border-[#354B5E]"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-[12.5px] font-bold text-[#23282D]">
            Código de rastreio
            <input
              value={trackingCode}
              onChange={(event) => setTrackingCode(event.target.value.toUpperCase())}
              placeholder="Ex: BR123456789X"
              className="mt-1.5 w-full rounded-xl border border-[#E6E1D2] bg-[#FAF8F5] px-3.5 py-2.5 text-[13.5px] font-mono font-bold uppercase tracking-[0.04em] text-[#354B5E] outline-none focus:border-[#354B5E] focus:bg-white transition-colors"
            />
          </label>

          {error && (
            <div className="rounded-xl bg-[#FDF4F0] border border-[#F0C4B0] px-3.5 py-2.5">
              <p role="alert" className="text-[12px] font-semibold text-[#BA1A1A] m-0">
                {error}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EFEBDD]">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-5 py-2.5 text-[13px] font-bold text-[#5A6067] hover:bg-[#F5F3E9] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#354B5E] px-6 py-2.5 text-[13px] font-jakarta font-bold text-white hover:bg-[#263847] disabled:opacity-60 transition-colors cursor-pointer shadow-sm"
            >
              {isSubmitting ? "Confirmando..." : "Confirmar Envio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
