import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Search, Leaf } from "lucide-react";
import { api } from "../lib/api";
import Sidebar from "../components/Sidebar";

// ============================================================
// Tipos
// ============================================================

interface EstoqueItem {
    id: number;
    propriedade_id: number;
    item: string;
    categoria: string;
    quantidade: number;
    unidade: string;
    quantidade_minima: number;
}

interface FormData {
    propriedade_id: string;
    item: string;
    categoria: string;
    quantidade: string;
    unidade: string;
    quantidade_minima: string;
}

const FORM_VAZIO: FormData = {
    propriedade_id: "1",
    item: "",
    categoria: "",
    quantidade: "",
    unidade: "",
    quantidade_minima: "",
};

// ============================================================
// Estoque
// ============================================================

export default function Estoque() {
    const [itens, setItens] = useState<EstoqueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState<EstoqueItem | null>(null);
    const [form, setForm] = useState<FormData>(FORM_VAZIO);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");


    const carregarItens = async () => {
        try {
            const { data } = await api.get<EstoqueItem[]>("/estoque");
            setItens(data);
        } catch {
            setItens([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarItens();
    }, []);

    const abrirNovo = () => {
        setEditando(null);
        setForm(FORM_VAZIO);
        setErro("");
        setModalAberto(true);
    };

    const abrirEdicao = (item: EstoqueItem) => {
        setEditando(item);
        setForm({
            propriedade_id: String(item.propriedade_id),
            item: item.item,
            categoria: item.categoria,
            quantidade: String(item.quantidade),
            unidade: item.unidade,
            quantidade_minima: String(item.quantidade_minima),
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
        if (!form.item || !form.categoria || !form.quantidade || !form.unidade) {
            setErro("Preencha todos os campos obrigatórios.");
            return;
        }

        setSalvando(true);
        setErro("");

        try {
            if (editando) {
                // PUT — sem propriedade_id
                await api.put(`/estoque/${editando.id}`, {
                    item: form.item,
                    categoria: form.categoria,
                    quantidade: Number(form.quantidade),
                    unidade: form.unidade,
                    quantidade_minima: Number(form.quantidade_minima),
                });
            } else {
                // POST — com propriedade_id
                await api.post("/estoque", {
                    propriedade_id: Number(form.propriedade_id),
                    item: form.item,
                    categoria: form.categoria,
                    quantidade: Number(form.quantidade),
                    unidade: form.unidade,
                    quantidade_minima: Number(form.quantidade_minima),
                });
            }
            await carregarItens();
            fecharModal();
        } catch {
            setErro("Erro ao salvar item. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    const deletar = async (id: number) => {
        if (!confirm("Deseja excluir este item do estoque?")) return;
        try {
            await api.delete(`/estoque/${id}`);
            await carregarItens();
        } catch {
            alert("Erro ao excluir item.");
        }
    };

    const itensFiltrados = itens.filter(
        (i) =>
            i.item.toLowerCase().includes(busca.toLowerCase()) ||
            i.categoria.toLowerCase().includes(busca.toLowerCase())
    );

    const percentual = (item: EstoqueItem) => {
        if (!item.quantidade_minima) return 100;
        return Math.min(Math.round((item.quantidade / item.quantidade_minima) * 100), 100);
    };

    const corBarra = (pct: number) => {
        if (pct <= 30) return "#B0472F";
        if (pct <= 60) return "#C9A227";
        return "#0D5006";
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full" style={{ background: "#F7F8F5" }}>
            <Sidebar />

            {/* Main */}
            <div className="flex-1 flex flex-col">

                {/* Header */}
                <header className="px-10 pt-8 pb-6" style={{ background: "#0D5006" }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                Estoque
                            </h1>
                            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                                Gerencie os itens do seu estoque
                            </p>
                        </div>
                        <button
                            onClick={abrirNovo}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:brightness-90"
                            style={{ background: "#4FF47B", color: "#0D5006" }}
                        >
                            <Plus size={16} />
                            Novo item
                        </button>
                    </div>
                </header>

                <main className="px-10 py-8 flex-1">

                    {/* Busca */}
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 mb-6 w-full max-w-sm" style={{ border: "1px solid #E7E9E4" }}>
                        <Search size={16} style={{ color: "#8B978A" }} />
                        <input
                            type="text"
                            placeholder="Buscar item ou categoria..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="flex-1 text-sm outline-none bg-transparent"
                            style={{ color: "#1A2E1A" }}
                        />
                    </div>

                    {/* Conteúdo */}
                    {loading ? (
                        <p className="text-sm" style={{ color: "#7A8A78" }}>Carregando...</p>
                    ) : itensFiltrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#EFF5EC" }}>
                                <Leaf size={20} style={{ color: "#8CA88A" }} />
                            </div>
                            <p className="text-sm" style={{ color: "#7A8A78" }}>Nenhum item no estoque ainda</p>
                            <button
                                onClick={abrirNovo}
                                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition hover:brightness-95"
                                style={{ color: "#0D5006", background: "#EAF9EC" }}
                            >
                                <Plus size={13} /> Adicionar item
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {itensFiltrados.map((item) => {
                                const pct = percentual(item);
                                const cor = corBarra(pct);
                                const baixo = item.quantidade <= item.quantidade_minima;

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-2xl p-5 flex flex-col gap-3"
                                        style={{ border: "1px solid #E7E9E4" }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-sm" style={{ color: "#1A2E1A" }}>{item.item}</p>
                                                <p className="text-xs mt-0.5" style={{ color: "#8B978A" }}>{item.categoria}</p>
                                            </div>
                                            {baixo && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FDECEA", color: "#B0472F" }}>
                                                    Estoque baixo
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-end justify-between">
                                            <p className="text-xl font-bold" style={{ color: "#1A2E1A" }}>
                                                {item.quantidade}
                                                <span className="text-sm font-normal ml-1" style={{ color: "#8B978A" }}>{item.unidade}</span>
                                            </p>
                                            <p className="text-xs" style={{ color: "#8B978A" }}>
                                                Mínimo: {item.quantidade_minima} {item.unidade}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="w-full h-2 rounded-full" style={{ background: "#EDEFEA" }}>
                                                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: cor }} />
                                            </div>
                                            <p className="text-[11px] mt-1 text-right" style={{ color: "#8B978A" }}>{pct}% do mínimo</p>
                                        </div>

                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => abrirEdicao(item)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition hover:brightness-95"
                                                style={{ background: "#F3F7F1", color: "#0D5006" }}
                                            >
                                                <Pencil size={12} /> Editar
                                            </button>
                                            <button
                                                onClick={() => deletar(item.id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition hover:brightness-95"
                                                style={{ background: "#FDECEA", color: "#B0472F" }}
                                            >
                                                <Trash2 size={12} /> Excluir
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4" style={{ border: "1px solid #E7E9E4" }}>

                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg" style={{ color: "#1A2E1A", fontFamily: "Montserrat, sans-serif" }}>
                                {editando ? "Editar item" : "Novo item"}
                            </h2>
                            <button onClick={fecharModal}>
                                <X size={18} style={{ color: "#8B978A" }} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {[
                                { label: "Item *", key: "item", placeholder: "Ex: Fertilizante NPK" },
                                { label: "Categoria *", key: "categoria", placeholder: "Ex: Fertilizante" },
                                { label: "Quantidade *", key: "quantidade", placeholder: "Ex: 500", type: "number" },
                                { label: "Unidade *", key: "unidade", placeholder: "Ex: kg, L, sacas" },
                                { label: "Quantidade mínima", key: "quantidade_minima", placeholder: "Ex: 100", type: "number" },
                            ].map(({ label, key, placeholder, type }) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#0D5006" }}>{label}</label>
                                    <input
                                        type={type ?? "text"}
                                        placeholder={placeholder}
                                        value={form[key as keyof FormData]}
                                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F3F7F1", color: "#1A2E1A", border: "1px solid #E7E9E4" }}
                                    />
                                </div>
                            ))}
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