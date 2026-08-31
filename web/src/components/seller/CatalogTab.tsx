import { useState } from "react";

export function CatalogTab() {
    const [items, setItems] = useState([
        { id: 1, icon: "#bt-libre", name: "Libre", brand: "Yves Saint Laurent", spec: "EDP · 50ml", price: "R$ 620,00", qty: 2, active: true, low: false },
        { id: 2, icon: "#bt-baccarat", name: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", spec: "EDP · 70ml", price: "R$ 1.890,00", qty: 14, active: true, low: false },
        { id: 3, icon: "#bt-oudwood", name: "Oud Wood", brand: "Tom Ford", spec: "EDP · 100ml", price: "R$ 1.540,00", qty: 1, active: true, low: true },
        { id: 4, icon: "#bt-essencia", name: "Essência do Brasil", brand: "Natura", spec: "EDT · 100ml", price: "R$ 289,00", qty: 27, active: false, low: false },
    ]);

    const updateQty = (id: number, delta: number) => {
        setItems(items.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item));
    };

    const toggleActive = (id: number) => {
        setItems(items.map(item => item.id === id ? { ...item, active: !item.active } : item));
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
                <div>
                    <h1 className="text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em] font-jakarta">Meus Perfumes</h1>
                    <p className="text-[13px] text-[#5A6067] m-0">18 perfumes cadastrados · 2 com estoque baixo</p>
                </div>
                <div className="flex gap-2.5">
                    <button className="font-jakarta font-bold text-[13px] rounded-full px-5 py-[11px] inline-flex items-center gap-2 whitespace-nowrap bg-[#354B5E] text-white hover:bg-[#263847] transition-colors">
                        <svg className="w-[15px] h-[15px]"><use href="#ic-plus" /></svg> Adicionar Perfume
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3.5 flex-wrap mb-5">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-2 bg-white border border-[#E6E1D2] rounded-xl px-3.5 py-[9px] min-w-[220px]">
                        <svg className="w-[15px] h-[15px] text-[#93927F]"><use href="#ic-search" /></svg>
                        <input type="text" placeholder="Buscar por nome ou marca..." className="border-none outline-none bg-transparent text-[12.5px] w-full" />
                    </div>
                    <select className="appearance-none font-inter text-[12.5px] font-semibold text-[#5A6067] bg-white border border-[#E6E1D2] rounded-xl py-[9px] pl-[13px] pr-[30px] cursor-pointer outline-none focus:border-[#354B5E]" style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2393927F' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '13px' }}>
                        <option>Concentração</option><option>EDP</option><option>EDT</option><option>Decant</option>
                    </select>
                    <select className="appearance-none font-inter text-[12.5px] font-semibold text-[#5A6067] bg-white border border-[#E6E1D2] rounded-xl py-[9px] pl-[13px] pr-[30px] cursor-pointer outline-none focus:border-[#354B5E]" style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2393927F' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '13px' }}>
                        <option>Status</option><option>Ativo</option><option>Esgotado</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Produto</th>
                                <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Concentração / Volume</th>
                                <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Preço</th>
                                <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Estoque</th>
                                <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Status</th>
                                <th className="text-right text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-[#FBFAF6] transition-colors border-b border-[#EFEBDD] last:border-0">
                                    <td className="p-[14px_22px] align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[34px] h-[58px] flex items-center justify-center flex-shrink-0 bg-[#F5F3E9] rounded-lg">
                                                <svg className="h-[48px] w-auto"><use href={item.icon} /></svg>
                                            </div>
                                            <div>
                                                <div className="font-bold text-[13px] text-[#23282D]">{item.name}</div>
                                                <div className="text-[11px] text-[#93927F]">{item.brand}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-[14px_22px] align-middle text-[13px]">{item.spec}</td>
                                    <td className="p-[14px_22px] align-middle font-semibold text-[13px]">{item.price}</td>
                                    <td className="p-[14px_22px] align-middle">
                                        <div className="flex items-center border border-[#E6E1D2] rounded-full w-fit overflow-hidden bg-white">
                                            <button onClick={() => updateQty(item.id, -1)} className="w-[26px] h-[26px] border-none bg-[#F5F3E9] text-[#5A6067] font-extrabold text-[14px] flex items-center justify-center hover:bg-[#E9EDF0] hover:text-[#354B5E] transition-colors">−</button>
                                            <span className={`w-[32px] text-center text-[12.5px] font-bold ${item.low || item.qty === 0 ? 'text-[#A24726]' : 'text-[#23282D]'}`}>{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="w-[26px] h-[26px] border-none bg-[#F5F3E9] text-[#5A6067] font-extrabold text-[14px] flex items-center justify-center hover:bg-[#E9EDF0] hover:text-[#354B5E] transition-colors">+</button>
                                        </div>
                                    </td>
                                    <td className="p-[14px_22px] align-middle">
                                        <div onClick={() => toggleActive(item.id)} className={`w-[36px] h-[20px] rounded-full relative cursor-pointer inline-block transition-colors duration-200 ${item.active ? 'bg-[#5C6B4E]' : 'bg-[#D8D5CE]'}`}>
                                            <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white transition-all duration-200 shadow-sm ${item.active ? 'left-[18px]' : 'left-[2px]'}`}></div>
                                        </div>
                                    </td>
                                    <td className="p-[14px_22px] align-middle">
                                        <div className="flex gap-1.5 justify-end">
                                            <button className="w-[28px] h-[28px] rounded-lg border border-[#E6E1D2] bg-white flex items-center justify-center text-[#5A6067] hover:border-[#23282D] hover:text-[#23282D] transition-colors">
                                                <svg className="w-[13.5px] h-[13.5px]"><use href="#ic-edit" /></svg>
                                            </button>
                                            <button className="w-[28px] h-[28px] rounded-lg border border-[#E6E1D2] bg-white flex items-center justify-center text-[#5A6067] hover:border-[#A24726] hover:text-[#A24726] transition-colors">
                                                <svg className="w-[13.5px] h-[13.5px]"><use href="#ic-trash" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between p-[14px_22px] text-[12px] text-[#93927F] border-t border-[#EFEBDD]">
                    <span>Mostrando 4 de 18 perfumes</span>
                    <div className="flex gap-1.5">
                        <button className="w-[26px] h-[26px] rounded-md border border-[#354B5E] bg-[#354B5E] text-[11.5px] font-bold text-white flex items-center justify-center">1</button>
                        <button className="w-[26px] h-[26px] rounded-md border border-[#E6E1D2] bg-white text-[11.5px] font-bold text-[#5A6067] flex items-center justify-center hover:border-[#23282D] hover:text-[#23282D]">2</button>
                        <button className="w-[26px] h-[26px] rounded-md border border-[#E6E1D2] bg-white text-[11.5px] font-bold text-[#5A6067] flex items-center justify-center hover:border-[#23282D] hover:text-[#23282D]">3</button>
                    </div>
                </div>
            </div>
        </div>
    );
}