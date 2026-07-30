import { Camera, MapPinned, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";

const itens = [
    {
        para: "/analise-foliar",
        fim: true,
        rotulo: "Diagnóstico",
        curto: "Diagnóstico",
        icone: Camera,
    },
    {
        para: "/analise-foliar/quarentenas",
        fim: false,
        rotulo: "Quarentenas",
        curto: "Quarentena",
        icone: ShieldCheck,
    },
    {
        para: "/analise-foliar/vistorias",
        fim: false,
        rotulo: "Vistoria de área",
        curto: "Área",
        icone: MapPinned,
    },
];

export default function AnaliseFoliarNav() {
    return (
        <nav className="mb-5 grid grid-cols-3 gap-1 rounded-md border border-[#DCE3D8] bg-white p-1.5">
            {itens.map(({ para, fim, rotulo, curto, icone: Icone }) => (
                <NavLink
                    key={para}
                    to={para}
                    end={fim}
                    className={({ isActive }) =>
                        `flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-2.5 text-[10px] font-bold transition sm:gap-2 sm:px-3.5 sm:text-xs ${
                            isActive
                                ? "bg-[#1F5B3A] text-white"
                                : "text-[#607064] hover:bg-[#F1F5EE]"
                        }`
                    }
                >
                    <Icone size={15} />
                    <span className="truncate sm:hidden">{curto}</span>
                    <span className="hidden truncate sm:inline">{rotulo}</span>
                </NavLink>
            ))}
        </nav>
    );
}
