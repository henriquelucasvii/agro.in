import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Search, Leaf, TrendingUp, TrendingDown } from "lucide-react";
import { api } from "../lib/api";
import Sidebar from "../components/Sidebar";

// ============================================================
// Tipos
// ============================================================

type TipoFinanceiro = "entrada" | "saida";
type AbaAtiva = "entrada" | "saida" | "fluxo";

interface Lancamento {
    id: number;
    propriedade_id: number;
    tipo: TipoFinanceiro;
    categoria: string;
    descricao: string;
    valor: number;
    data: string;
}

interface FormData {
    propriedade_id: string;
    tipo: TipoFinanceiro;
    categoria: string;
    descricao: string;
    valor: string;
    data: string;
}

const formVazio = (propriedadeId: string): FormData => ({
    propriedade_id: propriedadeId,
    tipo: "entrada",
    categoria: "",
    descricao: "",
    valor: "",
    data: new Date().toISOString().split("T")[0],
});

const formatBRL = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatData = (data: string) => new Date(data).toLocaleDateString("pt-BR");

// ============================================================
// Financeiro
// ============================================================

export default function Financeiro() {
    const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [aba, setAba] = useState<AbaAtiva>("fluxo");
    const [busca, setBusca] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState<Lancamento | null>(null);
    const [propriedadeId, setPropriedadeId] = useState<string>("");
    const [form, setForm] = useState<FormData>(formVazio(""));
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");

    const carregar = async () => {
        try {
            const { data } = await api.get<Lancamento[]>("/financeiro");
            setLancamentos(data);
        } catch {
            setLancamentos([]);
        } finally {
            setLoading(false);
        }
    };

    const carregarPropriedade = async () => {
        try {
            const { data } = await api.get<{ id: number }[]>("/propriedades");
            if (data.length > 0) {
                setPropriedadeId(String(data[0].id));
            }
        } catch {
            setPropriedadeId("");
        }
    };

    useEffect(() => {
        carregar();
        carregarPropriedade();
    }, []);

    const abrirNovo = () => {
        setEditando(null);
        setForm({ ...formVazio(propriedadeId), tipo: aba === "fluxo" ? "entrada" : aba });
        setErro("");
        setModalAberto(true);
    };

    const abrirEdicao = (l: Lancamento) => {
        setEditando(l);
        setForm({
            propriedade_id: String(l.propriedade_id),
            tipo: l.tipo,
            categoria: l.categoria,
            descricao: l.descricao,
            valor: String(l.valor),
            data: new Date(l.data).toISOString().split("T")[0],
        });
        setErro("");
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setEditando(null);
        setForm(formVazio(propriedadeId));
        setErro("");
    };

    const salvar = async () => {
        if (!form.categoria || !form.descricao || !form.valor || !form.data) {
            setErro("Preencha todos os campos obrigatórios.");
            return;
        }

        if (!editando && !form.propriedade_id) {
            setErro("Não foi possível identificar sua propriedade. Recarregue a página.");
            return;
        }

        setSalvando(true);
        setErro("");

        try {
            if (editando) {
                await api.put(`/financeiro/${editando.id}`, {
                    tipo: form.tipo,
                    categoria: form.categoria,
                    descricao: form.descricao,
                    valor: Number(form.valor),
                    data: form.data,
                });
            } else {
                await api.post("/financeiro", {
                    propriedade_id: Number(form.propriedade_id),
                    tipo: form.tipo,
                    categoria: form.categoria,
                    descricao: form.descricao,
                    valor: Number(form.valor),
                    data: form.data,
                });
            }
            await carregar();
            fecharModal();
        } catch {
            setErro("Erro ao salvar lançamento. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    const deletar = async (id: number) => {
        if (!confirm("Deseja excluir este lançamento?")) return;
        try {
            await api.delete(`/financeiro/${id}`);
            await carregar();
        } catch {
            alert("Erro ao excluir lançamento.");
        }
    };

    const entradas = lancamentos.filter((l) => l.tipo === "entrada");
    const saidas = lancamentos.filter((l) => l.tipo === "saida");
    const totalEntradas = entradas.reduce((s, l) => s + l.valor, 0);
    const totalSaidas = saidas.reduce((s, l) => s + l.valor, 0);
    const saldo = totalEntradas - totalSaidas;

    const listaAtiva = aba === "fluxo" ? lancamentos : lancamentos.filter((l) => l.tipo === aba);
    const filtrados = listaAtiva.filter(
        (l) =>
            l.descricao.toLowerCase().includes(busca.toLowerCase()) ||
            l.categoria.toLowerCase().includes(busca.toLowerCase())
    );

    const corAba = (a: AbaAtiva) => aba === a;

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full" style={{background: "#F5F6F2" }}>
           <Sidebar />

            {/* Main */}
            <div className="flex-1 flex flex-col">

                {/* Header */}
                <header className="px-10 pt-8 pb-6" style={{ background: "#1F5B3A" }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                Financeiro
                            </h1>
                            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                                Gerencie entradas, saídas e fluxos financeiros
                            </p>
                        </div>
                        <button
                            onClick={abrirNovo}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:brightness-90"
                            style={{ background: "#9AE6A6", color: "#1F5B3A" }}
                        >
                            <Plus size={16} />
                            Novo lançamento
                        </button>
                    </div>

                    {/* Resumo cards */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            { label: "Total Entradas", valor: totalEntradas, cor: "#9AE6A6", icon: <TrendingUp size={16} /> },
                            { label: "Total Saídas", valor: totalSaidas, cor: "#E36C5C", icon: <TrendingDown size={16} /> },
                            { label: "Saldo", valor: saldo, cor: saldo >= 0 ? "#9AE6A6" : "#E36C5C", icon: null },
                        ].map(({ label, valor, cor, icon }) => (
                            <div key={label} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.1)" }}>
                                <div className="flex items-center gap-1.5 mb-1" style={{ color: cor }}>
                                    {icon}
                                    <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</p>
                                </div>
                                <p className="text-lg font-bold" style={{ color: cor }}>{formatBRL(valor)}</p>
                            </div>
                        ))}
                    </div>
                </header>

                <main className="px-10 py-8 flex-1">

                    {/* Abas */}
                    <div className="flex gap-2 mb-6">
                        {([
                            { key: "entrada", label: "Entrada" },
                            { key: "saida", label: "Saída" },
                            { key: "fluxo", label: "Fluxo de Caixa" },
                        ] as { key: AbaAtiva; label: string }[]).map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setAba(key)}
                                className="px-4 py-2 rounded-full text-sm font-medium transition"
                                style={{
                                    background: corAba(key) ? "#1F5B3A" : "white",
                                    color: corAba(key) ? "white" : "#46564B",
                                    border: "1px solid #E1E6DF",
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Busca */}
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 mb-6 w-full max-w-sm" style={{ border: "1px solid #E1E6DF" }}>
                        <Search size={16} style={{ color: "#647269" }} />
                        <input
                            type="text"
                            placeholder="Buscar por descrição ou categoria..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="flex-1 text-sm outline-none bg-transparent"
                            style={{ color: "#25352B" }}
                        />
                    </div>

                    {/* Tabela */}
                    {loading ? (
                        <p className="text-sm" style={{ color: "#647269" }}>Carregando...</p>
                    ) : filtrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#E9F1E8" }}>
                                <Leaf size={20} style={{ color: "#8CA88A" }} />
                            </div>
                            <p className="text-sm" style={{ color: "#647269" }}>Nenhum lançamento encontrado</p>
                            <button
                                onClick={abrirNovo}
                                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition hover:brightness-95"
                                style={{ color: "#1F5B3A", background: "#E8F3EA" }}
                            >
                                <Plus size={13} /> Adicionar lançamento
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E1E6DF" }}>
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #E1E6DF", background: "#F5F6F2" }}>
                                        {["Data", "Descrição", "Categoria", "Tipo", "Valor", "Ações"].map((h) => (
                                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#647269" }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.map((l, i) => (
                                        <tr
                                            key={l.id}
                                            style={{ borderBottom: i < filtrados.length - 1 ? "1px solid #EFF3ED" : "none" }}
                                        >
                                            <td className="px-5 py-4 text-sm" style={{ color: "#46564B" }}>{formatData(l.data)}</td>
                                            <td className="px-5 py-4 text-sm font-medium" style={{ color: "#25352B" }}>{l.descricao}</td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "#E8F3EA", color: "#1F5B3A" }}>
                                                    {l.categoria}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className="text-xs font-semibold px-2 py-1 rounded-full"
                                                    style={{
                                                        background: l.tipo === "entrada" ? "#E8F3EA" : "#F8ECE8",
                                                        color: l.tipo === "entrada" ? "#1F5B3A" : "#A8553E",
                                                    }}
                                                >
                                                    {l.tipo === "entrada" ? "Entrada" : "Saída"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-semibold" style={{ color: l.tipo === "entrada" ? "#1F5B3A" : "#A8553E" }}>
                                                {l.tipo === "saida" ? "- " : ""}{formatBRL(l.valor)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => abrirEdicao(l)}
                                                        className="p-1.5 rounded-lg transition hover:brightness-95"
                                                        style={{ background: "#F2F5F0" }}
                                                    >
                                                        <Pencil size={13} style={{ color: "#1F5B3A" }} />
                                                    </button>
                                                    <button
                                                        onClick={() => deletar(l.id)}
                                                        className="p-1.5 rounded-lg transition hover:brightness-95"
                                                        style={{ background: "#F8ECE8" }}
                                                    >
                                                        <Trash2 size={13} style={{ color: "#A8553E" }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: "2px solid #E1E6DF", background: "#F5F6F2" }}>
                                        <td colSpan={4} className="px-5 py-3 text-sm font-semibold" style={{ color: "#25352B" }}>Total</td>
                                        <td className="px-5 py-3 text-sm font-bold" style={{ color: "#25352B" }}>
                                            {formatBRL(filtrados.reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0))}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 flex overflow-y-auto p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <div className="mx-auto my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-5 sm:p-6" style={{ border: "1px solid #E1E6DF" }}>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                {editando ? "Editar lançamento" : "Novo lançamento"}
                            </h2>
                            <button onClick={fecharModal} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl" aria-label="Fechar janela"><X size={18} style={{ color: "#647269" }} /></button>
                        </div>

                        <div className="flex flex-col gap-3">

                            {/* Tipo */}
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#1F5B3A" }}>Tipo *</label>
                                <div className="flex gap-2">
                                    {(["entrada", "saida"] as TipoFinanceiro[]).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                                            className="flex-1 py-2 rounded-lg text-sm font-medium transition"
                                            style={{
                                                background: form.tipo === t ? (t === "entrada" ? "#E8F3EA" : "#F8ECE8") : "#F2F5F0",
                                                color: form.tipo === t ? (t === "entrada" ? "#1F5B3A" : "#A8553E") : "#647269",
                                                border: `1px solid ${form.tipo === t ? (t === "entrada" ? "#1F5B3A" : "#A8553E") : "#E1E6DF"}`,
                                            }}
                                        >
                                            {t === "entrada" ? "Entrada" : "Saída"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {[
                                { label: "Descrição *", key: "descricao", placeholder: "Ex: Venda de Soja" },
                                { label: "Categoria *", key: "categoria", placeholder: "Ex: Varejo, Insumos" },
                                { label: "Valor *", key: "valor", placeholder: "Ex: 25000", type: "number" },
                                { label: "Data *", key: "data", placeholder: "", type: "date" },
                            ].map(({ label, key, placeholder, type }) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#1F5B3A" }}>{label}</label>
                                    <input
                                        type={type ?? "text"}
                                        placeholder={placeholder}
                                        value={form[key as keyof FormData]}
                                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F2F5F0", color: "#25352B", border: "1px solid #E1E6DF" }}
                                    />
                                </div>
                            ))}
                        </div>

                        {erro && <p className="text-xs text-red-500">{erro}</p>}

                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={fecharModal}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                                style={{ background: "#F2F5F0", color: "#46564B" }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={salvar}
                                disabled={salvando}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition hover:brightness-95 disabled:opacity-60"
                                style={{ background: "#1F5B3A", color: "#fff" }}
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
