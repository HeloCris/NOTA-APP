import { useState, useEffect } from 'react';
import { brandService } from '../../services/brandService';
import type { Product } from '../../types/catalog';
import { ProductFormModal } from './ProductFormModal';
import { ProductDetailsModal } from '../common/ProductDetailsModal';

type SearchFilterType = 'all' | 'name' | 'note' | 'family';

interface BrandPortfolioTabProps {
  initialSearch?: string;
}

export function BrandPortfolioTab({ initialSearch = '' }: BrandPortfolioTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [searchFilter, setSearchFilter] = useState<SearchFilterType>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await brandService.getMyProducts();
      const data = response.data as any;
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Erro ao buscar produtos da marca", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Deseja realmente excluir este perfume do seu portfólio?")) {
      try {
        await brandService.deleteProduct(id);
        fetchProducts();
      } catch (error) {
        console.error("Erro ao excluir", error);
      }
    }
  };

  const term = search.trim().toLowerCase();
  const filteredProducts = term
    ? products.filter((p) => {
        const matchesName = (p.name || "").toLowerCase().includes(term);
        const matchesFamily = (p.olfactory_family || "").toLowerCase().includes(term);
        const allNotes = [
          ...(p.top_notes ?? []),
          ...(p.heart_notes ?? []),
          ...(p.base_notes ?? []),
        ].join(" ").toLowerCase();
        const matchesNote = allNotes.includes(term);

        if (searchFilter === "name") return matchesName;
        if (searchFilter === "note") return matchesNote;
        if (searchFilter === "family") return matchesFamily;
        return matchesName || matchesFamily || matchesNote || (p.brand?.name ?? "").toLowerCase().includes(term);
      })
    : products;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-4 border-[#354B5E]/20 border-t-[#354B5E] rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em] font-jakarta">Meus Perfumes</h1>
          <p className="text-[13px] text-[#5A6067] m-0">
            {term
              ? `${filteredProducts.length} perfume${filteredProducts.length === 1 ? "" : "s"} encontrado${filteredProducts.length === 1 ? "" : "s"}`
              : `${products.length} perfume${products.length === 1 ? "" : "s"} cadastrado${products.length === 1 ? "" : "s"} no catálogo mestre`}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="font-jakarta font-bold text-[14px] rounded-full px-6 py-[13px] border-2 border-transparent inline-flex items-center gap-2.5 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-colors cursor-pointer shadow-sm"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Perfume
        </button>
      </div>

      <div className="flex items-center justify-between gap-3.5 mb-5 flex-wrap">
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

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            aria-label="Filtrar busca por"
            className="border border-[#E6E1D2] bg-white rounded-xl py-[9px] px-3 text-[12.5px] font-semibold text-[#5A6067] outline-none focus:border-[#354B5E] cursor-pointer"
            value={searchFilter}
            onChange={(event) => setSearchFilter(event.target.value as SearchFilterType)}
          >
            <option value="all">Buscar em tudo</option>
            <option value="name">Nome do perfume</option>
            <option value="note">Nota olfativa</option>
            <option value="family">Caminho olfativo</option>
          </select>
          <label className="relative">
            <svg className="w-4 h-4 text-[#93927F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><use href="#ic-search" /></svg>
            <input
              className="border border-[#E6E1D2] bg-white rounded-xl pl-9 pr-4 py-[9px] text-[12.5px] text-[#23282D] outline-none focus:border-[#354B5E] w-[240px]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                searchFilter === "name"
                  ? "Nome do perfume..."
                  : searchFilter === "note"
                    ? "Nota (ex: Jasmim, Baunilha)..."
                    : searchFilter === "family"
                      ? "Caminho (ex: Floral, Cítrico)..."
                      : "Buscar no meu portfólio..."
              }
              type="search"
              value={search}
            />
          </label>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E6E1D2] rounded-[20px] py-[70px] px-[30px] text-center shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
          <div className="w-[56px] h-[56px] rounded-2xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center mx-auto mb-5">
            <svg className="w-[26px] h-[26px]"><use href="#ic-flask" /></svg>
          </div>
          <h3 className="text-[18px] font-extrabold text-[#23282D] mb-2">
            {term ? "Nenhum perfume encontrado" : "Nenhum perfume cadastrado"}
          </h3>
          <p className="text-[13px] text-[#5A6067] max-w-[360px] mx-auto leading-[1.6]">
            {term
              ? `Não encontramos perfumes que correspondam a "${search.trim()}".`
              : "Comece a montar o portfólio oficial da sua marca para que os lojistas possam vender seus produtos."}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-6 font-bold text-[13px] text-[#354B5E] bg-[#E9EDF0] px-5 py-2.5 rounded-full hover:bg-[#D9E1E6] transition-colors cursor-pointer"
          >
            Cadastrar Primeiro Perfume
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Visualização em Grade de Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const allNotes = [
              ...(p.top_notes ?? []),
              ...(p.heart_notes ?? []),
              ...(p.base_notes ?? []),
            ];

            return (
              <div
                key={p.id}
                className="bg-white border border-[#E6E1D2] rounded-2xl p-4 flex flex-col justify-between hover:border-[#354B5E] hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  {/* Imagem do Frasco */}
                  <div
                    onClick={() => setSelectedProduct(p)}
                    className="w-full h-44 rounded-xl bg-[#F5F3E9] overflow-hidden flex items-center justify-center relative border border-[#EFEBDD] mb-3.5 cursor-pointer"
                    title="Clique para ver detalhes do perfume"
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <svg className="w-10 h-10 text-[#93927F]">
                        <use href="#ic-flask" />
                      </svg>
                    )}

                    <div className="absolute top-2.5 left-2.5">
                      {p.is_approved ? (
                        <span className="bg-[#EDF0E7] text-[#454F3A] text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-[#D5DCCC] shadow-xs">
                          Aprovado
                        </span>
                      ) : (
                        <span className="bg-[#FFF4E5] text-[#8A5B22] text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-[#F0DDC5] shadow-xs">
                          Em Análise
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                      {p.olfactory_family && (
                        <span className="bg-white/95 backdrop-blur-sm text-[#263847] text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-[#E6E1D2] shadow-xs">
                          {p.olfactory_family}
                        </span>
                      )}
                      {p.concentration && (
                        <span className="bg-[#354B5E]/90 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          {p.concentration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3
                        onClick={() => setSelectedProduct(p)}
                        className="text-[16px] font-extrabold text-[#263847] font-jakarta leading-snug truncate cursor-pointer hover:text-[#354B5E] transition-colors"
                      >
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-[#93927F] font-mono mt-0.5">
                        <span>EAN: {p.ean || 'N/A'}</span>
                        {p.anvisa_code && <span>· ANVISA: {p.anvisa_code}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(p)}
                      title="Ver detalhes do perfume"
                      aria-label={`Ver detalhes de ${p.name}`}
                      className="w-7 h-7 rounded-lg text-[#5A6067] hover:text-[#354B5E] hover:bg-[#E9EDF0] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                    >
                      <svg className="w-4 h-4">
                        <use href="#ic-eye-kpi" />
                      </svg>
                    </button>
                  </div>

                  {/* Notas em Chips */}
                  {allNotes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {allNotes.slice(0, 3).map((note) => (
                        <span
                          key={note}
                          className="bg-[#F8F6F0] text-[#5A6067] text-[10.5px] font-medium px-2 py-0.5 rounded-md border border-[#EFEBDD]"
                        >
                          {note}
                        </span>
                      ))}
                      {allNotes.length > 3 && (
                        <span className="text-[10px] text-[#93927F] font-bold self-center">
                          +{allNotes.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="mt-4 pt-3 border-t border-[#EFEBDD] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#F5F3E9] hover:bg-[#E9EDF0] text-[#354B5E] text-[12px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Ver Detalhes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    title="Excluir perfume"
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
        <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[16px_22px] border-b border-[#EFEBDD] w-[60px]"></th>
                  <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[16px_22px] border-b border-[#EFEBDD]">Produto</th>
                  <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[16px_22px] border-b border-[#EFEBDD]">Família Olfativa</th>
                  <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[16px_22px] border-b border-[#EFEBDD]">Registro ANVISA</th>
                  <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[16px_22px] border-b border-[#EFEBDD]">Status</th>
                  <th className="p-[16px_22px] border-b border-[#EFEBDD]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FBFAF6] transition-colors border-b border-[#EFEBDD] last:border-0">
                    <td className="p-[14px_22px] align-middle">
                      <div
                        onClick={() => setSelectedProduct(p)}
                        className="w-[42px] h-[56px] rounded-lg bg-[#F5F3E9] overflow-hidden flex items-center justify-center border border-[#E6E1D2] cursor-pointer hover:border-[#354B5E] transition-colors"
                        title="Ver detalhes do perfume"
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-[#93927F]"><use href="#ic-flask" /></svg>
                        )}
                      </div>
                    </td>
                    <td className="p-[14px_22px] align-middle">
                      <div
                        onClick={() => setSelectedProduct(p)}
                        className="font-bold text-[#23282D] text-[14px] cursor-pointer hover:text-[#354B5E] transition-colors"
                        title="Ver detalhes do perfume"
                      >
                        {p.name}
                      </div>
                      <div className="text-[11px] text-[#93927F] font-mono mt-0.5">EAN: {p.ean || 'N/A'}</div>
                    </td>
                    <td className="p-[14px_22px] align-middle">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.concentration && (
                          <span className="inline-block bg-[#354B5E]/10 text-[#354B5E] text-[11px] font-bold px-2 py-0.5 rounded-md border border-[#354B5E]/20">
                            {p.concentration}
                          </span>
                        )}
                        {p.gender && (
                          <span className="inline-block bg-[#F5F3E9] text-[#23282D] text-[11px] font-bold px-2 py-0.5 rounded-md border border-[#E6E1D2]">
                            {p.gender}
                          </span>
                        )}
                        <span className="inline-block bg-[#F5F3E9] text-[#5A6067] text-[12px] font-semibold px-2.5 py-1 rounded-md border border-[#E6E1D2]">
                          {p.olfactory_family}
                        </span>
                      </div>
                    </td>
                    <td className="p-[14px_22px] align-middle text-[13px] text-[#5A6067] font-mono">
                      {p.anvisa_code || 'N/A'}
                    </td>
                    <td className="p-[14px_22px] align-middle">
                      {p.is_approved ? (
                        <span className="inline-flex items-center gap-1.5 bg-[#EDF0E7] text-[#454F3A] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#D5DCCC]">
                          Aprovado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-[#FFF4E5] text-[#8A5B22] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#F0DDC5]">
                          Análise
                        </span>
                      )}
                    </td>
                    <td className="p-[14px_22px] align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(p)}
                          title="Ver detalhes do perfume"
                          aria-label={`Ver detalhes de ${p.name}`}
                          className="w-8 h-8 rounded-lg text-[#354B5E] hover:bg-[#E9EDF0] transition-colors flex items-center justify-center cursor-pointer"
                        >
                          <svg className="w-4 h-4"><use href="#ic-eye-kpi" /></svg>
                        </button>
                        <button onClick={() => handleDelete(p.id)} title="Excluir perfume" className="w-8 h-8 rounded-lg text-[#93927F] hover:bg-[#FBEEE7] hover:text-[#A24726] transition-colors flex items-center justify-center cursor-pointer">
                          <svg className="w-4 h-4"><use href="#ic-trash" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ProductFormModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchProducts();
          }} 
        />
      )}

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
