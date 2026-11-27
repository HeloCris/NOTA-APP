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

interface CatalogTabProps {
    store: Store | null;
    initialSearch?: string;
}

const statusSelectBg = {
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2393927F' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    backgroundSize: "13px",
};

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
                <div className="mb-6 bg-[#FEF0EB] border border-[#F5C9B3] rounded-[16px] p-[20px_24px] flex items-start gap-4">
                     <svg className="w-6 h-6 text-[#A24726] flex-shrink-0 mt-0.5"><use href="#ic-warning" /></svg>
                     <div>
                         <h3 className="text-[#7E4228] font-bold text-[15px] m-0 mb-1">Sua loja está inativa</h3>
                         <p className="text-[#A24726] text-[13px] m-0">Sua vitrine não está visível para os clientes e novos pedidos não podem ser feitos. Reative sua loja na aba Configurações.</p>
                     </div>
                 </div>
            )}

            <div className={!store?.is_active ? "pointer-events-none opacity-60 grayscale-[0.2]" : ""}>
                <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
                    <div>
                        <h1 className="text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em] font-jakarta">Estoque & Vendas</h1>
                        <p className="text-[13px] text-[#5A6067] m-0">
                            {isLoading
                                ? "Carregando seu estoque..."
                                : `${items.length} perfume${items.length !== 1 ? "s" : ""} cadastrado${items.length !== 1 ? "s" : ""}${lowStockCount ? ` · ${lowStockCount} com estoque baixo` : ""}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => openAddModal(null)}
                            className="font-jakarta font-bold text-[13px] rounded-full px-5 py-[11px] inline-flex items-center gap-2 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-colors cursor-pointer shadow-sm"
                        >
                            <svg className="w-[15px] h-[15px]"><use href="#ic-plus" /></svg> Adicionar Perfume
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3.5 flex-wrap mb-5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <select
                            aria-label="Filtrar por status"
                            className="appearance-none font-inter text-[12.5px] font-semibold text-[#5A6067] bg-white border border-[#E6E1D2] rounded-xl py-[9px] pl-[13px] pr-[30px] cursor-pointer outline-none focus:border-[#354B5E]"
                            style={statusSelectBg}
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="">Todos os status</option>
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                            <option value="low_stock">Estoque baixo (&lt;3)</option>
                        </select>

                        {/* Toggle de Visualização: Tabela vs Grade */}
                        <div className="inline-flex items-center bg-[#EFEBDD]/60 p-1 rounded-xl border border-[#E6E1D2]">
                            <button
                                type="button"
                                onClick={() => setViewMode("table")}
                                className={`px-3 py-1 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    viewMode === "table"
                                        ? "bg-white text-[#263847] shadow-xs"
                                        : "text-[#5A6067] hover:text-[#263847]"
                                }`}
                                title="Visualizar como Tabela"
                            >
                                <svg className="w-3.5 h-3.5">
                                    <use href="#ic-grid" />
                                </svg>
                                Tabela
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                className={`px-3 py-1 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    viewMode === "grid"
                                        ? "bg-white text-[#263847] shadow-xs"
                                        : "text-[#5A6067] hover:text-[#263847]"
                                }`}
                                title="Visualizar como Grade de Cards"
                            >
                                <svg className="w-3.5 h-3.5">
                                    <use href="#ic-flask" />
                                </svg>
                                Grade
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <select
                            aria-label="Filtrar busca por"
                            className="border border-[#E6E1D2] bg-white rounded-xl py-[9px] px-3 text-[12.5px] font-semibold text-[#5A6067] outline-none focus:border-[#354B5E] cursor-pointer"
                            value={searchFilter}
                            onChange={(event) => setSearchFilter(event.target.value as any)}
                        >
                            <option value="all">Buscar em tudo</option>
                            <option value="name">Nome do perfume</option>
                            <option value="note">Nota olfativa</option>
                            <option value="family">Caminho olfativo</option>
                        </select>
                        <label className="relative">
                            <svg className="w-4 h-4 text-[#93927F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><use href="#ic-search" /></svg>
                            <input
                                className="border border-[#E6E1D2] bg-white rounded-xl pl-9 pr-4 py-[9px] text-[12.5px] text-[#23282D] outline-none focus:border-[#354B5E] w-[220px]"
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={
                                    searchFilter === "name"
                                        ? "Nome do perfume..."
                                        : searchFilter === "note"
                                          ? "Nota (ex: Jasmim, Baunilha)..."
                                          : searchFilter === "family"
                                            ? "Caminho (ex: Floral, Cítrico)..."
                                            : "Buscar no meu estoque..."
                                }
                                type="search"
                                value={search}
                            />
                        </label>
                    </div>
                </div>

                {isLoading ? (
                    <div className="bg-white border border-[#EFEBDD] rounded-[20px] py-[50px] text-center text-[13px] text-[#5A6067]">
                        Carregando seu estoque...
                    </div>
                ) : loadError ? (
                    <div className="bg-white border border-dashed border-[#E6E1D2] rounded-[20px] py-[56px] px-[30px] text-center">
                        <h3 className="text-[18px] font-extrabold text-[#23282D] mb-2">Não foi possível carregar o estoque</h3>
                        <button
                            className="mt-4 rounded-full bg-[#354B5E] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#263847] cursor-pointer"
                            onClick={() => { setIsLoading(true); fetchItems(); }}
                            type="button"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white border border-dashed border-[#E6E1D2] rounded-[20px] py-[56px] px-[30px] text-center">
                        <div className="w-[56px] h-[56px] rounded-2xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center mx-auto mb-5">
                            <svg className="w-[26px] h-[26px]"><use href="#ic-flask" /></svg>
                        </div>
                        <h3 className="text-[18px] font-extrabold text-[#23282D] mb-2">Nenhum perfume no estoque</h3>
                        <p className="text-[13px] text-[#5A6067] max-w-[380px] mx-auto leading-[1.6]">
                            Escolha um perfume do catálogo oficial para começar a vender na sua loja.
                        </p>
                        <button
                            onClick={() => openAddModal(null)}
                            className="mt-5 font-bold text-[13px] text-white bg-[#354B5E] px-6 py-2.5 rounded-full hover:bg-[#263847] transition-colors cursor-pointer"
                        >
                            Adicionar Primeiro Perfume
                        </button>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Visualização em Grade de Cards */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {items.map((item) => {
                            const lowStock = item.stock_quantity < 3;
                            const isOut = item.stock_quantity === 0;

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white border rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200 group ${
                                        lowStock ? "border-[#E4B34B]/80 bg-[#FFFDF8]" : "border-[#E6E1D2]"
                                    }`}
                                >
                                    <div>
                                        {/* Imagem do Frasco */}
                                        <div
                                            onClick={() => setDetailsItem(item)}
                                            className="w-full h-44 rounded-xl bg-[#F5F3E9] overflow-hidden flex items-center justify-center relative border border-[#EFEBDD] mb-3.5 cursor-pointer"
                                            title="Clique para ver detalhes do perfume"
                                        >
                                            {item.product.image_url ? (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <svg className="w-10 h-10 text-[#93927F]">
                                                    <use href="#ic-flask" />
                                                </svg>
                                            )}

                                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                                <span className="bg-[#354B5E] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-md shadow-xs">
                                                    {item.volume_ml}ml
                                                </span>
                                                {item.volume_ml <= 15 && (
                                                    <span className="bg-[#FFF4E5] text-[#8A5B22] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#F0DDC5] shadow-xs">
                                                        Decant
                                                    </span>
                                                )}
                                            </div>

                                            <div className="absolute top-2.5 right-2.5">
                                                <span
                                                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border shadow-xs ${
                                                        isOut
                                                            ? "bg-[#FEF0EB] text-[#A24726] border-[#F5C9B3]"
                                                            : lowStock
                                                              ? "bg-[#FFF8E6] text-[#8A5B22] border-[#F0DDC5]"
                                                              : "bg-[#EDF0E7] text-[#454F3A] border-[#D5DCCC]"
                                                    }`}
                                                >
                                                    {isOut
                                                        ? "Esgotado"
                                                        : lowStock
                                                          ? `Estoque Baixo (${item.stock_quantity})`
                                                          : `${item.stock_quantity} un.`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Informações */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <span className="block text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#93927F] truncate">
                                                    {item.product.brand}
                                                </span>
                                                <h3
                                                    onClick={() => setDetailsItem(item)}
                                                    className="text-[16px] font-extrabold text-[#263847] font-jakarta leading-snug mt-0.5 truncate cursor-pointer hover:text-[#354B5E] transition-colors"
                                                >
                                                    {item.product.name}
                                                </h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setDetailsItem(item)}
                                                title="Ver detalhes do perfume"
                                                aria-label={`Ver detalhes de ${item.product.name}`}
                                                className="w-7 h-7 rounded-lg text-[#5A6067] hover:text-[#354B5E] hover:bg-[#E9EDF0] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                                            >
                                                <svg className="w-4 h-4">
                                                    <use href="#ic-eye-kpi" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Preço e Disponibilidade */}
                                        <div className="mt-3 pt-3 border-t border-[#EFEBDD] flex items-center justify-between">
                                            <div>
                                                <span className="block text-[10.5px] font-semibold text-[#93927F] uppercase tracking-wider">
                                                    Preço
                                                </span>
                                                {item.promotional_price ? (
                                                    <div className="leading-tight mt-0.5">
                                                        <span className="text-[11px] text-[#93927F] line-through block">
                                                            {formatBRL(item.price)}
                                                        </span>
                                                        <span className="text-[15px] font-extrabold text-[#3A7A3F]">
                                                            {formatBRL(item.promotional_price)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[15px] font-extrabold text-[#263847] mt-0.5 block">
                                                        {formatBRL(item.price)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <span className="text-[10.5px] font-semibold text-[#93927F] uppercase tracking-wider mb-1">
                                                    {item.is_available ? "Ativo" : "Pausado"}
                                                </span>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={item.is_available}
                                                    aria-label={item.is_available ? "Perfume ativo" : "Perfume inativo"}
                                                    onClick={() => handleToggleAvailability(item)}
                                                    className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                                                        item.is_available ? "bg-[#354B5E]" : "bg-[#D8D2C2]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                                            item.is_available ? "translate-x-4" : "translate-x-0"
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="mt-4 pt-3 border-t border-[#EFEBDD] flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDetailsItem(item)}
                                            className="flex-1 py-1.5 px-3 rounded-lg bg-[#F5F3E9] hover:bg-[#E9EDF0] text-[#354B5E] text-[12px] font-bold transition-colors cursor-pointer text-center"
                                        >
                                            Ver Detalhes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item)}
                                            title="Remover perfume do estoque"
                                            className="w-8 h-8 rounded-lg text-[#93927F] hover:bg-[#FBEEE7] hover:text-[#A24726] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4">
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
