import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Bot, Search, Menu } from "lucide-react";
import logo from "../assets/logo.png";

const NAV = [
    { key: "dashboard", label: "Dashboard" },
    { key: "propriedade", label: "Propriedade" },
    { key: "financeiro", label: "Financeiro" },
    { key: "producao", label: "Produção" },
    { key: "estoque", label: "Estoque" },
    { key: "meta", label: "Meta" },
    { key: "relatorios", label: "Relatórios" },
    { key: "perfil", label: "Perfil" },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarAberto, setSidebarAberto] = useState(false);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    return (
        <>
            {/* Overlay do menu mobile */}
            {sidebarAberto && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                    onClick={() => setSidebarAberto(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 lg:w-60 flex flex-col py-6 px-4 shrink-0 transition-transform duration-300 ease-in-out ${
                    sidebarAberto ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0`}
                style={{ background: "#0D5006" }}
            >
                <div className="flex items-center justify-between px-2 mb-8">
                    <img src={logo} alt="Agro.in" className="w-14" />
                    <button className="lg:hidden" onClick={() => setSidebarAberto(false)}>
                        <X size={20} style={{ color: "rgba(255,255,255,0.8)" }} />
                    </button>
                </div>

                <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-6" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <Search size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
                    <input type="text" placeholder="Pesquisar" className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/50 text-white" />
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {NAV.map(({ key, label }) => {
                        const path = `/${key}`;
                        const isActive = location.pathname === path;
                        const isHovered = hoveredKey === key;

                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    navigate(path);
                                    setSidebarAberto(false);
                                }}
                                onMouseEnter={() => setHoveredKey(key)}
                                onMouseLeave={() => setHoveredKey(null)}
                                className="px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
                                style={{
                                    background: isActive ? "#4FF47B" : isHovered ? "rgba(255,255,255,0.08)" : "transparent",
                                    color: isActive ? "#0D5006" : "rgba(255,255,255,0.85)",
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </nav>
                <button
                    onClick={() => navigate("/assistente")}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold mt-4"
                    style={{ background: "rgba(79,244,123,0.15)", color: "#4FF47B", border: "1px solid rgba(79,244,123,0.35)" }}
                >
                    <Bot size={17} />
                    Assistente de IA
                </button>
            </aside>

            {/* Topbar mobile */}
            <div className="flex items-center justify-between px-4 py-3 lg:hidden" style={{ background: "#0D5006" }}>
                <button onClick={() => setSidebarAberto(true)}>
                    <Menu size={22} style={{ color: "white" }} />
                </button>
                <img src={logo} alt="Agro.in" className="w-9" />
                <div style={{ width: 22 }} />
            </div>
        </>
    );
}