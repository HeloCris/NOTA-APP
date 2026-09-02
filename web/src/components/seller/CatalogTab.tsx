import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { inventoryService } from "../../services/inventoryService";
import type { Store } from "../../types/store";
import type { Product } from "../../types/catalog";
import type { StoreProduct, StoreProductPayload } from "../../types/inventory";
import { AddProductModal } from "./AddProductModal";
import { InventoryTable } from "./InventoryTable";
import { OlfactoryPyramidModal } from "./OlfactoryPyramidModal";
import { ProductAutoComplete } from "./ProductAutoComplete";

interface CatalogTabProps {
    store: Store | null;
}

const statusSelectBg = {
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2393927F' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    backgroundSize: "13px",
};

export function CatalogTab({ store }: CatalogTabProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [items, setItems] = useState<StoreProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addInitialProduct, setAddInitialProduct] = useState<Product | null>(null);

    const fetchItems = useCallback(async () => {
        try {
            const params: { search?: string; status?: string } = {};
            if (status) params.status = status;
            if (search.trim()) params.search = search.trim();
            const result = await inventoryService.listStoreProducts(params);
            setItems(result);
            setLoadError(false);
        } catch {
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    }, [status, search]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchItems();
        }, 0);
        return () => window.clearTimeout(timer);
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
        setAddInitialProduct(product ?? null);
        setIsAddModalOpen(true);
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
                        <h1 className="text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em] font-jakarta">Meus Perfumes</h1>
                        <p className="text-[13px] text-[#5A6067] m-0">
                            {isLoading
                                ? "Carregando seu estoque..."
                                : `${items.length} perfume${items.length !== 1 ? "s" : ""} cadastrado${items.length !== 1 ? "s" : ""}${lowStockCount ? ` · ${lowStockCount} com estoque baixo` : ""}`}
                        </p>
                    </div>
                    <div className="flex gap-2.5">
                        <button
                            onClick={() => openAddModal(null)}
                            className="font-jakarta font-bold text-[13px] rounded-full px-5 py-[11px] inline-flex items-center gap-2 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-colors"
                        >
                            <svg className="w-[15px] h-[15px]"><use href="#ic-plus" /></svg> Adicionar Perfume
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3.5 flex-wrap mb-5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <ProductAutoComplete onSelect={setSelectedProduct} />
                        <select
                            className="appearance-none font-inter text-[12.5px] font-semibold text-[#5A6067] bg-white border border-[#E6E1D2] rounded-xl py-[9px] pl-[13px] pr-[30px] cursor-pointer outline-none focus:border-[#354B5E]"
                            style={statusSelectBg}
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="">Status</option>
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                            <option value="low_stock">Estoque baixo</option>
                        </select>
                    </div>
                    <label className="relative">
                        <svg className="w-4 h-4 text-[#93927F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><use href="#ic-search" /></svg>
                        <input
                            className="border border-[#E6E1D2] bg-white rounded-xl pl-9 pr-4 py-[9px] text-[12.5px] text-[#23282D] outline-none focus:border-[#354B5E] w-[220px]"
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar no meu estoque..."
                            type="search"
                            value={search}
                        />
                    </label>
                </div>

                {isLoading ? (
                    <div className="bg-white border border-[#EFEBDD] rounded-[20px] py-[50px] text-center text-[13px] text-[#5A6067]">
                        Carregando seu estoque...
                    </div>
                ) : loadError ? (
                    <div className="bg-white border border-dashed border-[#E6E1D2] rounded-[20px] py-[56px] px-[30px] text-center">
                        <h3 className="text-[18px] font-extrabold text-[#23282D] mb-2">Não foi possível carregar o estoque</h3>
                        <button
                            className="mt-4 rounded-full bg-[#354B5E] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#263847]"
                            onClick={() => { setIsLoading(true); fetchItems(); }}
                            type="button"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : (
                    <InventoryTable
                        items={items}
                        onDelete={handleDelete}
                        onToggleAvailability={handleToggleAvailability}
                        onUpdate={handleUpdate}
                    />
                )}
            </div>

            {isAddModalOpen ? (
                <AddProductModal
                    initialProduct={addInitialProduct}
                    onClose={() => setIsAddModalOpen(false)}
                    onCreated={handleCreated}
                />
            ) : null}

            {selectedProduct ? (
                <OlfactoryPyramidModal
                    onAddToStock={(product) => {
                        setSelectedProduct(null);
                        openAddModal(product);
                    }}
                    onClose={() => setSelectedProduct(null)}
                    product={selectedProduct}
                />
            ) : null}
        </div>
    );
}