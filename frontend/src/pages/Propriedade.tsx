import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Search, Leaf, MapPin, Sprout } from "lucide-react";
import { api } from "../lib/api";
import Sidebar from "../components/Sidebar";

// ============================================================
// Tipos
// ============================================================

interface Propriedade {
    id: number;
    usuario_id: number;
    nome: string;
    area_total: number;
    tipo_producao: string;
    localizacao: string;
    criado_em: string;
}

interface FormData {
    nome: string;
    area_total: string;
    tipo_producao: string;
    localizacao: string;
    usuario_id: string;
}

const FORM_VAZIO: FormData = {
    nome: "",
    area_total: "",
    tipo_producao: "",
    localizacao: "",
    usuario_id: "1",
};

// ============================================================
// Propriedades
// ============================================================

export default function Propriedade() {

    const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState<Propriedade | null>(null);
    const [form, setForm] = useState<FormData>(FORM_VAZIO);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");

    const carregarPropriedades = async () => {
        try {
            const { data } = await api.get<Propriedade[]>("/propriedades");
            setPropriedades(data);
        } catch {
            setPropriedades([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarPropriedades();
    }, []);

    const abrirNovo = () => {
        setEditando(null);
        setForm(FORM_VAZIO);
        setErro("");
        setModalAberto(true);
    };

    const abrirEdicao = (p: Propriedade) => {
        setEditando(p);
        setForm({
            nome: p.nome,
            area_total: String(p.area_total),
            tipo_producao: p.tipo_producao,
            localizacao: p.localizacao,
            usuario_id: String(p.usuario_id),
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
        if (!form.nome || !form.area_total || !form.tipo_producao || !form.localizacao) {
            setErro("Preencha todos os campos obrigatórios.");
            return;
        }

        setSalvando(true);
        setErro("");

        try {
            if (editando) {
                // PUT — sem usuario_id
                await api.put(`/propriedades/${editando.id}`, {
                    nome: form.nome,
                    area_total: Number(form.area_total),
                    tipo_producao: form.tipo_producao,
                    localizacao: form.localizacao,
                });
            } else {
                // POST — com usuario_id
                await api.post("/propriedades", {
                    nome: form.nome,
                    area_total: Number(form.area_total),
                    tipo_producao: form.tipo_producao,
                    localizacao: form.localizacao,
                    usuario_id: Number(form.usuario_id),
                });
            }
            await carregarPropriedades();
            fecharModal();
        } catch {
            setErro("Erro ao salvar propriedade. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    const deletar = async (id: number) => {
        if (!confirm("Deseja excluir esta propriedade?")) return;
        try {
            await api.delete(`/propriedades/${id}`);
            await carregarPropriedades();
        } catch {
            alert("Erro ao excluir propriedade.");
        }
    };

    const filtradas = propriedades.filter(
        (p) =>
            p.nome.toLowerCase().includes(busca.toLowerCase()) ||
            p.localizacao.toLowerCase().includes(busca.toLowerCase()) ||
            p.tipo_producao.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full" style={{background: "#F7F8F5" }}>
            <Sidebar />

            {/* Main */}
            <div className="flex-1 flex flex-col">

                {/* Header */}
                <header className="px-10 pt-8 pb-6" style={{ background: "#0D5006" }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                Propriedades
                            </h1>
                            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                                Gerencie suas propriedades rurais
                            </p>
                        </div>
                        <button
                            onClick={abrirNovo}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:brightness-90"
                            style={{ background: "#4FF47B", color: "#0D5006" }}
                        >
                            <Plus size={16} />
                            Nova propriedade
                        </button>
                    </div>
                </header>

                <main className="px-10 py-8 flex-1">

                    {/* Busca */}
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 mb-6 w-full max-w-sm" style={{ border: "1px solid #E7E9E4" }}>
                        <Search size={16} style={{ color: "#8B978A" }} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou local..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="flex-1 text-sm outline-none bg-transparent"
                            style={{ color: "#1A2E1A" }}
                        />
                    </div>

                    {/* Conteúdo */}
                    {loading ? (
                        <p className="text-sm" style={{ color: "#7A8A78" }}>Carregando...</p>
                    ) : filtradas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#EFF5EC" }}>
                                <Leaf size={20} style={{ color: "#8CA88A" }} />
                            </div>
                            <p className="text-sm" style={{ color: "#7A8A78" }}>Nenhuma propriedade cadastrada ainda</p>
                            <button
                                onClick={abrirNovo}
                                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition hover:brightness-95"
                                style={{ color: "#0D5006", background: "#EAF9EC" }}
                            >
                                <Plus size={13} /> Cadastrar propriedade
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filtradas.map((p) => (
                                <div
                                    key={p.id}
                                    className="bg-white rounded-2xl p-5 flex flex-col gap-4"
                                    style={{ border: "1px solid #E7E9E4" }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-base" style={{ color: "#1A2E1A" }}>{p.nome}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <MapPin size={11} style={{ color: "#8B978A" }} />
                                                <p className="text-xs" style={{ color: "#8B978A" }}>{p.localizacao}</p>
                                            </div>
                                        </div>
                                        <span
                                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                            style={{ background: "#EAF9EC", color: "#0D5006" }}
                                        >
                                            Ativa
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-xl px-3 py-2.5" style={{ background: "#F3F7F1" }}>
                                            <p className="text-[11px]" style={{ color: "#8B978A" }}>Área Total</p>
                                            <p className="text-sm font-semibold mt-0.5" style={{ color: "#1A2E1A" }}>{p.area_total} ha</p>
                                        </div>
                                        <div className="rounded-xl px-3 py-2.5" style={{ background: "#F3F7F1" }}>
                                            <div className="flex items-center gap-1">
                                                <Sprout size={11} style={{ color: "#8B978A" }} />
                                                <p className="text-[11px]" style={{ color: "#8B978A" }}>Produção</p>
                                            </div>
                                            <p className="text-sm font-semibold mt-0.5" style={{ color: "#1A2E1A" }}>{p.tipo_producao}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => abrirEdicao(p)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition hover:brightness-95"
                                            style={{ background: "#F3F7F1", color: "#0D5006" }}
                                        >
                                            <Pencil size={12} /> Editar
                                        </button>
                                        <button
                                            onClick={() => deletar(p.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition hover:brightness-95"
                                            style={{ background: "#FDECEA", color: "#B0472F" }}
                                        >
                                            <Trash2 size={12} /> Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
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
                                {editando ? "Editar propriedade" : "Nova propriedade"}
                            </h2>
                            <button onClick={fecharModal}>
                                <X size={18} style={{ color: "#8B978A" }} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {[
                                { label: "Nome *", key: "nome", placeholder: "Ex: Fazenda São João" },
                                { label: "Área total (ha) *", key: "area_total", placeholder: "Ex: 340", type: "number" },
                                { label: "Tipo de produção *", key: "tipo_producao", placeholder: "Ex: Soja, Milho, Gado" },
                                { label: "Localização *", key: "localizacao", placeholder: "Ex: Mato Grosso, BR" },
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
                                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}