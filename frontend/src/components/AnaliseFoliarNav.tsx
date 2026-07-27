import { Camera, MapPinned, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";

const itens = [
    { para: "/analise-foliar", fim: true, rotulo: "Diagnóstico", icone: Camera },
    {
        para: "/analise-foliar/quarentenas",
        fim: false,
        rotulo: "Quarentenas",
        icone: ShieldCheck,
    },
    {
        para: "/analise-foliar/vistorias",
        fim: false,
        rotulo: "Vistoria de área",
        icone: MapPinned,
    },
];

export default function AnaliseFoliarNav() {
    return (
        <nav className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-[#DCE3D8] bg-white p-1.5">
            {itens.map(({ para, fim, rotulo, icone: Icone }) => (
                <NavLink
                    key={para}
                    to={para}
                    end={fim}
                    className={({ isActive }) =>
                        `flex min-w-max items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-bold transition ${
                            isActive
                                ? "bg-[#174D27] text-white"
                                : "text-[#607064] hover:bg-[#F1F5EE]"
                        }`
                    }
                >
                    <Icone size={15} />
                    {rotulo}
                </NavLink>
            ))}
        </nav>
    );
}
