import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Plus,
    X,
    AlertCircle,
    FileText,
    FileSpreadsheet,
    Mail,
    Share2,
    Eye,
    ChevronDown,
    RefreshCw,
    DollarSign,
    Sprout,
    Boxes,
} from "lucide-react";

import { api } from "../lib/api";
import Sidebar from "../components/Sidebar";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
    type CategoriaRelatorio,
    type StatusRelatorio,
    type RelatorioPropriedadeAPI,
    type RelatorioGerado,
    CHAVE_HISTORICO_RELATORIOS,
    reviveHistoricoRelatorios,
    tempoRelativo,
} from "../hooks/relatorios";

type AbaRelatorio = "todas" | "producao" | "financeiro" | "estoque";

interface Propriedade {
    id: number;
    nome: string;
}

const ABAS: { key: AbaRelatorio; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "producao", label: "Produção" },
    { key: "financeiro", label: "Financeiro" },
    { key: "estoque", label: "Estoque" },
];

const CATEGORIA_LABEL: Record<CategoriaRelatorio, string> = {
    financeiro: "Financeiro",
    producao: "Produção",
    estoque: "Estoque",
    geral: "Geral",
};

const ICONE_CATEGORIA: Record<CategoriaRelatorio, typeof DollarSign> = {
    financeiro: DollarSign,
    producao: Sprout,
    estoque: Boxes,
    geral: FileText,
};

const CORES_CATEGORIA: Record<CategoriaRelatorio, { bg: string; icone: string }> = {
    financeiro: { bg: "#E8F3EA", icone: "#4E9462" },
    producao: { bg: "#F8ECE8", icone: "#E2574C" },
    estoque: { bg: "#FFF3DC", icone: "#D9A62E" },
    geral: { bg: "#E8F3EA", icone: "#1F5B3A" },
};

const COR_AGENDADO = { bg: "#EAF2FB", icone: "#4E829C" };

const CORES_STATUS: Record<StatusRelatorio, { bg: string; texto: string }> = {
    pronto: { bg: "#E8F3EA", texto: "#1F5B3A" },
    agendado: { bg: "#EAF2FB", texto: "#2A5C93" },
};

const NOMES_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Evita que o localStorage cresça sem limite: guarda só os relatórios mais recentes.
const MAX_HISTORICO_PERSISTIDO = 100;

const mesAno = (d: Date) => `${NOMES_MES[d.getMonth()]}/${d.getFullYear()}`;

const formatBRL = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const tituloRelatorio = (categoria: CategoriaRelatorio, data: Date) => {
    const ref = mesAno(data);
    switch (categoria) {
        case "financeiro":
            return `Fechamento financeiro - ${ref}`;
        case "producao":
            return `Produtividade - ${ref}`;
        case "estoque":
            return `Movimentação de estoque - ${ref}`;
        default:
            return `Relatório geral - ${ref}`;
    }
};

