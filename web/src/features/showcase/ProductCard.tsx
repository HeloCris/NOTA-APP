import { Link } from "react-router-dom";
import type { ShowcaseProduct } from "../../types/showcase";

interface ProductCardProps {
  product: ShowcaseProduct;
}

const formatPrice = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

export function ProductCard({ product }: ProductCardProps) {
  const notes = [...product.top_notes, ...product.heart_notes, ...product.base_notes].slice(0, 3);
  const hasPromotion = product.promotional_price !== null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#E6E1D2] bg-white shadow-[0_8px_28px_rgba(39,45,45,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(39,45,45,0.1)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F1EEE5]">
        {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-5xl text-[#A79876]">NŌTA</div>}
        {hasPromotion && <span className="absolute left-3 top-3 rounded-full bg-[#A24726] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">Oferta</span>}
      </div>
      <div className="space-y-3 p-4">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A79876]">{product.brand}</p><h2 className="mt-1 font-jakarta text-lg font-bold text-[#263847]">{product.name}</h2></div>
        <div className="flex flex-wrap gap-1.5">{notes.map((note) => <span key={note} className="rounded-full bg-[#F0F5EE] px-2 py-1 text-[10px] font-semibold text-[#546347]">{note}</span>)}</div>
        <div className="flex items-end justify-between gap-3"><div><span className="text-xs text-[#8B8980]">{product.volume_ml} ml</span><p className="font-jakarta text-xl font-extrabold text-[#263847]">{formatPrice(product.effective_price)}</p>{hasPromotion && <del className="text-xs text-[#93927F]">{formatPrice(product.price)}</del>}</div><Link to={`/lojas/${product.store_slug}`} className="text-xs font-bold text-[#354B5E] underline underline-offset-4">Ver loja</Link></div>
      </div>
    </article>
  );
}
