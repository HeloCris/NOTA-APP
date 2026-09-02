import { useState } from "react";
import type {
  StoreProduct,
  StoreProductPayload,
} from "../../types/inventory";

interface InventoryTableProps {
  items: StoreProduct[];
  onToggleAvailability: (item: StoreProduct) => void;
  onUpdate: (
    item: StoreProduct,
    payload: Partial<StoreProductPayload>,
  ) => void;
  onDelete: (item: StoreProduct) => void;
}

interface EditDraft {
  price: string;
  promotional_price: string;
  stock_quantity: string;
}

const LOW_STOCK_THRESHOLD = 3;

const formatBRL = (value: string): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));

export function InventoryTable({
  items,
  onToggleAvailability,
  onUpdate,
  onDelete,
}: InventoryTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);

  const startEdit = (item: StoreProduct) => {
    setEditingId(item.id);
    setDraft({
      price: item.price,
      promotional_price: item.promotional_price ?? "",
      stock_quantity: String(item.stock_quantity),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = (item: StoreProduct) => {
    if (!draft) return;

    onUpdate(item, {
      price: draft.price,
      promotional_price:
        draft.promotional_price.trim() === ""
          ? null
          : draft.promotional_price,
      stock_quantity: Number(draft.stock_quantity),
    });

    cancelEdit();
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[#E6E1D2] rounded-[20px] py-[56px] px-[30px] text-center">
        <div className="w-[56px] h-[56px] rounded-2xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center mx-auto mb-5">
          <svg className="w-[26px] h-[26px]"><use href="#ic-flask" /></svg>
        </div>
        <h3 className="text-[18px] font-extrabold text-[#23282D] mb-2">Nenhum perfume no estoque ainda</h3>
        <p className="text-[13px] text-[#5A6067] max-w-[380px] mx-auto leading-[1.6]">
          Busque no catálogo oficial e adicione seu primeiro perfume com preço, volume e quantidade.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Produto</th>
              <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Volume</th>
              <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Preço</th>
              <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Estoque</th>
              <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Status</th>
              <th className="text-right text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const lowStock = item.stock_quantity < LOW_STOCK_THRESHOLD;
              const isEditing = item.id === editingId;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-[#FBFAF6] transition-colors border-b border-[#EFEBDD] last:border-0 ${
                    lowStock
                      ? "bg-[#FDF7EC] border-l-4 border-l-[#E4B34B]"
                      : ""
                  }`}
                >
                  <td className="p-[14px_22px] align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-[34px] h-[58px] flex items-center justify-center flex-shrink-0 bg-[#F5F3E9] rounded-lg">
                        <svg className="h-[48px] w-auto"><use href="#bt-libre" /></svg>
                      </div>
                      <div>
                        <div className="font-bold text-[13px] text-[#23282D]">{item.product.name}</div>
                        <div className="text-[11px] text-[#93927F]">{item.product.brand}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-[14px_22px] align-middle">
                    <span className="inline-flex items-center rounded-full bg-[#E9EDF0] text-[#354B5E] text-[11.5px] font-bold px-3 py-1">
                      {item.volume_ml}ml
                    </span>
                  </td>

                  <td className="p-[14px_22px] align-middle">
                    {isEditing ? (
                      <div className="flex flex-col gap-1.5 w-[140px]">
                        <input
                          aria-label={`Preço ${item.product.name}`}
                          className="border border-[#E6E1D2] rounded-lg px-2.5 py-1.5 text-[13px] outline-none focus:border-[#354B5E]"
                          onChange={(event) =>
                            setDraft((prev) => prev ? { ...prev, price: event.target.value } : prev)
                          }
                          value={draft?.price ?? ""}
                        />
                        <input
                          aria-label={`Preço promocional ${item.product.name}`}
                          className="border border-[#E6E1D2] rounded-lg px-2.5 py-1.5 text-[13px] outline-none focus:border-[#354B5E]"
                          onChange={(event) =>
                            setDraft((prev) => prev ? { ...prev, promotional_price: event.target.value } : prev)
                          }
                          placeholder="Promo (opcional)"
                          value={draft?.promotional_price ?? ""}
                        />
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        {item.promotional_price ? (
                          <>
                            <span className="text-[12px] text-[#93927F] line-through">
                              {formatBRL(item.price)}
                            </span>
                            <span className="text-[13px] font-bold text-[#3A7A3F]">
                              {formatBRL(item.promotional_price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-[13px] font-semibold">{formatBRL(item.price)}</span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="p-[14px_22px] align-middle">
                    {isEditing ? (
                      <input
                        aria-label={`Estoque ${item.product.name}`}
                        className="border border-[#E6E1D2] rounded-lg px-2.5 py-1.5 text-[13px] w-[80px] outline-none focus:border-[#354B5E]"
                        min={0}
                        onChange={(event) =>
                          setDraft((prev) => prev ? { ...prev, stock_quantity: event.target.value } : prev)
                        }
                        type="number"
                        value={draft?.stock_quantity ?? ""}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-bold ${lowStock ? "text-[#B77B0F]" : "text-[#23282D]"}`}>
                          {item.stock_quantity}
                        </span>
                        {lowStock ? (
                          <svg className="w-[15px] h-[15px] text-[#B77B0F]"><use href="#ic-warning" /></svg>
                        ) : null}
                      </div>
                    )}
                  </td>

                  <td className="p-[14px_22px] align-middle">
                    <div
                      aria-label={item.is_available ? "Perfume ativo" : "Perfume inativo"}
                      aria-pressed={item.is_available}
                      className={`w-[36px] h-[20px] rounded-full relative cursor-pointer inline-block transition-colors duration-200 ${
                        item.is_available ? "bg-[#5C6B4E]" : "bg-[#D8D5CE]"
                      }`}
                      onClick={() => onToggleAvailability(item)}
                      role="switch"
                      tabIndex={0}
                    >
                      <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white transition-all duration-200 shadow-sm ${item.is_available ? "left-[18px]" : "left-[2px]"}`}></div>
                    </div>
                  </td>

                  <td className="p-[14px_22px] align-middle">
                    {isEditing ? (
                      <div className="flex gap-1.5 justify-end">
                        <button
                          className="h-[30px] rounded-lg bg-[#354B5E] px-3 text-[12px] font-bold text-white hover:bg-[#263847]"
                          onClick={() => saveEdit(item)}
                          type="button"
                        >
                          Salvar
                        </button>
                        <button
                          className="h-[30px] rounded-lg border border-[#E6E1D2] px-3 text-[12px] font-semibold text-[#5A6067] hover:border-[#23282D]"
                          onClick={cancelEdit}
                          type="button"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 justify-end">
                        <button
                          aria-label={`Editar ${item.product.name}`}
                          className="w-[28px] h-[28px] rounded-lg border border-[#E6E1D2] bg-white flex items-center justify-center text-[#5A6067] hover:border-[#23282D] hover:text-[#23282D] transition-colors"
                          onClick={() => startEdit(item)}
                          type="button"
                        >
                          <svg className="w-[13.5px] h-[13.5px]"><use href="#ic-edit" /></svg>
                        </button>
                        <button
                          aria-label={`Remover ${item.product.name}`}
                          className="w-[28px] h-[28px] rounded-lg border border-[#E6E1D2] bg-white flex items-center justify-center text-[#5A6067] hover:border-[#A24726] hover:text-[#A24726] transition-colors"
                          onClick={() => onDelete(item)}
                          type="button"
                        >
                          <svg className="w-[13.5px] h-[13.5px]"><use href="#ic-trash" /></svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-[14px_22px] text-[12px] text-[#93927F] border-t border-[#EFEBDD]">
        <span>
          {items.length} perfume{items.length !== 1 ? "s" : ""} no estoque
          {items.some((item) => item.stock_quantity < LOW_STOCK_THRESHOLD)
            ? ` · ${items.filter((item) => item.stock_quantity < LOW_STOCK_THRESHOLD).length} com estoque baixo`
            : ""}
        </span>
      </div>
    </div>
  );
}