import { isAxiosError } from "axios";
import {
    Camera,
    CheckCircle2,
    CircleDot,
    Crosshair,
    Footprints,
    LoaderCircle,
    LocateFixed,
    MapPin,
    MapPinned,
    Plus,
    RefreshCw,
    Route,
    Satellite,
    WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import AnaliseFoliarNav from "../components/AnaliseFoliarNav";
import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";

interface AnalisePonto {
    id: number;
    status_geral: string;
    criado_em: string;
    comparacao_anterior?: {
        estado: "melhora_visual" | "estavel" | "piora_visual" | "inconclusivo";
        resumo: string;
    } | null;
    hipoteses: Array<{ nome: string }>;
}

interface PontoVistoria {
    id: number;
    nome: string;
    setor?: string | null;
    ordem: number;
    latitude?: number | null;
    longitude?: number | null;
    precisao_metros?: number | null;
    analises: AnalisePonto[];
}

interface Vistoria {
    id: number;
    nome: string;
    cultura?: string | null;
    objetivo?: string | null;
    status: "em_andamento" | "concluida";
    propriedade?: { id: number; nome: string } | null;
    pontos: PontoVistoria[];
    resumo: {
        pontos_previstos: number;
        pontos_fotografados: number;
        cobertura: number;
        pontos_com_sinal: number;
        pontos_aparentemente_saudaveis: number;
        pontos_inconclusivos: number;
        nota: string;
    };
}

interface Propriedade {
    id: number;
    nome: string;
}

interface Posicao {
    latitude: number;
    longitude: number;
    precisao: number;
}

const dataCurta = (valor: string) =>
    new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(valor));

const distanciaMetros = (a: Posicao, b: { latitude: number; longitude: number }) => {
    const raio = 6_371_000;
    const rad = (valor: number) => (valor * Math.PI) / 180;
    const deltaLat = rad(b.latitude - a.latitude);
    const deltaLon = rad(b.longitude - a.longitude);
    const valor =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(rad(a.latitude)) *
            Math.cos(rad(b.latitude)) *
            Math.sin(deltaLon / 2) ** 2;
    return raio * 2 * Math.atan2(Math.sqrt(valor), Math.sqrt(1 - valor));
};

const rotuloStatus = (status?: string) => {
    if (!status) return "Aguardando foto";
    if (status === "aparentemente_saudavel") return "Aparentemente saudável";
    if (status === "inconclusivo") return "Inconclusivo";
    return "Sinal para verificar";
};

