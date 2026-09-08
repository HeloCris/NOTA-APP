import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OlfactoryFilterChips } from "./OlfactoryFilterChips";
import { ProductCard } from "./ProductCard";
import { showcaseService } from "../../services/showcaseService";
import type { ShowcaseStore } from "../../types/showcase";

export function StoreShowcasePage() {
  const { slug = "" } = useParams();
  const [store, setStore] = useState<ShowcaseStore | null>(null);
  const [family, setFamily] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    showcaseService.getStore(slug, { family, search: search || undefined })
      .then((data) => { if (active) { setStore(data); setError(false); } })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, family, search]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#F5F3E9] text-sm text-[#63666A]">Carregando vitrine...</main>;
  if (error || !store) return <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F5F3E9] px-6 text-center"><p className="font-jakarta text-2xl font-bold text-[#263847]">Esta vitrine não está disponível.</p><Link to="/" className="font-bold text-[#354B5E] underline">Voltar para o início</Link></main>;

  return (
    <main className="min-h-screen bg-[#F5F3E9] text-[#263847]">
      <header className="relative min-h-[360px] overflow-hidden bg-[#263847]">
        {store.cover_url && <img src={store.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,33,43,.9),rgba(20,33,43,.34))]" />
        <div className="relative mx-auto flex max-w-6xl items-end gap-6 px-6 pb-12 pt-10 sm:px-10">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/80 bg-[#F0EEE4] text-2xl font-bold text-[#354B5E] shadow-xl sm:h-32 sm:w-32">{store.logo_url ? <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" /> : store.name.charAt(0)}</div>
          <div className="max-w-2xl text-white"><div className="mb-3 flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.18em] text-[#E1C98A]">Vitrine pública</span>{store.is_official && <span className="rounded-full bg-[#E1C98A] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#263847]">Loja verificada</span>}</div><h1 className="font-jakarta text-4xl font-extrabold sm:text-6xl">{store.name}</h1><p className="mt-4 max-w-xl text-sm leading-7 text-white/80">{store.bio || "Uma curadoria de fragrâncias para encontrar a sua próxima assinatura olfativa."}</p></div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-10"><div className="mb-8 flex flex-col gap-5 border-b border-[#DDD8CA] pb-8 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A79876]">Curadoria da loja</p><h2 className="mt-1 font-jakarta text-2xl font-bold">Encontre sua próxima fragrância</h2></div><label className="relative block w-full max-w-sm"><span className="sr-only">Buscar perfumes</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar perfume ou marca..." className="w-full rounded-full border border-[#D8D4C8] bg-white px-5 py-3 text-sm outline-none transition focus:border-[#354B5E]" /></label></div><OlfactoryFilterChips value={family} onChange={setFamily} /><div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{store.products.length ? store.products.map((product) => <ProductCard key={product.id} product={product} />) : <div className="col-span-full rounded-2xl border border-dashed border-[#CFC9BA] bg-white/50 px-6 py-16 text-center text-sm text-[#63666A]">Nenhum perfume encontrado com esses filtros.</div>}</div></section>
    </main>
  );
}
