import type { Product } from "../../types/catalog";

interface OlfactoryPyramidModalProps {
  product: Product;
  onClose: () => void;
  onAddToStock?: (product: Product) => void;
}

interface NoteLayerProps {
  label: string;
  notes: string[];
  className: string;
}

function NoteLayer({ label, notes, className }: NoteLayerProps) {
  return (
    <section className={`border p-4 ${className}`}>
      <h3 className="font-jakarta text-sm font-bold text-[#263847]">{label}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {notes.map((note) => (
          <span
            className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#354B5E]"
            key={note}
          >
            {note}
          </span>
        ))}
      </div>
    </section>
  );
}

export function OlfactoryPyramidModal({
  product,
  onClose,
  onAddToStock,
}: OlfactoryPyramidModalProps) {
  return (
    <div
      aria-labelledby="olfactory-pyramid-title"
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
          <div className="flex min-w-0 items-center gap-4">
            {product.image_url ? (
              <img
                alt=""
                className="h-16 w-12 rounded-md bg-[#F5F3E9] object-cover"
                src={product.image_url}
              />
            ) : null}
            <div>
              <p className="text-xs font-semibold text-[#93927F]">{product.brand.name}</p>
              <h2
                className="font-jakarta text-xl font-extrabold text-[#263847]"
                id="olfactory-pyramid-title"
              >
                {product.name}
              </h2>
              <p className="mt-1 text-sm text-[#5A6067]">{product.olfactory_family}</p>
            </div>
          </div>
          <button
            aria-label="Fechar ficha técnica"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xl text-[#5A6067] hover:bg-[#F0EEE4]"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </header>

        <div className="space-y-2 p-5">
          <NoteLayer className="border-[#D5E1CB] bg-[#EEF5E9]" label="Saída" notes={product.top_notes} />
          <NoteLayer className="border-[#E7D1DC] bg-[#F9F0F4]" label="Corpo" notes={product.heart_notes} />
          <NoteLayer className="border-[#E8D9BE] bg-[#F8F2E5]" label="Fundo" notes={product.base_notes} />
          {product.description ? (
            <p className="pt-2 text-sm leading-6 text-[#5A6067]">{product.description}</p>
          ) : null}
        </div>

        <footer className="flex justify-end border-t border-[#E6E1D2] p-4">
          <button
            className="rounded-md bg-[#354B5E] px-4 py-2.5 font-jakarta text-sm font-bold text-white hover:bg-[#263847]"
            onClick={() => onAddToStock?.(product)}
            type="button"
          >
            Adicionar ao Meu Estoque
          </button>
        </footer>
      </div>
    </div>
  );
}