export default function VistoriasFoliares() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [vistorias, setVistorias] = useState<Vistoria[]>([]);
    const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [ocupado, setOcupado] = useState(false);
    const [erro, setErro] = useState("");
    const [criando, setCriando] = useState(false);
    const [nome, setNome] = useState("");
    const [cultura, setCultura] = useState("");
    const [propriedadeId, setPropriedadeId] = useState("");
    const [novoPonto, setNovoPonto] = useState("");
    const [distancias, setDistancias] = useState<Record<number, number>>({});
    const [online, setOnline] = useState(navigator.onLine);
    const selecionadaId = Number(params.get("id")) || vistorias[0]?.id;
    const selecionada =
        vistorias.find((vistoria) => vistoria.id === selecionadaId) ?? null;

    const tratarErro = useCallback(
        (error: unknown, mensagem: string) => {
            if (isAxiosError(error) && error.response?.status === 401) {
                navigate("/login");
                return "Sua sessão expirou.";
            }
            if (isAxiosError<{ error?: string }>(error)) {
                return error.response?.data?.error ?? mensagem;
            }
            return mensagem;
        },
        [navigate],
    );

    const carregar = useCallback(async () => {
        try {
            const [resVistorias, resPropriedades] = await Promise.all([
                api.get<Vistoria[]>("/analise-foliar/vistorias"),
                api.get<Propriedade[]>("/propriedades"),
            ]);
            setVistorias(resVistorias.data);
            setPropriedades(resPropriedades.data);
            if (!params.get("id") && resVistorias.data[0]) {
                setParams({ id: String(resVistorias.data[0].id) });
            }
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível carregar as vistorias."));
        } finally {
            setCarregando(false);
        }
    }, [params, setParams, tratarErro]);

    useEffect(() => {
        const inicio = window.setTimeout(() => void carregar(), 0);
        return () => window.clearTimeout(inicio);
    }, [carregar]);

    useEffect(() => {
        const atualizar = () => setOnline(navigator.onLine);
        window.addEventListener("online", atualizar);
        window.addEventListener("offline", atualizar);
        return () => {
            window.removeEventListener("online", atualizar);
            window.removeEventListener("offline", atualizar);
        };
    }, []);

    const obterPosicao = () =>
        new Promise<Posicao>((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("GPS não disponível neste navegador."));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (posicao) =>
                    resolve({
                        latitude: posicao.coords.latitude,
                        longitude: posicao.coords.longitude,
                        precisao: posicao.coords.accuracy,
                    }),
                () =>
                    reject(
                        new Error(
                            "Não foi possível obter o GPS. Libere a localização e tente a céu aberto.",
                        ),
                    ),
                { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
            );
        });

    const criarVistoria = async () => {
        if (!nome.trim()) {
            setErro("Informe um nome para a vistoria.");
            return;
        }
        setOcupado(true);
        setErro("");
        try {
            const { data } = await api.post<Vistoria>("/analise-foliar/vistorias", {
                nome: nome.trim(),
                cultura: cultura.trim() || undefined,
                propriedade_id: propriedadeId
                    ? Number(propriedadeId)
                    : undefined,
            });
            setVistorias((atuais) => [data, ...atuais]);
            setParams({ id: String(data.id) });
            setCriando(false);
            setNome("");
            setCultura("");
            setPropriedadeId("");
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível criar a vistoria."));
        } finally {
            setOcupado(false);
        }
    };

    const marcarPonto = async (ponto: PontoVistoria) => {
        if (!selecionada) return;
        setOcupado(true);
        setErro("");
        try {
            const posicao = await obterPosicao();
            const { data } = await api.patch<Vistoria>(
                `/analise-foliar/vistorias/${selecionada.id}/pontos/${ponto.id}/localizacao`,
                {
                    latitude: posicao.latitude,
                    longitude: posicao.longitude,
                    precisao_metros: posicao.precisao,
                },
            );
            setVistorias((atuais) =>
                atuais.map((item) => (item.id === data.id ? data : item)),
            );
            setDistancias((atuais) => ({ ...atuais, [ponto.id]: 0 }));
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : tratarErro(error, "Não foi possível marcar o ponto."),
            );
        } finally {
            setOcupado(false);
        }
    };

    const medirDistancia = async (ponto: PontoVistoria) => {
        if (ponto.latitude == null || ponto.longitude == null) return;
        setOcupado(true);
        setErro("");
        try {
            const posicao = await obterPosicao();
            setDistancias((atuais) => ({
                ...atuais,
                [ponto.id]: distanciaMetros(posicao, {
                    latitude: ponto.latitude!,
                    longitude: ponto.longitude!,
                }),
            }));
        } catch (error) {
            setErro(error instanceof Error ? error.message : "GPS indisponível.");
        } finally {
            setOcupado(false);
        }
    };

    const adicionarPonto = async () => {
        if (!selecionada || !novoPonto.trim()) return;
        setOcupado(true);
        try {
            const { data } = await api.post<Vistoria>(
                `/analise-foliar/vistorias/${selecionada.id}/pontos`,
                { nome: novoPonto.trim() },
            );
            setVistorias((atuais) =>
                atuais.map((item) => (item.id === data.id ? data : item)),
            );
            setNovoPonto("");
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível adicionar o ponto."));
        } finally {
            setOcupado(false);
        }
    };

    const alternarStatus = async () => {
        if (!selecionada) return;
        if (
            selecionada.status === "em_andamento" &&
            !window.confirm(
                "Concluir esta vistoria? Os pontos e análises continuarão disponíveis.",
            )
        ) {
            return;
        }
        setOcupado(true);
        try {
            const acao =
                selecionada.status === "em_andamento" ? "concluir" : "reabrir";
            const { data } = await api.post<Vistoria>(
                `/analise-foliar/vistorias/${selecionada.id}/${acao}`,
            );
            setVistorias((atuais) =>
                atuais.map((item) => (item.id === data.id ? data : item)),
            );
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível atualizar a vistoria."));
        } finally {
            setOcupado(false);
        }
    };

    const emCampo = useMemo(
        () =>
            selecionada?.pontos.filter(
                (ponto) => ponto.latitude != null && ponto.longitude != null,
            ).length ?? 0,
        [selecionada],
    );

    if (carregando) {
        return (
            <div className="flex min-h-screen bg-[#F5F6F2]">
                <Sidebar />
                <div className="flex flex-1 items-center justify-center">
                    <LoaderCircle className="animate-spin text-[#1F5B3A]" size={28} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F6F2] text-[#25352B] lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1">
                <header className="border-b border-[#DDE2D8] bg-[#F8FAF5] px-5 py-5 md:px-8 lg:px-10">
                    <div className="mx-auto flex max-w-[1380px] flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#317244]">
                                <MapPinned size={14} /> Amostragem orientativa
                            </p>
                            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] md:text-4xl">
                                Vistoria de área
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687267]">
                                Percorra pontos espaçados, registre a posição e volte ao
                                mesmo lugar para comparar a evolução.
                            </p>
                        </div>
                        <span
                            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${
                                online
                                    ? "border-[#CDE0CC] bg-white text-[#386443]"
                                    : "border-[#E6C5AC] bg-[#FFF6EE] text-[#8A4B25]"
                            }`}
                        >
                            {online ? <Satellite size={14} /> : <WifiOff size={14} />}
                            {online
                                ? "Sincronização disponível"
                                : "Sem internet para analisar"}
                        </span>
                    </div>
                </header>

                <div className="mx-auto max-w-[1380px] px-4 py-5 md:px-8 md:py-8 lg:px-10">
                    <AnaliseFoliarNav />
                    {erro && (
                        <div className="mb-5 rounded-md border border-[#E9C1A8] bg-[#FFF4EC] px-4 py-3 text-sm text-[#8A431F]">
                            {erro}
                        </div>
                    )}

                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2 overflow-x-auto">
                            {vistorias.map((vistoria) => (
                                <button
                                    key={vistoria.id}
                                    onClick={() =>
                                        setParams({ id: String(vistoria.id) })
                                    }
                                    className="min-w-max rounded-full border px-3.5 py-2 text-xs font-bold"
                                    style={{
                                        borderColor:
                                            vistoria.id === selecionada?.id
                                                ? "#397348"
                                                : "#D6DED3",
                                        background:
                                            vistoria.id === selecionada?.id
                                                ? "#E8F3E6"
                                                : "white",
                                        color: "#31513A",
                                    }}
                                >
                                    {vistoria.nome}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCriando((atual) => !atual)}
                            className="flex items-center gap-2 rounded-md bg-[#1F5B3A] px-4 py-2.5 text-xs font-bold text-white"
                        >
                            <Plus size={15} /> Nova vistoria
                        </button>
                    </div>

                    {criando && (
                        <section className="mb-5 grid gap-3 rounded-lg border border-[#D9E1D5] bg-white p-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                            <label className="text-xs font-bold text-[#425346]">
                                Nome
                                <input
                                    value={nome}
                                    onChange={(event) => setNome(event.target.value)}
                                    placeholder="Talhão norte · julho"
                                    className="mt-2 h-11 w-full rounded-md border border-[#DCE2D8] px-3 text-sm outline-none focus:border-[#4A8A55]"
                                />
                            </label>
                            <label className="text-xs font-bold text-[#425346]">
                                Cultura
                                <input
                                    value={cultura}
                                    onChange={(event) =>
                                        setCultura(event.target.value)
                                    }
                                    placeholder="Ex.: soja"
                                    className="mt-2 h-11 w-full rounded-md border border-[#DCE2D8] px-3 text-sm outline-none focus:border-[#4A8A55]"
                                />
                            </label>
                            <label className="text-xs font-bold text-[#425346]">
                                Propriedade
                                <select
                                    value={propriedadeId}
                                    onChange={(event) =>
                                        setPropriedadeId(event.target.value)
                                    }
                                    className="mt-2 h-11 w-full rounded-md border border-[#DCE2D8] bg-white px-3 text-sm outline-none"
                                >
                                    <option value="">Sem vínculo</option>
                                    {propriedades.map((propriedade) => (
                                        <option
                                            key={propriedade.id}
                                            value={propriedade.id}
                                        >
                                            {propriedade.nome}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button
                                onClick={criarVistoria}
                                disabled={ocupado}
                                className="h-11 rounded-md bg-[#1F5B3A] px-5 text-xs font-bold text-white disabled:opacity-50"
                            >
                                Criar roteiro
                            </button>
                        </section>
                    )}

                    {!selecionada ? (
                        <section className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-[#C9D4C6] bg-white px-6 text-center">
                            <Route size={40} className="text-[#3B7748]" />
                            <h2 className="mt-5 text-2xl font-bold">
                                Monte o primeiro roteiro
                            </h2>
                            <p className="mt-2 max-w-lg text-sm leading-6 text-[#6F7B70]">
                                O sistema cria cinco pontos iniciais em sequência:
                                frente, esquerda, centro, direita e fundo.
                            </p>
                        </section>
                    ) : (
                        <section className="overflow-hidden rounded-lg border border-[#D9E0D4] bg-white shadow-[0_22px_55px_rgba(31,61,35,0.06)]">
                            <div className="border-b border-[#E1E6DE] px-5 py-5 md:px-7">
                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5D7B63]">
                                            {selecionada.status === "em_andamento"
                                                ? "Em campo"
                                                : "Vistoria concluída"}
                                        </span>
                                        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
                                            {selecionada.nome}
                                        </h2>
                                        <p className="mt-1 text-xs text-[#788278]">
                                            {selecionada.cultura ||
                                                "Cultura não informada"}
                                            {selecionada.propriedade?.nome
                                                ? ` · ${selecionada.propriedade.nome}`
                                                : ""}
                                        </p>
                                    </div>
                                    <button
                                        onClick={alternarStatus}
                                        disabled={ocupado}
                                        className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#CBD6C8] px-4 py-2.5 text-xs font-bold text-[#31533A]"
                                    >
                                        {selecionada.status === "em_andamento" ? (
                                            <>
                                                <CheckCircle2 size={16} /> Concluir vistoria
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw size={16} /> Reabrir
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[#DCE3D8] bg-[#DCE3D8] md:grid-cols-4">
                                    {[
                                        [
                                            "Cobertura",
                                            `${selecionada.resumo.cobertura}%`,
                                        ],
                                        [
                                            "Fotografados",
                                            `${selecionada.resumo.pontos_fotografados}/${selecionada.resumo.pontos_previstos}`,
                                        ],
                                        [
                                            "Com sinais",
                                            String(
                                                selecionada.resumo.pontos_com_sinal,
                                            ),
                                        ],
                                        ["GPS marcado", `${emCampo}/${selecionada.pontos.length}`],
                                    ].map(([label, valor]) => (
                                        <div
                                            key={label}
                                            className="bg-[#F8FAF6] px-4 py-3"
                                        >
                                            <p className="text-[10px] uppercase tracking-[0.12em] text-[#7A867A]">
                                                {label}
                                            </p>
                                            <p className="mt-1 text-xl font-bold">
                                                {valor}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_310px]">
                                <div className="divide-y divide-[#E4E9E1]">
                                    {selecionada.pontos.map((ponto, indice) => {
                                        const ultima = ponto.analises.at(-1);
                                        const temSinal =
                                            ultima &&
                                            ![
                                                "aparentemente_saudavel",
                                                "inconclusivo",
                                            ].includes(ultima.status_geral);
                                        const distancia = distancias[ponto.id];
                                        return (
                                            <article
                                                key={ponto.id}
                                                className="grid gap-4 px-5 py-5 md:grid-cols-[44px_minmax(0,1fr)_auto] md:items-center md:px-7"
                                            >
                                                <span
                                                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                                                    style={{
                                                        color: temSinal
                                                            ? "#9B482E"
                                                            : ultima
                                                              ? "#276D39"
                                                              : "#677467",
                                                        background: temSinal
                                                            ? "#FBECE5"
                                                            : ultima
                                                              ? "#E7F5E7"
                                                              : "#EEF1EC",
                                                    }}
                                                >
                                                    {indice + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-sm font-bold">
                                                            {ponto.nome}
                                                        </h3>
                                                        {ponto.setor && (
                                                            <span className="rounded-full bg-[#EFF3EC] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#687668]">
                                                                {ponto.setor}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-[#7A857A]">
                                                        {rotuloStatus(
                                                            ultima?.status_geral,
                                                        )}
                                                        {ultima
                                                            ? ` · ${dataCurta(ultima.criado_em)}`
                                                            : ""}
                                                    </p>
                                                    <p className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#657365]">
                                                        <MapPin size={12} />
                                                        {ponto.latitude != null
                                                            ? `Ponto salvo · precisão ±${Math.round(ponto.precisao_metros ?? 0)} m`
                                                            : "Local ainda não marcado"}
                                                        {distancia !== undefined && (
                                                            <strong className="text-[#205F31]">
                                                                Você está a{" "}
                                                                {distancia < 1000
                                                                    ? `${Math.round(distancia)} m`
                                                                    : `${(distancia / 1000).toFixed(1)} km`}
                                                            </strong>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2 md:justify-end">
                                                    {selecionada.status ===
                                                        "em_andamento" && (
                                                        <button
                                                            onClick={() =>
                                                                marcarPonto(ponto)
                                                            }
                                                            disabled={ocupado}
                                                            className="flex min-h-10 items-center gap-1.5 rounded-lg border border-[#D4DDD1] px-3 py-2 text-[10px] font-bold text-[#49604E]"
                                                        >
                                                            <LocateFixed size={14} />
                                                            {ponto.latitude == null
                                                                ? "Marcar GPS"
                                                                : "Atualizar GPS"}
                                                        </button>
                                                    )}
                                                    {ponto.latitude != null && (
                                                        <button
                                                            onClick={() =>
                                                                medirDistancia(ponto)
                                                            }
                                                            disabled={ocupado}
                                                            className="flex min-h-10 items-center gap-1.5 rounded-lg border border-[#D4DDD1] px-3 py-2 text-[10px] font-bold text-[#49604E]"
                                                        >
                                                            <Crosshair size={14} /> Voltar ao
                                                            ponto
                                                        </button>
                                                    )}
                                                    {selecionada.status ===
                                                        "em_andamento" && (
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    `/analise-foliar?ponto=${ponto.id}&vistoria=${selecionada.id}`,
                                                                )
                                                            }
                                                            className="flex min-h-10 items-center gap-1.5 rounded-lg bg-[#1F5B3A] px-3 py-2 text-[10px] font-bold text-white"
                                                        >
                                                            <Camera size={14} /> Fotografar
                                                        </button>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                <aside className="border-t border-[#E1E6DE] bg-[#F6F8F3] p-5 lg:border-l lg:border-t-0">
                                    <p className="flex items-center gap-2 text-xs font-bold">
                                        <Footprints size={16} /> Roteiro de campo
                                    </p>
                                    <div className="relative mt-5 space-y-4 before:absolute before:bottom-3 before:left-[9px] before:top-3 before:w-px before:bg-[#B8C8B5]">
                                        {selecionada.pontos.map((ponto) => (
                                            <div
                                                key={ponto.id}
                                                className="relative flex items-center gap-3"
                                            >
                                                <CircleDot
                                                    size={19}
                                                    className="z-10 shrink-0 bg-[#F6F8F3] text-[#4D8056]"
                                                />
                                                <span className="text-[11px] font-semibold text-[#536256]">
                                                    {ponto.nome}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {selecionada.status === "em_andamento" && (
                                        <div className="mt-6 flex gap-2">
                                            <input
                                                value={novoPonto}
                                                onChange={(event) =>
                                                    setNovoPonto(event.target.value)
                                                }
                                                placeholder="Outro ponto"
                                                className="h-10 min-w-0 flex-1 rounded-md border border-[#D7DED3] bg-white px-3 text-xs outline-none"
                                            />
                                            <button
                                                onClick={adicionarPonto}
                                                disabled={!novoPonto.trim() || ocupado}
                                                className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1F5B3A] text-white disabled:opacity-40"
                                                aria-label="Adicionar ponto"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="mt-6 rounded-md border border-[#E4D9AF] bg-[#FFF9E7] p-3 text-[10px] leading-5 text-[#756220]">
                                        <strong>Leitura orientativa.</strong> Caminhe em
                                        zigue-zague e distribua pontos em zonas homogêneas.
                                        Cinco fotos não representam automaticamente toda a
                                        área.
                                    </div>
                                    <p className="mt-4 text-[10px] leading-5 text-[#748074]">
                                        O GPS ajuda a retornar ao local, mas a precisão varia
                                        com aparelho, céu e vegetação. A análise e a
                                        sincronização exigem internet.
                                    </p>
                                </aside>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
