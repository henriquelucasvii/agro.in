import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import { api } from "../lib/api.ts";
import Sidebar from "../components/Sidebar.tsx";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { type RelatorioGerado, CHAVE_HISTORICO_RELATORIOS, reviveHistoricoRelatorios, tempoRelativo, } from "../hooks/relatorios";

// ============================================================
// Tipos
// ============================================================

interface PropriedadeResumo {
    nome: string;
    status: "Ativa" | "Inativa";
    areaTotalHa: number;
    talhoes: number;
}

interface FinanceiroResumo {
    saldoMes: number;
    historico: number[];
}

interface ProducaoResumo {
    colhendoTon: number;
    historico: number[]; 
}

interface EstoqueItem {
    nome: string;
    percentual: number; 
}

interface MetaResumo {
    titulo: string;
    atual: number;
    alvo: number;
    unidade: string;
    prazo: string;
}

interface DashboardData {
    propriedade: PropriedadeResumo | null;
    financeiro: FinanceiroResumo | null;
    producao: ProducaoResumo | null;
    estoque: EstoqueItem[];
    meta: MetaResumo | null;
}

const DASHBOARD_ACCENTS = {
    propriedade: "#2C7A3D",
    financeiro: "#4D98BC",
    producao: "#C8A229",
    estoque: "#956437",
    metas: "#B64C35",
    relatorios: "#617665",
} as const;

const DASHBOARD_VAZIO: DashboardData = {
    propriedade: null,
    financeiro: null,
    producao: null,
    estoque: [],
    meta: null,
};

const formatBRL = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });


function EmptyState({ label, cta, onClick }: { label: string; cta: string; onClick: () => void }) {
    return (
        <div className="flex h-full flex-col items-start justify-center gap-3 py-4">
            <p className="max-w-[240px] text-sm leading-5" style={{ color: "#647269" }}>{label}</p>
            <button
                onClick={onClick}
                className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors hover:bg-[#EDF3EC]"
                style={{ color: "#1F5B3A", borderColor: "#C7D5C7", background: "#FFFFFF" }}
            >
                <Plus size={13} /> {cta}
            </button>
        </div>
    );
}

function Card({
    accent,
    title,
    footer,
    onFooterClick,
    children,
}: {
    accent: string;
    title: string;
    footer?: string;
    onFooterClick?: () => void;
    children: ReactNode;
}) {


    return (

        <div
            className="flex min-h-[190px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_3px_9px_rgba(26,48,31,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_7px_18px_rgba(26,48,31,0.13)] sm:min-h-[224px]"
            style={{ border: "1px solid #D8E0D8" }}
        >
            <div className="h-1.5 shrink-0" style={{ background: accent }} />
            <div className="flex items-center justify-between px-4 pb-3 pt-4">
                <h3 className="text-[15px] font-semibold" style={{ color: "#25352B" }}>
                    {title}
                </h3>
                <ChevronRight size={15} style={{ color: "#9DAA9F" }} />
            </div>
            <div className="flex-1 px-4 pb-3">{children}</div>
            {footer && (
                <button
                    onClick={onFooterClick}
                    className="border-t px-4 py-2.5 text-left text-xs font-semibold transition-colors hover:bg-[#F5F7F3]"
                    style={{ borderColor: "#EFF3ED", color: accent }}
                >
                    {footer}
                </button>
            )}
        </div>
    );
}

function MiniAreaChart({ data, color }: { data: number[]; color: string }) {
    if (!data.length) return null;
    const w = 240;
    const h = 90;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1 || 1);
    const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
    const areaPoints = `0,${h} ${points} ${w},${h}`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
            <defs>
                <linearGradient id="financeiroGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={areaPoints} fill="url(#financeiroGradient)" />
            <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-2 h-24">
            {data.map((v, i) => (
                <div
                    key={i}
                    className="flex-1 rounded-md"
                    style={{ height: `${(v / max) * 100}%`, minHeight: 6, background: color }}
                />
            ))}
        </div>
    );
}

function ProgressBar({ label, percentual, color }: { label: string; percentual: number; color: string }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: "#46564B" }}>{label}</span>
                <span className="text-xs font-medium" style={{ color: "#647269" }}>{percentual}%</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: "#E4E9E3" }}>
                <div className="h-2 rounded-full" style={{ width: `${percentual}%`, background: color }} />
            </div>
        </div>
    );
}

function ProgressRing({ percentual, color }: { percentual: number; color: string }) {
    const size = 88;
    const stroke = 8;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(percentual, 100) / 100) * c;

    return (
        <svg width={size} height={size} className="shrink-0">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1E7E3" strokeWidth={stroke} />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={c}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize={18} fontWeight={700} fill="#25352B">
                {percentual}%
            </text>
        </svg>
    );
}

