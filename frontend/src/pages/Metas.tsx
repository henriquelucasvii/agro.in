import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Search,
    Target,
    CheckCircle2,
    Circle,
    Clock,
    RefreshCw,
    AlertCircle,
} from "lucide-react";
import { api } from "../lib/api";
import Sidebar from "../components/Sidebar";

type StatusMeta = "pendente" | "em_andamento" | "concluida";
type CategoriaMeta = "producao" | "financeiro" | "sustentabilidade" | "geral";
type AbaCategoria = "todas" | CategoriaMeta;

interface Meta {
    id: number;
    propriedade_id: number;
    descricao: string;
    categoria?: CategoriaMeta | null;
    valor_alvo?: number | null;
    valor_atual?: number | null;
    unidade?: string | null;
    responsavel?: string | null;
    prazo?: string | null;
    status?: StatusMeta | string | null;
}

interface FormData {
    propriedade_id: string;
    descricao: string;
    categoria: CategoriaMeta;
    valor_alvo: string;
    valor_atual: string;
    unidade: string;
    responsavel: string;
    prazo: string;
    status: StatusMeta;
}

const FORM_VAZIO: FormData = {
    propriedade_id: "",
    descricao: "",
    categoria: "geral",
    valor_alvo: "",
    valor_atual: "",
    unidade: "",
    responsavel: "",
    prazo: "",
    status: "pendente",
};

const CATEGORIAS: { key: AbaCategoria; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "producao", label: "Produção" },
    { key: "financeiro", label: "Financeiro" },
    { key: "sustentabilidade", label: "Sustentabilidade" },
];

const CATEGORIA_LABEL: Record<CategoriaMeta, string> = {
    producao: "Produção",
    financeiro: "Financeiro",
    sustentabilidade: "Sustentabilidade",
    geral: "Geral",
};

const CORES_CATEGORIA: Record<CategoriaMeta, { linha: string; barra: string; bg: string; texto: string }> = {
    producao: { linha: "#E2574C", barra: "#E2574C", bg: "#FDECEA", texto: "#B0472F" },
    financeiro: { linha: "#4FA84F", barra: "#4FA84F", bg: "#EAF9EC", texto: "#0D5006" },
    sustentabilidade: { linha: "#8B6F47", barra: "#8B6F47", bg: "#F2ECE1", texto: "#6B5636" },
    geral: { linha: "#0D5006", barra: "#0D5006", bg: "#EAF9EC", texto: "#0D5006" },
};

const INTERVALO_SINCRONIA_MS = 15000;

const corCategoria = (m: Meta) => CORES_CATEGORIA[(m.categoria as CategoriaMeta) || "geral"] ?? CORES_CATEGORIA.geral;
const categoriaDe = (m: Meta): CategoriaMeta => (m.categoria as CategoriaMeta) || "geral";

const formatBRL = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatPrazo = (data?: string | null) => {
    if (!data) return "Sem prazo definido";
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return "Sem prazo definido";
    const mes = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    return `${mes}/${d.getFullYear()}`;
};

const calcPercentual = (m: Meta): number => {
    if (m.status === "concluida") return 100;
    if (m.valor_alvo && m.valor_alvo > 0 && m.valor_atual != null) {
        return Math.min(100, Math.max(0, Math.round((m.valor_atual / m.valor_alvo) * 100)));
    }
    return 0;
};

const estaAtrasada = (m: Meta) => {
    if (m.status === "concluida" || !m.prazo) return false;
    return new Date(m.prazo).getTime() < Date.now();
};

const statusInfo = (m: Meta) => {
    if (m.status === "concluida") return { label: "Concluída", bg: "#EAF9EC", cor: "#0D5006" };
    if (estaAtrasada(m)) return { label: "Atrasada", bg: "#FDECEA", cor: "#B0472F" };
    return { label: "Dentro do prazo", bg: "#EAF9EC", cor: "#0D5006" };
};

