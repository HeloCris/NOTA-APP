export function DashboardTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
                <div>
                    <h1 className="text-[27px] font-extrabold text-[#263847] mb-1 tracking-[-0.01em] font-jakarta">Visão Geral</h1>
                    <p className="text-[13px] text-[#5A6067] m-0">Bem-vinda de volta. Aqui está o desempenho da sua loja hoje.</p>
                </div>
            </div>

            <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] p-[22px_26px] flex items-center gap-[18px] mb-[22px]">
                <div className="w-[64px] h-[64px] rounded-2xl bg-[#354B5E] text-white flex-shrink-0 flex items-center justify-center font-jakarta font-extrabold text-[24px] overflow-hidden">
                    M
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-[20px] font-extrabold text-[#23282D] flex items-center gap-2.5 flex-wrap font-jakarta">
                        Maison d'Essence
                        <span className="inline-flex items-center gap-1.5 bg-[#EDF0E7] text-[#454F3A] text-[11px] font-bold px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3"><use href="#ic-check-badge" /></svg> Vendedor Verificado
                        </span>
                    </h2>
                    <div className="text-[12.5px] text-[#93927F] mt-1.5">Membro desde 2023 · Perfumaria de nicho e decants autorais</div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="font-jakarta text-[20px] font-extrabold text-[#263847]">4.9 ★</div>
                    <div className="text-[10.5px] text-[#93927F] font-semibold uppercase tracking-[0.05em]">Avaliação</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-[22px]">
                {[
                    { icon: "#ic-chart", trend: "12%", up: true, val: "R$ 45,2K", lbl: "Faturamento (mês)", foot: "vs. mês anterior" },
                    { icon: "#ic-box", trend: "5%", up: false, val: "124", lbl: "Pedidos Pendentes", foot: "vs. semana anterior" },
                    { icon: "#ic-box", trend: "Atenção", alert: true, val: "3", lbl: "Alertas de Estoque", foot: "Itens abaixo do mínimo" },
                    { icon: "#ic-eye-kpi", trend: "24%", up: true, val: "8.4K", lbl: "Visualizações (loja)", foot: "vs. mês anterior" },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white border border-[#EFEBDD] rounded-[18px] p-5 relative overflow-hidden shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
                        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${kpi.alert ? 'from-[#A85A38]' : 'from-[#354B5E]'} to-transparent`}></div>
                        <div className="flex items-center justify-between mb-3.5">
                            <div className={`w-[38px] h-[38px] rounded-[11px] flex items-center justify-center ${kpi.alert ? 'bg-[#F5E7DE] text-[#7E4228]' : 'bg-[#E9EDF0] text-[#354B5E]'}`}>
                                <svg className="w-[19px] h-[19px]"><use href={kpi.icon} /></svg>
                            </div>
                            <div className={`text-[11px] font-extrabold px-2 py-[3px] rounded-full flex items-center gap-[3px] ${kpi.up ? 'bg-[#EDF0E7] text-[#454F3A]' : 'bg-[#FBEEE7] text-[#A24726]'}`}>
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
                            <svg viewBox="0 0 700 200" preserveAspectRatio="none" className="w-full h-auto block">
                                <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#354B5E" stopOpacity=".22" /><stop offset="100%" stopColor="#354B5E" stopOpacity="0" /></linearGradient></defs>
                                <g stroke="#F0EEE5" strokeWidth="1">
                                    <line x1="0" y1="15" x2="700" y2="15" /><line x1="0" y1="65" x2="700" y2="65" /><line x1="0" y1="115" x2="700" y2="115" /><line x1="0" y1="155" x2="700" y2="155" />
                                </g>
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
                        </div>
                    </div>

                    <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)] overflow-hidden">
                        <div className="flex items-center justify-between p-[20px_22px_12px]">
                            <h3 className="text-[16.5px] font-extrabold m-0 text-[#23282D]">Pedidos Recentes</h3>
                            <span className="text-[11.5px] font-bold text-[#354B5E] cursor-pointer hover:underline">Ver Todos &rarr;</span>
                        </div>
                        <div className="overflow-x-auto">
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
                                    {[
                                        { id: "#ORD-8921", date: "Hoje, 10:12", client: "Isabella M.", frag: "Santal Majuscule", vol: "100ml", val: "R$ 840,00", st: "Pendente", stClass: "bg-[#FBEEE7] text-[#A24726]" },
                                        { id: "#ORD-8920", date: "Hoje, 08:47", client: "Ricardo S.", frag: "Oud Wood Intense", vol: "50ml", val: "R$ 1.250,00", st: "Em Separação", stClass: "bg-[#F5E7DE] text-[#7E4228]" },
                                        { id: "#ORD-8919", date: "Ontem, 19:30", client: "Camila R.", frag: "Rose Privée", vol: "50ml", val: "R$ 980,00", st: "Enviado", stClass: "bg-[#EDF0E7] text-[#454F3A]" },
                                    ].map((row, i) => (
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
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#EFEBDD] rounded-[20px] shadow-[0_1px_3px_rgba(35,40,45,0.06)]">
                    <div className="p-[18px_22px_20px] border-b border-[#EFEBDD]">
                        <h3 className="text-[15px] font-extrabold pb-3 text-[#23282D] m-0">Top Perfumes</h3>
                        {[
                            { icon: "#bt-baccarat", name: "Baccarat Rouge 540", brand: "Maison F. Kurkdjian", pct: "82%", val: "32%" },
                            { icon: "#bt-libre", name: "Libre EDP", brand: "Yves Saint Laurent", pct: "64%", val: "24%" },
                            { icon: "#bt-oudwood", name: "Oud Wood", brand: "Tom Ford", pct: "47%", val: "18%" },
                        ].map((p, i) => (
                            <div key={i} className="flex items-center gap-3 py-2.5">
                                <div className="w-8 h-[56px] flex items-center justify-center flex-shrink-0"><svg className="h-[48px] w-auto"><use href={p.icon} /></svg></div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[12.5px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{p.name}</div>
                                    <div className="text-[10.5px] text-[#93927F] mb-1.5">{p.brand}</div>
                                    <div className="h-[5px] rounded-full bg-[#EFEBDD] overflow-hidden"><div className="h-full bg-gradient-to-r from-[#263847] to-[#354B5E] rounded-full" style={{ width: p.pct }}></div></div>
                                </div>
                                <div className="text-[12px] font-extrabold text-[#23282D] w-[34px] text-right flex-shrink-0">{p.val}</div>
                            </div>
                        ))}
                    </div>
                    <div className="p-[18px_22px_20px]">
                        <h3 className="text-[15px] font-extrabold pb-3 text-[#23282D] m-0">Alerta de Reposição</h3>
                        {[
                            { icon: "#bt-libre", name: "Libre EDP 50ml", qty: "Restam 2 un." },
                            { icon: "#bt-oudwood", name: "Oud Wood 100ml", qty: "Restam 1 un." },
                        ].map((p, i) => (
                            <div key={i} className="flex items-center gap-3 py-2.5">
                                <div className="w-[28px] h-[48px] flex items-center justify-center flex-shrink-0"><svg className="h-[42px] w-auto"><use href={p.icon} /></svg></div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[12.5px] font-bold">{p.name}</div>
                                    <div className="text-[11px] text-[#A24726] font-bold">{p.qty}</div>
                                </div>
                                <button className="text-[11px] font-bold text-[#7E4228] whitespace-nowrap border border-[#A85A38] px-2.5 py-1 rounded-full hover:bg-[#F5E7DE] transition-colors">Repor</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}