import { useState } from "react";
import type { StoreOrder } from "../../services/storeOrderService";

interface ShippingModalProps {
  order: StoreOrder;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (carrier: string, trackingCode: string) => void;
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23282D]/45 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipping-modal-title"
        className="w-full max-w-[440px] rounded-[18px] bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A85A38]">Expedição</p>
            <h2 id="shipping-modal-title" className="font-jakarta text-[20px] font-extrabold text-[#263847]">
              Despachar Pedido #{order.id}
            </h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fechar" className="text-[22px] leading-none text-[#93927F] hover:text-[#263847]">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-[12px] font-bold text-[#5A6067]">
            Transportadora
            <input
              value={carrier}
              onChange={(event) => setCarrier(event.target.value)}
              placeholder="Correios ou Jadlog"
              className="mt-1.5 w-full rounded-[10px] border border-[#D9D5C8] px-3 py-2.5 text-[13px] font-normal text-[#23282D] outline-none focus:border-[#A85A38]"
            />
          </label>
          <label className="block text-[12px] font-bold text-[#5A6067]">
            Código de rastreio
            <input
              value={trackingCode}
              onChange={(event) => setTrackingCode(event.target.value)}
              placeholder="BR123456789X"
              className="mt-1.5 w-full rounded-[10px] border border-[#D9D5C8] px-3 py-2.5 text-[13px] font-normal uppercase tracking-[0.04em] text-[#23282D] outline-none focus:border-[#A85A38]"
            />
          </label>
          {error && <p role="alert" className="text-[12px] font-semibold text-[#BA1A1A]">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="rounded-full px-4 py-2.5 text-[12.5px] font-bold text-[#5A6067] hover:bg-[#F5F3E9]">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-full bg-[#A85A38] px-5 py-2.5 text-[12.5px] font-bold text-white hover:bg-[#873F25] disabled:opacity-60">
              {isSubmitting ? "Confirmando..." : "Confirmar Envio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
