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
      {/* Header unificado e compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-[21px] font-extrabold text-[#263847] tracking-tight font-jakarta m-0">
            Meus Perfumes
          </h1>
          <span className="text-[11.5px] font-bold text-[#5A6067] bg-[#EFEBDD]/70 px-2.5 py-0.5 rounded-full border border-[#E6E1D2]">
            {term
              ? `${filteredProducts.length} de ${products.length} perfumes`
              : `${products.length} cadastrados`}
          </span>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="font-jakarta font-bold text-[12.5px] rounded-xl px-4 py-2 inline-flex items-center gap-2 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Perfume
        </button>
      </div>

      {/* Toolbar unificada, compacta e conectada */}
      <div className="bg-white border border-[#E6E1D2] rounded-xl p-2 mb-3.5 shadow-xs flex items-center justify-between gap-2.5 flex-wrap">
        {/* Toggle de Visualização: Lista vs Grade com ícones corretos */}
        <div className="inline-flex items-center bg-[#F5F3E9] p-0.5 rounded-lg border border-[#E6E1D2]">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-[#263847] shadow-xs"
                : "text-[#5A6067] hover:text-[#263847]"
            }`}
            title="Visualizar como Lista"
          >
            {/* Ícone de Lista: 3 linhas horizontais */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Lista
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-white text-[#263847] shadow-xs"
                : "text-[#5A6067] hover:text-[#263847]"
            }`}
            title="Visualizar como Grade"
          >
            {/* Ícone de Grade: 4 quadrados */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            Grade
          </button>
        </div>

        {/* Campo de Busca Unificado com Dropdown de Filtro Integrado */}
        <div className="flex items-center flex-1 max-w-sm sm:max-w-md bg-[#FAF9F5] border border-[#E6E1D2] rounded-lg focus-within:border-[#354B5E] focus-within:bg-white transition-all overflow-hidden ml-auto">
          <select
            aria-label="Filtrar busca por"
            className="bg-transparent text-[11.5px] font-bold text-[#5A6067] py-1.5 px-2.5 border-r border-[#E6E1D2] outline-none cursor-pointer hover:text-[#263847]"
            value={searchFilter}
            onChange={(event) => setSearchFilter(event.target.value as SearchFilterType)}
          >
            <option value="all">Tudo</option>
            <option value="name">Nome</option>
            <option value="note">Nota</option>
            <option value="family">Família</option>
          </select>
          <div className="relative flex-1 flex items-center">
            <svg className="w-3.5 h-3.5 text-[#93927F] absolute left-2.5 pointer-events-none">
              <use href="#ic-search" />
            </svg>
            <input
              className="w-full bg-transparent pl-8 pr-2.5 py-1.5 text-[12px] text-[#23282D] outline-none placeholder:text-[#93927F]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                searchFilter === "name"
                  ? "Buscar nome do perfume..."
                  : searchFilter === "note"
                    ? "Buscar nota (ex: Jasmim)..."
                    : searchFilter === "family"
                      ? "Buscar família (ex: Floral)..."
                      : "Buscar por perfume, nota ou família..."
              }
              type="search"
              value={search}
            />
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E6E1D2] rounded-xl py-12 px-6 text-center">
          <div className="w-11 h-11 rounded-xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5"><use href="#ic-flask" /></svg>
          </div>
          <h3 className="text-[16px] font-extrabold text-[#23282D] mb-1">
            {term ? "Nenhum perfume encontrado" : "Nenhum perfume cadastrado"}
          </h3>
          <p className="text-[12.5px] text-[#5A6067] max-w-sm mx-auto leading-relaxed">
            {term
              ? `Não encontramos perfumes que correspondam a "${search.trim()}".`
              : "Comece a montar o portfólio oficial da sua marca para que os lojistas possam vender seus produtos."}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 font-bold text-[12.5px] text-[#354B5E] bg-[#E9EDF0] px-4 py-2 rounded-lg hover:bg-[#D9E1E6] transition-colors cursor-pointer"
          >
            Cadastrar Primeiro Perfume
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Visualização em Grade Compacta - Aproveitamento Inteligente do Espaço */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredProducts.map((p) => {
            const allNotes = [
              ...(p.top_notes ?? []),
              ...(p.heart_notes ?? []),
              ...(p.base_notes ?? []),
            ];

            return (
              <div
                key={p.id}
                className="bg-white border border-[#E6E1D2] rounded-xl p-2.5 flex flex-col justify-between hover:border-[#354B5E] hover:shadow-xs transition-all duration-150 group"
              >
                <div>
                  {/* Imagem do Frasco Compacta */}
                  <div
                    onClick={() => setSelectedProduct(p)}
                    className="w-full h-28 rounded-lg bg-[#F5F3E9] overflow-hidden flex items-center justify-center relative border border-[#EFEBDD] mb-2 cursor-pointer"
                    title="Clique para ver detalhes do perfume"
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-[#93927F]">
                        <use href="#ic-flask" />
                      </svg>
                    )}

                    <div className="absolute top-1.5 left-1.5">
                      {p.is_approved ? (
                        <span className="bg-[#EDF0E7] text-[#454F3A] text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-[#D5DCCC] shadow-xs">
                          Aprovado
                        </span>
                      ) : (
                        <span className="bg-[#FFF4E5] text-[#8A5B22] text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-[#F0DDC5] shadow-xs">
                          Análise
                        </span>
                      )}
                    </div>

                    <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5 items-end">
                      {p.concentration && (
                        <span className="bg-[#354B5E]/90 text-white text-[9px] font-extrabold px-1 py-0.5 rounded shadow-xs">
                          {p.concentration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações Compactas */}
                  <div className="mb-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <h3
                        onClick={() => setSelectedProduct(p)}
                        className="text-[13.5px] font-extrabold text-[#263847] font-jakarta leading-tight truncate cursor-pointer hover:text-[#354B5E] transition-colors flex-1"
                        title={p.name}
                      >
                        {p.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        title="Ver detalhes do perfume"
                        aria-label={`Ver detalhes de ${p.name}`}
                        className="w-6 h-6 rounded text-[#5A6067] hover:text-[#354B5E] hover:bg-[#E9EDF0] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                      >
                        <svg className="w-3.5 h-3.5">
                          <use href="#ic-eye-kpi" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#93927F] font-mono mt-0.5 truncate">
                      <span>{p.olfactory_family}</span>
                      {p.anvisa_code && <span>· ANVISA: {p.anvisa_code}</span>}
                    </div>
                  </div>

                  {/* Notas em Chips Compactos */}
                  {allNotes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {allNotes.slice(0, 2).map((note) => (
                        <span
                          key={note}
                          className="bg-[#F8F6F0] text-[#5A6067] text-[9.5px] font-medium px-1.5 py-0.2 rounded border border-[#EFEBDD] truncate max-w-[85px]"
                          title={note}
                        >
                          {note}
                        </span>
                      ))}
                      {allNotes.length > 2 && (
                        <span className="text-[9px] text-[#93927F] font-bold self-center">
                          +{allNotes.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Ações Compactas */}
                <div className="pt-2 border-t border-[#EFEBDD] flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className="flex-1 py-1 px-2 rounded bg-[#F5F3E9] hover:bg-[#E9EDF0] text-[#354B5E] text-[11px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Detalhes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    title="Excluir perfume"
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
        /* Visualização em Lista (Tabela compacta) */
        <div className="bg-white border border-[#EFEBDD] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5]">
                  <th className="text-left text-[10px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[10px_16px] border-b border-[#EFEBDD] w-[50px]"></th>
                  <th className="text-left text-[10px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[10px_16px] border-b border-[#EFEBDD]">Produto</th>
                  <th className="text-left text-[10px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[10px_16px] border-b border-[#EFEBDD]">Família Olfativa</th>
                  <th className="text-left text-[10px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[10px_16px] border-b border-[#EFEBDD]">Registro ANVISA</th>
                  <th className="text-left text-[10px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[10px_16px] border-b border-[#EFEBDD]">Status</th>
                  <th className="p-[10px_16px] border-b border-[#EFEBDD] w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FBFAF6] transition-colors border-b border-[#EFEBDD] last:border-0">
                    <td className="p-[10px_16px] align-middle">
                      <div
                        onClick={() => setSelectedProduct(p)}
                        className="w-[36px] h-[46px] rounded bg-[#F5F3E9] overflow-hidden flex items-center justify-center border border-[#E6E1D2] cursor-pointer hover:border-[#354B5E] transition-colors"
                        title="Ver detalhes do perfume"
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-[#93927F]"><use href="#ic-flask" /></svg>
                        )}
                      </div>
                    </td>
                    <td className="p-[10px_16px] align-middle">
                      <div
                        onClick={() => setSelectedProduct(p)}
                        className="font-bold text-[#23282D] text-[13.5px] cursor-pointer hover:text-[#354B5E] transition-colors"
                        title="Ver detalhes do perfume"
                      >
                        {p.name}
                      </div>
                      <div className="text-[10.5px] text-[#93927F] font-mono mt-0.5">EAN: {p.ean || 'N/A'}</div>
                    </td>
                    <td className="p-[10px_16px] align-middle">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.concentration && (
                          <span className="inline-block bg-[#354B5E]/10 text-[#354B5E] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#354B5E]/20">
                            {p.concentration}
                          </span>
                        )}
                        {p.gender && (
                          <span className="inline-block bg-[#F5F3E9] text-[#23282D] text-[10.5px] font-bold px-2 py-0.5 rounded border border-[#E6E1D2]">
                            {p.gender}
                          </span>
                        )}
                        <span className="inline-block bg-[#F5F3E9] text-[#5A6067] text-[11px] font-semibold px-2 py-0.5 rounded border border-[#E6E1D2]">
                          {p.olfactory_family}
                        </span>
                      </div>
                    </td>
                    <td className="p-[10px_16px] align-middle text-[12px] text-[#5A6067] font-mono">
                      {p.anvisa_code || 'N/A'}
                    </td>
                    <td className="p-[10px_16px] align-middle">
                      {p.is_approved ? (
                        <span className="inline-flex items-center gap-1 bg-[#EDF0E7] text-[#454F3A] text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-[#D5DCCC]">
                          Aprovado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-[#FFF4E5] text-[#8A5B22] text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-[#F0DDC5]">
                          Análise
                        </span>
                      )}
                    </td>
                    <td className="p-[10px_16px] align-middle text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(p)}
                          title="Ver detalhes do perfume"
                          aria-label={`Ver detalhes de ${p.name}`}
                          className="w-7 h-7 rounded text-[#354B5E] hover:bg-[#E9EDF0] transition-colors flex items-center justify-center cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5"><use href="#ic-eye-kpi" /></svg>
                        </button>
                        <button onClick={() => handleDelete(p.id)} title="Excluir perfume" className="w-7 h-7 rounded text-[#93927F] hover:bg-[#FBEEE7] hover:text-[#A24726] transition-colors flex items-center justify-center cursor-pointer">
                          <svg className="w-3.5 h-3.5"><use href="#ic-trash" /></svg>
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
