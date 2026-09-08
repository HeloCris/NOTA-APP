import React, { useState } from 'react';
import { brandService } from '../../services/brandService';
import toast from 'react-hot-toast';

interface ProductFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductFormModal({ onClose, onSuccess }: ProductFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    ean: '',
    anvisa_code: '',
    olfactory_family: 'Amadeirado', // default
    description: '',
    image_url: ''
  });

  const [notes, setNotes] = useState({
    top: [] as string[],
    heart: [] as string[],
    base: [] as string[]
  });

  const [currentNote, setCurrentNote] = useState({ top: '', heart: '', base: '' });

  const handleAddNote = (type: 'top' | 'heart' | 'base') => {
    if (currentNote[type].trim()) {
      setNotes(prev => ({ ...prev, [type]: [...prev[type], currentNote[type].trim()] }));
      setCurrentNote(prev => ({ ...prev, [type]: '' }));
    }
  };

  const handleRemoveNote = (type: 'top' | 'heart' | 'base', index: number) => {
    setNotes(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // EAN Validation
    if (formData.ean.length !== 13 || !/^\d+$/.test(formData.ean)) {
      toast.error("O EAN deve conter exatamente 13 dígitos numéricos.");
      return;
    }

    if (notes.top.length === 0 || notes.heart.length === 0 || notes.base.length === 0) {
      toast.error("Você deve adicionar pelo menos uma nota olfativa em cada categoria (topo, coração, fundo).");
      return;
    }

    try {
      await brandService.createProduct({
        ...formData,
        top_notes: notes.top,
        heart_notes: notes.heart,
        base_notes: notes.base,
        brand: { id: 0, name: '' } as any // backend will associate with current brand
      });
      toast.success("Perfume cadastrado com sucesso!");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Erro ao cadastrar perfume");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23282D]/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#E6E1D2]">
          <h2 className="text-xl font-extrabold text-[#23282D]">Cadastrar Novo Perfume</h2>
          <button onClick={onClose} className="text-[#93927F] hover:text-[#23282D]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[#354B5E] mb-1.5">Nome do Perfume</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-[#E6E1D2] bg-[#F5F3E9]/50 focus:border-[#354B5E] focus:bg-white outline-none transition-all text-[14px]"
                placeholder="Ex: Sauvage"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#354B5E] mb-1.5">EAN (13 dígitos)</label>
              <input
                required
                type="text"
                maxLength={13}
                value={formData.ean}
                onChange={e => setFormData({ ...formData, ean: e.target.value.replace(/\D/g, '') })}
                className="w-full h-11 px-4 rounded-xl border border-[#E6E1D2] bg-[#F5F3E9]/50 focus:border-[#354B5E] focus:bg-white outline-none transition-all text-[14px]"
                placeholder="0000000000000"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#354B5E] mb-1.5">Código ANVISA</label>
              <input
                required
                type="text"
                value={formData.anvisa_code}
                onChange={e => setFormData({ ...formData, anvisa_code: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-[#E6E1D2] bg-[#F5F3E9]/50 focus:border-[#354B5E] focus:bg-white outline-none transition-all text-[14px]"
                placeholder="Ex: 25351..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#354B5E] mb-1.5">Família Olfativa</label>
              <select
                value={formData.olfactory_family}
                onChange={e => setFormData({ ...formData, olfactory_family: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-[#E6E1D2] bg-[#F5F3E9]/50 focus:border-[#354B5E] focus:bg-white outline-none transition-all text-[14px]"
              >
                <option value="Amadeirado">Amadeirado</option>
                <option value="Cítrico">Cítrico</option>
                <option value="Floral">Floral</option>
                <option value="Oriental">Oriental</option>
                <option value="Fougère">Fougère</option>
                <option value="Chipre">Chipre</option>
                <option value="Couro">Couro</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#354B5E] mb-1.5">URL da Imagem</label>
              <input
                required
                type="url"
                value={formData.image_url}
                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-[#E6E1D2] bg-[#F5F3E9]/50 focus:border-[#354B5E] focus:bg-white outline-none transition-all text-[14px]"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#354B5E] mb-1.5">Descrição Curta</label>
              <textarea
                required
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-4 rounded-xl border border-[#E6E1D2] bg-[#F5F3E9]/50 focus:border-[#354B5E] focus:bg-white outline-none transition-all text-[14px]"
                placeholder="Uma breve descrição..."
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#E6E1D2]">
            <h3 className="font-bold text-[#263847]">Pirâmide Olfativa</h3>
            
            {/* Notas de Topo */}
            <div>
              <label className="block text-sm font-bold text-[#5A6067] mb-1.5">Notas de Saída (Topo)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentNote.top}
                  onChange={e => setCurrentNote({ ...currentNote, top: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNote('top'); } }}
                  className="flex-1 h-10 px-3 rounded-lg border border-[#E6E1D2] outline-none text-[13px]"
                  placeholder="Ex: Bergamota (pressione Enter)"
                />
                <button type="button" onClick={() => handleAddNote('top')} className="px-4 bg-[#E9EDF0] text-[#354B5E] rounded-lg text-sm font-bold">Adicionar</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {notes.top.map((note, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 bg-[#F5F3E9] border border-[#E6E1D2] px-2.5 py-1 rounded-full text-[12px] font-semibold text-[#354B5E]">
                    {note}
                    <button type="button" onClick={() => handleRemoveNote('top', i)} className="text-[#A24726] hover:text-red-700">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Notas de Coração */}
            <div>
              <label className="block text-sm font-bold text-[#5A6067] mb-1.5">Notas de Coração</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentNote.heart}
                  onChange={e => setCurrentNote({ ...currentNote, heart: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNote('heart'); } }}
                  className="flex-1 h-10 px-3 rounded-lg border border-[#E6E1D2] outline-none text-[13px]"
                  placeholder="Ex: Lavanda (pressione Enter)"
                />
                <button type="button" onClick={() => handleAddNote('heart')} className="px-4 bg-[#E9EDF0] text-[#354B5E] rounded-lg text-sm font-bold">Adicionar</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {notes.heart.map((note, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 bg-[#F5F3E9] border border-[#E6E1D2] px-2.5 py-1 rounded-full text-[12px] font-semibold text-[#354B5E]">
                    {note}
                    <button type="button" onClick={() => handleRemoveNote('heart', i)} className="text-[#A24726] hover:text-red-700">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Notas de Fundo */}
            <div>
              <label className="block text-sm font-bold text-[#5A6067] mb-1.5">Notas de Fundo (Base)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentNote.base}
                  onChange={e => setCurrentNote({ ...currentNote, base: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNote('base'); } }}
                  className="flex-1 h-10 px-3 rounded-lg border border-[#E6E1D2] outline-none text-[13px]"
                  placeholder="Ex: Ambroxan (pressione Enter)"
                />
                <button type="button" onClick={() => handleAddNote('base')} className="px-4 bg-[#E9EDF0] text-[#354B5E] rounded-lg text-sm font-bold">Adicionar</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {notes.base.map((note, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 bg-[#F5F3E9] border border-[#E6E1D2] px-2.5 py-1 rounded-full text-[12px] font-semibold text-[#354B5E]">
                    {note}
                    <button type="button" onClick={() => handleRemoveNote('base', i)} className="text-[#A24726] hover:text-red-700">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E6E1D2]">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-[#5A6067] hover:bg-[#F5F3E9] transition-colors text-[14px]">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-[#354B5E] text-white hover:bg-[#263847] transition-colors text-[14px]">
              Cadastrar Perfume
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
