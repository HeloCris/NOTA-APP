import { useState, useRef } from "react";

export function SettingsTab() {
    const [logoStr, setLogoStr] = useState<string | null>(null);
    const [coverStr, setCoverStr] = useState<string | null>(null);
    const [cnpjError, setCnpjError] = useState(false);
    const [bio, setBio] = useState("Especialistas em perfumaria de nicho, decants exclusivos e fragrâncias autorais selecionadas a dedo.");

    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const file = evt.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => setLogoStr(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleCoverUpload = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const file = evt.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => setCoverStr(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const maskCnpj = (val: string) => {
        let v = val.replace(/\D/g, '').slice(0, 14);
        if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
        else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
        else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
        else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
        return v;
    };

    const validateCnpj = (val: string) => {
        const digits = val.replace(/\D/g, '');
        setCnpjError(digits.length > 0 && digits.length !== 14);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
                <div>
                    <h1 className="text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em] font-jakarta">Configurações da Loja</h1>
                    <p className="text-[13px] text-[#5A6067] m-0">Esses dados aparecem na sua vitrine e no cabeçalho do Hub.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-[22px] items-start">
                <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] p-[28px_30px]">
                    <h3 className="text-[16.5px] font-extrabold mb-1 text-[#23282D]">Perfil da Loja</h3>
                    <p className="text-[12.5px] text-[#5A6067] mb-[22px]">Nome, identidade visual e bio olfativa que os clientes vão ver.</p>

                    <div className="flex gap-5 mb-[26px]">
                        <div className="flex-none">
                            <label className="block text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold mb-[9px]">Logo</label>
                            <div onClick={() => logoInputRef.current?.click()} className="w-[88px] h-[88px] rounded-[18px] border-2 border-dashed border-[#E6E1D2] bg-[#F5F3E9] flex items-center justify-center cursor-pointer relative overflow-hidden hover:border-[#354B5E] transition-colors">
                                {logoStr ? <img src={logoStr} alt="Logo" className="w-full h-full object-cover" /> : <svg className="w-[22px] h-[22px] text-[#93927F]"><use href="#ic-image" /></svg>}
                            </div>
                            <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            <div className="text-[10.5px] text-[#93927F] mt-[7px]">PNG, 512×512px</div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold mb-[9px]">Capa da Loja</label>
                            <div onClick={() => coverInputRef.current?.click()} className="h-[88px] rounded-[14px] border-2 border-dashed border-[#E6E1D2] bg-[#F5F3E9] flex items-center justify-center cursor-pointer gap-2 text-[#93927F] text-[12px] font-semibold relative overflow-hidden hover:border-[#354B5E] transition-colors">
                                {coverStr ? <img src={coverStr} alt="Capa" className="absolute inset-0 w-full h-full object-cover" /> : <><svg className="w-[18px] h-[18px]"><use href="#ic-image" /></svg><span>Enviar imagem de capa</span></>}
                            </div>
                            <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={handleCoverUpload} />
                            <div className="text-[10.5px] text-[#93927F] mt-[7px]">Recomendado 1200×300px</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 mb-4">
                            <label className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold">Nome Fantasia</label>
                            <input type="text" defaultValue="Maison d'Essence" className="font-inter text-[13px] px-[13px] py-[11px] border-[1.5px] border-[#E6E1D2] rounded-lg bg-white outline-none text-[#23282D] focus:border-[#354B5E] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5 mb-4">
                            <label className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold">Razão Social</label>
                            <input type="text" placeholder="Maison d'Essence Perfumaria LTDA" className="font-inter text-[13px] px-[13px] py-[11px] border-[1.5px] border-[#E6E1D2] rounded-lg bg-white outline-none text-[#23282D] focus:border-[#354B5E] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5 mb-4">
                            <label className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold">CNPJ</label>
                            <input type="text" placeholder="00.000.000/0000-00" onChange={(e) => e.target.value = maskCnpj(e.target.value)} onBlur={(e) => validateCnpj(e.target.value)} className={`font-inter text-[13px] px-[13px] py-[11px] border-[1.5px] rounded-lg bg-white outline-none text-[#23282D] transition-colors ${cnpjError ? 'border-[#A24726]' : 'border-[#E6E1D2] focus:border-[#354B5E]'}`} />
                            {cnpjError && <div className="text-[11px] text-[#A24726] font-semibold mt-1">CNPJ inválido — verifique o formato.</div>}
                        </div>
                        <div className="flex flex-col gap-1.5 mb-4">
                            <label className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold">Telefone</label>
                            <input type="text" placeholder="(11) 99999-0000" className="font-inter text-[13px] px-[13px] py-[11px] border-[1.5px] border-[#E6E1D2] rounded-lg bg-white outline-none text-[#23282D] focus:border-[#354B5E] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5 mb-4 col-span-1 sm:col-span-2">
                            <label className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold">Bio Olfativa da Loja</label>
                            <textarea rows={4} maxLength={220} value={bio} onChange={(e) => setBio(e.target.value)} className="font-inter text-[13px] px-[13px] py-[11px] border-[1.5px] border-[#E6E1D2] rounded-lg bg-white outline-none text-[#23282D] focus:border-[#354B5E] transition-colors resize-y"></textarea>
                            <div className="text-[10.5px] text-[#93927F] text-right">{bio.length}/220</div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2 border-t border-[#EFEBDD] mt-1.5">
                        <button className="font-jakarta font-bold text-[13px] rounded-full px-5 py-[11px] bg-white text-[#23282D] border border-[#E6E1D2] hover:border-[#23282D] transition-colors">Cancelar</button>
                        <button className="font-jakarta font-bold text-[13px] rounded-full px-5 py-[11px] bg-[#354B5E] text-white hover:bg-[#263847] transition-colors flex items-center gap-2">
                            <svg className="w-[15px] h-[15px]"><use href="#ic-check" /></svg> Salvar Perfil da Loja
                        </button>
                    </div>
                </div>

                <div className="bg-[#F5E7DE] border border-[rgba(168,90,56,0.12)] rounded-[20px] p-[22px_22px_24px]">
                    <h4 className="text-[13.5px] font-extrabold text-[#7E4228] mb-3 flex items-center gap-2 font-jakarta">
                        <svg className="w-4 h-4"><use href="#ic-lightbulb" /></svg> Dicas para sua vitrine
                    </h4>
                    <ul className="m-0 pl-[18px] text-[12px] text-[#5A6067] leading-[1.9] list-disc">
                        <li>Lojas com logo cadastrada recebem 2x mais visitas.</li>
                        <li>Uma bio olfativa clara ajuda o cliente a entender sua curadoria.</li>
                        <li>O CNPJ é validado automaticamente e não fica público.</li>
                        <li>Alterações aparecem na sua vitrine em tempo real.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}