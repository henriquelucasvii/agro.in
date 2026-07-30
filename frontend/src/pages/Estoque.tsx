import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
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

const formVazio = (propriedadeId: string): FormData => ({
    propriedade_id: propriedadeId,
    item: "",
    categoria: "",
    quantidade: "",
    unidade: "",
    quantidade_minima: "",
});

// ============================================================
// Estoque
// ============================================================

export default function Estoque() {
    const [itens, setItens] = useState<EstoqueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState<EstoqueItem | null>(null);
    const [propriedadeId, setPropriedadeId] = useState<string>("");
    const [form, setForm] = useState<FormData>(formVazio(""));
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
        carregarItens();
        carregarPropriedade();
    }, []);

    const abrirNovo = () => {
        setEditando(null);
        setForm(formVazio(propriedadeId));
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
        setForm(formVazio(propriedadeId));
        setErro("");
    };

    const salvar = async () => {
        if (!form.item || !form.categoria || !form.quantidade || !form.unidade) {
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
        if (pct <= 30) return "#A8553E";
        if (pct <= 60) return "#B49A45";
        return "#1F5B3A";
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full" style={{ background: "#F5F6F2" }}>
            <Sidebar />

            {/* Main */}
            <div className="flex-1 flex flex-col">

                {/* Header */}
                <header className="px-4 pb-6 pt-6 sm:px-6 sm:pt-8 lg:px-10" style={{ background: "#1F5B3A" }}>
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                            className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition hover:brightness-90 sm:w-auto"
                            style={{ background: "#9AE6A6", color: "#1F5B3A" }}
                        >
                            <Plus size={16} />
                            Novo item
                        </button>
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">

                    {/* Busca */}
                    <div className="flex items-center gap-3 bg-white rounded-md px-4 py-3 mb-6 w-full max-w-sm" style={{ border: "1px solid #E1E6DF" }}>
                        <Search size={16} style={{ color: "#647269" }} />
                        <input
                            type="text"
                            placeholder="Buscar item ou categoria..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="flex-1 text-sm outline-none bg-transparent"
                            style={{ color: "#25352B" }}
                        />
                    </div>

                    {/* Conteúdo */}
                    {loading ? (
                        <p className="text-sm" style={{ color: "#647269" }}>Carregando...</p>
                    ) : itensFiltrados.length === 0 ? (
                        <div className="flex flex-col items-start justify-center gap-3 border-t border-[#DDE4DC] py-16">
                            <p className="text-sm font-medium" style={{ color: "#46564B" }}>Nenhum item cadastrado</p>
                            <p className="text-xs" style={{ color: "#7A877E" }}>Cadastre insumos ou materiais para acompanhar o saldo do estoque.</p>
                            <button
                                onClick={abrirNovo}
                                className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition hover:bg-[#EDF3EC]"
                                style={{ color: "#1F5B3A", borderColor: "#C7D5C7", background: "#FFFFFF" }}
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
                                        className="bg-white rounded-lg p-5 flex flex-col gap-3"
                                        style={{ border: "1px solid #E1E6DF" }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-sm" style={{ color: "#25352B" }}>{item.item}</p>
                                                <p className="text-xs mt-0.5" style={{ color: "#647269" }}>{item.categoria}</p>
                                            </div>
                                            {baixo && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F8ECE8", color: "#A8553E" }}>
                                                    Estoque baixo
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-end justify-between">
                                            <p className="text-xl font-bold" style={{ color: "#25352B" }}>
                                                {item.quantidade}
                                                <span className="text-sm font-normal ml-1" style={{ color: "#647269" }}>{item.unidade}</span>
                                            </p>
                                            <p className="text-xs" style={{ color: "#647269" }}>
                                                Mínimo: {item.quantidade_minima} {item.unidade}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="w-full h-2 rounded-full" style={{ background: "#E4E9E3" }}>
                                                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: cor }} />
                                            </div>
                                            <p className="text-[11px] mt-1 text-right" style={{ color: "#647269" }}>{pct}% do mínimo</p>
                                        </div>

                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => abrirEdicao(item)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition hover:brightness-95"
                                                style={{ background: "#F2F5F0", color: "#1F5B3A" }}
                                            >
                                                <Pencil size={12} /> Editar
                                            </button>
                                            <button
                                                onClick={() => deletar(item.id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition hover:brightness-95"
                                                style={{ background: "#F8ECE8", color: "#A8553E" }}
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
                <div className="fixed inset-0 z-50 flex overflow-y-auto p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <div className="mx-auto my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-lg bg-white p-5 sm:p-6" style={{ border: "1px solid #E1E6DF" }}>

                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                {editando ? "Editar item" : "Novo item"}
                            </h2>
                            <button onClick={fecharModal} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md" aria-label="Fechar janela">
                                <X size={18} style={{ color: "#647269" }} />
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
                                className="flex-1 py-2.5 rounded-md text-sm font-medium"
                                style={{ background: "#F2F5F0", color: "#46564B" }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={salvar}
                                disabled={salvando}
                                className="flex-1 py-2.5 rounded-md text-sm font-semibold transition hover:brightness-95 disabled:opacity-60"
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