const estaNoTrimestreAtual = (data?: string | null) => {
    if (!data) return false;
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return false;
    const agora = new Date();
    return d.getFullYear() === agora.getFullYear() && Math.floor(d.getMonth() / 3) === Math.floor(agora.getMonth() / 3);
};

const formatValorMeta = (m: Meta) => {
    const atual = m.valor_atual ?? 0;
    const alvo = m.valor_alvo;
    if (m.categoria === "financeiro") {
        return alvo ? `${formatBRL(atual)} / ${formatBRL(alvo)}` : formatBRL(atual);
    }
    const unidade = m.unidade ? ` ${m.unidade}` : "";
    return alvo ? `${atual}${unidade} / ${alvo}${unidade}` : `${atual}${unidade}`;
};

// ============================================================
// Subcomponentes visuais
// ============================================================

function AnelProgresso({ percentual, cor, tamanho = 108, espessura = 10 }: { percentual: number; cor: string; tamanho?: number; espessura?: number }) {
    const raio = (tamanho - espessura) / 2;
    const circunferencia = 2 * Math.PI * raio;
    const offset = circunferencia * (1 - percentual / 100);
    return (
        <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
            <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
                <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" stroke="#F0F1EC" strokeWidth={espessura} />
                <circle
                    cx={tamanho / 2}
                    cy={tamanho / 2}
                    r={raio}
                    fill="none"
                    stroke={cor}
                    strokeWidth={espessura}
                    strokeLinecap="round"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: "#1A2E1A", fontFamily: "Montserrat, sans-serif" }}>
                    {percentual}%
                </span>
            </div>
        </div>
    );
}

function BarraProgresso({ percentual, cor }: { percentual: number; cor: string }) {
    return (
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#EDEFE9" }}>
            <div
                className="h-full rounded-full"
                style={{ width: `${percentual}%`, background: cor, transition: "width 0.6s ease" }}
            />
        </div>
    );
}

// ============================================================
// Metas
// ============================================================

