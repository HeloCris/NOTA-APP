import { AxiosError } from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { inventoryService } from "../../services/inventoryService";
import type { Product } from "../../types/catalog";
import type { StoreProduct } from "../../types/inventory";
import { ProductAutoComplete } from "./ProductAutoComplete";

interface AddProductModalProps {
  initialProduct?: Product | null;
  onClose: () => void;
  onCreated: (item: StoreProduct) => void;
}

const addProductSchema = z
  .object({
    volume_ml: z
      .coerce.number()
      .int("Informe um número inteiro.")
      .positive("Informe o volume em ml."),
    price: z
      .string()
      .min(1, "Informe o preço.")
      .refine(
        (value) => Number(value) > 0,
        "O preço deve ser maior que zero.",
      ),
    promotional_price: z.string().optional(),
    stock_quantity: z
      .coerce.number()
      .int("Informe um número inteiro.")
      .min(0, "O estoque não pode ser negativo."),
  })
  .refine(
    (data) =>
      !data.promotional_price ||
      data.promotional_price.trim() === "" ||
      Number(data.promotional_price) < Number(data.price),
    {
      message: "O preço promocional deve ser menor que o preço de venda.",
      path: ["promotional_price"],
    },
  );

type AddProductFormInput = z.input<typeof addProductSchema>;
type AddProductFormValues = z.output<typeof addProductSchema>;

function getApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{
    detail?: string | string[];
  }>;
  const detail = axiosError.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail[0] ?? "Não foi possível adicionar o perfume.";
  }

  return detail ?? "Não foi possível adicionar o perfume. Tente novamente.";
}

const inputClassName =
  "w-full rounded-lg border border-[#E6E1D2] bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-[#354B5E]";
const errorClassName = "mt-1 text-[12px] text-[#A24726]";

export function AddProductModal({
  initialProduct,
  onClose,
  onCreated,
}: AddProductModalProps) {
  const [product, setProduct] = useState<Product | null>(
    initialProduct ?? null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddProductFormInput, unknown, AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      volume_ml: undefined,
      price: "",
      promotional_price: "",
      stock_quantity: 0,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!product) {
      toast.error("Selecione um perfume do catálogo.");
      return;
    }

    try {
      const created = await inventoryService.createStoreProduct({
        product_id: product.id,
        volume_ml: values.volume_ml,
        price: values.price,
        promotional_price:
          values.promotional_price && values.promotional_price.trim() !== ""
            ? values.promotional_price
            : null,
        stock_quantity: values.stock_quantity,
      });

      toast.success("Perfume adicionado ao seu estoque.");
      onCreated(created);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <div
      aria-labelledby="add-product-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B1C16]/55 p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg bg-[#FCFBF7] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-[#E6E1D2] p-5">
          <div>
            <h2
              className="font-jakarta text-xl font-extrabold text-[#263847]"
              id="add-product-title"
            >
              Adicionar Perfume
            </h2>
            <p className="mt-1 text-sm text-[#5A6067]">
              Vincule um perfume do catálogo ao seu estoque.
            </p>
          </div>
          <button
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xl text-[#5A6067] hover:bg-[#F0EEE4]"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </header>

        <form className="space-y-4 p-5" noValidate onSubmit={onSubmit}>
          <div>
            <label
              className="mb-1.5 block text-[13px] font-bold text-[#23282D]"
              htmlFor="add-product-search"
            >
              Perfume
            </label>

            {product ? (
              <div className="flex items-center gap-3 rounded-lg border border-[#E6E1D2] bg-white p-3">
                {product.image_url ? (
                  <img
                    alt=""
                    className="h-12 w-9 rounded bg-[#F5F3E9] object-cover"
                    src={product.image_url}
                  />
                ) : (
                  <div className="h-12 w-9 rounded bg-[#F5F3E9]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#23282D]">
                    {product.name}
                  </p>
                  <p className="truncate text-xs text-[#93927F]">
                    {product.brand.name} · {product.olfactory_family}
                  </p>
                </div>
                <button
                  className="text-[12px] font-semibold text-[#A24726] hover:underline"
                  onClick={() => setProduct(null)}
                  type="button"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <ProductAutoComplete onSelect={setProduct} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="mb-1.5 block text-[13px] font-bold text-[#23282D]"
                htmlFor="volume-ml"
              >
                Volume (ml)
              </label>
              <input
                className={inputClassName}
                id="volume-ml"
                min={1}
                placeholder="Ex.: 100"
                type="number"
                {...register("volume_ml")}
              />
              {errors.volume_ml ? (
                <p className={errorClassName}>{errors.volume_ml.message}</p>
              ) : null}
            </div>

            <div>
              <label
                className="mb-1.5 block text-[13px] font-bold text-[#23282D]"
                htmlFor="stock-quantity"
              >
                Quantidade
              </label>
              <input
                className={inputClassName}
                id="stock-quantity"
                min={0}
                placeholder="Ex.: 10"
                type="number"
                {...register("stock_quantity")}
              />
              {errors.stock_quantity ? (
                <p className={errorClassName}>{errors.stock_quantity.message}</p>
              ) : null}
            </div>

            <div>
              <label
                className="mb-1.5 block text-[13px] font-bold text-[#23282D]"
                htmlFor="price"
              >
                Preço
              </label>
              <input
                className={inputClassName}
                id="price"
                placeholder="Ex.: 349.90"
                step="0.01"
                type="number"
                {...register("price")}
              />
              {errors.price ? (
                <p className={errorClassName}>{errors.price.message}</p>
              ) : null}
            </div>

            <div>
              <label
                className="mb-1.5 block text-[13px] font-bold text-[#23282D]"
                htmlFor="promotional-price"
              >
                Preço promocional (opcional)
              </label>
              <input
                className={inputClassName}
                id="promotional-price"
                placeholder="Ex.: 299.90"
                step="0.01"
                type="number"
                {...register("promotional_price")}
              />
              {errors.promotional_price ? (
                <p className={errorClassName}>
                  {errors.promotional_price.message}
                </p>
              ) : null}
            </div>
          </div>

          <footer className="flex justify-end gap-2.5 border-t border-[#E6E1D2] pt-4">
            <button
              className="rounded-md border border-[#E6E1D2] px-4 py-2.5 font-jakarta text-sm font-semibold text-[#5A6067] hover:border-[#23282D] hover:text-[#23282D]"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-[#354B5E] px-4 py-2.5 font-jakarta text-sm font-bold text-white hover:bg-[#263847]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Adicionando..." : "Adicionar ao Estoque"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}