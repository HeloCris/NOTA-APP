import { useState, useEffect } from "react";
import type { Store, DashboardData } from "../../types/store";
import { storeService } from "../../services/storeService";

interface DashboardTabProps {
    store: Store | null;
}

export function DashboardTab({ store }: DashboardTabProps) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const storeName = store?.name || "Sua Loja";
    const initial = storeName.charAt(0).toUpperCase();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const dashboardData = await storeService.getDashboardData();
                setData(dashboardData);
            } catch (err) {
                console.error("Erro ao carregar dados do dashboard", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (store) {
            fetchData();
        }
    }, [store]);

    if (isLoading || !data) {
        return (
            <div className="flex items-center justify-center py-20">
                <span className="w-8 h-8 border-4 border-[#354B5E]/20 border-t-[#354B5E] rounded-full animate-spin"></span>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!store?.is_active && (
                <div className="mb-6 bg-[#FEF0EB] border border-[#F5C9B3] rounded-[16px] p-[20px_24px] flex items-start gap-4">
                     <svg className="w-6 h-6 text-[#A24726] flex-shrink-0 mt-0.5"><use href="#ic-warning" /></svg>
                     <div>
                         <h3 className="text-[#7E4228] font-bold text-[15px] m-0 mb-1">Sua loja está inativa</h3>
                         <p className="text-[#A24726] text-[13px] m-0">Sua vitrine não está visível para os clientes e novos pedidos não podem ser feitos. Reative sua loja na aba Configurações.</p>
                     </div>
                 </div>
            )}

            <div className={!store?.is_active ? "pointer-events-none opacity-60 grayscale-[0.2]" : ""}>
                <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
                    <div>
                        <h1 className="text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em] font-jakarta">Visão Geral</h1>
                        <p className="text-[13px] text-[#5A6067] m-0">Bem-vinda de volta. Aqui está o desempenho da sua loja hoje.</p>
                    </div>
                </div>

            <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] p-[22px_26px] flex items-center gap-[18px] mb-[22px]">
                <div className="w-[64px] h-[64px] rounded-2xl bg-[#354B5E] text-white flex-shrink-0 flex items-center justify-center font-jakarta font-extrabold text-[24px] overflow-hidden">
                    {store?.logo_url ? (
                        <img src={store.logo_url} alt={storeName} className="w-full h-full object-cover" />
                    ) : (
                        initial
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-[20px] font-extrabold text-[#23282D] flex items-center gap-2.5 flex-wrap font-jakarta">
                        {storeName}
                        {data.is_verified && (
                            <span className="inline-flex items-center gap-1.5 bg-[#EDF0E7] text-[#454F3A] text-[11px] font-bold px-2.5 py-1 rounded-full">
                                <svg className="w-3 h-3"><use href="#ic-check-badge" /></svg> Vendedor Verificado
                            </span>
                        )}
                    </h2>
                    <div className="text-[12.5px] text-[#93927F] mt-1.5">
                        {store?.created_at ? `Membro desde ${new Date(store.created_at).getFullYear()}` : 'Membro novo'} · {store?.bio || 'Sua bio olfativa aparecerá aqui'}
                    </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <span className="font-jakarta text-[20px] font-extrabold text-[#263847]">
                            {data.rating > 0 ? data.rating.toFixed(1) : "Novo"}
                        </span>
                        <svg className="w-[16px] h-[16px] text-[#263847]" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                    <div className="text-[10.5px] text-[#93927F] font-semibold uppercase tracking-[0.05em] pr-[2px]">Avaliação</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-[22px]">
                {[
                    { icon: "#ic-chart", trend: "0%", up: true, val: `R$ ${(data.kpis.revenue_month / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, lbl: "Faturamento (mês)", foot: "vs. mês anterior" },
                    { icon: "#ic-box", trend: "0%", up: true, val: data.kpis.pending_orders.toString(), lbl: "Pedidos Pendentes", foot: "vs. semana anterior" },
                    { icon: "#ic-box", trend: "Atenção", alert: true, val: data.kpis.stock_alerts.toString(), lbl: "Alertas de Estoque", foot: "Itens abaixo do mínimo" },
                    { icon: "#ic-eye-kpi", trend: "0%", up: true, val: data.kpis.store_views.toString(), lbl: "Visualizações (loja)", foot: "vs. mês anterior" },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white border border-[#EFEBDD] rounded-[18px] p-5 relative overflow-hidden shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
                        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${kpi.alert ? 'from-[#A85A38]' : 'from-[#354B5E]'} to-transparent`}></div>
                        <div className="flex items-center justify-between mb-3.5">
                            <div className={`w-[38px] h-[38px] rounded-[11px] flex items-center justify-center ${kpi.alert ? 'bg-[#F5E7DE] text-[#7E4228]' : 'bg-[#E9EDF0] text-[#354B5E]'}`}>
                                <svg className="w-[19px] h-[19px]"><use href={kpi.icon} /></svg>
                            </div>
                            <div className={`text-[11px] font-extrabold px-2 py-[3px] rounded-full flex items-center gap-[3px] ${kpi.alert ? 'bg-[#FBEEE7] text-[#A24726]' : kpi.up ? 'bg-[#EDF0E7] text-[#454F3A]' : 'bg-[#FBEEE7] text-[#A24726]'}`}>
                                {!kpi.alert && <svg className="w-2.5 h-2.5"><use href={kpi.up ? "#ic-arrow-up" : "#ic-arrow-down"} /></svg>}
                                {kpi.trend}
                            </div>
                        </div>
                        <div className="font-jakarta text-[25px] font-extrabold text-[#23282D] leading-[1.1]">{kpi.val}</div>
                        <div className="text-[12px] text-[#5A6067] mt-1.5 font-semibold">{kpi.lbl}</div>
                        <div className="text-[11px] text-[#93927F] mt-2">{kpi.foot}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-[22px] items-start">
                <div className="space-y-[22px]">
                    <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
                        <div className="flex items-center justify-between p-[20px_22px_4px]">
                            <h3 className="text-[16.5px] font-extrabold m-0 text-[#23282D]">Vendas da Semana</h3>
                            <div className="flex gap-1 bg-[#F5F3E9] border border-[#E6E1D2] rounded-full p-[3px]">
                                <span className="text-[11px] font-bold px-[11px] py-[5px] rounded-full bg-white text-[#23282D] shadow-[0_1px_3px_rgba(35,40,45,0.06)] cursor-pointer">7 dias</span>
                                <span className="text-[11px] font-bold px-[11px] py-[5px] rounded-full text-[#5A6067] cursor-pointer">30 dias</span>
                            </div>
                        </div>
                        <div className="p-[6px_22px_18px]">
                            {data.weekly_sales.reduce((a, b) => a + b, 0) === 0 ? (
                                <div className="h-[200px] flex items-center justify-center text-[13px] text-[#93927F] border-2 border-dashed border-[#E6E1D2] rounded-xl m-2">
                                    Nenhuma venda registrada nesta semana.
                                </div>
                            ) : (
                                <svg viewBox="0 0 700 200" preserveAspectRatio="none" className="w-full h-auto block">
                                    <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#354B5E" stopOpacity=".22" /><stop offset="100%" stopColor="#354B5E" stopOpacity="0" /></linearGradient></defs>
                                    <g stroke="#F0EEE5" strokeWidth="1">
                                        <line x1="0" y1="15" x2="700" y2="15" /><line x1="0" y1="65" x2="700" y2="65" /><line x1="0" y1="115" x2="700" y2="115" /><line x1="0" y1="155" x2="700" y2="155" />
                                    </g>
                                    {/* Exemplo estático (como placeholder se houvesse vendas) */}
                                    <path d="M0,140 C40,130 60,105 100,110 C140,115 160,75 200,70 C240,65 260,120 300,115 C340,110 360,55 400,50 C440,45 460,85 500,80 C540,75 560,35 600,30 L700,20 L700,200 L0,200 Z" fill="url(#chartFill)" />
                                    <path d="M0,140 C40,130 60,105 100,110 C140,115 160,75 200,70 C240,65 260,120 300,115 C340,110 360,55 400,50 C440,45 460,85 500,80 C540,75 560,35 600,30 L700,20" fill="none" stroke="#354B5E" strokeWidth="2.5" strokeLinecap="round" />
                                    <g fill="#354B5E">
                                        <circle cx="0" cy="140" r="3.5" /><circle cx="100" cy="110" r="3.5" /><circle cx="200" cy="70" r="3.5" /><circle cx="300" cy="115" r="3.5" /><circle cx="400" cy="50" r="3.5" /><circle cx="500" cy="80" r="3.5" /><circle cx="600" cy="30" r="4" stroke="#fff" strokeWidth="2" />
                                    </g>
                                    <g className="font-inter text-[11px]" fill="#93927F">
                                        <text x="0" y="192">Seg</text><text x="98" y="192">Ter</text><text x="196" y="192">Qua</text>
                                        <text x="296" y="192">Qui</text><text x="396" y="192">Sex</text><text x="496" y="192">Sáb</text><text x="600" y="192">Dom</text>
                                    </g>
                                </svg>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] overflow-hidden">
                        <div className="flex items-center justify-between p-[20px_22px_12px]">
                            <h3 className="text-[16.5px] font-extrabold m-0 text-[#23282D]">Pedidos Recentes</h3>
                            <span className="text-[11.5px] font-bold text-[#354B5E] cursor-pointer hover:underline">Ver Todos &rarr;</span>
                        </div>
                        <div className="overflow-x-auto">
                            {data.recent_orders.length === 0 ? (
                                <div className="p-8 text-center text-[13px] text-[#5A6067]">Nenhum pedido recente.</div>
                            ) : (
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">ID</th>
                                            <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Cliente</th>
                                            <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Fragrância + Volume</th>
                                            <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Valor</th>
                                            <th className="text-left text-[10.5px] tracking-[0.06em] uppercase text-[#93927F] font-bold p-[12px_22px] border-b border-[#EFEBDD]">Status</th>
                                            <th className="p-[12px_22px] border-b border-[#EFEBDD]"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.recent_orders.map((row, i) => (
                                            <tr key={i} className="hover:bg-[#FBFAF6] transition-colors border-b border-[#EFEBDD] last:border-0">
                                                <td className="p-[14px_22px] align-middle"><div className="font-bold text-[#23282D] text-[13px]">{row.id}</div><div className="text-[11px] text-[#93927F]">{row.date}</div></td>
                                                <td className="p-[14px_22px] align-middle font-semibold text-[13px]">{row.client}</td>
                                                <td className="p-[14px_22px] align-middle"><div className="font-semibold text-[13px]">{row.frag}</div><div className="text-[11px] text-[#93927F]">{row.vol}</div></td>
                                                <td className="p-[14px_22px] align-middle text-[13px]">{row.val}</td>
                                                <td className="p-[14px_22px] align-middle"><span className={`text-[11px] font-bold px-[11px] py-[5px] rounded-full inline-block ${row.stClass}`}>{row.st}</span></td>
                                                <td className="p-[14px_22px] align-middle text-right"><button className="w-[28px] h-[28px] rounded-lg border border-[#E6E1D2] bg-white inline-flex items-center justify-center text-[#5A6067] hover:border-[#23282D] transition-colors"><svg className="w-[17px] h-[17px]"><use href="#ic-dots" /></svg></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
                    <div className="p-[18px_22px_20px] border-b border-[#EFEBDD]">
                        <h3 className="text-[15px] font-extrabold pb-3 text-[#23282D] m-0">Top Perfumes</h3>
                        {data.top_perfumes.length === 0 ? (
                            <div className="py-6 text-center text-[12.5px] text-[#5A6067]">Nenhum dado de vendas ainda.</div>
                        ) : (
                            data.top_perfumes.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 py-2.5">
                                    <div className="w-8 h-[56px] flex items-center justify-center flex-shrink-0"><svg className="h-[48px] w-auto"><use href={p.icon} /></svg></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12.5px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{p.name}</div>
                                        <div className="text-[10.5px] text-[#93927F] mb-1.5">{p.brand}</div>
                                        <div className="h-[5px] rounded-full bg-[#EFEBDD] overflow-hidden"><div className="h-full bg-gradient-to-r from-[#263847] to-[#354B5E] rounded-full" style={{ width: p.pct }}></div></div>
                                    </div>
                                    <div className="text-[12px] font-extrabold text-[#23282D] w-[34px] text-right flex-shrink-0">{p.val}</div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-[18px_22px_20px]">
                        <h3 className="text-[15px] font-extrabold pb-3 text-[#23282D] m-0">Alerta de Reposição</h3>
                        {data.restock_alerts.length === 0 ? (
                            <div className="py-6 text-center text-[12.5px] text-[#5A6067]">Estoque em dia!</div>
                        ) : (
                            data.restock_alerts.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 py-2.5">
                                    <div className="w-[28px] h-[48px] flex items-center justify-center flex-shrink-0"><svg className="h-[42px] w-auto"><use href={p.icon} /></svg></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12.5px] font-bold">{p.name}</div>
                                        <div className="text-[11px] text-[#A24726] font-bold">{p.qty}</div>
                                    </div>
                                    <button className="text-[11px] font-bold text-[#7E4228] whitespace-nowrap border border-[#A85A38] px-2.5 py-1 rounded-full hover:bg-[#F5E7DE] transition-colors">Repor</button>
                                </div>
                            ))
                        )}
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}