export default function Metas() {
    const [metas, setMetas] = useState<Meta[]>([]);
    const [loading, setLoading] = useState(true);
    const [sincronizando, setSincronizando] = useState(false);
    const [erroConexao, setErroConexao] = useState(false);
    const [ultimaSincronia, setUltimaSincronia] = useState<Date | null>(null);
    const [segundosDesde, setSegundosDesde] = useState(0);

    const [abaCategoria, setAbaCategoria] = useState<AbaCategoria>("todas");
    const [busca, setBusca] = useState("");

    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState<Meta | null>(null);
    const [form, setForm] = useState<FormData>(FORM_VAZIO);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");

    const carregar = useCallback(async (silencioso = false) => {
        if (!silencioso) setLoading(true);
        setSincronizando(true);
        try {
            const { data } = await api.get<Meta[]>("/metas");
            setMetas(data);
            setErroConexao(false);
            setUltimaSincronia(new Date());
        } catch {
            setErroConexao(true);
        } finally {
            setLoading(false);
            setSincronizando(false);
        }
    }, []);

    useEffect(() => {
        carregar();
        const intervalo = setInterval(() => carregar(true), INTERVALO_SINCRONIA_MS);
        return () => clearInterval(intervalo);
    }, [carregar]);

    useEffect(() => {
        const t = setInterval(() => {
            if (ultimaSincronia) setSegundosDesde(Math.floor((Date.now() - ultimaSincronia.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(t);
    }, [ultimaSincronia]);

    // ------------------------------------------------------------
    // CRUD — toda ação grava direto na API e depois re-sincroniza
    // ------------------------------------------------------------

    const abrirNovo = () => {
        setEditando(null);
        setForm({ ...FORM_VAZIO, categoria: abaCategoria === "todas" ? "geral" : abaCategoria });
        setErro("");
        setModalAberto(true);
    };

    const abrirEdicao = (m: Meta) => {
        setEditando(m);
        setForm({
            propriedade_id: String(m.propriedade_id),
            descricao: m.descricao,
            categoria: categoriaDe(m),
            valor_alvo: m.valor_alvo != null ? String(m.valor_alvo) : "",
            valor_atual: m.valor_atual != null ? String(m.valor_atual) : "",
            unidade: m.unidade || "",
            responsavel: m.responsavel || "",
            prazo: m.prazo ? new Date(m.prazo).toISOString().split("T")[0] : "",
            status: (m.status as StatusMeta) || "pendente",
        });
        setErro("");
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setEditando(null);
        setForm(FORM_VAZIO);
        setErro("");
    };

    const salvar = async () => {
        if (!form.descricao || !form.prazo) {
            setErro("Preencha ao menos a descrição e o prazo.");
            return;
        }

        setSalvando(true);
        setErro("");

        const payload = {
            descricao: form.descricao,
            categoria: form.categoria,
            valor_alvo: form.valor_alvo ? Number(form.valor_alvo) : null,
            valor_atual: form.valor_atual ? Number(form.valor_atual) : 0,
            unidade: form.unidade || null,
            responsavel: form.responsavel || null,
            prazo: form.prazo,
            status: form.status,
        };

        try {
            if (editando) {
                await api.put(`/metas/${editando.id}`, payload);
            } else {
                await api.post("/metas", { propriedade_id: Number(form.propriedade_id), ...payload });
            }
            await carregar();
            fecharModal();
        } catch {
            setErro("Erro ao salvar meta. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    const deletar = async (id: number) => {
        if (!confirm("Deseja excluir esta meta?")) return;
        try {
            await api.delete(`/metas/${id}`);
            await carregar();
        } catch {
            alert("Erro ao excluir meta.");
        }
    };

    const alternarConcluida = async (m: Meta) => {
        try {
            await api.put(`/metas/${m.id}`, {
                status: m.status === "concluida" ? "pendente" : "concluida",
            });
            await carregar();
        } catch {
            alert("Erro ao atualizar status da meta.");
        }
    };

    // ------------------------------------------------------------
    // Dados derivados
    // ------------------------------------------------------------

    const metasFiltradas = useMemo(() => {
        return metas
            .filter((m) => abaCategoria === "todas" || categoriaDe(m) === abaCategoria)
            .filter((m) => m.descricao.toLowerCase().includes(busca.toLowerCase()));
    }, [metas, abaCategoria, busca]);

    const metasAtivas = metas.filter((m) => m.status !== "concluida").length;
    const progressoMedio = metas.length
        ? Math.round(metas.reduce((s, m) => s + calcPercentual(m), 0) / metas.length)
        : 0;
    const concluidasTrimestre = metas.filter((m) => m.status === "concluida" && estaNoTrimestreAtual(m.prazo)).length;

    const destaque = useMemo(() => {
        const ativas = metasFiltradas.filter((m) => m.status !== "concluida");
        if (ativas.length === 0) return null;
        return [...ativas].sort((a, b) => {
            if (!a.prazo) return 1;
            if (!b.prazo) return -1;
            return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
        })[0];
    }, [metasFiltradas]);

    const secundarias = metasFiltradas.filter((m) => m.id !== destaque?.id).slice(0, 4);

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full" style={{ fontFamily: "Inter, sans-serif", background: "#F7F8F5" }}>
            <Sidebar />
            
            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <header className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-6" style={{ background: "#0D5006" }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                Metas
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{
                                        background: erroConexao ? "#FF6B6B" : "#4FF47B",
                                        boxShadow: erroConexao ? "none" : "0 0 0 3px rgba(79,244,123,0.25)",
                                    }}
                                />
                                <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                                    {erroConexao
                                        ? "Sem conexão com o servidor"
                                        : sincronizando
                                        ? "Sincronizando..."
                                        : ultimaSincronia
                                        ? `Atualizado em tempo real · há ${segundosDesde}s`
                                        : "Conectando..."}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => carregar()}
                                className="flex items-center justify-center w-10 h-10 rounded-xl transition hover:brightness-90 shrink-0"
                                style={{ background: "rgba(255,255,255,0.1)" }}
                                title="Atualizar agora"
                            >
                                <RefreshCw size={16} className={sincronizando ? "animate-spin" : ""} style={{ color: "white" }} />
                            </button>
                            <button
                                onClick={abrirNovo}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:brightness-90 whitespace-nowrap"
                                style={{ background: "#4FF47B", color: "#0D5006" }}
                            >
                                <Plus size={16} />
                                Nova meta
                            </button>
                        </div>
                    </div>
                </header>

                <main className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex-1 w-full max-w-full overflow-x-hidden">

                    {/* Abas de categoria */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                        {CATEGORIAS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setAbaCategoria(key)}
                                className="px-4 py-2 rounded-full text-sm font-medium transition shrink-0"
                                style={{
                                    background: abaCategoria === key ? "#0D5006" : "white",
                                    color: abaCategoria === key ? "white" : "#3A4A38",
                                    border: "1px solid #E7E9E4",
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Cards resumo */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {[
                            { label: "Metas ativas", valor: String(metasAtivas) },
                            { label: "Progresso médio", valor: `${progressoMedio}%` },
                            { label: "Concluídas no trimestre", valor: String(concluidasTrimestre) },
                        ].map(({ label, valor }) => (
                            <div key={label} className="rounded-2xl px-5 py-4" style={{ background: "#F0F2EC" }}>
                                <p className="text-sm" style={{ color: "#7A8A78" }}>{label}</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: "#1A2E1A", fontFamily: "Montserrat, sans-serif" }}>
                                    {valor}
                                </p>
                            </div>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <RefreshCw size={22} className="animate-spin" style={{ color: "#8CA88A" }} />
                            <p className="text-sm" style={{ color: "#7A8A78" }}>Carregando metas...</p>
                        </div>
                    ) : erroConexao && metas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#FDECEA" }}>
                                <AlertCircle size={20} style={{ color: "#B0472F" }} />
                            </div>
                            <p className="text-sm" style={{ color: "#7A8A78" }}>Não foi possível carregar as metas</p>
                            <button
                                onClick={() => carregar()}
                                className="text-xs font-semibold px-3 py-1.5 rounded-full transition hover:brightness-95"
                                style={{ color: "#0D5006", background: "#EAF9EC" }}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : (
                        <>
                            {metasFiltradas.length > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

                                    {/* Card destaque */}
                                    {destaque ? (
                                        <div
                                            className="bg-white rounded-2xl p-6 flex flex-col"
                                            style={{ border: "1px solid #E7E9E4", borderTop: `4px solid ${corCategoria(destaque).linha}` }}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-5">
                                                <h3 className="font-bold text-lg" style={{ color: "#1A2E1A", fontFamily: "Montserrat, sans-serif" }}>
                                                    {destaque.descricao}
                                                </h3>
                                                <span
                                                    className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
                                                    style={{ background: statusInfo(destaque).bg, color: statusInfo(destaque).cor }}
                                                >
                                                    {statusInfo(destaque).label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-5 flex-1">
                                                <AnelProgresso percentual={calcPercentual(destaque)} cor={corCategoria(destaque).linha} />
                                                <div className="flex flex-col gap-1.5 min-w-0">
                                                    <p className="text-sm font-medium truncate" style={{ color: "#3A4A38" }}>
                                                        {formatValorMeta(destaque)}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8B978A" }}>
                                                        <Clock size={12} className="shrink-0" />
                                                        Prazo · {formatPrazo(destaque.prazo)}
                                                    </div>
                                                    {destaque.responsavel && (
                                                        <p className="text-xs truncate" style={{ color: "#8B978A" }}>
                                                            Responsável · {destaque.responsavel}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => abrirEdicao(destaque)}
                                                className="text-sm font-semibold mt-5 text-left w-fit"
                                                style={{ color: corCategoria(destaque).linha }}
                                            >
                                                Ver detalhes
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            className="bg-white rounded-2xl p-6 flex items-center justify-center text-center"
                                            style={{ border: "1px solid #E7E9E4", minHeight: 200 }}
                                        >
                                            <p className="text-sm" style={{ color: "#7A8A78" }}>
                                                Todas as metas desta categoria foram concluídas 🎉
                                            </p>
                                        </div>
                                    )}

                                    {/* Progresso geral */}
                                    <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E7E9E4", borderTop: "4px solid #4FA84F" }}>
                                        <h3 className="font-bold text-lg mb-5" style={{ color: "#1A2E1A", fontFamily: "Montserrat, sans-serif" }}>
                                            Progresso geral
                                        </h3>
                                        <div className="flex flex-col gap-4">
                                            {secundarias.length === 0 ? (
                                                <p className="text-sm" style={{ color: "#7A8A78" }}>Sem outras metas nesta categoria.</p>
                                            ) : (
                                                secundarias.map((m) => (
                                                    <div key={m.id}>
                                                        <div className="flex items-center justify-between gap-3 mb-1.5">
                                                            <span className="text-sm font-medium truncate" style={{ color: "#3A4A38" }}>
                                                                {m.descricao}
                                                            </span>
                                                            <span className="text-sm font-semibold shrink-0" style={{ color: "#1A2E1A" }}>
                                                                {calcPercentual(m)}%
                                                            </span>
                                                        </div>
                                                        <BarraProgresso percentual={calcPercentual(m)} cor={corCategoria(m).barra} />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Busca */}
                            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 mb-4 w-full sm:max-w-sm" style={{ border: "1px solid #E7E9E4" }}>
                                <Search size={16} style={{ color: "#8B978A" }} />
                                <input
                                    type="text"
                                    placeholder="Buscar meta..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    className="flex-1 text-sm outline-none bg-transparent"
                                    style={{ color: "#1A2E1A" }}
                                />
                            </div>

                            {/* Lista completa */}
                            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E7E9E4" }}>
                                <div className="px-5 sm:px-6 py-4" style={{ borderBottom: "1px solid #E7E9E4", background: "#F7F8F5" }}>
                                    <h3 className="font-bold" style={{ color: "#1A2E1A", fontFamily: "Montserrat, sans-serif" }}>
                                        Todas as metas
                                    </h3>
                                </div>

                                {metasFiltradas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#EFF5EC" }}>
                                            <Target size={20} style={{ color: "#8CA88A" }} />
                                        </div>
                                        <p className="text-sm" style={{ color: "#7A8A78" }}>Nenhuma meta encontrada</p>
                                        <button
                                            onClick={abrirNovo}
                                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition hover:brightness-95"
                                            style={{ color: "#0D5006", background: "#EAF9EC" }}
                                        >
                                            <Plus size={13} /> Criar meta
                                        </button>
                                    </div>
                                ) : (
                                    metasFiltradas.map((m, i) => {
                                        const pct = calcPercentual(m);
                                        const info = statusInfo(m);
                                        const cor = corCategoria(m).barra;
                                        const concluida = m.status === "concluida";
                                        return (
                                            <div
                                                key={m.id}
                                                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4"
                                                style={{ borderBottom: i < metasFiltradas.length - 1 ? "1px solid #F0F1EC" : "none" }}
                                            >
                                                <button
                                                    onClick={() => alternarConcluida(m)}
                                                    className="shrink-0"
                                                    title={concluida ? "Marcar como pendente" : "Marcar como concluída"}
                                                >
                                                    {concluida ? (
                                                        <CheckCircle2 size={20} style={{ color: "#0D5006" }} />
                                                    ) : (
                                                        <Circle size={20} style={{ color: "#C7D0C4" }} />
                                                    )}
                                                </button>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate" style={{ color: "#1A2E1A" }}>{m.descricao}</p>
                                                    <p className="text-xs mt-0.5" style={{ color: "#8B978A" }}>Prazo - {formatPrazo(m.prazo)}</p>
                                                </div>

                                                <div className="flex items-center gap-3 sm:w-48 shrink-0">
                                                    <div className="flex-1">
                                                        <BarraProgresso percentual={pct} cor={cor} />
                                                    </div>
                                                    {concluida ? (
                                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: info.bg, color: info.cor }}>
                                                            Concluída
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-semibold shrink-0 w-8 text-right" style={{ color: "#1A2E1A" }}>{pct}%</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                    <button
                                                        onClick={() => abrirEdicao(m)}
                                                        className="p-1.5 rounded-lg transition hover:brightness-95"
                                                        style={{ background: "#F3F7F1" }}
                                                    >
                                                        <Pencil size={13} style={{ color: "#0D5006" }} />
                                                    </button>
                                                    <button
                                                        onClick={() => deletar(m.id)}
                                                        className="p-1.5 rounded-lg transition hover:brightness-95"
                                                        style={{ background: "#FDECEA" }}
                                                    >
                                                        <Trash2 size={13} style={{ color: "#B0472F" }} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Modal */}
            {modalAberto && (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.4)", zIndex: 60 }}
                >
                    <div
                        className="bg-white rounded-2xl p-6 w-full max-w-md flex flex-col gap-4 overflow-y-auto"
                        style={{ border: "1px solid #E7E9E4", maxHeight: "90vh" }}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg" style={{ color: "#1A2E1A", fontFamily: "Montserrat, sans-serif" }}>
                                {editando ? "Editar meta" : "Nova meta"}
                            </h2>
                            <button onClick={fecharModal}><X size={18} style={{ color: "#8B978A" }} /></button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Descrição *</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Produção anual de milho"
                                    value={form.descricao}
                                    onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                                    className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                    style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Categoria</label>
                                <div className="flex gap-2 flex-wrap">
                                    {(["producao", "financeiro", "sustentabilidade", "geral"] as CategoriaMeta[]).map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setForm((f) => ({ ...f, categoria: c }))}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                                            style={{
                                                background: form.categoria === c ? CORES_CATEGORIA[c].bg : "#F3F7F1",
                                                color: form.categoria === c ? CORES_CATEGORIA[c].texto : "#8B978A",
                                                border: `1px solid ${form.categoria === c ? CORES_CATEGORIA[c].linha : "#E7E9E4"}`,
                                            }}
                                        >
                                            {CATEGORIA_LABEL[c]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Valor atual</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={form.valor_atual}
                                        onChange={(e) => setForm((f) => ({ ...f, valor_atual: e.target.value }))}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Valor alvo</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 800"
                                        value={form.valor_alvo}
                                        onChange={(e) => setForm((f) => ({ ...f, valor_alvo: e.target.value }))}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Unidade</label>
                                    <input
                                        type="text"
                                        placeholder="ton, kg, %..."
                                        value={form.unidade}
                                        onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Prazo *</label>
                                    <input
                                        type="date"
                                        value={form.prazo}
                                        onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value }))}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Responsável</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Talhão 1 e 2"
                                    value={form.responsavel}
                                    onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
                                    className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                    style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Status</label>
                                <div className="flex gap-2">
                                    {([
                                        { key: "pendente", label: "Pendente" },
                                        { key: "em_andamento", label: "Em andamento" },
                                        { key: "concluida", label: "Concluída" },
                                    ] as { key: StatusMeta; label: string }[]).map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => setForm((f) => ({ ...f, status: key }))}
                                            className="flex-1 py-2 rounded-lg text-xs font-medium transition"
                                            style={{
                                                background: form.status === key ? "#EAF9EC" : "#F3F7F1",
                                                color: form.status === key ? "#0D5006" : "#8B978A",
                                                border: `1px solid ${form.status === key ? "#0D5006" : "#E7E9E4"}`,
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {erro && <p className="text-xs text-red-500">{erro}</p>}

                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={fecharModal}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                                style={{ background: "#F3F7F1", color: "#3A4A38" }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={salvar}
                                disabled={salvando}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition hover:brightness-95 disabled:opacity-60"
                                style={{ background: "#0D5006", color: "#fff" }}
                            >
                                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Adicionar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
