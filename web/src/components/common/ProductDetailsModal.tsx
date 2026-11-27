import { useEffect, useState } from "react";

import { apiClient } from "../../lib/apiClient";
import type { Product } from "../../types/catalog";
import type { StoreProduct } from "../../types/inventory";

interface ProductDetailsModalProps {
  product: Partial<Product> & {
    brand?: any;
    top_notes?: string[];
    heart_notes?: string[];
    base_notes?: string[];
  };
  storeProduct?: StoreProduct | null;
  onClose: () => void;
}

const formatBRL = (value: string | number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));

export function ProductDetailsModal({
  product: initialProduct,
  storeProduct,
  onClose,
}: ProductDetailsModalProps) {
  const [product, setProduct] = useState<Partial<Product>>(initialProduct);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setProduct(initialProduct);

    // Se faltarem dados detalhados (ex: vindo de StoreProduct resumido), busca do catálogo mestre
    if (
      initialProduct.id &&
      (!initialProduct.ean ||
        !initialProduct.olfactory_family ||
        !initialProduct.top_notes?.length)
    ) {
      setIsLoading(true);
      apiClient
        .get<Product>(`/products/${initialProduct.id}/`)
        .then((response) => {
          setProduct((prev) => ({
            ...prev,
            ...response.data,
          }));
        })
        .catch((error) => {
          console.error("Erro ao carregar detalhes completos do produto:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialProduct]);

  const brandName =
    typeof product.brand === "object"
      ? product.brand?.name ?? ""
      : typeof product.brand === "string"
        ? product.brand
        : "";

  const topNotes = product.top_notes ?? [];
  const heartNotes = product.heart_notes ?? [];
  const baseNotes = product.base_notes ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-details-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FCFBF7] rounded-[24px] border border-[#E6E1D2] shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <header className="relative p-6 border-b border-[#EFEBDD] bg-white flex items-start gap-4">
          <div className="w-[74px] h-[98px] rounded-xl bg-[#F5F3E9] border border-[#E6E1D2] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name ?? "Perfume"}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-8 h-8 text-[#93927F]">
                <use href="#ic-flask" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-8">
            {brandName && (
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#93927F]">
                {brandName}
              </span>
            )}
            <h2
              id="product-details-modal-title"
              className="text-[20px] font-extrabold text-[#263847] leading-tight font-jakarta mt-0.5"
            >
              {product.name}
            </h2>

            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {product.concentration && (
                <span className="bg-[#354B5E]/10 text-[#354B5E] text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-[#354B5E]/20">
                  {product.concentration}
                </span>
              )}
              {product.gender && (
                <span className="bg-[#F5F3E9] text-[#23282D] text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-[#E6E1D2]">
                  {product.gender}
                </span>
              )}
              {product.olfactory_family && (
                <span className="bg-[#FAF7EE] text-[#5A6067] text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-[#E6E1D2]">
                  {product.olfactory_family}
                </span>
              )}
              {typeof product.is_approved === "boolean" && (
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    product.is_approved
                      ? "bg-[#EDF0E7] text-[#454F3A] border-[#D5DCCC]"
                      : "bg-[#FFF4E5] text-[#8A5B22] border-[#F0DDC5]"
                  }`}
                >
                  {product.is_approved ? "Aprovado" : "Em Análise"}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="Fechar detalhes"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#E6E1D2] flex items-center justify-center text-[#5A6067] hover:bg-[#F5F3E9] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </header>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 font-inter">
          {/* Dados Regulatórios / Ficha Técnica */}
          <section>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#93927F] mb-2.5">
              Identificação & Registros
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white border border-[#E6E1D2] rounded-xl p-3">
                <span className="block text-[11px] text-[#93927F] font-semibold">
                  EAN / Código de Barras
                </span>
                <span className="block text-[13px] font-bold text-[#263847] font-mono mt-0.5">
                  {product.ean || "Não informado"}
                </span>
              </div>
              <div className="bg-white border border-[#E6E1D2] rounded-xl p-3">
                <span className="block text-[11px] text-[#93927F] font-semibold">
                  Registro / Processo ANVISA
                </span>
                <span className="block text-[13px] font-bold text-[#263847] font-mono mt-0.5">
                  {product.anvisa_code || "Não informado"}
                </span>
              </div>
            </div>
          </section>

          {/* Dados de Estoque da Loja (se for StoreProduct) */}
          {storeProduct && (
            <section>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#93927F] mb-2.5">
                Dados no Estoque da Loja
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-[#E6E1D2] rounded-xl p-3">
                  <span className="block text-[11px] text-[#93927F] font-semibold">
                    Volume
                  </span>
                  <span className="block text-[14px] font-bold text-[#263847] mt-0.5">
                    {storeProduct.volume_ml}ml{" "}
                    {storeProduct.volume_ml <= 15 ? "(Decant)" : "(Frasco)"}
                  </span>
                </div>

                <div className="bg-white border border-[#E6E1D2] rounded-xl p-3">
                  <span className="block text-[11px] text-[#93927F] font-semibold">
                    Preço
                  </span>
                  <div className="mt-0.5">
                    {storeProduct.promotional_price ? (
                      <div className="leading-tight">
                        <span className="text-[11px] text-[#93927F] line-through block">
                          {formatBRL(storeProduct.price)}
                        </span>
                        <span className="text-[14px] font-bold text-[#3A7A3F]">
                          {formatBRL(storeProduct.promotional_price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[14px] font-bold text-[#263847]">
                        {formatBRL(storeProduct.price)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#E6E1D2] rounded-xl p-3">
                  <span className="block text-[11px] text-[#93927F] font-semibold">
                    Estoque
                  </span>
                  <span className="block text-[14px] font-bold text-[#263847] mt-0.5">
                    {storeProduct.stock_quantity} unidades
                  </span>
                </div>

                <div className="bg-white border border-[#E6E1D2] rounded-xl p-3">
                  <span className="block text-[11px] text-[#93927F] font-semibold">
                    Visibilidade
                  </span>
                  <span
                    className={`inline-block text-[12px] font-bold mt-1 px-2 py-0.5 rounded-full ${
                      storeProduct.is_available
                        ? "bg-[#EDF0E7] text-[#454F3A]"
                        : "bg-[#FDF4F0] text-[#7E2D11]"
                    }`}
                  >
                    {storeProduct.is_available ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Pirâmide Olfativa */}
          <section>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#93927F] mb-2.5">
              Pirâmide Olfativa
            </h3>
            <div className="space-y-2.5">
              <div className="border border-[#D5E1CB] bg-[#EEF5E9] rounded-xl p-3.5">
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#3A5C30] mb-1.5">
                  Notas de Saída (Topo)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {topNotes.length > 0 ? (
                    topNotes.map((note) => (
                      <span
                        key={note}
                        className="rounded-full bg-white/90 border border-[#D5E1CB] px-3 py-1 text-[11.5px] font-bold text-[#354B5E]"
                      >
                        {note}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#5A6067] italic">
                      Nenhuma nota de saída informada.
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-[#E7D1DC] bg-[#F9F0F4] rounded-xl p-3.5">
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#8C3D66] mb-1.5">
                  Notas de Corpo (Coração)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {heartNotes.length > 0 ? (
                    heartNotes.map((note) => (
                      <span
                        key={note}
                        className="rounded-full bg-white/90 border border-[#E7D1DC] px-3 py-1 text-[11.5px] font-bold text-[#354B5E]"
                      >
                        {note}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#5A6067] italic">
                      Nenhuma nota de corpo informada.
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-[#E8D9BE] bg-[#F8F2E5] rounded-xl p-3.5">
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#7E5723] mb-1.5">
                  Notas de Fundo (Base)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {baseNotes.length > 0 ? (
                    baseNotes.map((note) => (
                      <span
                        key={note}
                        className="rounded-full bg-white/90 border border-[#E8D9BE] px-3 py-1 text-[11.5px] font-bold text-[#354B5E]"
                      >
                        {note}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#5A6067] italic">
                      Nenhuma nota de fundo informada.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Descrição */}
          {product.description && (
            <section>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#93927F] mb-2">
                Descrição & Conceito Olfativo
              </h3>
              <p className="text-[13px] text-[#5A6067] leading-[1.6] bg-white border border-[#E6E1D2] rounded-xl p-4 whitespace-pre-wrap">
                {product.description}
              </p>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-[#EFEBDD] bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#354B5E] text-white text-[13px] font-bold hover:bg-[#263847] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
