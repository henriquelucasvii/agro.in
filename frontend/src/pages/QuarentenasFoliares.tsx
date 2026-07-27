import { isAxiosError } from "axios";
import {
    ArrowLeftRight,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    LoaderCircle,
    Plus,
    RefreshCw,
    Save,
    ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import AnaliseFoliarNav from "../components/AnaliseFoliarNav";
import FotoAnaliseProtegida from "../components/FotoAnaliseProtegida";
import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";

interface Comparacao {
    estado: "melhora_visual" | "estavel" | "piora_visual" | "inconclusivo";
    dias_desde: number;
    resumo: string;
    aviso: string;
}

interface AnaliseCaso {
    id: number;
    etapa_acompanhamento: number;
    status_geral: string;
    confianca?: number | null;
    cultura_informada?: string | null;
    cultura_detectada?: string | null;
    criado_em: string;
    comparacao_anterior?: Comparacao | null;
    hipoteses: Array<{ nome: string }>;
}

interface CasoFoliar {
    id: number;
    titulo: string;
    cultura?: string | null;
    tratamento?: string | null;
    status: "em_quarentena" | "encerrado";
    proxima_revisao_em?: string | null;
    encerrado_em?: string | null;
    atualizado_em: string;
    propriedade?: { id: number; nome: string } | null;
    analises: AnaliseCaso[];
}

const dataCurta = (valor: string) =>
    new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(valor));

const COMPARACOES: Record<
    Comparacao["estado"],
    { rotulo: string; cor: string; fundo: string }
> = {
    melhora_visual: {
        rotulo: "Melhora visual",
        cor: "#176B35",
        fundo: "#E4F5E7",
    },
    estavel: { rotulo: "Estável", cor: "#526052", fundo: "#EEF1EC" },
    piora_visual: { rotulo: "Piora visual", cor: "#A0482C", fundo: "#FBECE5" },
    inconclusivo: { rotulo: "Inconclusivo", cor: "#756320", fundo: "#FFF7D8" },
};

