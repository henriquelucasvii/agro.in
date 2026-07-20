import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Search,
    Sprout,
    RefreshCw,
    AlertCircle,
} from "lucide-react";

import { api } from "../lib/api";
import Sidebar from "../components/Sidebar";


type CategoriaProducao = "plantio" | "colheita" | "criacao_animal" | "geral";
type AbaCategoria = "todas" | CategoriaProducao;

interface Producao {
    id: number;
    propriedade_id: number;
    tipo: string;
    categoria?: CategoriaProducao | null;
    area_utilizada?: number | null;
    quantidade?: number | null;
    unidade?: string | null;
    data_inicio?: string | null;
    data_fim?: string | null;
    status?: string | null;
}

interface FormData {
    propriedade_id: string;
    tipo: string;
    categoria: CategoriaProducao;
    area_utilizada: string;
    quantidade: string;
    unidade: string;
    data_inicio: string;
    data_fim: string;
    status: string;
}

const FORM_VAZIO: FormData = {
    propriedade_id: "",
    tipo: "",
    categoria: "plantio",
    area_utilizada: "",
    quantidade: "",
    unidade: "",
    data_inicio: "",
    data_fim: "",
    status: "Plantio",
};

const CATEGORIAS: { key: AbaCategoria; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "plantio", label: "Plantio" },
    { key: "colheita", label: "Colheitas" },
    { key: "criacao_animal", label: "Criação animal" },
];

const CATEGORIA_LABEL: Record<CategoriaProducao, string> = {
    plantio: "Plantio",
    colheita: "Colheita",
    criacao_animal: "Criação animal",
    geral: "Geral",
};

const CORES_CATEGORIA: Record<CategoriaProducao, { bg: string; texto: string; borda: string }> = {
    plantio: { bg: "#EAF9EC", texto: "#0D5006", borda: "#4FA84F" },
    colheita: { bg: "#FDF3E6", texto: "#8A5A17", borda: "#E0A94C" },
    criacao_animal: { bg: "#F2ECE1", texto: "#6B5636", borda: "#8B6F47" },
    geral: { bg: "#EAF9EC", texto: "#0D5006", borda: "#4FA84F" },
};

const STATUS_PRESETS = ["Plantio", "Crescimento", "Colheita", "Finalizado"];

const ANIMAL_KEYWORDS = [
    "gado", "boi", "boiada", "vaca", "ave", "aves", "frango", "galinha",
    "suíno", "suino", "porco", "ovino", "caprino", "peixe", "piscicultura",
    "abelha", "apicultura", "leite",
];

const INTERVALO_SINCRONIA_MS = 15000;

const inferCategoria = (p: Producao): CategoriaProducao => {
    if (p.categoria) return p.categoria;
    const tipo = (p.tipo || "").toLowerCase();
    const status = (p.status || "").toLowerCase();
    if (ANIMAL_KEYWORDS.some((k) => tipo.includes(k))) return "criacao_animal";
    if (status.includes("colheita")) return "colheita";
    if (status.includes("plantio")) return "plantio";
    return "geral";
};

const formatNumeroPt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

const formatValorProducao = (p: Producao) => {
    if (p.area_utilizada != null) return `${formatNumeroPt(p.area_utilizada)}ha`;
    if (p.quantidade != null) {
        const unidade = p.unidade ? ` ${p.unidade}` : "";
        return `${formatNumeroPt(p.quantidade)}${unidade}`;
    }
    return "Sem valor registrado";
};