export default function Relatorios() {
    // Aba selecionada: persistida para o usuário voltar de onde parou.
    const [abaCategoria, setAbaCategoria] = useLocalStorage<AbaRelatorio>(
        "agroin:relatorios:aba",
        "todas"
    );

    const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
    // Última propriedade selecionada: persistida entre sessões.
    const [propriedadeId, setPropriedadeId] = useLocalStorage<number | null>(
        "agroin:relatorios:propriedadeId",
        null
    );
    const [carregandoPropriedades, setCarregandoPropriedades] = useState(true);

    // Histórico de relatórios gerados: persistido no localStorage.
    // `fromJSON` reconstrói `geradoEm` como Date (o JSON só guarda string).
    const [historico, setHistorico, limparHistorico] = useLocalStorage<RelatorioGerado[]>(
        CHAVE_HISTORICO_RELATORIOS,
        [],
        {
            version: 1,
            fromJSON: reviveHistoricoRelatorios,
        }
    );
    const [gerando, setGerando] = useState(false);
    const [erroGeracao, setErroGeracao] = useState("");
    const [detalhe, setDetalhe] = useState<RelatorioGerado | null>(null);

    const carregarPropriedades = useCallback(async () => {
        setCarregandoPropriedades(true);
        try {
            const { data } = await api.get<Propriedade[]>("/propriedades");
            setPropriedades(data);
            if (data.length > 0) {
                setPropriedadeId((atual) => atual ?? data[0].id);
            }
        } catch {
            setPropriedades([]);
        } finally {
            setCarregandoPropriedades(false);
        }
    }, []);

    useEffect(() => {
        carregarPropriedades();
    }, [carregarPropriedades]);

    // ------------------------------------------------------------
    // Ações
    // ------------------------------------------------------------

    const gerarRelatorio = async () => {
        if (!propriedadeId) {
            setErroGeracao("Selecione uma propriedade antes de gerar o relatório.");
            return;
        }
        setGerando(true);
        setErroGeracao("");
        try {
            const { data } = await api.get<RelatorioPropriedadeAPI>(`/relatorios/${propriedadeId}`);
            const categoria: CategoriaRelatorio = abaCategoria === "todas" ? "geral" : abaCategoria;
            const agora = new Date();
            const novo: RelatorioGerado = {
                id: `r-${agora.getTime()}`,
                categoria,
                titulo: tituloRelatorio(categoria, agora),
                geradoEm: agora,
                status: "pronto",
                compartilhado: false,
                dados: data,
            };
            setHistorico((h) => [novo, ...h].slice(0, MAX_HISTORICO_PERSISTIDO));
        } catch {
            setErroGeracao("Não foi possível gerar o relatório. Tente novamente.");
        } finally {
            setGerando(false);
        }
    };

    const alternarCompartilhado = (id: string) => {
        setHistorico((h) => h.map((r) => (r.id === id ? { ...r, compartilhado: !r.compartilhado } : r)));
    };

    const exportarPDF = () => {
        window.print();
    };

    const exportarPlanilha = () => {
        const linhas = [
            ["Relatório", "Categoria", "Status", "Gerado em"],
            ...historicoFiltrado.map((r) => [
                r.titulo,
                CATEGORIA_LABEL[r.categoria],
                r.status,
                r.geradoEm.toLocaleDateString("pt-BR"),
            ]),
        ];
        const csv = linhas.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorios-agroin-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const enviarPorEmail = () => {
        const assunto = encodeURIComponent("Relatórios AGRO.IN");
        const corpo = encodeURIComponent(
            "Segue o resumo dos últimos relatórios:\n\n" +
                historicoFiltrado
                    .slice(0, 5)
                    .map((r) => `- ${r.titulo} (${CATEGORIA_LABEL[r.categoria]})`)
                    .join("\n")
        );
        window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
    };

    // ------------------------------------------------------------
    // Dados derivados
    // ------------------------------------------------------------

    const historicoFiltrado = useMemo(() => {
        const base = historico.filter((r) => abaCategoria === "todas" || r.categoria === abaCategoria);
        const prontos = base.filter((r) => r.status === "pronto").sort((a, b) => b.geradoEm.getTime() - a.geradoEm.getTime());
        const agendados = base.filter((r) => r.status === "agendado").sort((a, b) => a.geradoEm.getTime() - b.geradoEm.getTime());
        return [...prontos, ...agendados];
    }, [historico, abaCategoria]);

    const geradosEsteMes = useMemo(() => {
        const hoje = new Date();
        return historico.filter(
            (r) => r.status === "pronto" && r.geradoEm.getFullYear() === hoje.getFullYear() && r.geradoEm.getMonth() === hoje.getMonth()
        ).length;
    }, [historico]);

    const totalCompartilhados = useMemo(() => historico.filter((r) => r.compartilhado).length, [historico]);

    const ultimoGerado = useMemo(() => {
        const prontos = historico.filter((r) => r.status === "pronto").sort((a, b) => b.geradoEm.getTime() - a.geradoEm.getTime());
        return prontos[0] ?? null;
    }, [historico]);

    const dadosGrafico = useMemo(() => {
        const hoje = new Date();
        const meses: { label: string; ano: number; mes: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            meses.push({ label: NOMES_MES[d.getMonth()], ano: d.getFullYear(), mes: d.getMonth() });
        }
        return meses.map(({ label, ano, mes }) => ({
            label,
            total: historico.filter((r) => r.status === "pronto" && r.geradoEm.getFullYear() === ano && r.geradoEm.getMonth() === mes).length,
        }));
    }, [historico]);

    const maxGrafico = Math.max(1, ...dadosGrafico.map((d) => d.total));

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full" style={{ fontFamily: "Inter, sans-serif", background: "#F5F6F2" }}>
            <Sidebar />
            
            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <header className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-6" style={{ background: "#1F5B3A" }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                Relatórios
                            </h1>
                            <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                                {historico.length} {historico.length === 1 ? "relatório" : "relatórios"} · último {ultimoGerado ? tempoRelativo(ultimoGerado.geradoEm) : "nenhum ainda"}
                            </p>
                        </div>

                        {/* Seletor de propriedade */}
                        <div className="shrink-0">
                            {carregandoPropriedades ? (
                                <div className="h-10 px-4 flex items-center gap-2 rounded-md text-sm" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                                    <RefreshCw size={14} className="animate-spin" /> Carregando...
                                </div>
                            ) : propriedades.length > 0 ? (
                                <div className="relative">
                                    <select
                                        value={propriedadeId ?? ""}
                                        onChange={(e) => setPropriedadeId(Number(e.target.value))}
                                        className="appearance-none h-10 pl-3 pr-8 rounded-md text-sm font-medium outline-none cursor-pointer"
                                        style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                                    >
                                        {propriedades.map((p) => (
                                            <option key={p.id} value={p.id} style={{ color: "#25352B" }}>
                                                {p.nome}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.7)" }} />
                                </div>
                            ) : (
                                <input
                                    type="number"
                                    min={1}
                                    value={propriedadeId ?? ""}
                                    onChange={(e) => setPropriedadeId(e.target.value ? Number(e.target.value) : null)}
                                    placeholder="ID da propriedade"
                                    className="w-40 h-10 rounded-md px-3 text-sm outline-none"
                                    style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                                />
                            )}
                        </div>
                    </div>
                </header>

                <main className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex-1 w-full max-w-full overflow-x-hidden">

                    {/* Abas + gerar relatório */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {ABAS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setAbaCategoria(key)}
                                    className="px-4 py-2 rounded-md text-sm font-medium transition shrink-0"
                                    style={{
                                        background: abaCategoria === key ? "#1F5B3A" : "white",
                                        color: abaCategoria === key ? "white" : "#46564B",
                                        border: "1px solid #E1E6DF",
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={gerarRelatorio}
                            disabled={gerando || !propriedadeId}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition hover:brightness-90 disabled:opacity-60 shrink-0"
                            style={{ background: "#9AE6A6", color: "#1F5B3A" }}
                        >
                            {gerando ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                            {gerando ? "Gerando..." : "Gerar relatório"}
                        </button>
                    </div>

                    {erroGeracao && (
                        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-md text-sm" style={{ background: "#F8ECE8", color: "#A8553E" }}>
                            <AlertCircle size={15} className="shrink-0" /> {erroGeracao}
                        </div>
                    )}

                    {/* Cards resumo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="rounded-lg px-5 py-4" style={{ background: "#EFF3ED" }}>
                            <p className="text-sm" style={{ color: "#647269" }}>Gerados este mês</p>
                            <p className="text-2xl font-bold mt-1" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                {geradosEsteMes}
                            </p>
                        </div>
                        <div className="rounded-lg px-5 py-4" style={{ background: "#EFF3ED" }}>
                            <p className="text-sm" style={{ color: "#647269" }}>Compartilhados</p>
                            <p className="text-2xl font-bold mt-1" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                {totalCompartilhados}
                            </p>
                        </div>
                    </div>

                    {/* Gráfico + Exportar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

                        <div className="bg-white rounded-lg p-6" style={{ border: "1px solid #E1E6DF", borderTop: "4px solid #1F5B3A" }}>
                            <h3 className="font-bold text-lg mb-5" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                Relatórios gerados por mês
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-end justify-between gap-2" style={{ height: 100 }}>
                                    {dadosGrafico.map((d, i) => {
                                        const alturaPx = d.total === 0 ? 4 : Math.max(10, (d.total / maxGrafico) * 100);
                                        const ehAtual = i === dadosGrafico.length - 1;
                                        return (
                                            <div key={`${d.label}-${i}`} className="flex-1 flex justify-center" style={{ height: "100%" }}>
                                                <div
                                                    className="w-full max-w-[7] rounded-t-md self-end transition-all"
                                                    style={{ height: alturaPx, background: ehAtual ? "#1F5B3A" : "#AEC2A9" }}
                                                    title={`${d.total} relatório(s)`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between gap-2">
                                    {dadosGrafico.map((d, i) => (
                                        <span key={`${d.label}-label-${i}`} className="flex-1 text-center text-xs" style={{ color: "#647269" }}>
                                            {d.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6" style={{ border: "1px solid #E1E6DF", borderTop: "4px solid #4E829C" }}>
                            <h3 className="font-bold text-lg mb-4" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                Exportar
                            </h3>
                            <div className="flex flex-col">
                                <button onClick={exportarPDF} className="flex items-center gap-3 py-3 text-left transition hover:opacity-70" style={{ borderBottom: "1px solid #EFF3ED" }}>
                                    <FileText size={17} style={{ color: "#4E829C" }} />
                                    <span className="text-sm font-medium" style={{ color: "#25352B" }}>Exportar em PDF</span>
                                </button>
                                <button onClick={exportarPlanilha} className="flex items-center gap-3 py-3 text-left transition hover:opacity-70" style={{ borderBottom: "1px solid #EFF3ED" }}>
                                    <FileSpreadsheet size={17} style={{ color: "#4E829C" }} />
                                    <span className="text-sm font-medium" style={{ color: "#25352B" }}>Exportar em planilha</span>
                                </button>
                                <button onClick={enviarPorEmail} className="flex items-center gap-3 py-3 text-left transition hover:opacity-70">
                                    <Mail size={17} style={{ color: "#4E829C" }} />
                                    <span className="text-sm font-medium" style={{ color: "#25352B" }}>Enviar por e-mail</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Histórico */}
                    <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1px solid #E1E6DF" }}>
                        <div
                            className="flex items-center justify-between px-5 sm:px-6 py-4"
                            style={{ borderBottom: "1px solid #E1E6DF", background: "#F5F6F2" }}
                        >
                            <h3 className="font-bold" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                Histórico de relatórios
                            </h3>
                            {historico.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("Limpar todo o histórico de relatórios salvo neste navegador?")) {
                                            limparHistorico();
                                        }
                                    }}
                                    className="text-xs font-medium transition hover:opacity-70"
                                    style={{ color: "#647269" }}
                                >
                                    Limpar histórico
                                </button>
                            )}
                        </div>

                        {historicoFiltrado.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#E9F1E8" }}>
                                    <FileText size={20} style={{ color: "#8CA88A" }} />
                                </div>
                                <p className="text-sm" style={{ color: "#647269" }}>
                                    {historico.length === 0 ? "Nenhum relatório gerado ainda" : "Nenhum relatório nesta categoria"}
                                </p>
                                <button
                                    onClick={gerarRelatorio}
                                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md transition hover:brightness-95"
                                    style={{ color: "#1F5B3A", background: "#E8F3EA" }}
                                >
                                    <Plus size={13} /> Gerar relatório
                                </button>
                            </div>
                        ) : (
                            historicoFiltrado.map((r, i) => {
                                const Icone = ICONE_CATEGORIA[r.categoria];
                                const corIcone = r.status === "agendado" ? COR_AGENDADO : CORES_CATEGORIA[r.categoria];
                                const corStatus = CORES_STATUS[r.status];
                                return (
                                    <div
                                        key={r.id}
                                        className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4"
                                        style={{ borderBottom: i < historicoFiltrado.length - 1 ? "1px solid #EFF3ED" : "none" }}
                                    >
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: corIcone.bg }}>
                                            <Icone size={16} style={{ color: corIcone.icone }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: "#25352B" }}>{r.titulo}</p>
                                            <p className="text-xs mt-0.5" style={{ color: "#647269" }}>
                                                {CATEGORIA_LABEL[r.categoria]} · {tempoRelativo(r.geradoEm)}
                                            </p>
                                        </div>
                                        <span
                                            className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
                                            style={{ background: corStatus.bg, color: corStatus.texto }}
                                        >
                                            {r.status}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => r.dados && setDetalhe(r)}
                                                disabled={!r.dados}
                                                title={r.dados ? "Ver detalhes" : "Detalhes indisponíveis para este exemplo"}
                                                className="p-1.5 rounded-lg transition hover:brightness-95 disabled:opacity-40"
                                                style={{ background: "#F2F5F0" }}
                                            >
                                                <Eye size={13} style={{ color: "#1F5B3A" }} />
                                            </button>
                                            <button
                                                onClick={() => alternarCompartilhado(r.id)}
                                                title={r.compartilhado ? "Deixar de compartilhar" : "Compartilhar"}
                                                className="p-1.5 rounded-lg transition hover:brightness-95"
                                                style={{ background: r.compartilhado ? "#EAF2FB" : "#F2F5F0" }}
                                            >
                                                <Share2 size={13} style={{ color: r.compartilhado ? "#4E829C" : "#1F5B3A" }} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>

            {/* Modal de detalhes */}
            {detalhe && detalhe.dados && (
                <div className="fixed inset-0 flex overflow-y-auto p-4" style={{ background: "rgba(0,0,0,0.4)", zIndex: 60 }}>
                    <div className="mx-auto my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-lg bg-white p-5 sm:p-6" style={{ border: "1px solid #E1E6DF" }}>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                {detalhe.titulo}
                            </h2>
                            <button onClick={() => setDetalhe(null)} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md" aria-label="Fechar janela">
                                <X size={18} style={{ color: "#647269" }} />
                            </button>
                        </div>
                        <p className="text-xs -mt-2" style={{ color: "#647269" }}>{detalhe.dados.propriedade}</p>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-md px-4 py-3" style={{ background: "#E8F3EA" }}>
                                <p className="text-xs" style={{ color: "#1F5B3A" }}>Entradas</p>
                                <p className="text-base font-bold mt-0.5" style={{ color: "#25352B" }}>{formatBRL(detalhe.dados.financeiro.entradas)}</p>
                            </div>
                            <div className="rounded-md px-4 py-3" style={{ background: "#F8ECE8" }}>
                                <p className="text-xs" style={{ color: "#A8553E" }}>Saídas</p>
                                <p className="text-base font-bold mt-0.5" style={{ color: "#25352B" }}>{formatBRL(detalhe.dados.financeiro.saidas)}</p>
                            </div>
                            <div className="rounded-md px-4 py-3 col-span-2" style={{ background: "#F2F5F0" }}>
                                <p className="text-xs" style={{ color: "#46564B" }}>Saldo</p>
                                <p className="text-lg font-bold mt-0.5" style={{ color: detalhe.dados.financeiro.saldo >= 0 ? "#1F5B3A" : "#A8553E" }}>
                                    {formatBRL(detalhe.dados.financeiro.saldo)}
                                </p>
                            </div>
                            <div className="rounded-md px-4 py-3" style={{ background: "#F2F5F0" }}>
                                <p className="text-xs" style={{ color: "#46564B" }}>Produções registradas</p>
                                <p className="text-base font-bold mt-0.5" style={{ color: "#25352B" }}>{detalhe.dados.producao.total}</p>
                            </div>
                            <div className="rounded-md px-4 py-3" style={{ background: "#F2F5F0" }}>
                                <p className="text-xs" style={{ color: "#46564B" }}>Itens em estoque</p>
                                <p className="text-base font-bold mt-0.5" style={{ color: "#25352B" }}>{detalhe.dados.estoque.totalItens}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setDetalhe(null)}
                            className="mt-1 py-2.5 rounded-md text-sm font-medium"
                            style={{ background: "#F2F5F0", color: "#46564B" }}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