const formatPrazo = (data?: string | null) => {
    if (!data) return "Sem prazo definido";
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return "Sem prazo definido";
    const mes = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    return `${mes}/${d.getFullYear()}`;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const [historicoRelatorios] = useLocalStorage<RelatorioGerado[]>(
        CHAVE_HISTORICO_RELATORIOS,
        [],
        { version: 1, fromJSON: reviveHistoricoRelatorios }
    );

    const relatoriosRecentes = useMemo(
        () =>
            historicoRelatorios
                .filter((r) => r.status === "pronto")
                .sort((a, b) => b.geradoEm.getTime() - a.geradoEm.getTime())
                .slice(0, 4),
        [historicoRelatorios]
    );

    useEffect(() => {
        const carregarDashboard = async () => {
            try {
                const [propriedadesRes, estoqueRes, financeiroRes, metasRes, producaoRes] = await Promise.all([
                    api.get("/propriedades"),
                    api.get("/estoque"),
                    api.get("/financeiro"),
                    api.get("/metas"),
                    api.get("/producao")
                ]);

                const propriedades = propriedadesRes.data;
                const estoque = estoqueRes.data;
                const financeiro = financeiroRes.data;
                const metas = metasRes.data;
                const producao = producaoRes.data;

                const entradas = financeiro
                    .filter((item: any) => item.tipo === "entrada")
                    .reduce((total: number, item: any) => total + Number(item.valor), 0);

                const saidas = financeiro
                    .filter((item: any) => item.tipo === "saida")
                    .reduce((total: number, item: any) => total + Number(item.valor), 0);

                const saldoMes = entradas - saidas;

                const historicoFinanceiro: number[] = [...financeiro]
                    .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())
                    .reduce((acc: number[], item: any) => {
                        const ultimo = acc.length ? acc[acc.length - 1]! : 0;
                        const valor = item.tipo === "entrada" ? Number(item.valor) : -Number(item.valor);
                        acc.push(ultimo + valor);
                        return acc;
                    }, []);

                const primeiraPropriedade = propriedades[0] ?? null;
                const metaAtiva = metas.find((m: any) => m.status !== "concluida") ?? metas[0] ?? null;

                setData({
                    propriedade: primeiraPropriedade
                        ? {
                            nome: primeiraPropriedade.nome,
                            status: "Ativa",
                            areaTotalHa: primeiraPropriedade.area_total,
                            talhoes: propriedades.length,
                        }
                        : null,
                    financeiro: financeiro.length
                        ? { saldoMes, historico: historicoFinanceiro }
                        : null,
                    producao: producao.length
                        ? {
                            colhendoTon: producao
                                .reduce((s: number, p: any) => s + (p.area_utilizada ?? 0), 0),
                            historico: producao
                                .slice(-5)
                                .map((p: any) => p.area_utilizada ?? p.quantidade ?? 0),
                        }
                        : null,
                    estoque: estoque.map((item: any) => ({
                        nome: item.item,
                        percentual: item.quantidade_minima && item.quantidade_minima > 0
                            ? Math.min(Math.round((item.quantidade / item.quantidade_minima) * 100), 100)
                            : 100,
                    })),
                    meta: metaAtiva
                        ? {
                            titulo: metaAtiva.descricao,
                            atual: metaAtiva.valor_atual,
                            alvo: metaAtiva.valor_alvo,
                            unidade: metaAtiva.unidade,
                            prazo: metaAtiva.prazo,
                        }
                        : null,
                });
            } catch (error) {
                console.error("Erro ao carregar dashboard:", error);
                setData(DASHBOARD_VAZIO);
            } finally {
                setLoading(false);
            }
        };

        carregarDashboard();
    }, []);

    if (loading || !data) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#F5F6F2" }}>
                <p className="text-sm" style={{ color: "#647269" }}>Carregando dashboard...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full" style={{ background: "#F5F6F2" }}>
            <Sidebar />

            {/* Main */}
            <div className="flex-1 flex flex-col">

                <header className="bg-[#0F5317] px-4 pb-6 pt-6 sm:px-6 lg:px-10 lg:pb-7 lg:pt-8">
                    <h1 className="text-2xl font-bold text-[#83E092]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-white/65">
                        Visão geral da sua propriedade
                    </p>
                </header>

                <main className="grid flex-1 content-start grid-cols-1 gap-4 px-4 py-5 sm:px-6 md:grid-cols-2 lg:px-10 lg:py-7 xl:grid-cols-3">
                    {/* Propriedades */}
                    <Card
                        accent={DASHBOARD_ACCENTS.propriedade}
                        title="Propriedades"
                        footer={data.propriedade ? "Ver todas as propriedades" : undefined}
                        onFooterClick={() => navigate("/propriedade")}
                    >
                        {data.propriedade ? (
                            <div className="flex flex-col gap-2 pt-1">
                                <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "#F2F5F0" }}>
                                    <span className="text-sm font-medium" style={{ color: "#25352B" }}>{data.propriedade.nome}</span>
                                    <span
                                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: "#E8F3EA", color: "#1F5B3A" }}
                                    >
                                        {data.propriedade.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div className="rounded-lg px-3 py-2" style={{ background: "#F2F5F0" }}>
                                        <p className="text-[11px]" style={{ color: "#647269" }}>Área Total</p>
                                        <p className="text-sm font-semibold" style={{ color: "#25352B" }}>{data.propriedade.areaTotalHa} ha</p>
                                    </div>
                                    <div className="rounded-lg px-3 py-2" style={{ background: "#F2F5F0" }}>
                                        <p className="text-[11px]" style={{ color: "#647269" }}>Talhões</p>
                                        <p className="text-sm font-semibold" style={{ color: "#25352B" }}>{data.propriedade.talhoes}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <EmptyState label="Nenhuma propriedade cadastrada" cta="Cadastrar propriedade" onClick={() => navigate("/propriedade")} />
                        )}
                    </Card>

                    {/* Financeiro */}
                    <Card
                        accent={DASHBOARD_ACCENTS.financeiro}
                        title="Financeiro"
                        footer={data.financeiro ? "Ver extrato completo" : undefined}
                        onFooterClick={() => navigate("/financeiro")}
                    >
                        {data.financeiro ? (
                            <div className="pt-1">
                                <p className="text-xs" style={{ color: "#647269" }}>Saldo do mês</p>
                                <p className="text-xl font-bold" style={{ color: "#25352B" }}>{formatBRL(data.financeiro.saldoMes)}</p>
                                <div className="mt-2">
                                    <MiniAreaChart data={data.financeiro.historico} color={DASHBOARD_ACCENTS.financeiro} />
                                </div>
                            </div>
                        ) : (
                            <EmptyState label="Nenhum lançamento este mês" cta="Adicionar lançamento" onClick={() => navigate("/financeiro")} />
                        )}
                    </Card>

                    {/* Produção */}
                    <Card
                        accent={DASHBOARD_ACCENTS.producao}
                        title="Produção"
                        footer={data.producao ? "Ver extrato completo" : undefined}
                        onFooterClick={() => navigate("/producao")}
                    >
                        {data.producao ? (
                            <div className="pt-1">
                                <p className="text-xs" style={{ color: "#647269" }}>Área total utilizada (ha)</p>
                                <p className="text-xl font-bold mb-2" style={{ color: "#25352B" }}>{data.producao.colhendoTon} ha</p>
                                <MiniBarChart data={data.producao.historico} color={DASHBOARD_ACCENTS.producao} />
                            </div>
                        ) : (
                            <EmptyState label="Nenhum registro de produção" cta="Registrar produção" onClick={() => navigate("/producao/")} />
                        )}
                    </Card>

                    {/* Estoques */}
                    <Card
                        accent={DASHBOARD_ACCENTS.estoque}
                        title="Estoques"
                        footer={data.estoque.length ? "Ver todo o estoque" : undefined}
                        onFooterClick={() => navigate("/estoque")}
                    >
                        {data.estoque.length ? (
                            <div className="flex flex-col gap-3 pt-1">
                                {data.estoque.map((item) => (
                                    <ProgressBar key={item.nome} label={item.nome} percentual={item.percentual} color={DASHBOARD_ACCENTS.estoque} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState label="Estoque ainda não configurado" cta="Adicionar item" onClick={() => navigate("/estoque")} />
                        )}
                    </Card>

                    {/* Metas */}
                    <Card
                        accent={DASHBOARD_ACCENTS.metas}
                        title="Metas"
                        footer={data.meta ? "Ver todas as metas" : undefined}
                        onFooterClick={() => navigate("/meta")}
                    >
                        {data.meta ? (
                            <div className="flex items-center gap-4 pt-1">
                                <ProgressRing percentual={Math.round((data.meta.atual / data.meta.alvo) * 100)} color={DASHBOARD_ACCENTS.metas} />
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: "#25352B" }}>{data.meta.titulo}</p>
                                    <p className="text-xs mt-1" style={{ color: "#647269" }}>
                                        {data.meta.atual} / {data.meta.alvo} {data.meta.unidade} · Prazo - {formatPrazo(data.meta.prazo)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <EmptyState label="Nenhuma meta definida" cta="Criar meta" onClick={() => navigate("/meta")} />
                        )}
                    </Card>

                    <Card
                        accent={DASHBOARD_ACCENTS.relatorios}
                        title="Relatórios"
                        footer={relatoriosRecentes.length ? "Ver todos os relatórios" : undefined}
                        onFooterClick={() => navigate("/relatorios")}
                    >
                        {relatoriosRecentes.length ? (
                            <div className="flex flex-col gap-2 pt-1">
                                {relatoriosRecentes.map((relatorio) => (
                                    <button
                                        key={relatorio.id}
                                        onClick={() => navigate("/relatorios")}
                                        className="text-left rounded-lg px-3 py-2 transition-colors hover:brightness-95"
                                        style={{ background: "#F2F5F0" }}
                                    >
                                        <p className="text-sm font-medium" style={{ color: "#25352B" }}>{relatorio.titulo}</p>
                                        <p className="text-[11px]" style={{ color: "#647269" }}>{tempoRelativo(relatorio.geradoEm)}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <EmptyState label="Nenhum relatório gerado" cta="Gerar relatório" onClick={() => navigate("/relatorios/")} />
                        )}
                    </Card>
                </main>
            </div>
        </div>
    );
}
