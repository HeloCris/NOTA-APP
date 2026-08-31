import { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import type { Store, StoreUpdatePayload } from "../../types/store";
import { storeService } from "../../services/storeService";

const storeSchema = z.object({
    name: z.string().min(1, "O nome fantasia é obrigatório."),
    legal_name: z.string().optional(),
    cnpj: z.string().min(14, "O CNPJ é obrigatório e deve ser completo."),
    phone: z.string().optional(),
    bio: z.string().max(220, "A bio deve ter no máximo 220 caracteres.").optional(),
    vacation_mode: z.boolean(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

interface SettingsTabProps {
    store: Store | null;
    onStoreUpdated: () => void;
}

export function SettingsTab({ store, onStoreUpdated }: SettingsTabProps) {
    const [logoStr, setLogoStr] = useState<string | null>(null);
    const [coverStr, setCoverStr] = useState<string | null>(null);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivatePassword, setDeactivatePassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReactivating, setIsReactivating] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const canDeactivate = deactivatePassword.length >= 6;
    const isStoreDeactivated = store && !store.is_active;

    const maskCnpj = (val: string) => {
        let v = val.replace(/\D/g, '').slice(0, 14);
        if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
        else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
        else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
        else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
        return v;
    };

    const maskPhone = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 11);
        if (digits.length <= 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        }
        return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    };

    const { register, handleSubmit, setValue, watch, control, formState: { errors }, reset } = useForm<StoreFormValues>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            name: "",
            legal_name: "",
            cnpj: "",
            phone: "",
            bio: "",
            vacation_mode: false,
        }
    });

    useEffect(() => {
        if (store) {
            reset({
                name: store.name || "",
                legal_name: store.legal_name || "",
                cnpj: store.cnpj ? maskCnpj(store.cnpj) : "",
                phone: store.phone ? maskPhone(store.phone) : "",
                bio: store.bio || "",
                vacation_mode: store.vacation_mode || false,
            });
            if (store.logo_url) setLogoStr(store.logo_url);
            if (store.cover_url) setCoverStr(store.cover_url);
        }
    }, [store, reset]);

    const bioValue = watch("bio") || "";

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

    const handleReactivate = async () => {
        setIsReactivating(true);
        try {
            await storeService.updateStoreMe({ is_active: true });
            toast.success("Loja reativada com sucesso! Bem-vindo de volta.");
            onStoreUpdated();
        } catch (err) {
            toast.error("Erro ao reativar a loja.");
        } finally {
            setIsReactivating(false);
        }
    };

    const onSubmit = async (data: StoreFormValues) => {
        setIsSubmitting(true);
        try {
            const payload: StoreUpdatePayload = {
                ...data,
                cnpj: data.cnpj.replace(/\D/g, ''), // Envía só números
                phone: data.phone ? data.phone.replace(/\D/g, '') : undefined,
                logo_url: logoStr || undefined,
                cover_url: coverStr || undefined,
            };
            if (store) {
                await storeService.updateStoreMe(payload);
            } else {
                await storeService.createStore(payload);
            }
            toast.success("Perfil da loja salvo com sucesso!");
            onStoreUpdated();
        } catch (error: any) {
            if (error.response?.data?.cnpj) {
                toast.error("CNPJ já cadastrado ou inválido.");
            } else {
                toast.error("Erro ao salvar perfil da loja.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
                <div>
                    <h1 className="text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em] font-jakarta">Configurações da Loja</h1>
                    <p className="text-[13px] text-[#5A6067] m-0">Esses dados aparecem na sua vitrine e no cabeçalho do Hub.</p>
                </div>
            </div>

            {isStoreDeactivated && (
                <div className="mb-6 bg-[#FEF0EB] border border-[#F5C9B3] rounded-[16px] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#A24726]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#A24726]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-[14.5px] font-bold text-[#7E2D11] font-jakarta">Sua loja está inativa</h3>
                        <p className="text-[13px] text-[#A24726] mt-0.5">Nenhum cliente pode acessar a sua vitrine ou realizar novos pedidos. Você não pode editar as configurações enquanto a loja estiver desativada.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-[22px] items-start">
                <form 
                    onSubmit={handleSubmit(onSubmit)} 
                    className={`bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] p-[28px_30px] transition-all ${isStoreDeactivated ? 'opacity-60 pointer-events-none select-none grayscale-[0.2]' : ''}`}
                >
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-1.5 mb-2">
                            <label className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold">Nome Fantasia</label>
                            <input type="text" {...register("name")} className="font-inter text-[13px] px-[13px] py-[11px] border-[1.5px] border-[#E6E1D2] rounded-lg bg-white outline-none text-[#23282D] focus:border-[#354B5E] transition-colors" />
                            {errors.name && <div className="text-[11px] text-[#A24726] font-semibold">{errors.name.message}</div>}
                        </div>
                        <div className="flex flex-col gap-1.5 mb-2">
                            <label className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold">Razão Social</label>
                            <input type="text" {...register("legal_name")} placeholder="Opcional" className="font-inter text-[13px] px-[13px] py-[11px] border-[1.5px] border-[#E6E1D2] rounded-lg bg-white outline-none text-[#23282D] focus:border-[#354B5E] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5 mb-2">
                            <label className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold">CNPJ</label>
                            <input type="text" {...register("cnpj")} onChange={(e) => setValue('cnpj', maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" className={`font-inter text-[13px] px-[13px] py-[11px] border-[1.5px] rounded-lg bg-white outline-none text-[#23282D] transition-colors ${errors.cnpj ? 'border-[#A24726]' : 'border-[#E6E1D2] focus:border-[#354B5E]'}`} />
                            {errors.cnpj && <div className="text-[11px] text-[#A24726] font-semibold">{errors.cnpj.message}</div>}
                        </div>
                        <div className="flex flex-col gap-1.5 mb-2">
                            <label className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold">Telefone</label>
                            <input type="text" {...register("phone")} onChange={(e) => setValue('phone', maskPhone(e.target.value))} placeholder="(11) 99999-0000" className="font-inter text-[13px] px-[13px] py-[11px] border-[1.5px] border-[#E6E1D2] rounded-lg bg-white outline-none text-[#23282D] focus:border-[#354B5E] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5 mb-2 col-span-1 sm:col-span-2">
                            <label className="text-[10.5px] tracking-[0.08em] uppercase text-[#5A6067] font-bold">Bio Olfativa da Loja</label>
                            <textarea rows={4} maxLength={220} {...register("bio")} className="font-inter text-[13px] px-[13px] py-[11px] border-[1.5px] border-[#E6E1D2] rounded-lg bg-white outline-none text-[#23282D] focus:border-[#354B5E] transition-colors resize-y"></textarea>
                            <div className="flex justify-between items-center">
                                {errors.bio ? <div className="text-[11px] text-[#A24726] font-semibold">{errors.bio.message}</div> : <div/>}
                                <div className="text-[10.5px] text-[#93927F] text-right">{bioValue.length}/220</div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[#EFEBDD] pt-5 pb-2 mb-2">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h4 className="text-[14px] font-bold text-[#23282D] mb-0.5">Modo Férias</h4>
                                <p className="text-[12.5px] text-[#5A6067]">Pause temporariamente os pedidos na sua loja. Os clientes ainda poderão ver seus produtos, mas não poderão comprar.</p>
                            </div>
                            <Controller
                                name="vacation_mode"
                                control={control}
                                render={({ field }) => (
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={field.value}
                                        onClick={() => field.onChange(!field.value)}
                                        className={`relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${field.value ? 'bg-[#5C6B4E]' : 'bg-[#E6E1D2]'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${field.value ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                                    </button>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EFEBDD] mt-1.5">
                        <button type="button" onClick={() => reset()} className="font-jakarta font-bold text-[13px] rounded-full px-5 py-[11px] bg-white text-[#23282D] border border-[#E6E1D2] hover:border-[#23282D] transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="font-jakarta font-bold text-[13px] rounded-full px-5 py-[11px] bg-[#354B5E] text-white hover:bg-[#263847] transition-colors flex items-center gap-2 disabled:opacity-70">
                            {isSubmitting ? (
                                <span className="w-[15px] h-[15px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-[15px] h-[15px]"><use href="#ic-check" /></svg>
                            )}
                            Salvar Perfil da Loja
                        </button>
                    </div>
                </form>

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

            {/* Zona de Perigo / Reativação */}
            <div className={`mt-8 border rounded-[20px] overflow-hidden ${isStoreDeactivated ? 'border-[#B8CFAF]' : 'border-[#F0C4B0]'}`}>
                <div className={`${isStoreDeactivated ? 'bg-[#F0F5EE] border-[#B8CFAF]' : 'bg-[#FDF4F0] border-[#F0C4B0]'} px-[28px] py-[18px] border-b flex items-center gap-3`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isStoreDeactivated ? 'bg-[#5C6B4E]/10' : 'bg-[#A24726]/10'}`}>
                        {isStoreDeactivated ? (
                            <svg className="w-[16px] h-[16px] text-[#3A5C30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        ) : (
                            <svg className="w-[16px] h-[16px] text-[#A24726]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <div className={`text-[14px] font-extrabold font-jakarta ${isStoreDeactivated ? 'text-[#3A5C30]' : 'text-[#7E2D11]'}`}>
                            {isStoreDeactivated ? 'Zona de Reativação' : 'Zona de Perigo'}
                        </div>
                        <div className={`text-[11.5px] ${isStoreDeactivated ? 'text-[#5C6B4E]' : 'text-[#A24726]'}`}>
                            {isStoreDeactivated ? 'Traga sua loja de volta para a plataforma.' : 'Ações que afetam a visibilidade da sua loja — prossiga com cuidado.'}
                        </div>
                    </div>
                </div>
                <div className="bg-white px-[28px] py-[22px] flex items-center justify-between gap-6 flex-wrap">
                    <div>
                        <div className="text-[14px] font-bold text-[#23282D] mb-0.5">
                            {isStoreDeactivated ? 'Reativar minha loja no NŌTA' : 'Desativar minha loja no NŌTA'}
                        </div>
                        <div className="text-[12.5px] text-[#5A6067] max-w-[480px] leading-[1.6]">
                            {isStoreDeactivated 
                                ? 'Ao reativar, sua vitrine voltará a ficar pública e você poderá receber novos pedidos imediatamente.'
                                : 'Sua vitrine será removida da plataforma, seus perfumes ficarão ocultos e você não receberá novos pedidos. Os pedidos em andamento não serão afetados.'}
                        </div>
                    </div>
                    
                    {isStoreDeactivated ? (
                        <button
                            type="button"
                            onClick={handleReactivate}
                            disabled={isReactivating}
                            className="font-jakarta font-bold text-[13px] rounded-full px-6 py-[11px] border-2 border-transparent bg-[#5C6B4E] text-white hover:bg-[#4a573e] transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-2 disabled:opacity-70 shadow-sm"
                        >
                            {isReactivating ? (
                                <span className="w-[15px] h-[15px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            Reativar Loja
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowDeactivateModal(true)}
                            className="font-jakarta font-bold text-[13px] rounded-full px-5 py-[11px] border-2 border-[#A24726] text-[#A24726] bg-white hover:bg-[#FDF4F0] transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-2"
                        >
                            <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Desativar Loja
                        </button>
                    )}
                </div>
            </div>

            {/* Modal de confirmação para Desativar */}
            {showDeactivateModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-5"
                    onClick={() => { setShowDeactivateModal(false); setDeactivatePassword(""); setShowPassword(false); }}
                >
                    <div className="absolute inset-0 bg-[#0D1117]/70 backdrop-blur-md" />
                    <div
                        className="relative bg-white rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.32)] w-full max-w-[420px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-[6px] bg-gradient-to-r from-[#A24726] via-[#C4582E] to-[#A24726]" />

                        <div className="px-[32px] pt-[30px] pb-[32px]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-xl bg-[#FEF0EB] border border-[#F5C9B3] flex items-center justify-center flex-shrink-0">
                                    <svg className="w-[30px] h-[30px] text-[#A24726]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="font-jakarta text-[21px] font-extrabold text-[#1A1A1A] leading-tight tracking-[-0.01em]">Desativar sua loja?</h2>
                                    <p className="text-[13px] text-[#5A6067] leading-[1.7] mt-1.5">
                                        Sua vitrine ficará offline, seus perfumes serão ocultados e nenhum novo pedido poderá ser recebido. Você poderá <span className="font-semibold text-[#3A5C30]">reativar</span> sua loja a qualquer momento.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-[11px] tracking-[0.08em] uppercase font-bold text-[#5A6067] mb-2">
                                    Confirme sua senha para continuar
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={deactivatePassword}
                                        onChange={(e) => setDeactivatePassword(e.target.value)}
                                        placeholder="Digite sua senha"
                                        className="w-full font-inter text-[13.5px] px-4 py-3 pr-11 border-[1.5px] border-[#E6E1D2] rounded-xl bg-[#FAFAFA] outline-none text-[#23282D] focus:border-[#A24726] focus:bg-white transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#93927F] hover:text-[#5A6067] transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                <button
                                    type="button"
                                    disabled={!canDeactivate || isSubmitting}
                                    onClick={async () => {
                                        if (canDeactivate) {
                                            setIsSubmitting(true);
                                            try {
                                                await storeService.updateStoreMe({ is_active: false });
                                                toast.success("Sua loja foi desativada.");
                                                setShowDeactivateModal(false);
                                                onStoreUpdated();
                                            } catch (err) {
                                                toast.error("Erro ao desativar a loja.");
                                            } finally {
                                                setIsSubmitting(false);
                                            }
                                        }
                                    }}
                                    className={`w-full font-jakarta font-bold text-[14px] rounded-xl py-[13px] transition-all duration-200 flex items-center justify-center gap-2 ${
                                        canDeactivate
                                            ? 'bg-[#A24726] text-white hover:bg-[#8a3a1f] shadow-[0_4px_14px_rgba(162,71,38,0.35)] cursor-pointer'
                                            : 'bg-[#F0EDE8] text-[#B0A89E] cursor-not-allowed'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <span className="w-[15px] h-[15px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    )}
                                    Desativar minha loja
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowDeactivateModal(false); setDeactivatePassword(""); setShowPassword(false); }}
                                    className="w-full font-jakarta font-semibold text-[13.5px] py-[12px] rounded-xl text-[#5A6067] hover:text-[#23282D] hover:bg-[#F5F3F0] transition-colors"
                                >
                                    Cancelar, manter loja ativa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}