export default function Producao() {
    const [producoes, setProducoes] = useState<Producao[]>([]);
    const [loading, setLoading] = useState(true);
    const [sincronizando, setSincronizando] = useState(false);
    const [erroConexao, setErroConexao] = useState(false);
    const [ultimaSincronia, setUltimaSincronia] = useState<Date | null>(null);
    const [segundosDesde, setSegundosDesde] = useState(0);

    const [abaCategoria, setAbaCategoria] = useState<AbaCategoria>("todas");
    const [busca, setBusca] = useState("");

    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState<Producao | null>(null);
    const [form, setForm] = useState<FormData>(FORM_VAZIO);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");

    const carregar = useCallback(async (silencioso = false) => {
        if (!silencioso) setLoading(true);
        setSincronizando(true);
        try {
            const { data } = await api.get<Producao[]>("/producao");
            setProducoes(data);
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
        setForm({ ...FORM_VAZIO, categoria: abaCategoria === "todas" ? "plantio" : abaCategoria });
        setErro("");
        setModalAberto(true);
    };

    const abrirEdicao = (p: Producao) => {
        setEditando(p);
        setForm({
            propriedade_id: String(p.propriedade_id),
            tipo: p.tipo,
            categoria: inferCategoria(p),
            area_utilizada: p.area_utilizada != null ? String(p.area_utilizada) : "",
            quantidade: p.quantidade != null ? String(p.quantidade) : "",
            unidade: p.unidade || "",
            data_inicio: p.data_inicio ? new Date(p.data_inicio).toISOString().split("T")[0] : "",
            data_fim: p.data_fim ? new Date(p.data_fim).toISOString().split("T")[0] : "",
            status: p.status || "Plantio",
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
        if (!form.tipo) {
            setErro("Preencha ao menos o nome/tipo da produção.");
            return;
        }

        setSalvando(true);
        setErro("");

        const payload = {
            tipo: form.tipo,
            categoria: form.categoria,
            area_utilizada: form.area_utilizada ? Number(form.area_utilizada) : null,
            quantidade: form.quantidade ? Number(form.quantidade) : null,
            unidade: form.unidade || null,
            data_inicio: form.data_inicio || null,
            data_fim: form.data_fim || null,
            status: form.status,
        };

        try {
            if (editando) {
                await api.put(`/producao/${editando.id}`, payload);
            } else {
                await api.post("/producao", { propriedade_id: Number(form.propriedade_id), ...payload });
            }
            await carregar();
            fecharModal();
        } catch {
            setErro("Erro ao salvar produção. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    const deletar = async (id: number) => {
        if (!confirm("Deseja excluir este registro de produção?")) return;
        try {
            await api.delete(`/producao/${id}`);
            await carregar();
        } catch {
            alert("Erro ao excluir produção.");
        }
    };

    const producoesFiltradas = useMemo(() => {
        return producoes
            .filter((p) => abaCategoria === "todas" || inferCategoria(p) === abaCategoria)
            .filter(
                (p) =>
                    p.tipo.toLowerCase().includes(busca.toLowerCase()) ||
                    (p.status || "").toLowerCase().includes(busca.toLowerCase())
            );
    }, [producoes, abaCategoria, busca]);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full" style={{background: "#F7F8F5" }}>
            <Sidebar />
            
            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <header className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-6" style={{ background: "#0D5006" }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                Produção
                            </h1>
                            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                                Gerencie suas atividades produtivas
                            </p>
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
                                Nova produção
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
                                    color: abaCategoria === key ? "white" : "#1A2E1A",
                                    border: `1.5px solid ${abaCategoria === key ? "#0D5006" : "#4FA84F"}`,
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Busca */}
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 mb-6 w-full sm:max-w-sm" style={{ border: "1px solid #E7E9E4" }}>
                        <Search size={16} style={{ color: "#8B978A" }} />
                        <input
                            type="text"
                            placeholder="Buscar por tipo ou status..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="flex-1 text-sm outline-none bg-transparent"
                            style={{ color: "#1A2E1A" }}
                        />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <RefreshCw size={22} className="animate-spin" style={{ color: "#8CA88A" }} />
                            <p className="text-sm" style={{ color: "#7A8A78" }}>Carregando produções...</p>
                        </div>
                    ) : erroConexao && producoes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#FDECEA" }}>
                                <AlertCircle size={20} style={{ color: "#B0472F" }} />
                            </div>
                            <p className="text-sm" style={{ color: "#7A8A78" }}>Não foi possível carregar as produções</p>
                            <button
                                onClick={() => carregar()}
                                className="text-xs font-semibold px-3 py-1.5 rounded-full transition hover:brightness-95"
                                style={{ color: "#0D5006", background: "#EAF9EC" }}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "2px solid #4FA84F" }}>
                            {producoesFiltradas.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#EAF9EC" }}>
                                        <Sprout size={20} style={{ color: "#4FA84F" }} />
                                    </div>
                                    <p className="text-sm" style={{ color: "#7A8A78" }}>Nenhuma produção encontrada</p>
                                    <button
                                        onClick={abrirNovo}
                                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition hover:brightness-95"
                                        style={{ color: "#0D5006", background: "#EAF9EC" }}
                                    >
                                        <Plus size={13} /> Registrar produção
                                    </button>
                                </div>
                            ) : (
                                producoesFiltradas.map((p, i) => (
                                    <div
                                        key={p.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-8 py-5 sm:py-7"
                                        style={{ borderBottom: i < producoesFiltradas.length - 1 ? "1px solid #E3E6DE" : "none" }}
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold text-base sm:text-lg truncate" style={{ color: "#1A2E1A", fontFamily: "Montserrat, sans-serif" }}>
                                                {p.tipo}
                                            </p>
                                            <p className="text-sm mt-0.5" style={{ color: "#8B978A" }}>
                                                {p.status || CATEGORIA_LABEL[inferCategoria(p)]}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                            <p className="font-bold text-base sm:text-lg whitespace-nowrap" style={{ color: "#1A2E1A" }}>
                                                {formatValorProducao(p)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => abrirEdicao(p)}
                                                    className="p-1.5 rounded-lg transition hover:brightness-95"
                                                    style={{ background: "#F3F7F1" }}
                                                >
                                                    <Pencil size={13} style={{ color: "#0D5006" }} />
                                                </button>
                                                <button
                                                    onClick={() => deletar(p.id)}
                                                    className="p-1.5 rounded-lg transition hover:brightness-95"
                                                    style={{ background: "#FDECEA" }}
                                                >
                                                    <Trash2 size={13} style={{ color: "#B0472F" }} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
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
                                {editando ? "Editar produção" : "Nova produção"}
                            </h2>
                            <button onClick={fecharModal}><X size={18} style={{ color: "#8B978A" }} /></button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Tipo / nome *</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Soja 2025/2026"
                                    value={form.tipo}
                                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                                    className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                    style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Categoria</label>
                                <div className="flex gap-2 flex-wrap">
                                    {(["plantio", "colheita", "criacao_animal", "geral"] as CategoriaProducao[]).map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setForm((f) => ({ ...f, categoria: c }))}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                                            style={{
                                                background: form.categoria === c ? CORES_CATEGORIA[c].bg : "#F3F7F1",
                                                color: form.categoria === c ? CORES_CATEGORIA[c].texto : "#8B978A",
                                                border: `1px solid ${form.categoria === c ? CORES_CATEGORIA[c].borda : "#E7E9E4"}`,
                                            }}
                                        >
                                            {CATEGORIA_LABEL[c]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Status</label>
                                <div className="flex gap-2 flex-wrap">
                                    {STATUS_PRESETS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setForm((f) => ({ ...f, status: s }))}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                                            style={{
                                                background: form.status === s ? "#EAF9EC" : "#F3F7F1",
                                                color: form.status === s ? "#0D5006" : "#8B978A",
                                                border: `1px solid ${form.status === s ? "#0D5006" : "#E7E9E4"}`,
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Área utilizada (ha)</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 120"
                                        value={form.area_utilizada}
                                        onChange={(e) => setForm((f) => ({ ...f, area_utilizada: e.target.value }))}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Quantidade</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 150"
                                        value={form.quantidade}
                                        onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Unidade da quantidade</label>
                                <input
                                    type="text"
                                    placeholder="Ex: cabeças de gado, litros/dia"
                                    value={form.unidade}
                                    onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}
                                    className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                    style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Início</label>
                                    <input
                                        type="date"
                                        value={form.data_inicio}
                                        onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>Término previsto</label>
                                    <input
                                        type="date"
                                        value={form.data_fim}
                                        onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                    />
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
