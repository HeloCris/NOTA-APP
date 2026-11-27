import { useCallback, useEffect, useState } from "react";
import { catalogService } from "../../services/catalogService";
import type { Product } from "../../types/catalog";
import { ProductDetailsModal } from "../common/ProductDetailsModal";

interface CatalogPickerModalProps {
  onSelectProduct: (product: Product) => void;
  onClose: () => void;
}

const FAMILIES = [
  "Todas",
  "Floral",
  "Amadeirado",
  "Oriental",
  "Cítrico",
  "Gourmand",
  "Fougère",
  "Aquático",
];

export function CatalogPickerModal({
  onSelectProduct,
  onClose,
}: CatalogPickerModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("Todas");
  const [isLoading, setIsLoading] = useState(true);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (selectedFamily !== "Todas") {
        params.family = selectedFamily;
      }
      const results = await catalogService.searchProducts(
        search.trim() || undefined,
        params,
      );
      setProducts(results);
    } catch (error) {
      console.error("Erro ao carregar catálogo para seleção:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedFamily]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCatalog();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [fetchCatalog]);

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-picker-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-5xl bg-[#FCFBF7] rounded-[24px] border border-[#E6E1D2] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-4"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <header className="p-6 border-b border-[#EFEBDD] bg-white flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#93927F]">
                Catálogo Master NŌTA
              </span>
              <h2
                id="catalog-picker-title"
                className="text-[22px] font-extrabold text-[#263847] font-jakarta leading-tight mt-0.5"
              >
                Adicionar Perfume ao Estoque
              </h2>
              <p className="text-[13px] text-[#5A6067] mt-1">
                Escolha uma fragrância aprovada do catálogo para definir volumetria,
                preço e quantidade na sua loja.
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar catálogo"
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-[#E6E1D2] flex items-center justify-center text-[#5A6067] hover:bg-[#F5F3E9] transition-colors cursor-pointer flex-shrink-0"
            >
              ✕
            </button>
          </header>

          {/* Toolbar: Busca e Filtros */}
          <div className="p-5 border-b border-[#EFEBDD] bg-[#FDFCF9] space-y-3">
            <div className="relative">
              <svg className="w-4 h-4 text-[#93927F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <use href="#ic-search" />
              </svg>
              <input
                type="search"
                aria-label="Buscar perfume no catálogo"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome do perfume, marca ou nota olfativa..."
                className="w-full bg-white border border-[#E6E1D2] rounded-xl pl-11 pr-4 py-2.5 text-[13px] text-[#263847] placeholder-[#93927F] outline-none focus:border-[#354B5E] shadow-sm transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-[#93927F] uppercase tracking-wider mr-1 whitespace-nowrap">
                Família:
              </span>
              {FAMILIES.map((family) => {
                const isSelected = selectedFamily === family;
                return (
                  <button
                    key={family}
                    type="button"
                    onClick={() => setSelectedFamily(family)}
                    className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#354B5E] text-white shadow-sm"
                        : "bg-white text-[#5A6067] border border-[#E6E1D2] hover:border-[#354B5E] hover:text-[#263847]"
                    }`}
                  >
                    {family}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grade de Produtos */}
          <div className="p-6 overflow-y-auto flex-1 font-inter">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <span className="w-8 h-8 border-4 border-[#354B5E]/20 border-t-[#354B5E] rounded-full animate-spin mb-3"></span>
                <p className="text-[13px] text-[#5A6067]">
                  Buscando perfumes no catálogo...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7">
                    <use href="#ic-flask" />
                  </svg>
                </div>
                <h3 className="text-[17px] font-extrabold text-[#263847] mb-1.5">
                  Nenhum perfume encontrado
                </h3>
                <p className="text-[13px] text-[#5A6067] leading-relaxed">
                  Tente ajustar a busca ou escolher outra família olfativa para
                  encontrar os perfumes cadastrados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {products.map((p) => {
                  const brandName =
                    typeof p.brand === "object"
                      ? p.brand?.name ?? ""
                      : p.brand || "";
                  const allNotes = [
                    ...(p.top_notes ?? []),
                    ...(p.heart_notes ?? []),
                    ...(p.base_notes ?? []),
                  ];

                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-[#E6E1D2] rounded-xl p-2.5 flex flex-col justify-between hover:border-[#354B5E] hover:shadow-xs transition-all duration-150 group"
                    >
                      <div>
                        {/* Imagem do Frasco Compacta */}
                        <div
                          onClick={() => setPreviewProduct(p)}
                          className="w-full h-28 rounded-lg bg-[#F5F3E9] overflow-hidden flex items-center justify-center relative border border-[#EFEBDD] mb-2 cursor-pointer"
                          title="Clique para ver detalhes do perfume"
                        >
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <svg className="w-8 h-8 text-[#93927F]">
                              <use href="#ic-flask" />
                            </svg>
                          )}

                          <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5 items-end">
                            {p.olfactory_family && (
                              <span className="bg-white/95 backdrop-blur-sm text-[#263847] text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-[#E6E1D2] shadow-xs">
                                {p.olfactory_family}
                              </span>
                            )}
                            {p.concentration && (
                              <span className="bg-[#354B5E]/90 text-white text-[9px] font-extrabold px-1 py-0.5 rounded shadow-xs">
                                {p.concentration}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Informações Compactas */}
                        <div className="mb-1.5">
                          <span className="block text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#93927F] truncate">
                            {brandName}
                          </span>
                          <div className="flex items-start justify-between gap-1 mt-0.5">
                            <h3 className="text-[13.5px] font-extrabold text-[#263847] font-jakarta leading-tight truncate flex-1" title={p.name}>
                              {p.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => setPreviewProduct(p)}
                              title="Ver ficha técnica completa"
                              aria-label={`Ver detalhes de ${p.name}`}
                              className="w-6 h-6 rounded text-[#5A6067] hover:text-[#354B5E] hover:bg-[#E9EDF0] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                            >
                              <svg className="w-3.5 h-3.5">
                                <use href="#ic-eye-kpi" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Notas em Chips Compactas */}
                        {allNotes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {allNotes.slice(0, 2).map((note) => (
                              <span
                                key={note}
                                className="bg-[#F8F6F0] text-[#5A6067] text-[9.5px] font-medium px-1.5 py-0.5 rounded border border-[#EFEBDD] truncate max-w-[85px]"
                                title={note}
                              >
                                {note}
                              </span>
                            ))}
                            {allNotes.length > 2 && (
                              <span className="text-[9px] text-[#93927F] font-bold self-center">
                                +{allNotes.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Botão de Adição Compacto */}
                      <button
                        type="button"
                        onClick={() => onSelectProduct(p)}
                        className="mt-2 w-full py-1.5 px-3 rounded-lg bg-[#354B5E] text-white hover:bg-[#263847] font-jakarta font-bold text-[11.5px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                      >
                        <svg className="w-3 h-3">
                          <use href="#ic-plus" />
                        </svg>
                        Ofertar no meu estoque
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="p-4 border-t border-[#EFEBDD] bg-white flex items-center justify-between text-[12px] text-[#93927F]">
            <span>
              {products.length} perfume{products.length === 1 ? "" : "s"}{" "}
              disponíveis para oferta
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-[#E6E1D2] hover:bg-[#F5F3E9] text-[#5A6067] font-semibold text-[12.5px] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </footer>
        </div>
      </div>

      {previewProduct && (
        <ProductDetailsModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}
    </>
  );
}