export default function QuarentenasFoliares() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [casos, setCasos] = useState<CasoFoliar[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const selecionadoId = Number(params.get("id")) || casos[0]?.id;
    const selecionado = casos.find((caso) => caso.id === selecionadoId) ?? null;
    const [tratamento, setTratamento] = useState("");
    const [proximaRevisao, setProximaRevisao] = useState("");

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
            const { data } = await api.get<CasoFoliar[]>(
                "/analise-foliar/quarentenas",
            );
            setCasos(data);
            const solicitado = Number(params.get("id"));
            if (!solicitado && data[0]) setParams({ id: String(data[0].id) });
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível carregar as quarentenas."));
        } finally {
            setCarregando(false);
        }
    }, [params, setParams, tratarErro]);

    useEffect(() => {
        const inicio = window.setTimeout(() => void carregar(), 0);
        return () => window.clearTimeout(inicio);
    }, [carregar]);

    useEffect(() => {
        const inicio = window.setTimeout(() => {
            setTratamento(selecionado?.tratamento ?? "");
            setProximaRevisao(
                selecionado?.proxima_revisao_em?.slice(0, 10) ?? "",
            );
        }, 0);
        return () => window.clearTimeout(inicio);
    }, [selecionado?.id, selecionado?.tratamento, selecionado?.proxima_revisao_em]);

    const salvarPlano = async () => {
        if (!selecionado) return;
        setSalvando(true);
        setErro("");
        try {
            const { data } = await api.patch<CasoFoliar>(
                `/analise-foliar/quarentenas/${selecionado.id}`,
                {
                    tratamento: tratamento.trim() || null,
                    proxima_revisao_em: proximaRevisao
                        ? new Date(`${proximaRevisao}T12:00:00`).toISOString()
                        : null,
                },
            );
            setCasos((atuais) =>
                atuais.map((caso) => (caso.id === data.id ? data : caso)),
            );
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível salvar o plano."));
        } finally {
            setSalvando(false);
        }
    };

    const alternarStatus = async () => {
        if (!selecionado) return;
        const encerrando = selecionado.status === "em_quarentena";
        if (
            encerrando &&
            !window.confirm(
                "Encerrar esta quarentena? O histórico será mantido e poderá ser reaberto.",
            )
        ) {
            return;
        }
        setSalvando(true);
        try {
            const acao = encerrando ? "encerrar" : "reabrir";
            const { data } = await api.post<CasoFoliar>(
                `/analise-foliar/quarentenas/${selecionado.id}/${acao}`,
            );
            setCasos((atuais) =>
                atuais.map((caso) => (caso.id === data.id ? data : caso)),
            );
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível atualizar a quarentena."));
        } finally {
            setSalvando(false);
        }
    };

    const ativas = useMemo(
        () => casos.filter((caso) => caso.status === "em_quarentena").length,
        [casos],
    );

    if (carregando) {
        return (
            <div className="flex min-h-screen bg-[#F3F5EF]">
                <Sidebar />
                <div className="flex flex-1 items-center justify-center">
                    <LoaderCircle className="animate-spin text-[#174D27]" size={28} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F5EF] text-[#1D2C20] lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1">
                <header className="border-b border-[#DDE2D8] bg-[#F8FAF5] px-5 py-5 md:px-8 lg:px-10">
                    <div className="mx-auto max-w-[1380px]">
                        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#317244]">
                            <ShieldCheck size={14} /> Acompanhamento temporal
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] md:text-4xl">
                            Quarentenas
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687267]">
                            Guarde o contexto, registre o tratamento e compare a evolução
                            visual sem perder a foto inicial.
                        </p>
                    </div>
                </header>

                <div className="mx-auto max-w-[1380px] px-4 py-5 md:px-8 md:py-8 lg:px-10">
                    <AnaliseFoliarNav />

                    {erro && (
                        <div className="mb-5 rounded-xl border border-[#E9C1A8] bg-[#FFF4EC] px-4 py-3 text-sm text-[#8A431F]">
                            {erro}
                        </div>
                    )}

                    {casos.length === 0 ? (
                        <section className="flex min-h-[440px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#C9D4C6] bg-white px-6 text-center">
                            <ShieldCheck size={38} className="text-[#3B7748]" />
                            <h2 className="mt-5 text-2xl font-bold">
                                Nenhuma quarentena aberta
                            </h2>
                            <p className="mt-2 max-w-md text-sm leading-6 text-[#6F7B70]">
                                Faça um diagnóstico e use “Acompanhar tratamento” para
                                criar a primeira linha do tempo.
                            </p>
                            <button
                                onClick={() => navigate("/analise-foliar")}
                                className="mt-6 flex items-center gap-2 rounded-xl bg-[#174D27] px-5 py-3 text-sm font-bold text-white"
                            >
                                <Plus size={17} /> Nova análise
                            </button>
                        </section>
                    ) : (
                        <section className="grid overflow-hidden rounded-[24px] border border-[#D9E0D4] bg-white shadow-[0_22px_55px_rgba(31,61,35,0.06)] lg:grid-cols-[330px_minmax(0,1fr)]">
                            <aside className="border-b border-[#E0E5DC] bg-[#F8FAF6] lg:border-b-0 lg:border-r">
                                <div className="border-b border-[#E0E5DC] px-5 py-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold">Casos</span>
                                        <span className="text-[11px] text-[#748074]">
                                            {ativas} ativos
                                        </span>
                                    </div>
                                </div>
                                <div className="max-h-[760px] divide-y divide-[#E4E9E1] overflow-y-auto">
                                    {casos.map((caso) => {
                                        const ativo = caso.id === selecionado?.id;
                                        const ultima = caso.analises.at(-1);
                                        return (
                                            <button
                                                key={caso.id}
                                                onClick={() =>
                                                    setParams({ id: String(caso.id) })
                                                }
                                                className="flex w-full items-center gap-3 px-5 py-4 text-left transition"
                                                style={{
                                                    background: ativo
                                                        ? "#EDF5E9"
                                                        : "transparent",
                                                }}
                                            >
                                                <span
                                                    className="h-9 w-1 shrink-0 rounded-full"
                                                    style={{
                                                        background:
                                                            caso.status === "em_quarentena"
                                                                ? "#2F8142"
                                                                : "#A8B1A7",
                                                    }}
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-bold">
                                                        {caso.titulo}
                                                    </span>
                                                    <span className="mt-1 block truncate text-[11px] text-[#778277]">
                                                        {ultima
                                                            ? `${caso.analises.length} registro(s) · ${dataCurta(ultima.criado_em)}`
                                                            : "Sem registros"}
                                                    </span>
                                                </span>
                                                <ChevronRight
                                                    size={16}
                                                    className="text-[#9AA49A]"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>

                            {selecionado && (
                                <div className="min-w-0">
                                    <div className="border-b border-[#E1E6DE] px-5 py-5 md:px-7">
                                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                            <div>
                                                <span
                                                    className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                                                    style={{
                                                        color:
                                                            selecionado.status ===
                                                            "em_quarentena"
                                                                ? "#176B35"
                                                                : "#606A60",
                                                        background:
                                                            selecionado.status ===
                                                            "em_quarentena"
                                                                ? "#E4F5E7"
                                                                : "#EDF0EB",
                                                    }}
                                                >
                                                    {selecionado.status ===
                                                    "em_quarentena"
                                                        ? "Em acompanhamento"
                                                        : "Encerrada"}
                                                </span>
                                                <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em]">
                                                    {selecionado.titulo}
                                                </h2>
                                                <p className="mt-1 text-xs text-[#788278]">
                                                    {selecionado.cultura ||
                                                        "Cultura não informada"}
                                                    {selecionado.propriedade?.nome
                                                        ? ` · ${selecionado.propriedade.nome}`
                                                        : ""}
                                                </p>
                                            </div>
                                            <button
                                                onClick={alternarStatus}
                                                disabled={salvando}
                                                className="flex items-center justify-center gap-2 rounded-xl border border-[#CAD5C8] bg-white px-4 py-2.5 text-xs font-bold text-[#31533A]"
                                            >
                                                {selecionado.status === "em_quarentena" ? (
                                                    <>
                                                        <CheckCircle2 size={16} /> Encerrar
                                                        quarentena
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw size={16} /> Reabrir
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-7 p-5 md:p-7 xl:grid-cols-[minmax(0,1fr)_290px]">
                                        <div>
                                            <div className="mb-5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5F8066]">
                                                        Linha do tempo
                                                    </p>
                                                    <h3 className="mt-1 text-lg font-bold">
                                                        Antes e depois
                                                    </h3>
                                                </div>
                                                {selecionado.status === "em_quarentena" && (
                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                `/analise-foliar?caso=${selecionado.id}`,
                                                            )
                                                        }
                                                        className="flex items-center gap-2 rounded-xl bg-[#174D27] px-4 py-2.5 text-xs font-bold text-white"
                                                    >
                                                        <Plus size={15} /> Nova foto
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-5">
                                                {selecionado.analises.map(
                                                    (analise, indice) => {
                                                        const comparacao =
                                                            analise.comparacao_anterior;
                                                        const meta = comparacao
                                                            ? COMPARACOES[comparacao.estado]
                                                            : null;
                                                        return (
                                                            <article
                                                                key={analise.id}
                                                                className="relative grid gap-4 border-b border-[#E4E9E1] pb-5 sm:grid-cols-[150px_minmax(0,1fr)]"
                                                            >
                                                                <FotoAnaliseProtegida
                                                                    analiseId={analise.id}
                                                                    alt={`Foto ${indice + 1} de ${selecionado.titulo}`}
                                                                    className="h-36 w-full rounded-xl sm:h-32"
                                                                />
                                                                <div className="min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#66816C]">
                                                                            {indice === 0
                                                                                ? "Foto inicial"
                                                                                : `Revisão ${indice}`}
                                                                        </span>
                                                                        <span className="text-[11px] text-[#879187]">
                                                                            {dataCurta(
                                                                                analise.criado_em,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <h4 className="mt-2 text-sm font-bold">
                                                                        {analise.hipoteses[0]
                                                                            ?.nome ||
                                                                            "Análise foliar"}
                                                                    </h4>
                                                                    {meta && comparacao && (
                                                                        <div
                                                                            className="mt-3 rounded-xl p-3"
                                                                            style={{
                                                                                color: meta.cor,
                                                                                background:
                                                                                    meta.fundo,
                                                                            }}
                                                                        >
                                                                            <p className="flex items-center gap-2 text-xs font-bold">
                                                                                <ArrowLeftRight
                                                                                    size={14}
                                                                                />
                                                                                {meta.rotulo} ·{" "}
                                                                                {
                                                                                    comparacao.dias_desde
                                                                                }{" "}
                                                                                dias
                                                                            </p>
                                                                            <p className="mt-1 text-[11px] leading-5">
                                                                                {
                                                                                    comparacao.resumo
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </article>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>

                                        <aside className="h-fit rounded-2xl bg-[#F3F6F0] p-4">
                                            <p className="text-xs font-bold">
                                                Plano de tratamento
                                            </p>
                                            <textarea
                                                value={tratamento}
                                                onChange={(event) =>
                                                    setTratamento(event.target.value)
                                                }
                                                disabled={
                                                    selecionado.status === "encerrado"
                                                }
                                                placeholder="O que foi aplicado, dose orientada, manejo realizado..."
                                                className="mt-3 min-h-32 w-full resize-none rounded-xl border border-[#D7DED3] bg-white p-3 text-xs leading-5 outline-none focus:border-[#5D8C63] disabled:bg-[#EEF1EC]"
                                            />
                                            <label className="mt-4 block text-[11px] font-bold">
                                                Próxima revisão
                                            </label>
                                            <div className="relative mt-2">
                                                <CalendarClock
                                                    size={15}
                                                    className="absolute left-3 top-3 text-[#6C7C6F]"
                                                />
                                                <input
                                                    type="date"
                                                    value={proximaRevisao}
                                                    onChange={(event) =>
                                                        setProximaRevisao(
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={
                                                        selecionado.status ===
                                                        "encerrado"
                                                    }
                                                    className="h-10 w-full rounded-xl border border-[#D7DED3] bg-white pl-9 pr-3 text-xs outline-none disabled:bg-[#EEF1EC]"
                                                />
                                            </div>
                                            {selecionado.status === "em_quarentena" && (
                                                <button
                                                    onClick={salvarPlano}
                                                    disabled={salvando}
                                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#174D27] px-4 py-3 text-xs font-bold text-white disabled:opacity-50"
                                                >
                                                    {salvando ? (
                                                        <LoaderCircle
                                                            size={15}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Save size={15} />
                                                    )}
                                                    Salvar plano
                                                </button>
                                            )}
                                            <p className="mt-4 text-[10px] leading-4 text-[#7A857A]">
                                                Compare a mesma planta ou folhas de idade
                                                semelhante, no mesmo enquadramento e luz. A
                                                leitura é orientativa.
                                            </p>
                                        </aside>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
