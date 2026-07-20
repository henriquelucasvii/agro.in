import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight, Leaf} from "lucide-react";
import { api } from "../lib/api.ts";
import Sidebar from "../components/Sidebar.tsx";

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
    historico: number[]; // pontos usados no mini-gráfico
}

interface ProducaoResumo {
    colhendoTon: number;
    historico: number[]; // últimos registros p/ mini-gráfico de barras
}

interface EstoqueItem {
    nome: string;
    percentual: number; // 0-100
}

interface MetaResumo {
    titulo: string;
    atual: number;
    alvo: number;
    unidade: string;
    prazo: string;
}

interface RelatorioItem {
    titulo: string;
    atualizadoEm: string;
}

interface DashboardData {
    propriedade: PropriedadeResumo | null;
    financeiro: FinanceiroResumo | null;
    producao: ProducaoResumo | null;
    estoque: EstoqueItem[];
    meta: MetaResumo | null;
    relatorios: RelatorioItem[];
}

const DASHBOARD_VAZIO: DashboardData = {
    propriedade: null,
    financeiro: null,
    producao: null,
    estoque: [],
    meta: null,
    relatorios: [],
};

const formatBRL = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ============================================================
// Componentes de apoio
// ============================================================

function EmptyState({ label, cta, onClick }: { label: string; cta: string; onClick: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-2 py-6 text-center">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EFF5EC" }}>
                <Leaf size={16} style={{ color: "#8CA88A" }} />
            </div>
            <p className="text-sm" style={{ color: "#7A8A78" }}>{label}</p>
            <button
                onClick={onClick}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full mt-1 transition-colors hover:brightness-95"
                style={{ color: "#0D5006", background: "#EAF9EC" }}
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
            className="rounded-2xl bg-white flex flex-col overflow-hidden transition-shadow hover:shadow-md"
            style={{ border: "1px solid #E7E9E4", minHeight: 230 }}
        >
            <div className="h-1.5" style={{ background: accent }} />
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <h3 className="font-semibold text-[15px]" style={{ color: "#1A2E1A", fontFamily: "Montserrat, sans-serif" }}>
                    {title}
                </h3>
                <ChevronRight size={16} style={{ color: "#C7D0C4" }} />
            </div>
            <div className="flex-1 px-5 pb-2">{children}</div>
            {footer && (
                <button
                    onClick={onFooterClick}
                    className="text-left px-5 py-2.5 text-xs font-medium border-t hover:underline"
                    style={{ borderColor: "#F0F1EC", color: accent }}
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
                <span className="text-sm" style={{ color: "#3A4A38" }}>{label}</span>
                <span className="text-xs font-medium" style={{ color: "#8B978A" }}>{percentual}%</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: "#EDEFEA" }}>
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
            <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize={18} fontWeight={700} fill="#1A2E1A">
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

    useEffect(() => {

        const carregarDashboard = async () => {
            try {
                const [propriedadesRes, estoqueRes, financeiroRes, metasRes] = await Promise.all([
                    api.get("/propriedades"),
                    api.get("/estoque"),
                    api.get("/financeiro"),
                    api.get("/metas")
                ]);

                const propriedades = propriedadesRes.data;
                const estoque = estoqueRes.data;
                const financeiro = financeiroRes.data;
                const meta = metasRes.data;

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
                        const ultimo = acc.length ? acc[acc.length - 1] : 0;
                        const valor = item.tipo === "entrada" ? Number(item.valor) : -Number(item.valor);
                        acc.push(ultimo + valor);
                        return acc;
                    }, []);

                const primeiraPropriedade = propriedades[0] ?? null;

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
                    producao: null,
                    estoque: estoque.map((item: any) => ({
                        nome: item.item,
                        percentual: item.quantidade_minima && item.quantidade_minima > 0
                            ? Math.min(Math.round((item.quantidade / item.quantidade_minima) * 100), 100)
                            : 100,
                    })),
                    meta: meta.length > 0
                        ? {
                            titulo: meta[0].descricao,
                            atual: meta[0].valor_atual,
                            alvo: meta[0].valor_alvo,
                            unidade: meta[0].unidade, 
                            prazo: meta[0].prazo,
                        }
                        : null,
                    relatorios: [],
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
            <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#F7F8F5" }}>
                <p className="text-sm" style={{ color: "#7A8A78" }}>Carregando dashboard...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full" style={{background: "#F7F8F5" }}>
            <Sidebar />

            {/* Main */}
            <div className="flex-1 flex flex-col">

                <header className="px-10 pt-8 pb-6" style={{ background: "#0D5006" }}>
                    <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        Dashboard
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                        Visão geral da sua propriedade
                    </p>
                </header>

                <main className="px-10 py-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 flex-1">
                    {/* Propriedades */}
                    <Card
                        accent="#0D5006"
                        title="Propriedades"
                        footer={data.propriedade ? "Ver todas as propriedades" : undefined}
                        onFooterClick={() => navigate("/propriedade")}
                    >
                        {data.propriedade ? (
                            <div className="flex flex-col gap-2 pt-1">
                                <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "#F3F7F1" }}>
                                    <span className="text-sm font-medium" style={{ color: "#1A2E1A" }}>{data.propriedade.nome}</span>
                                    <span
                                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: "#EAF9EC", color: "#0D5006" }}
                                    >
                                        {data.propriedade.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div className="rounded-lg px-3 py-2" style={{ background: "#F3F7F1" }}>
                                        <p className="text-[11px]" style={{ color: "#8B978A" }}>Área Total</p>
                                        <p className="text-sm font-semibold" style={{ color: "#1A2E1A" }}>{data.propriedade.areaTotalHa} ha</p>
                                    </div>
                                    <div className="rounded-lg px-3 py-2" style={{ background: "#F3F7F1" }}>
                                        <p className="text-[11px]" style={{ color: "#8B978A" }}>Talhões</p>
                                        <p className="text-sm font-semibold" style={{ color: "#1A2E1A" }}>{data.propriedade.talhoes}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <EmptyState label="Nenhuma propriedade cadastrada" cta="Cadastrar propriedade" onClick={() => navigate("/propriedade")} />
                        )}
                    </Card>

                    {/* Financeiro */}
                    <Card
                        accent="#2E7DAF"
                        title="Financeiro"
                        footer={data.financeiro ? "Ver extrato completo" : undefined}
                        onFooterClick={() => navigate("/financeiro")}
                    >
                        {data.financeiro ? (
                            <div className="pt-1">
                                <p className="text-xs" style={{ color: "#8B978A" }}>Saldo do mês</p>
                                <p className="text-xl font-bold" style={{ color: "#1A2E1A" }}>{formatBRL(data.financeiro.saldoMes)}</p>
                                <div className="mt-2">
                                    <MiniAreaChart data={data.financeiro.historico} color="#2E7DAF" />
                                </div>
                            </div>
                        ) : (
                            <EmptyState label="Nenhum lançamento este mês" cta="Adicionar lançamento" onClick={() => navigate("/financeiro")} />
                        )}
                    </Card>

                    {/* Produção */}
                    <Card
                        accent="#C9A227"
                        title="Produção"
                        footer={data.producao ? "Ver extrato completo" : undefined}
                        onFooterClick={() => navigate("/producao")}
                    >
                        {data.producao ? (
                            <div className="pt-1">
                                <p className="text-xs" style={{ color: "#8B978A" }}>Colhendo este mês</p>
                                <p className="text-xl font-bold mb-2" style={{ color: "#1A2E1A" }}>{data.producao.colhendoTon} ton</p>
                                <MiniBarChart data={data.producao.historico} color="#C9A227" />
                            </div>
                        ) : (
                            <EmptyState label="Nenhum registro de produção" cta="Registrar produção" onClick={() => navigate("/producao/")} />
                        )}
                    </Card>

                    {/* Estoques */}
                    <Card
                        accent="#8B5E34"
                        title="Estoques"
                        footer={data.estoque.length ? "Ver todo o estoque" : undefined}
                        onFooterClick={() => navigate("/estoque")}
                    >
                        {data.estoque.length ? (
                            <div className="flex flex-col gap-3 pt-1">
                                {data.estoque.map((item) => (
                                    <ProgressBar key={item.nome} label={item.nome} percentual={item.percentual} color="#8B5E34" />
                                ))}
                            </div>
                        ) : (
                            <EmptyState label="Estoque ainda não configurado" cta="Adicionar item" onClick={() => navigate("/estoque")} />
                        )}
                    </Card>

                    {/* Metas */}
                    <Card
                        accent="#B0472F"
                        title="Metas"
                        footer={data.meta ? "Ver todas as metas" : undefined}
                        onFooterClick={() => navigate("/meta")}
                    >
                        {data.meta ? (
                            <div className="flex items-center gap-4 pt-1">
                                <ProgressRing percentual={Math.round((data.meta.atual / data.meta.alvo) * 100)} color="#B0472F" />
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: "#1A2E1A" }}>{data.meta.titulo}</p>
                                    <p className="text-xs mt-1" style={{ color: "#8B978A" }}>
                                        {data.meta.atual} / {data.meta.alvo} {data.meta.unidade} · Prazo - {formatPrazo(data.meta.prazo)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <EmptyState label="Nenhuma meta definida" cta="Criar meta" onClick={() => navigate("/meta")} />
                        )}
                    </Card>

                    {/* Relatórios */}
                    <Card
                        accent="#5A6E57"
                        title="Relatórios"
                        footer={data.relatorios.length ? "Ver todos os relatórios" : undefined}
                        onFooterClick={() => navigate("/relatorios")}
                    >
                        {data.relatorios.length ? (
                            <div className="flex flex-col gap-2 pt-1">
                                {data.relatorios.map((relatorio) => (
                                    <button
                                        key={relatorio.titulo}
                                        onClick={() => navigate("/relatorios")}
                                        className="text-left rounded-lg px-3 py-2 transition-colors hover:brightness-95"
                                        style={{ background: "#F3F4F1" }}
                                    >
                                        <p className="text-sm font-medium" style={{ color: "#1A2E1A" }}>{relatorio.titulo}</p>
                                        <p className="text-[11px]" style={{ color: "#8B978A" }}>{relatorio.atualizadoEm}</p>
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