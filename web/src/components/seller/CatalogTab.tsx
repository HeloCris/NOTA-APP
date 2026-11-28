import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { inventoryService } from "../../services/inventoryService";
import type { Store } from "../../types/store";
import type { Product } from "../../types/catalog";
import type { StoreProduct, StoreProductPayload } from "../../types/inventory";
import { AddProductModal } from "./AddProductModal";
import { InventoryTable } from "./InventoryTable";
import { ProductDetailsModal } from "../common/ProductDetailsModal";
import { CatalogPickerModal } from "./CatalogPickerModal";
import { CustomSelect } from "../common/CustomSelect";

interface CatalogTabProps {
    store: Store | null;
    initialSearch?: string;
}

const STATUS_OPTIONS = [
    { value: "", label: "Status: Todos" },
    { value: "active", label: "Ativos" },
    { value: "inactive", label: "Inativos" },
    { value: "low_stock", label: "Estoque baixo (<3)" },
    { value: "low_stock", label: "Estoque baixo" },
];

const SEARCH_FILTER_OPTIONS = [
    { value: "all", label: "Tudo" },
    { value: "name", label: "Nome" },
    { value: "note", label: "Nota" },
    { value: "family", label: "Família" },
];

const formatBRL = (value: string): string =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value));

export function CatalogTab({ store, initialSearch = "" }: CatalogTabProps) {
    const [detailsItem, setDetailsItem] = useState<StoreProduct | null>(null);
    const [items, setItems] = useState<StoreProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState(initialSearch);
    const [searchFilter, setSearchFilter] = useState<"all" | "name" | "note" | "family">("all");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
    const [addInitialProduct, setAddInitialProduct] = useState<Product | null>(null);

    const fetchItems = useCallback(async () => {
        try {
            const params: { search?: string; search_type?: string; status?: string } = {};
            if (status) params.status = status;
            if (search.trim()) {
                params.search = search.trim();
                params.search_type = searchFilter;
            }
            const result = await inventoryService.listStoreProducts(params);
            setItems(result);
            setLoadError(false);
        } catch {
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    }, [status, search, searchFilter]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchItems();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [fetchItems]);

    useEffect(() => {
        const refreshOnFocus = () => {
            if (document.visibilityState === "visible") {
                void fetchItems();
            }
        };
        document.addEventListener("visibilitychange", refreshOnFocus);
        const interval = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void fetchItems();
            }
        }, 30000);
        return () => {
            document.removeEventListener("visibilitychange", refreshOnFocus);
            window.clearInterval(interval);
        };
    }, [fetchItems]);

    const handleToggleAvailability = (item: StoreProduct) => {
        const next = !item.is_available;
        setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, is_available: next } : i)),
        );

        inventoryService
            .updateStoreProduct(item.id, { is_available: next })
            .then(() => {
                toast.success(next ? "Perfume ativado." : "Perfume desativado.");
            })
            .catch(() => {
                setItems((prev) =>
                    prev.map((i) =>
                        i.id === item.id ? { ...i, is_available: item.is_available } : i,
                    ),
                );
                toast.error("Não foi possível alterar a disponibilidade do perfume.");
            });
    };

    const handleUpdate = (item: StoreProduct, payload: Partial<StoreProductPayload>) => {
        setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, ...payload } : i)),
        );

        inventoryService
            .updateStoreProduct(item.id, payload)
            .then((updated) => {
                setItems((prev) =>
                    prev.map((i) => (i.id === item.id ? updated : i)),
                );
                toast.success("Perfume atualizado.");
            })
            .catch(() => {
                fetchItems();
                toast.error("Não foi possível salvar as alterações.");
            });
    };

    const handleDelete = (item: StoreProduct) => {
        if (!window.confirm(`Remover "${item.product.name}" (${item.volume_ml}ml) do seu estoque?`)) {
            return;
        }

        setItems((prev) => prev.filter((i) => i.id !== item.id));

        inventoryService.deleteStoreProduct(item.id).catch(() => {
            fetchItems();
            toast.error("Não foi possível remover o perfume.");
        });
    };

    const handleCreated = (created: StoreProduct) => {
        setItems((prev) => [created, ...prev]);
    };

    const openAddModal = (product?: Product | null) => {
        if (product) {
            setAddInitialProduct(product);
            setIsAddModalOpen(true);
        } else {
            setIsCatalogPickerOpen(true);
        }
    };

    const lowStockCount = items.filter((item) => item.stock_quantity < 3).length;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!store?.is_active && (
                <div className="mb-4 bg-[#FEF0EB] border border-[#F5C9B3] rounded-xl p-3.5 flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#A24726] flex-shrink-0 mt-0.5"><use href="#ic-warning" /></svg>
                    <div>
                        <h3 className="text-[#7E4228] font-bold text-[14px] m-0 mb-0.5">Sua loja está inativa</h3>
                        <p className="text-[#A24726] text-[12.5px] m-0">Sua vitrine não está visível para os clientes. Reative sua loja na aba Configurações.</p>
                    </div>
                </div>
            )}

            <div className={!store?.is_active ? "pointer-events-none opacity-60 grayscale-[0.2]" : ""}>
                {/* Header unificado e compacto */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-[21px] font-extrabold text-[#263847] tracking-tight font-jakarta m-0">
                            Estoque & Vendas
                        </h1>
                        <span className="text-[11.5px] font-bold text-[#5A6067] bg-[#EFEBDD]/70 px-2.5 py-0.5 rounded-full border border-[#E6E1D2]">
                            {isLoading
                                ? "Carregando..."
                                : `${items.length} perfume${items.length !== 1 ? "s" : ""}${lowStockCount ? ` · ${lowStockCount} estoque baixo` : ""}`}
                        </span>
                    </div>
                    <button
                        onClick={() => openAddModal(null)}
                        className="font-jakarta font-bold text-[12.5px] rounded-xl px-4 py-2 inline-flex items-center gap-2 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-all cursor-pointer shadow-xs self-start sm:self-auto"
                    >
                        <svg className="w-3.5 h-3.5"><use href="#ic-plus" /></svg> Adicionar Perfume
                    </button>
                </div>

                {/* Toolbar unificada, compacta e conectada */}
                <div className="bg-white border border-[#E6E1D2] rounded-xl p-2 mb-3.5 shadow-xs flex items-center justify-between gap-2.5 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Toggle de Visualização: Lista vs Grade com ícones corretos */}
                        <div className="inline-flex items-center bg-[#F5F3E9] p-0.5 rounded-lg border border-[#E6E1D2]">
                            <button
                                type="button"
                                onClick={() => setViewMode("table")}
                                className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === "table"
                                        ? "bg-white text-[#263847] shadow-xs"
                                        : "text-[#5A6067] hover:text-[#263847]"
                                    }`}
                                title="Visualizar como Lista"
                            >
                                {/* Ícone de Lista: 3 linhas horizontais */}
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                </svg>
                                Lista
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === "grid"
                                        ? "bg-white text-[#263847] shadow-xs"
                                        : "text-[#5A6067] hover:text-[#263847]"
                                    }`}
                                title="Visualizar como Grade"
                            >
                                {/* Ícone de Grade: 4 quadrados */}
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                </svg>
                                Grade
                            </button>
                        </div>

                        {/* Status Select Personalizado e Arredondado */}
                        <CustomSelect
                            ariaLabel="Filtrar por status"
                            value={status}
                            onChange={setStatus}
                            options={STATUS_OPTIONS}
                        />
                    </div>

                    {/* Campo de Busca Unificado com Dropdown de Filtro Integrado */}
                    <div className="flex items-center flex-1 max-w-sm sm:max-w-md bg-[#FAF9F5] border border-[#E6E1D2] rounded-lg focus-within:border-[#354B5E] focus-within:bg-white transition-all ml-auto">
                        <CustomSelect
                            ariaLabel="Filtrar busca por"
                            value={searchFilter}
                            onChange={(val) => setSearchFilter(val as any)}
                            options={SEARCH_FILTER_OPTIONS}
                            variant="attached"
                        />
                        <div className="relative flex-1 flex items-center">
                            <svg className="w-3.5 h-3.5 text-[#93927F] absolute left-2.5 pointer-events-none">
                                <use href="#ic-search" />
                            </svg>
                            <input
                                className="w-full bg-transparent pl-8 pr-2.5 py-1.5 text-[12px] text-[#23282D] outline-none placeholder:text-[#93927F]"
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={
                                    searchFilter === "name"
                                        ? "Buscar por nome..."
                                        : searchFilter === "note"
                                            ? "Buscar por nota (ex: Jasmim)..."
                                            : searchFilter === "family"
                                                ? "Buscar por caminho (ex: Floral)..."
                                                : "Buscar no estoque por perfume, nota..."
                                }
                                type="search"
                                value={search}
                            />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="bg-white border border-[#EFEBDD] rounded-xl py-12 text-center text-[13px] text-[#5A6067]">
                        Carregando seu estoque...
                    </div>
                ) : loadError ? (
                    <div className="bg-white border border-dashed border-[#E6E1D2] rounded-xl py-12 px-6 text-center">
                        <h3 className="text-[16px] font-extrabold text-[#23282D] mb-1">Não foi possível carregar o estoque</h3>
                        <button
                            className="mt-3 rounded-lg bg-[#354B5E] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#263847] cursor-pointer"
                            onClick={() => { setIsLoading(true); fetchItems(); }}
                            type="button"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white border border-dashed border-[#E6E1D2] rounded-xl py-12 px-6 text-center">
                        <div className="w-11 h-11 rounded-xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5"><use href="#ic-flask" /></svg>
                        </div>
                        <h3 className="text-[16px] font-extrabold text-[#23282D] mb-1">Nenhum perfume no estoque</h3>
                        <p className="text-[12.5px] text-[#5A6067] max-w-sm mx-auto leading-relaxed">
                            Escolha um perfume do catálogo master para começar a vender na sua loja.
                        </p>
                        <button
                            onClick={() => openAddModal(null)}
                            className="mt-4 font-bold text-[12.5px] text-white bg-[#354B5E] px-5 py-2 rounded-lg hover:bg-[#263847] transition-colors cursor-pointer"
                        >
                            Adicionar Primeiro Perfume
                        </button>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Visualização em Grade Compacta - Aproveitamento Inteligente do Espaço */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {items.map((item) => {
                            const lowStock = item.stock_quantity < 3;
                            const isOut = item.stock_quantity === 0;

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white border rounded-xl p-2.5 flex flex-col justify-between hover:shadow-xs transition-all duration-150 group ${lowStock ? "border-[#E4B34B]/80 bg-[#FFFDF8]" : "border-[#E6E1D2]"
                                        }`}
                                >
                                    <div>
                                        {/* Imagem do Frasco Compacta */}
                                        <div
                                            onClick={() => setDetailsItem(item)}
                                            className="w-full h-28 rounded-lg bg-[#F5F3E9] overflow-hidden flex items-center justify-center relative border border-[#EFEBDD] mb-2 cursor-pointer"
                                            title="Clique para ver detalhes do perfume"
                                        >
                                            {item.product.image_url ? (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                            ) : (
                                                <svg className="w-8 h-8 text-[#93927F]">
                                                    <use href="#ic-flask" />
                                                </svg>
                                            )}

                                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                                                <span className="bg-[#354B5E] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                                                    {item.volume_ml}ml
                                                </span>
                                                {item.volume_ml <= 15 && (
                                                    <span className="bg-[#FFF4E5] text-[#8A5B22] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#F0DDC5] shadow-xs">
                                                        Decant
                                                    </span>
                                                )}
                                            </div>

                                            <div className="absolute top-1.5 right-1.5">
                                                <span
                                                    className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border shadow-xs ${isOut
                                                            ? "bg-[#FEF0EB] text-[#A24726] border-[#F5C9B3]"
                                                            : lowStock
                                                                ? "bg-[#FFF8E6] text-[#8A5B22] border-[#F0DDC5]"
                                                                : "bg-[#EDF0E7] text-[#454F3A] border-[#D5DCCC]"
                                                        }`}
                                                >
                                                    {isOut
                                                        ? "Esgotado"
                                                        : lowStock
                                                            ? `Estoque (${item.stock_quantity})`
                                                            : `${item.stock_quantity} un.`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Informações Compactas */}
                                        <div className="mb-2">
                                            <span className="block text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#93927F] truncate">
                                                {item.product.brand}
                                            </span>
                                            <div className="flex items-start justify-between gap-1 mt-0.5">
                                                <h3
                                                    onClick={() => setDetailsItem(item)}
                                                    className="text-[13.5px] font-extrabold text-[#263847] font-jakarta leading-tight truncate cursor-pointer hover:text-[#354B5E] transition-colors flex-1"
                                                    title={item.product.name}
                                                >
                                                    {item.product.name}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailsItem(item)}
                                                    title="Ver detalhes do perfume"
                                                    aria-label={`Ver detalhes de ${item.product.name}`}
                                                    className="w-6 h-6 rounded text-[#5A6067] hover:text-[#354B5E] hover:bg-[#E9EDF0] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                                                >
                                                    <svg className="w-3.5 h-3.5">
                                                        <use href="#ic-eye-kpi" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Preço e Disponibilidade Compactos */}
                                        <div className="pt-2 border-t border-[#EFEBDD] flex items-center justify-between">
                                            <div>
                                                {item.promotional_price ? (
                                                    <div className="leading-tight">
                                                        <span className="text-[10px] text-[#93927F] line-through block">
                                                            {formatBRL(item.price)}
                                                        </span>
                                                        <span className="text-[13.5px] font-extrabold text-[#3A7A3F]">
                                                            {formatBRL(item.promotional_price)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[13.5px] font-extrabold text-[#263847] block">
                                                        {formatBRL(item.price)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={item.is_available}
                                                    aria-label={item.is_available ? "Perfume ativo" : "Perfume inativo"}
                                                    onClick={() => handleToggleAvailability(item)}
                                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${item.is_available ? "bg-[#354B5E]" : "bg-[#D8D2C2]"
                                                        }`}
                                                >
                                                    <div
                                                        className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform ${item.is_available ? "translate-x-3.5" : "translate-x-0"
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ações Compactas */}
                                    <div className="mt-2.5 pt-2 border-t border-[#EFEBDD] flex items-center justify-between gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setDetailsItem(item)}
                                            className="flex-1 py-1 px-2 rounded bg-[#F5F3E9] hover:bg-[#E9EDF0] text-[#354B5E] text-[11px] font-bold transition-colors cursor-pointer text-center"
                                        >
                                            Detalhes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item)}
                                            title="Remover perfume do estoque"
                                            className="w-6 h-6 rounded text-[#93927F] hover:bg-[#FBEEE7] hover:text-[#A24726] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                                        >
                                            <svg className="w-3.5 h-3.5">
                                                <use href="#ic-trash" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <InventoryTable
                        items={items}
                        onDelete={handleDelete}
                        onToggleAvailability={handleToggleAvailability}
                        onUpdate={handleUpdate}
                        onViewDetails={(item) => setDetailsItem(item)}
                    />
                )}
            </div>

            {isCatalogPickerOpen && (
                <CatalogPickerModal
                    onClose={() => setIsCatalogPickerOpen(false)}
                    onSelectProduct={(product) => {
                        setIsCatalogPickerOpen(false);
                        setAddInitialProduct(product);
                        setIsAddModalOpen(true);
                    }}
                />
            )}

            {isAddModalOpen ? (
                <AddProductModal
                    initialProduct={addInitialProduct}
                    onClose={() => setIsAddModalOpen(false)}
                    onCreated={handleCreated}
                />
            ) : null}

            {detailsItem ? (
                <ProductDetailsModal
                    product={detailsItem.product as any}
                    storeProduct={detailsItem}
                    onClose={() => setDetailsItem(null)}
                />
            ) : null}
        </div>
    );
}
