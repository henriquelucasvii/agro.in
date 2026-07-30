import {
    Bot,
    ChartNoAxesCombined,
    FileChartColumn,
    LayoutDashboard,
    Leaf,
    Map,
    Menu,
    Package,
    Search,
    Sprout,
    Target,
    UserRound,
    WalletCards,
    X,
    type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";

interface ItemNavegacao {
    key: string;
    label: string;
    icone: LucideIcon;
}

const NAV: ItemNavegacao[] = [
    { key: "dashboard", label: "Dashboard", icone: LayoutDashboard },
    { key: "propriedade", label: "Propriedade", icone: Map },
    { key: "financeiro", label: "Financeiro", icone: WalletCards },
    { key: "producao", label: "Produção", icone: Sprout },
    { key: "estoque", label: "Estoque", icone: Package },
    { key: "meta", label: "Metas", icone: Target },
    { key: "analise-foliar", label: "Análise foliar", icone: Leaf },
    { key: "relatorios", label: "Relatórios", icone: FileChartColumn },
    { key: "perfil", label: "Perfil", icone: UserRound },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarAberto, setSidebarAberto] = useState(false);
    const [busca, setBusca] = useState("");

    const itensVisiveis = NAV.filter((item) =>
        item.label.toLocaleLowerCase("pt-BR").includes(busca.trim().toLocaleLowerCase("pt-BR")),
    );

    const irPara = (path: string) => {
        navigate(path);
        setSidebarAberto(false);
    };

    return (
        <>
            {sidebarAberto && (
                <button
                    type="button"
                    aria-label="Fechar menu"
                    className="fixed inset-0 z-40 bg-[#071C0D]/60 backdrop-blur-[2px] lg:hidden"
                    onClick={() => setSidebarAberto(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 flex-col border-r border-white/8 bg-[#163B2A] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] shadow-2xl transition-transform duration-300 ease-out lg:static lg:w-[248px] lg:translate-x-0 lg:shadow-none ${
                    sidebarAberto ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between px-1">
                    <button
                        type="button"
                        onClick={() => irPara("/dashboard")}
                        className="flex items-center gap-3 rounded-md text-left"
                        aria-label="Ir para o dashboard do Agro.in"
                    >
                        <img src={logo} alt="" className="h-11 w-11 object-contain" />
                        <span>
                            <span className="block text-lg font-bold leading-none tracking-[-0.04em] text-white">
                                Agro.in
                            </span>
                            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9AC9A3]">
                                Gestão rural
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
                        onClick={() => setSidebarAberto(false)}
                        aria-label="Fechar menu"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="mt-7 flex h-10 items-center gap-2 rounded-md border border-white/8 bg-white/[0.06] px-3 transition focus-within:border-[#83B88B]/60 focus-within:bg-white/[0.09]">
                    <Search size={14} className="shrink-0 text-white/40" />
                    <input
                        value={busca}
                        onChange={(evento) => setBusca(evento.target.value)}
                        type="search"
                        placeholder="Encontrar módulo"
                        className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/38"
                    />
                </div>

                <p className="mb-2 mt-6 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/34">
                    Operação
                </p>

                <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                    {itensVisiveis.map(({ key, label, icone: Icone }) => {
                        const path = `/${key}`;
                        const ativo =
                            location.pathname === path ||
                            (key === "analise-foliar" && location.pathname.startsWith(`${path}/`));

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => irPara(path)}
                                className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs font-semibold transition ${
                                    ativo
                                        ? "bg-[#DCEFE1] text-[#17472F]"
                                        : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                                }`}
                            >
                                <Icone
                                    size={16}
                                    strokeWidth={1.8}
                                    className={ativo ? "text-[#24713A]" : "text-white/44 group-hover:text-white/75"}
                                />
                                {label}
                                {ativo && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#2C8C47]" />}
                            </button>
                        );
                    })}

                    {itensVisiveis.length === 0 && (
                        <p className="px-3 py-4 text-[11px] leading-5 text-white/45">
                            Nenhum módulo encontrado.
                        </p>
                    )}
                </nav>

                <div className="mt-4 border-t border-white/8 pt-4">
                    <button
                        type="button"
                        onClick={() => irPara("/assistente")}
                        className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition ${
                            location.pathname === "/assistente"
                                ? "bg-[#A0E4AD] text-[#153F29]"
                                : "bg-white/[0.07] text-[#C6F7D0] hover:bg-white/[0.11]"
                        }`}
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-current/10">
                            <Bot size={16} />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-xs font-bold">Assistente Agro.in</span>
                            <span className={`mt-0.5 block text-[9px] ${location.pathname === "/assistente" ? "text-[#356348]" : "text-white/40"}`}>
                                Orientação para o campo
                            </span>
                        </span>
                    </button>
                </div>
            </aside>

            <header className="mobile-app-header z-30 flex items-center justify-between border-b border-white/8 bg-[#1F5B3A] px-4 pb-3 shadow-[0_6px_20px_rgba(22,59,42,0.12)] lg:hidden">
                <button
                    type="button"
                    onClick={() => setSidebarAberto(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-white/[0.07] text-white"
                    aria-label="Abrir menu"
                >
                    <Menu size={21} />
                </button>

                <button
                    type="button"
                    onClick={() => irPara("/dashboard")}
                    className="flex items-center gap-2.5 text-left"
                    aria-label="Ir para o dashboard do Agro.in"
                >
                    <img src={logo} alt="" className="h-9 w-9 object-contain" />
                    <span>
                        <span className="block text-sm font-bold leading-none tracking-[-0.035em] text-white">
                            Agro.in
                        </span>
                        <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.14em] text-[#99C9A2]">
                            Gestão rural
                        </span>
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => irPara("/relatorios")}
                    className="flex h-10 w-10 items-center justify-center rounded-md text-white/70 transition hover:bg-white/[0.07]"
                    aria-label="Abrir relatórios"
                >
                    <ChartNoAxesCombined size={19} />
                </button>
            </header>
            <div className="mobile-app-header-spacer lg:hidden" aria-hidden="true" />
        </>
    );
}
