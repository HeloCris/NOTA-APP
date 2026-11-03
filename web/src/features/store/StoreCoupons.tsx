import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { storeService } from "../../services/storeService";
import type { StoreCoupon, StoreCouponCreatePayload } from "../../types/store";

export function StoreCoupons() {
  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_VALUE">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const data = await storeService.getCoupons();
      setCoupons(data);
    } catch {
      toast.error("Erro ao carregar cupons da loja.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleToggleActive = async (coupon: StoreCoupon) => {
    try {
      const updated = await storeService.updateCoupon(coupon.id, {
        is_active: !coupon.is_active,
      });
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: updated.is_active } : c))
      );
      toast.success(
        updated.is_active ? `Cupom ${coupon.code} ativado!` : `Cupom ${coupon.code} pausado.`
      );
    } catch {
      toast.error("Não foi possível alterar o status do cupom.");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Informe o código do cupom.");
      return;
    }
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      toast.error("Informe um valor de desconto válido e positivo.");
      return;
    }
    if (discountType === "PERCENTAGE" && val > 100) {
      toast.error("Desconto em porcentagem não pode ser maior que 100%.");
      return;
    }

    try {
      setIsSaving(true);
      const payload: StoreCouponCreatePayload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: val,
        min_purchase_amount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : 0,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        is_active: true,
      };

      const newCoupon = await storeService.createCoupon(payload);
      setCoupons((prev) => [newCoupon, ...prev]);
      toast.success(`Cupom ${newCoupon.code} criado com sucesso!`);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.code || err?.response?.data?.error || "Erro ao criar cupom.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCode("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setMinPurchaseAmount("");
    setUsageLimit("");
    setValidUntil("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[20px] border border-[#E6E1D2] shadow-sm">
        <div>
          <h2 className="text-[20px] font-jakarta font-bold text-[#23282D]">
            Cupons de Desconto da Loja
          </h2>
          <p className="text-[13.5px] text-[#717171] mt-0.5">
            Crie códigos promocionais exclusivos para os perfumes da sua loja e fidelize seus clientes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#354B5E] text-white font-jakarta font-bold text-[14px] hover:bg-[#263847] transition-colors cursor-pointer shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Criar Novo Cupom
        </button>
      </div>

      {/* Lista de Cupons */}
      <div className="bg-white rounded-[20px] border border-[#E6E1D2] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-[#93927F] font-jakarta text-[14px]">
            Carregando cupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F3E9] rounded-full flex items-center justify-center text-[#354B5E]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="font-jakarta font-bold text-[16px] text-[#23282D]">Nenhum cupom ativo no momento</h3>
            <p className="text-[13px] text-[#717171] max-w-[380px] mx-auto mt-1">
              Crie o primeiro cupom da sua loja para atrair clientes e impulsionar suas vendas!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EFEBDD] bg-[#FAFAF8] text-[12px] font-jakarta font-semibold text-[#717171] uppercase tracking-wider">
                  <th className="py-3.5 px-6">Código</th>
                  <th className="py-3.5 px-4">Desconto</th>
                  <th className="py-3.5 px-4">Pedido Mínimo</th>
                  <th className="py-3.5 px-4">Usos / Limite</th>
                  <th className="py-3.5 px-4">Validade</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBDD] text-[13.5px]">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-[#FCFBF8] transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#354B5E] text-[14.5px]">
                      {coupon.code}
                    </td>
                    <td className="py-4 px-4 font-semibold text-[#23282D]">
                      {coupon.discount_type === "PERCENTAGE"
                        ? `${Number(coupon.discount_value).toFixed(0)}% OFF`
                        : `R$ ${Number(coupon.discount_value).toFixed(2)} OFF`}
                    </td>
                    <td className="py-4 px-4 text-[#717171]">
                      {Number(coupon.min_purchase_amount) > 0
                        ? `R$ ${Number(coupon.min_purchase_amount).toFixed(2)}`
                        : "Sem mínimo"}
                    </td>
                    <td className="py-4 px-4 text-[#717171]">
                      <span className="font-semibold text-[#23282D]">{coupon.used_count}</span>
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : " (ilimitado)"}
                    </td>
                    <td className="py-4 px-4 text-[#717171]">
                      {coupon.valid_until
                        ? new Date(coupon.valid_until).toLocaleDateString("pt-BR")
                        : "Indeterminado"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold ${
                          coupon.is_active
                            ? "bg-[#F0F5EE] text-[#3A5C30]"
                            : "bg-[#FDF4F0] text-[#7E2D11]"
                        }`}
                      >
                        {coupon.is_active ? "Ativo" : "Pausado"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(coupon)}
                        className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                          coupon.is_active
                            ? "text-[#A24726] hover:bg-[#FDF4F0]"
                            : "text-[#3A5C30] hover:bg-[#F0F5EE]"
                        }`}
                      >
                        {coupon.is_active ? "Pausar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar Cupom */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-[500px] w-full p-6 sm:p-8 shadow-xl border border-[#E6E1D2] space-y-5">
            <div className="flex items-center justify-between border-b border-[#EFEBDD] pb-4">
              <h3 className="text-[18px] font-jakarta font-bold text-[#23282D]">
                Criar Novo Cupom de Loja
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-[#93927F] hover:text-[#23282D] text-[20px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-bold text-[#23282D] mb-1">
                  Código Promocional *
                </label>
                <input
                  type="text"
                  placeholder="EX: VERAO15, BEMVINDO10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E1D2] font-mono font-bold uppercase text-[14px] focus:outline-none focus:border-[#354B5E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-bold text-[#23282D] mb-1">
                    Tipo de Desconto *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E6E1D2] text-[13.5px] focus:outline-none focus:border-[#354B5E]"
                  >
                    <option value="PERCENTAGE">Porcentagem (%)</option>
                    <option value="FIXED_VALUE">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-bold text-[#23282D] mb-1">
                    Valor do Desconto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={discountType === "PERCENTAGE" ? 100 : undefined}
                    placeholder={discountType === "PERCENTAGE" ? "15" : "30.00"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E6E1D2] text-[14px] focus:outline-none focus:border-[#354B5E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-bold text-[#23282D] mb-1">
                    Subtotal Mínimo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00 (Opcional)"
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E6E1D2] text-[14px] focus:outline-none focus:border-[#354B5E]"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-bold text-[#23282D] mb-1">
                    Limite de Usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E6E1D2] text-[14px] focus:outline-none focus:border-[#354B5E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#23282D] mb-1">
                  Data de Expiração (Opcional)
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E1D2] text-[14px] focus:outline-none focus:border-[#354B5E]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFEBDD]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-[13.5px] text-[#717171] hover:bg-[#F5F3E9] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl font-jakarta font-bold text-[14px] bg-[#354B5E] text-white hover:bg-[#263847] disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                >
                  {isSaving ? "Salvando..." : "Salvar e Ativar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
