import React, { useState, useEffect } from 'react';
import { brandService } from '../../services/brandService';
import type { Product } from '../../types/catalog';
import { ProductFormModal } from './ProductFormModal';

export function BrandPortfolioTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <h1 className="text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em] font-jakarta">Meu Portfólio</h1>
          <p className="text-[13px] text-[#5A6067] m-0">{products.length} perfumes cadastrados</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="font-jakarta font-bold text-[14px] rounded-full px-6 py-[13px] border-2 border-transparent inline-flex items-center gap-2.5 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-colors"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Perfume
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E6E1D2] rounded-[20px] py-[70px] px-[30px] text-center shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
          <div className="w-[56px] h-[56px] rounded-2xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center mx-auto mb-5">
            <svg className="w-[26px] h-[26px]"><use href="#ic-flask" /></svg>
          </div>
          <h3 className="text-[18px] font-extrabold text-[#23282D] mb-2">Nenhum perfume cadastrado</h3>
          <p className="text-[13px] text-[#5A6067] max-w-[360px] mx-auto leading-[1.6]">
            Comece a montar o portfólio oficial da sua marca para que os lojistas possam vender seus produtos.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-6 font-bold text-[13px] text-[#354B5E] bg-[#E9EDF0] px-5 py-2.5 rounded-full hover:bg-[#D9E1E6] transition-colors"
          >
            Cadastrar Primeiro Perfume
          </button>
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
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FBFAF6] transition-colors border-b border-[#EFEBDD] last:border-0">
                    <td className="p-[14px_22px] align-middle">
                      <div className="w-[42px] h-[56px] rounded-lg bg-[#F5F3E9] overflow-hidden flex items-center justify-center border border-[#E6E1D2]">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-[#93927F]"><use href="#ic-flask" /></svg>
                        )}
                      </div>
                    </td>
                    <td className="p-[14px_22px] align-middle">
                      <div className="font-bold text-[#23282D] text-[14px]">{p.name}</div>
                      <div className="text-[11px] text-[#93927F] font-mono mt-0.5">EAN: {p.ean || 'N/A'}</div>
                    </td>
                    <td className="p-[14px_22px] align-middle">
                      <span className="inline-block bg-[#F5F3E9] text-[#5A6067] text-[12px] font-semibold px-2.5 py-1 rounded-md border border-[#E6E1D2]">
                        {p.olfactory_family}
                      </span>
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
                      <div className="flex items-center justify-end gap-2">
                        <button className="w-8 h-8 rounded-lg text-[#93927F] hover:bg-[#E9EDF0] hover:text-[#354B5E] transition-colors flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg text-[#93927F] hover:bg-[#FBEEE7] hover:text-[#A24726] transition-colors flex items-center justify-center">
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
    </div>
  );
}
