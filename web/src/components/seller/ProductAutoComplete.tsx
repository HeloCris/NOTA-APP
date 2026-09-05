import { useEffect, useState } from "react";

import { catalogService } from "../../services/catalogService";
import type { Product } from "../../types/catalog";

interface ProductAutoCompleteProps {
  onSelect: (product: Product) => void;
}

export function ProductAutoComplete({ onSelect }: ProductAutoCompleteProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setProducts([]);
      setHasError(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        setProducts(await catalogService.searchProducts(normalizedQuery));
      } catch {
        setProducts([]);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <label className="sr-only" htmlFor="catalog-product-search">Buscar no catálogo oficial</label>
      <div className="flex items-center gap-2 rounded-lg border border-[#E6E1D2] bg-white px-3.5 py-[9px] focus-within:border-[#354B5E]">
        <svg className="h-4 w-4 shrink-0 text-[#93927F]"><use href="#ic-search" /></svg>
        <input
          autoComplete="off"
          className="w-full border-none bg-transparent text-[13px] outline-none"
          id="catalog-product-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar no catálogo oficial..."
          type="search"
          value={query}
        />
      </div>

      {query.trim().length >= 2 ? (
        <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-lg border border-[#E6E1D2] bg-white p-1 shadow-lg">
          {isLoading ? <p className="p-3 text-sm text-[#5A6067]">Buscando catálogo...</p> : null}
          {!isLoading && hasError ? <p className="p-3 text-sm text-[#A24726]">Não foi possível buscar o catálogo.</p> : null}
          {!isLoading && !hasError && products.length === 0 ? <p className="p-3 text-sm text-[#5A6067]">Nenhum perfume encontrado.</p> : null}
          {!isLoading && products.map((product) => (
            <button
              className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-[#F5F3E9]"
              key={product.id}
              onClick={() => onSelect(product)}
              type="button"
            >
              {product.image_url ? (
                <img alt="" className="h-11 w-9 rounded bg-[#F5F3E9] object-cover" src={product.image_url} />
              ) : <div className="h-11 w-9 rounded bg-[#F5F3E9]" />}
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[#23282D]">{product.name}</span>
                <span className="block truncate text-xs text-[#93927F]">{product.brand.name} · {product.olfactory_family}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}