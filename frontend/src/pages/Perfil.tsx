import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, X, KeyRound, Bell, Package } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";

interface Usuario {
    id: number;
    nome: string;
    email: string;
    criado_em: string;
}

interface Propriedade {
    id: number;
    nome: string;
    area_total: number;
    talhoes?: number;
}

interface FormData {
    nome: string;
    email: string;
}

export default function Perfil() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState(false);
    const [form, setForm] = useState<FormData>({ nome: "", email: "" });
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const [modalSenha, setModalSenha] = useState(false);
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [erroSenha, setErroSenha] = useState("");
    const [salvandoSenha, setSalvandoSenha] = useState(false);

    const [notificacoes, setNotificacoes] = useState(true);
    const [alertaEstoque, setAlertaEstoque] = useState(true);
    const [modoEscuro, setModoEscuro] = useState(false);
    const [alertasEstoque, setAlertasEstoque] = useState<{ nome: string; percentual: number }[]>([]);

    const carregar = async () => {
        try {
            const [userRes, propsRes] = await Promise.all([
                api.get<Usuario>("/auth/me"),
                api.get<Propriedade[]>("/propriedades"),
            ]);
            setUsuario(userRes.data);
            setPropriedades(propsRes.data);
            setForm({ nome: userRes.data.nome, email: userRes.data.email });
        } catch {
            navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregar(); }, []);

    const salvarPerfil = async () => {
        if (!form.nome || !form.email) {
            setErro("Preencha todos os campos.");
            return;
        }
        setSalvando(true);
        setErro("");
        try {
            const { data } = await api.put<Usuario>("/auth/me", form);
            setUsuario(data);
            setEditando(false);
            setSucesso("Perfil atualizado com sucesso!");
            setTimeout(() => setSucesso(""), 3000);
        } catch {
            setErro("Erro ao salvar perfil.");
        } finally {
            setSalvando(false);
        }
    };

    const salvarSenha = async () => {
        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            setErroSenha("Preencha todos os campos.");
            return;
        }
        if (novaSenha !== confirmarSenha) {
            setErroSenha("As senhas não coincidem.");
            return;
        }
        if (novaSenha.length < 4) {
            setErroSenha("A nova senha deve ter ao menos 4 caracteres.");
            return;
        }
        setSalvandoSenha(true);
        setErroSenha("");
        try {
            await api.put("/auth/senha", { senhaAtual, novaSenha });
            setModalSenha(false);
            setSenhaAtual("");
            setNovaSenha("");
            setConfirmarSenha("");
            setSucesso("Senha alterada com sucesso!");
            setTimeout(() => setSucesso(""), 3000);
        } catch {
            setErroSenha("Senha atual incorreta.");
        } finally {
            setSalvandoSenha(false);
        }
    };

    // ← Toggle com verificação de estoque
    const toggleAlertaEstoque = async () => {
        const novoValor = !alertaEstoque;
        setAlertaEstoque(novoValor);

        if (novoValor) {
            try {
                const { data } = await api.get("/estoque");
                const baixos = data
                    .filter((item: any) => item.quantidade_minima > 0 && item.quantidade <= item.quantidade_minima)
                    .map((item: any) => ({
                        nome: item.item,
                        percentual: Math.round((item.quantidade / item.quantidade_minima) * 100),
                    }));
                setAlertasEstoque(baixos);
                setTimeout(() => setAlertasEstoque([]), 6000);
            } catch {
                // silencioso
            }
        } else {
            setAlertasEstoque([]);
        }
    };

    const iniciais = usuario?.nome
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() ?? "";

    const membroDesde = usuario?.criado_em
        ? new Date(usuario.criado_em).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
        : "";

    if (loading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F5F6F2" }}>
                <p className="text-sm" style={{ color: "#647269" }}>Carregando perfil...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full" style={{ fontFamily: "Inter, sans-serif", background: "#F5F6F2" }}>
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">

                <header className="px-6 lg:px-10 pt-8 pb-6" style={{ background: "#1F5B3A" }}>
                    <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        Perfil
                    </h1>
                </header>

                <main className="px-6 lg:px-10 py-8 flex-1">

                    {sucesso && (
                        <div className="mb-4 px-4 py-3 rounded-md text-sm font-medium" style={{ background: "#E8F3EA", color: "#1F5B3A" }}>
                            {sucesso}
                        </div>
                    )}

                    <div className="bg-white rounded-lg p-6 mb-5 flex flex-col sm:flex-row sm:items-center gap-5" style={{ border: "1px solid #E1E6DF" }}>
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
                            style={{ background: "#1F5B3A" }}
                        >
                            {iniciais}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                {usuario?.nome}
                            </h2>
                            <p className="text-sm mt-0.5" style={{ color: "#647269" }}>Proprietário · Administrator</p>
                            {propriedades[0] && (
                                <p className="text-xs mt-1" style={{ color: "#647269" }}>
                                    {propriedades[0].nome} · Membro desde {membroDesde}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => setModalSenha(true)}
                                className="px-4 py-2 rounded-md text-sm font-medium border transition hover:brightness-95"
                                style={{ background: "white", color: "#46564B", border: "1px solid #E1E6DF" }}
                            >
                                Alterar Senha
                            </button>
                            <button
                                onClick={() => setEditando(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition hover:brightness-90"
                                style={{ background: "#1F5B3A", color: "white" }}
                            >
                                <Pencil size={14} />
                                Editar perfil
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        <div className="lg:col-span-2 flex flex-col gap-5">

                            <div className="rounded-lg border border-[#DCE3DB] bg-white p-6">
                                <h3 className="font-bold text-base mb-5" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                    Dados pessoais
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: "NOME COMPLETO", value: usuario?.nome ?? "", key: "nome" },
                                        { label: "E-MAIL", value: usuario?.email ?? "", key: "email" },
                                    ].map(({ label, value, key }) => (
                                        <div key={key}>
                                            <p className="text-[11px] font-semibold mb-1" style={{ color: "#647269" }}>{label}</p>
                                            {editando ? (
                                                <input
                                                    type={key === "email" ? "email" : "text"}
                                                    value={form[key as keyof FormData]}
                                                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                                    className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                                    style={{ background: "#F2F5F0", color: "#25352B", border: "1px solid #E1E6DF" }}
                                                />
                                            ) : (
                                                <div
                                                    className="w-full h-10 rounded-lg px-3 flex items-center text-sm"
                                                    style={{ background: "#F2F5F0", color: "#25352B" }}
                                                >
                                                    {value}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {editando && (
                                    <>
                                        {erro && <p className="text-xs text-red-500 mt-3">{erro}</p>}
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => { setEditando(false); setErro(""); setForm({ nome: usuario?.nome ?? "", email: usuario?.email ?? "" }); }}
                                                className="flex-1 py-2.5 rounded-md text-sm font-medium"
                                                style={{ background: "#F2F5F0", color: "#46564B" }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={salvarPerfil}
                                                disabled={salvando}
                                                className="flex-1 py-2.5 rounded-md text-sm font-semibold transition hover:brightness-95 disabled:opacity-60"
                                                style={{ background: "#1F5B3A", color: "white" }}
                                            >
                                                {salvando ? "Salvando..." : "Salvar alterações"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="rounded-lg border border-[#DCE3DB] bg-white p-6">
                                <h3 className="font-bold text-base mb-5" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                    Propriedades vinculadas
                                </h3>
                                {propriedades.length === 0 ? (
                                    <p className="text-sm" style={{ color: "#647269" }}>Nenhuma propriedade cadastrada.</p>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {propriedades.map((p, i) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center justify-between px-4 py-3 rounded-md"
                                                style={{ background: "#F2F5F0" }}
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold" style={{ color: "#25352B" }}>{p.nome}</p>
                                                    <p className="text-xs mt-0.5" style={{ color: "#647269" }}>{p.area_total} ha</p>
                                                </div>
                                                <span
                                                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                                    style={{
                                                        background: i === 0 ? "#E8F3EA" : "#FDF3E6",
                                                        color: i === 0 ? "#1F5B3A" : "#8A5A17",
                                                    }}
                                                >
                                                    {i === 0 ? "Principal" : "Secundária"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coluna direita — Preferências */}
                        <div className="flex flex-col gap-5">
                            <div className="rounded-lg border border-[#DCE3DB] bg-white p-6">
                                <h3 className="font-bold text-base mb-5" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                    Preferências
                                </h3>
                                <div className="flex flex-col gap-4">
                                    {[
                                        {
                                            icon: <Bell size={16} />,
                                            label: "Notificações por e-mail",
                                            desc: "Resumo semanal da propriedade",
                                            value: notificacoes,
                                            onClick: () => setNotificacoes(!notificacoes),
                                        },
                                        {
                                            icon: <Package size={16} />,
                                            label: "Alertas de estoque baixo",
                                            desc: "Avisa quando um item atinge o mínimo",
                                            value: alertaEstoque,
                                            // ← toggle com verificação de estoque
                                            onClick: toggleAlertaEstoque,
                                        },
                                        {
                                            icon: <KeyRound size={16} />,
                                            label: "Modo escuro",
                                            desc: "Aplica tema escuro ao painel",
                                            value: modoEscuro,
                                            onClick: () => setModoEscuro(!modoEscuro),
                                        },
                                    ].map(({ icon, label, desc, value, onClick }) => (
                                        <div key={label} className="flex items-center justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5" style={{ color: "#647269" }}>{icon}</div>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: "#25352B" }}>{label}</p>
                                                    <p className="text-xs" style={{ color: "#647269" }}>{desc}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={onClick}
                                                type="button"
                                                aria-pressed={value}
                                                aria-label={`${label}: ${value ? "ativado" : "desativado"}`}
                                                className="relative h-11 w-12 shrink-0"
                                            >
                                                <span
                                                    className="absolute inset-x-0 top-2 h-7 rounded-full transition-colors"
                                                    style={{ background: value ? "#1F5B3A" : "#D1D5DB" }}
                                                />
                                                <span
                                                    className="absolute top-3.5 h-4 w-4 rounded-full bg-white transition-all"
                                                    style={{ left: value ? "calc(100% - 20px)" : "4px" }}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Popups de estoque baixo */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
                {alertasEstoque.map((alerta, i) => (
                    <div
                        key={i}
                        className="flex items-start gap-3 px-4 py-3 rounded-md shadow-lg"
                        style={{ background: "white", border: "1px solid #E1E6DF", minWidth: 240, maxWidth: 300 }}
                    >
                        <div
                            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                            style={{ background: alerta.percentual <= 30 ? "#A8553E" : "#B49A45" }}
                        />
                        <div>
                            <p className="text-sm font-semibold" style={{ color: "#25352B" }}>
                                {alerta.nome}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "#647269" }}>
                                Estoque em {alerta.percentual}% do mínimo
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Alterar Senha */}
            {modalSenha && (
                <div className="fixed inset-0 z-50 flex overflow-y-auto p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <div className="mx-auto my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col gap-4 overflow-y-auto rounded-lg bg-white p-5 sm:p-6" style={{ border: "1px solid #E1E6DF" }}>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg" style={{ color: "#25352B", fontFamily: "Montserrat, sans-serif" }}>
                                Alterar senha
                            </h2>
                            <button onClick={() => { setModalSenha(false); setErroSenha(""); }} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md" aria-label="Fechar janela">
                                <X size={18} style={{ color: "#647269" }} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {[
                                { label: "Senha atual", value: senhaAtual, set: setSenhaAtual },
                                { label: "Nova senha", value: novaSenha, set: setNovaSenha },
                                { label: "Confirmar nova senha", value: confirmarSenha, set: setConfirmarSenha },
                            ].map(({ label, value, set }) => (
                                <div key={label}>
                                    <label className="block text-xs font-medium mb-1" style={{ color: "#1F5B3A" }}>{label}</label>
                                    <input
                                        type="password"
                                        value={value}
                                        onChange={(e) => set(e.target.value)}
                                        className="w-full h-10 rounded-lg px-3 text-sm outline-none"
                                        style={{ background: "#F2F5F0", color: "#25352B", border: "1px solid #E1E6DF" }}
                                    />
                                </div>
                            ))}
                        </div>

                        {erroSenha && <p className="text-xs text-red-500">{erroSenha}</p>}

                        <div className="flex gap-2">
                            <button
                                onClick={() => { setModalSenha(false); setErroSenha(""); }}
                                className="flex-1 py-2.5 rounded-md text-sm font-medium"
                                style={{ background: "#F2F5F0", color: "#46564B" }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={salvarSenha}
                                disabled={salvandoSenha}
                                className="flex-1 py-2.5 rounded-md text-sm font-semibold transition hover:brightness-95 disabled:opacity-60"
                                style={{ background: "#1F5B3A", color: "white" }}
                            >
                                {salvandoSenha ? "Salvando..." : "Alterar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
