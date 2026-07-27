import {
    AlertTriangle,
    ArrowLeftRight,
    Camera,
    Check,
    ChevronRight,
    CircleHelp,
    Crosshair,
    FlaskConical,
    Focus,
    ImagePlus,
    Leaf,
    LoaderCircle,
    LocateFixed,
    MapPin,
    Microscope,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Sprout,
    SunMedium,
    ThumbsDown,
    ThumbsUp,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { isAxiosError } from "axios";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import AnaliseFoliarNav from "../components/AnaliseFoliarNav";
import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";

interface Propriedade {
    id: number;
    nome: string;
}

interface Hipotese {
    nome: string;
    nome_cientifico?: string;
    categoria: string;
    probabilidade: number;
    descricao?: string;
    sintomas: string[];
}

interface Recomendacao {
    etapa: "agora" | "confirmacao" | "laboratorio";
    titulo: string;
    descricao: string;
}

interface MetricasVisuais {
    largura: number;
    altura: number;
    luminosidade: number;
    contraste: number;
    foco_aproximado: number;
    area_foliar_aproximada: number;
    tecido_verde: number;
    tecido_amarelado: number;
    tecido_marrom: number;
    tecido_escuro: number;
}

interface Analise {
    id: number;
    caso_id?: number | null;
    ponto_vistoria_id?: number | null;
    etapa_acompanhamento?: number;
    comparacao_anterior?: {
        referencia_id: number;
        dias_desde: number;
        estado: "melhora_visual" | "estavel" | "piora_visual" | "inconclusivo";
        variacao_indice: number;
        resumo: string;
        aviso: string;
    } | null;
    propriedade_id?: number | null;
    propriedade?: Propriedade | null;
    cultura_informada?: string | null;
    cultura_detectada?: string | null;
    cultura_cientifica?: string | null;
    cultura_confianca?: number | null;
    status_geral: string;
    confianca?: number | null;
    origem_diagnostico: "triagem_visual" | "crop_health";
    qualidade_foto: "boa" | "aceitavel" | "refazer";
    hipoteses: Hipotese[];
    recomendacoes: Recomendacao[];
    perguntas_confirmacao: string[];
    metricas_visuais: MetricasVisuais;
    avisos: string[];
    observacoes?: string | null;
    feedback_util?: boolean | null;
    diagnostico_confirmado?: string | null;
    criado_em: string;
}

interface ContextoAnalise {
    tipo: "caso" | "ponto";
    id: number;
    titulo: string;
    retorno: string;
}

interface CasoContexto {
    id: number;
    titulo: string;
    cultura?: string | null;
    status: string;
    propriedade?: Propriedade | null;
}

interface VistoriaContexto {
    id: number;
    nome: string;
    cultura?: string | null;
    status: string;
    propriedade?: Propriedade | null;
    pontos: Array<{ id: number; nome: string }>;
}

interface Capacidades {
    diagnostico_especializado: boolean;
    provedor_especializado: string | null;
}

const PROCESSOS = [
    { titulo: "Qualidade da captura", detalhe: "luz, foco e enquadramento" },
    { titulo: "Leitura do tecido", detalhe: "segmentação e padrões de cor" },
    { titulo: "Hipóteses visuais", detalhe: "saúde, doença e estresses" },
    { titulo: "Plano de confirmação", detalhe: "campo, laboratório e manejo" },
];

const STATUS: Record<string, { titulo: string; cor: string; fundo: string }> = {
    aparentemente_saudavel: { titulo: "Aparentemente saudável", cor: "#0D6B32", fundo: "#E5F7EA" },
    possivel_doenca_fungica: { titulo: "Possível doença fúngica", cor: "#9C4E12", fundo: "#FFF0DE" },
    possivel_doenca_bacteriana: { titulo: "Possível doença bacteriana", cor: "#9C4E12", fundo: "#FFF0DE" },
    possivel_doenca_viral: { titulo: "Possível doença viral", cor: "#A33A35", fundo: "#FCE9E6" },
    possivel_praga: { titulo: "Possível presença de praga", cor: "#9C4E12", fundo: "#FFF0DE" },
    possivel_estresse_nutricional: { titulo: "Possível estresse nutricional", cor: "#8A6500", fundo: "#FFF5C8" },
    possivel_necrose_ou_ressecamento: { titulo: "Possível necrose ou ressecamento", cor: "#8D4B2A", fundo: "#F7E8DD" },
    possivel_doenca_ou_estresse: { titulo: "Possível doença ou estresse", cor: "#9C4E12", fundo: "#FFF0DE" },
    inconclusivo: { titulo: "Resultado inconclusivo", cor: "#5D675D", fundo: "#EEF1EC" },
};

const COMPARACAO = {
    melhora_visual: { titulo: "Melhora visual", cor: "#176B35", fundo: "#E4F5E7" },
    estavel: { titulo: "Estável", cor: "#526052", fundo: "#EEF1EC" },
    piora_visual: { titulo: "Piora visual", cor: "#A0482C", fundo: "#FBECE5" },
    inconclusivo: { titulo: "Comparação inconclusiva", cor: "#756320", fundo: "#FFF7D8" },
};

const etapaMeta: Record<Recomendacao["etapa"], { rotulo: string; icone: typeof Leaf }> = {
    agora: { rotulo: "Agora", icone: Crosshair },
    confirmacao: { rotulo: "Confirme no campo", icone: CircleHelp },
    laboratorio: { rotulo: "Decisão técnica", icone: FlaskConical },
};

const formatarData = (data: string) =>
    new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(data));

const percentual = (valor?: number | null) => `${Math.round((valor ?? 0) * 100)}%`;

const comprimirFoto = async (arquivo: File): Promise<string> => {
    if (!arquivo.type.startsWith("image/")) throw new Error("Escolha uma foto válida.");
    if (arquivo.size > 18 * 1024 * 1024) throw new Error("A foto original deve ter no máximo 18 MB.");

    const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
    const maiorLado = Math.max(bitmap.width, bitmap.height);
    const escala = maiorLado > 1600 ? 1600 / maiorLado : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const contexto = canvas.getContext("2d");

    if (!contexto) {
        bitmap.close();
        throw new Error("O navegador não conseguiu preparar a foto.");
    }

    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.86);
};

function BarraTecido({ label, valor, cor }: { label: string; valor: number; cor: string }) {
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
                <span style={{ color: "#566156" }}>{label}</span>
                <span className="font-semibold" style={{ color: "#1D2C20" }}>{percentual(valor)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "#E8ECE5" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: percentual(valor), background: cor }} />
            </div>
        </div>
    );
}

function QualidadeItem({ icone: Icone, label, valor }: { icone: typeof Focus; label: string; valor: string }) {
    return (
        <div className="flex items-center gap-2.5 border-r border-white/10 pr-4 last:border-0">
            <Icone size={16} className="text-[#B7F6A8]" />
            <div>
                <p className="text-[10px] uppercase tracking-[0.13em] text-white/45">{label}</p>
                <p className="mt-0.5 text-xs font-semibold text-white">{valor}</p>
            </div>
        </div>
    );
}

export default function AnaliseFoliar() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const casoParam = Number(searchParams.get("caso")) || undefined;
    const pontoParam = Number(searchParams.get("ponto")) || undefined;
    const vistoriaParam = Number(searchParams.get("vistoria")) || undefined;
    const inputRef = useRef<HTMLInputElement>(null);
    const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
    const [historico, setHistorico] = useState<Analise[]>([]);
    const [capacidades, setCapacidades] = useState<Capacidades | null>(null);
    const [resultado, setResultado] = useState<Analise | null>(null);
    const [imagem, setImagem] = useState("");
    const [cultura, setCultura] = useState("");
    const [propriedadeId, setPropriedadeId] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [consentimento, setConsentimento] = useState(false);
    const [coordenadas, setCoordenadas] = useState<{
        latitude: number;
        longitude: number;
        precisao: number;
    } | null>(null);
    const [contexto, setContexto] = useState<ContextoAnalise | null>(null);
    const [criandoQuarentena, setCriandoQuarentena] = useState(false);
    const [localizando, setLocalizando] = useState(false);
    const [processando, setProcessando] = useState(false);
    const [processoAtual, setProcessoAtual] = useState(0);
    const [erro, setErro] = useState("");
    const [carregandoPagina, setCarregandoPagina] = useState(true);
    const [perguntasMarcadas, setPerguntasMarcadas] = useState<Set<number>>(new Set());
    const [diagnosticoReal, setDiagnosticoReal] = useState("");
    const [salvandoFeedback, setSalvandoFeedback] = useState(false);

    const tratarErro = useCallback((error: unknown, padrao: string) => {
        if (isAxiosError(error) && error.response?.status === 401) {
            navigate("/login");
            return "Sua sessão expirou. Entre novamente.";
        }
        if (isAxiosError<{ error?: string }>(error)) return error.response?.data?.error ?? padrao;
        return error instanceof Error ? error.message : padrao;
    }, [navigate]);

    const carregarDados = useCallback(async () => {
        try {
            const [resPropriedades, resHistorico, resCapacidades] = await Promise.all([
                api.get<Propriedade[]>("/propriedades"),
                api.get<Analise[]>("/analise-foliar"),
                api.get<Capacidades>("/analise-foliar/capacidades"),
            ]);
            setPropriedades(resPropriedades.data);
            setHistorico(resHistorico.data);
            setCapacidades(resCapacidades.data);

            if (casoParam) {
                const { data } = await api.get<CasoContexto>(
                    `/analise-foliar/quarentenas/${casoParam}`,
                );
                setContexto({
                    tipo: "caso",
                    id: data.id,
                    titulo: data.titulo,
                    retorno: `/analise-foliar/quarentenas?id=${data.id}`,
                });
                setCultura(data.cultura ?? "");
                setPropriedadeId(data.propriedade?.id ? String(data.propriedade.id) : "");
            } else if (pontoParam && vistoriaParam) {
                const { data } = await api.get<VistoriaContexto>(
                    `/analise-foliar/vistorias/${vistoriaParam}`,
                );
                const ponto = data.pontos.find((item) => item.id === pontoParam);
                if (!ponto) throw new Error("Ponto de vistoria não encontrado.");
                setContexto({
                    tipo: "ponto",
                    id: ponto.id,
                    titulo: `${data.nome} · ${ponto.nome}`,
                    retorno: `/analise-foliar/vistorias?id=${data.id}`,
                });
                setCultura(data.cultura ?? "");
                setPropriedadeId(data.propriedade?.id ? String(data.propriedade.id) : "");
            }
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível carregar o módulo."));
        } finally {
            setCarregandoPagina(false);
        }
    }, [casoParam, pontoParam, tratarErro, vistoriaParam]);

    useEffect(() => {
        const inicio = window.setTimeout(() => {
            void carregarDados();
        }, 0);
        return () => window.clearTimeout(inicio);
    }, [carregarDados]);

    useEffect(() => {
        if (!processando) return;
        const intervalo = window.setInterval(
            () => setProcessoAtual((atual) => Math.min(atual + 1, PROCESSOS.length - 1)),
            850,
        );
        return () => window.clearInterval(intervalo);
    }, [processando]);

    const status = useMemo(
        () => (resultado ? STATUS[resultado.status_geral] ?? STATUS.inconclusivo : STATUS.inconclusivo),
        [resultado],
    );

    const selecionarFoto = async (evento: ChangeEvent<HTMLInputElement>) => {
        const arquivo = evento.target.files?.[0];
        if (!arquivo) return;
        setErro("");
        setResultado(null);
        setPerguntasMarcadas(new Set());
        try {
            setImagem(await comprimirFoto(arquivo));
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível preparar a foto.");
        } finally {
            evento.target.value = "";
        }
    };

    const obterLocalizacao = () => {
        if (!navigator.geolocation) {
            setErro("Este navegador não oferece localização.");
            return;
        }
        setLocalizando(true);
        setErro("");
        navigator.geolocation.getCurrentPosition(
            (posicao) => {
                setCoordenadas({
                    latitude: posicao.coords.latitude,
                    longitude: posicao.coords.longitude,
                    precisao: posicao.coords.accuracy,
                });
                setLocalizando(false);
            },
            () => {
                setErro("Não foi possível obter a localização. Você pode continuar sem ela.");
                setLocalizando(false);
            },
            { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
        );
    };

    const analisar = async () => {
        if (!imagem) return setErro("Tire ou selecione uma foto da folha.");
        if (!consentimento) return setErro("Confirme o envio e armazenamento da foto para continuar.");
        setProcessando(true);
        setProcessoAtual(0);
        setErro("");

        try {
            const { data } = await api.post<Analise>("/analise-foliar", {
                imagem,
                cultura: cultura.trim() || undefined,
                propriedade_id: propriedadeId ? Number(propriedadeId) : undefined,
                latitude: coordenadas?.latitude,
                longitude: coordenadas?.longitude,
                precisao_metros: coordenadas?.precisao,
                observacoes: observacoes.trim() || undefined,
                consentimento,
                caso_id: contexto?.tipo === "caso" ? contexto.id : undefined,
                ponto_vistoria_id:
                    contexto?.tipo === "ponto" ? contexto.id : undefined,
            });
            setResultado(data);
            setHistorico((atual) => [data, ...atual.filter((item) => item.id !== data.id)]);
            setPerguntasMarcadas(new Set());
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível concluir a análise."));
        } finally {
            setProcessando(false);
        }
    };

    const abrirHistorico = async (analise: Analise) => {
        setResultado(analise);
        setPerguntasMarcadas(new Set());
        setDiagnosticoReal(analise.diagnostico_confirmado ?? "");
        setErro("");
        try {
            const { data } = await api.get<Blob>(`/analise-foliar/${analise.id}/imagem`, { responseType: "blob" });
            if (imagem.startsWith("blob:")) URL.revokeObjectURL(imagem);
            setImagem(URL.createObjectURL(data));
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível abrir a foto desta análise."));
        }
    };

    const novaAnalise = () => {
        if (imagem.startsWith("blob:")) URL.revokeObjectURL(imagem);
        setImagem("");
        setResultado(null);
        if (!contexto) setCultura("");
        setObservacoes("");
        setConsentimento(false);
        setPerguntasMarcadas(new Set());
        setDiagnosticoReal("");
        setErro("");
        inputRef.current?.click();
    };

    const iniciarQuarentena = async () => {
        if (!resultado || resultado.caso_id || resultado.ponto_vistoria_id) return;
        setCriandoQuarentena(true);
        setErro("");
        try {
            const { data } = await api.post<{ id: number }>(
                "/analise-foliar/quarentenas",
                { analise_id: resultado.id },
            );
            navigate(`/analise-foliar/quarentenas?id=${data.id}`);
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível iniciar o acompanhamento."));
        } finally {
            setCriandoQuarentena(false);
        }
    };

    const enviarFeedback = async (util: boolean) => {
        if (!resultado) return;
        setSalvandoFeedback(true);
        try {
            const { data } = await api.patch<Analise>(`/analise-foliar/${resultado.id}/feedback`, {
                util,
                diagnostico_confirmado: diagnosticoReal.trim() || undefined,
            });
            setResultado(data);
            setHistorico((atual) => atual.map((item) => (item.id === data.id ? data : item)));
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível registrar o retorno."));
        } finally {
            setSalvandoFeedback(false);
        }
    };

    const removerAnalise = async (analise: Analise) => {
        if (!window.confirm("Excluir esta análise e a foto armazenada? Essa ação não pode ser desfeita.")) return;
        try {
            await api.delete(`/analise-foliar/${analise.id}`);
            setHistorico((atual) => atual.filter((item) => item.id !== analise.id));
            if (resultado?.id === analise.id) {
                setResultado(null);
                setImagem("");
            }
        } catch (error) {
            setErro(tratarErro(error, "Não foi possível excluir a análise."));
        }
    };

    if (carregandoPagina) {
        return (
            <div className="flex min-h-screen" style={{ background: "#F3F5EF" }}>
                <Sidebar />
                <div className="flex flex-1 items-center justify-center">
                    <LoaderCircle className="animate-spin text-[#0D5006]" size={28} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen lg:flex" style={{ background: "#F3F5EF", color: "#1D2C20" }}>
            <Sidebar />
            <main className="min-w-0 flex-1 overflow-hidden">
                <header className="border-b border-[#DDE2D8] bg-[#F8FAF5]/95 px-5 py-5 backdrop-blur md:px-8 lg:px-10">
                    <div className="mx-auto flex max-w-[1380px] flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#317244]">
                                <Sparkles size={14} /> Campo inteligente
                            </div>
                            <h1 className="text-3xl font-bold tracking-[-0.035em] md:text-4xl">Análise foliar</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687267]">
                                Transforme uma boa captura em hipóteses verificáveis e próximos passos seguros.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 self-start rounded-full border border-[#D7DED2] bg-white px-3 py-2 text-xs font-semibold text-[#36533C] md:self-auto">
                            <span className={`h-2 w-2 rounded-full ${capacidades?.diagnostico_especializado ? "bg-[#30B85D]" : "bg-[#D79A28]"}`} />
                            {capacidades?.diagnostico_especializado ? "Diagnóstico ampliado ativo" : "Triagem visual ativa"}
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-[1380px] px-4 py-5 md:px-8 md:py-8 lg:px-10">
                    <AnaliseFoliarNav />
                    {contexto && (
                        <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-[#C9DEC8] bg-[#EDF6EA] px-4 py-3 sm:flex-row sm:items-center">
                            <div className="flex items-start gap-3">
                                {contexto.tipo === "caso" ? (
                                    <ShieldCheck size={18} className="mt-0.5 text-[#2D713D]" />
                                ) : (
                                    <MapPin size={18} className="mt-0.5 text-[#2D713D]" />
                                )}
                                <div>
                                    <p className="text-xs font-bold text-[#285B34]">
                                        {contexto.tipo === "caso"
                                            ? "Nova revisão da quarentena"
                                            : "Foto vinculada ao ponto da vistoria"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#5E735F]">
                                        {contexto.titulo}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(contexto.retorno)}
                                className="text-left text-xs font-bold text-[#2C6638] sm:text-right"
                            >
                                Voltar ao acompanhamento
                            </button>
                        </div>
                    )}
                    {erro && (
                        <div className="foliar-enter mb-5 flex items-start justify-between gap-3 rounded-xl border border-[#E9C1A8] bg-[#FFF4EC] px-4 py-3 text-sm text-[#8A431F]">
                            <div className="flex items-start gap-2.5">
                                <AlertTriangle size={17} className="mt-0.5 shrink-0" /><span>{erro}</span>
                            </div>
                            <button onClick={() => setErro("")} aria-label="Fechar aviso"><X size={16} /></button>
                        </div>
                    )}

                    <section className="grid overflow-hidden rounded-[26px] border border-[#D9E0D4] bg-white shadow-[0_24px_60px_rgba(31,61,35,0.07)] xl:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)]">
                        <div className="relative min-h-[520px] overflow-hidden bg-[#102C1A] md:min-h-[620px]">
                            {imagem ? (
                                <>
                                    <img src={imagem} alt="Folha selecionada para análise" className="absolute inset-0 h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#07150B]/35 via-transparent to-[#07150B]/85" />
                                    {!processando && <div className="foliar-scan pointer-events-none absolute inset-x-[8%] top-[18%] h-px bg-[#8AFF72] shadow-[0_0_18px_3px_rgba(138,255,114,0.75)]" />}
                                    <div className="absolute left-5 top-5 flex gap-2">
                                        <span className="rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-white backdrop-blur">Captura atual</span>
                                        {resultado && <span className="rounded-full bg-[#B9FF9E] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#12371B]">Processada</span>}
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                                    <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_25%_25%,#4f8a54_0,transparent_32%),radial-gradient(circle_at_80%_70%,#325d38_0,transparent_36%)]" />
                                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/8"><Leaf size={42} className="text-[#B7F6A8]" strokeWidth={1.5} /></div>
                                    <h2 className="relative mt-6 text-2xl font-semibold tracking-[-0.025em] text-white md:text-3xl">Enquadre uma folha por vez</h2>
                                    <p className="relative mt-3 max-w-md text-sm leading-6 text-white/60">Use luz natural indireta, preencha o quadro e fotografe também o verso em uma nova análise quando houver manchas.</p>
                                    <button onClick={() => inputRef.current?.click()} className="relative mt-7 flex items-center gap-2 rounded-full bg-[#B9FF9E] px-5 py-3 text-sm font-bold text-[#12371B] transition hover:-translate-y-0.5"><Camera size={18} /> Abrir câmera</button>
                                </div>
                            )}

                            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={selecionarFoto} />

                            {processando && (
                                <div className="absolute inset-0 z-20 flex flex-col justify-end bg-[#07150B]/82 p-6 backdrop-blur-sm md:p-8">
                                    <div className="mb-auto flex items-center justify-between text-white/70">
                                        <span className="text-xs font-bold uppercase tracking-[0.17em]">Multiprocessamento</span>
                                        <LoaderCircle size={20} className="animate-spin text-[#B9FF9E]" />
                                    </div>
                                    <h3 className="max-w-lg text-3xl font-semibold tracking-[-0.04em] text-white">Lendo os sinais da folha</h3>
                                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                                        {PROCESSOS.map((processo, indice) => (
                                            <div key={processo.titulo} className={`flex items-start gap-3 transition-all duration-500 ${indice <= processoAtual ? "opacity-100" : "opacity-30"}`}>
                                                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${indice < processoAtual ? "bg-[#B9FF9E] text-[#12371B]" : indice === processoAtual ? "foliar-processing-dot border border-[#B9FF9E] text-[#B9FF9E]" : "border border-white/30 text-white/40"}`}>
                                                    {indice < processoAtual ? <Check size={13} /> : <span className="text-[10px]">{indice + 1}</span>}
                                                </div>
                                                <div><p className="text-sm font-semibold text-white">{processo.titulo}</p><p className="mt-0.5 text-xs text-white/50">{processo.detalhe}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {imagem && !processando && (
                                <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                                    {resultado ? (
                                        <div className="flex flex-wrap items-end justify-between gap-4">
                                            <div className="flex gap-4">
                                                <QualidadeItem icone={Focus} label="foco" valor={percentual(resultado.metricas_visuais.foco_aproximado)} />
                                                <QualidadeItem icone={SunMedium} label="luz" valor={percentual(resultado.metricas_visuais.luminosidade)} />
                                                <QualidadeItem icone={ImagePlus} label="folha" valor={percentual(resultado.metricas_visuais.area_foliar_aproximada)} />
                                            </div>
                                            <button onClick={novaAnalise} className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#18351F] shadow-lg"><Camera size={15} /> Nova foto</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#18351F] shadow-lg"><RefreshCw size={15} /> Trocar foto</button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            {!resultado ? (
                                <div className="flex h-full flex-col p-5 md:p-8 lg:p-9">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#3A7949]">Contexto da amostra</p>
                                            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">Ajude o modelo a comparar melhor</h2>
                                        </div>
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9F4E7] text-[#27693A]"><Sprout size={19} /></div>
                                    </div>

                                    <div className="mt-7 space-y-5">
                                        <div>
                                            <label htmlFor="cultura" className="mb-2 block text-xs font-semibold text-[#405043]">Cultura ou planta <span className="font-normal text-[#8A9588]">(se souber)</span></label>
                                            <input id="cultura" value={cultura} onChange={(e) => setCultura(e.target.value)} placeholder="Ex.: soja, café, tomate" className="h-12 w-full rounded-xl border border-[#DCE2D8] bg-[#F8FAF6] px-4 text-sm outline-none transition focus:border-[#4A8A55] focus:bg-white" />
                                        </div>
                                        <div>
                                            <label htmlFor="propriedade" className="mb-2 block text-xs font-semibold text-[#405043]">Propriedade</label>
                                            <select id="propriedade" value={propriedadeId} onChange={(e) => setPropriedadeId(e.target.value)} className="h-12 w-full rounded-xl border border-[#DCE2D8] bg-[#F8FAF6] px-4 text-sm outline-none transition focus:border-[#4A8A55] focus:bg-white">
                                                <option value="">Sem vínculo</option>
                                                {propriedades.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="observacoes" className="mb-2 block text-xs font-semibold text-[#405043]">O que você observou?</label>
                                            <textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Quando começou, onde apareceu e como está o clima..." maxLength={600} className="min-h-24 w-full resize-none rounded-xl border border-[#DCE2D8] bg-[#F8FAF6] px-4 py-3 text-sm leading-5 outline-none transition focus:border-[#4A8A55] focus:bg-white" />
                                        </div>
                                        <button type="button" onClick={obterLocalizacao} disabled={localizando} className="flex w-full items-center justify-between rounded-xl border border-[#DCE2D8] px-4 py-3 text-left transition hover:bg-[#F7FAF4]">
                                            <span className="flex items-center gap-3">
                                                {coordenadas ? <MapPin size={18} className="text-[#268448]" /> : <LocateFixed size={18} className="text-[#647365]" />}
                                                <span>
                                                    <span className="block text-xs font-semibold text-[#344438]">{coordenadas ? "Localização adicionada" : "Adicionar localização"}</span>
                                                    <span className="mt-0.5 block text-[11px] text-[#849084]">{coordenadas ? "Ajuda a considerar o contexto regional" : "Opcional e usada somente nesta análise"}</span>
                                                </span>
                                            </span>
                                            {localizando ? <LoaderCircle size={17} className="animate-spin" /> : <ChevronRight size={17} className="text-[#A0AAA0]" />}
                                        </button>
                                    </div>

                                    <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-[#F3F6F0] p-3.5">
                                        <input type="checkbox" checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#175F2D]" />
                                        <span className="text-[11px] leading-5 text-[#617063]">Autorizo o processamento e armazenamento desta foto no meu histórico. Posso excluí-la a qualquer momento.</span>
                                    </label>
                                    <div className="mt-auto pt-6">
                                        <button onClick={analisar} disabled={!imagem || processando} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#174D27] px-5 text-sm font-bold text-white transition hover:bg-[#0E3D1D] disabled:cursor-not-allowed disabled:opacity-45"><Microscope size={18} /> Processar análise</button>
                                        <p className="mt-3 text-center text-[10px] leading-4 text-[#8A9588]">Resultado de triagem. Não substitui diagnóstico agronômico, fitopatológico ou análise laboratorial.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="foliar-enter">
                                    <div className="border-b border-[#E3E8DF] p-5 md:p-7">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: status.cor, background: status.fundo }}>{status.titulo}</span>
                                                <h2 className="mt-4 text-2xl font-bold tracking-[-0.035em] md:text-3xl">{resultado.hipoteses[0]?.nome ?? "Análise concluída"}</h2>
                                                {(resultado.cultura_detectada || resultado.cultura_informada) && <p className="mt-2 text-sm text-[#657064]">{resultado.cultura_detectada ?? resultado.cultura_informada}{resultado.cultura_cientifica ? ` · ${resultado.cultura_cientifica}` : ""}</p>}
                                            </div>
                                            <div className="flex h-17 w-17 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${status.cor} ${percentual(resultado.confianca)}, #E7EBE4 0)` }}>
                                                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-white text-sm font-bold">{percentual(resultado.confianca)}</div>
                                            </div>
                                        </div>
                                        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#E8DDAA] bg-[#FFF9E5] p-3 text-[11px] leading-5 text-[#705C16]">
                                            <ShieldCheck size={17} className="mt-0.5 shrink-0" />
                                            <span><strong>Hipótese, não laudo.</strong> Confiança indica semelhança visual, não certeza da causa. Use os diferenciais e perguntas abaixo.</span>
                                        </div>
                                    </div>

                                    <div className="max-h-[680px] overflow-y-auto">
                                        <div className="border-b border-[#E3E8DF] p-5 md:p-7">
                                            <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Leitura visual do tecido</h3><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#778277]">pré-análise</span></div>
                                            <div className="mt-5 grid gap-3">
                                                <BarraTecido label="Verde" valor={resultado.metricas_visuais.tecido_verde} cor="#3A9C55" />
                                                <BarraTecido label="Amarelado" valor={resultado.metricas_visuais.tecido_amarelado} cor="#D5B23C" />
                                                <BarraTecido label="Marrom / necrosado" valor={resultado.metricas_visuais.tecido_marrom} cor="#9B6740" />
                                            </div>
                                            <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#F4F6F1] p-3 text-[10px] leading-4 text-[#697369]"><FlaskConical size={14} className="mt-0.5 shrink-0" /> Cor foliar pode sugerir estresse, mas não estima NPK, pH ou fertilidade do solo.</div>
                                        </div>

                                        {resultado.comparacao_anterior && (() => {
                                            const meta = COMPARACAO[resultado.comparacao_anterior.estado];
                                            return (
                                                <div className="border-b border-[#E3E8DF] p-5 md:p-7">
                                                    <div className="flex items-start gap-3 rounded-xl p-4" style={{ color: meta.cor, background: meta.fundo }}>
                                                        <ArrowLeftRight size={19} className="mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-bold">{meta.titulo} · {resultado.comparacao_anterior.dias_desde} dias</p>
                                                            <p className="mt-1 text-[11px] leading-5">{resultado.comparacao_anterior.resumo}</p>
                                                            <p className="mt-2 text-[10px] leading-4 opacity-80">{resultado.comparacao_anterior.aviso}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="border-b border-[#E3E8DF] p-5 md:p-7">
                                            <h3 className="text-sm font-bold">Hipóteses e diferenciais</h3>
                                            <div className="mt-4 divide-y divide-[#E6EAE2]">
                                                {resultado.hipoteses.map((hipotese, indice) => (
                                                    <div key={`${hipotese.nome}-${indice}`} className="py-4 first:pt-0">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF4EB] text-[11px] font-bold text-[#2F683B]">{indice + 1}</span>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{hipotese.nome}</p><span className="text-xs font-bold text-[#47624C]">{percentual(hipotese.probabilidade)}</span></div>
                                                                {hipotese.nome_cientifico && <p className="mt-0.5 truncate text-[11px] italic text-[#879087]">{hipotese.nome_cientifico}</p>}
                                                            </div>
                                                        </div>
                                                        {hipotese.descricao && indice === 0 && <p className="mt-3 text-xs leading-5 text-[#697369]">{hipotese.descricao}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-b border-[#E3E8DF] p-5 md:p-7">
                                            <h3 className="text-sm font-bold">Confirme no campo</h3>
                                            <p className="mt-1 text-[11px] leading-5 text-[#7D887D]">Marque o que você realmente observou. Essas respostas ajudam a separar causas parecidas.</p>
                                            <div className="mt-4 space-y-2">
                                                {resultado.perguntas_confirmacao.map((pergunta, indice) => {
                                                    const marcada = perguntasMarcadas.has(indice);
                                                    return (
                                                        <button key={pergunta} onClick={() => setPerguntasMarcadas((atual) => {
                                                            const proximo = new Set(atual);
                                                            if (proximo.has(indice)) proximo.delete(indice); else proximo.add(indice);
                                                            return proximo;
                                                        })} className="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition" style={{ borderColor: marcada ? "#7FAD79" : "#E1E6DD", background: marcada ? "#F0F8ED" : "#FFFFFF" }}>
                                                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded" style={{ background: marcada ? "#2F743D" : "#EEF1EC", color: "white" }}>{marcada && <Check size={11} />}</span>
                                                            <span className="text-xs leading-5 text-[#536055]">{pergunta}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="p-5 md:p-7">
                                            <h3 className="text-sm font-bold">Plano recomendado</h3>
                                            <div className="mt-4 space-y-4">
                                                {resultado.recomendacoes.map((recomendacao, indice) => {
                                                    const MetaIcone = etapaMeta[recomendacao.etapa].icone;
                                                    return (
                                                        <div key={`${recomendacao.titulo}-${indice}`} className="flex gap-3">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF3E7] text-[#2C6C3A]"><MetaIcone size={15} /></div>
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#50805A]">{etapaMeta[recomendacao.etapa].rotulo}</p>
                                                                <p className="mt-1 text-xs font-bold text-[#28372B]">{recomendacao.titulo}</p>
                                                                <p className="mt-1 text-[11px] leading-5 text-[#707B70]">{recomendacao.descricao}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="border-t border-[#E3E8DF] bg-[#F8FAF6] p-5 md:p-7">
                                            <p className="text-xs font-bold">Essa triagem foi útil?</p>
                                            <div className="mt-3 flex gap-2">
                                                <button onClick={() => enviarFeedback(true)} disabled={salvandoFeedback} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: resultado.feedback_util === true ? "#4B8B57" : "#DDE3D9", background: resultado.feedback_util === true ? "#EAF6E8" : "white" }}><ThumbsUp size={14} /> Sim</button>
                                                <button onClick={() => enviarFeedback(false)} disabled={salvandoFeedback} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: resultado.feedback_util === false ? "#A4674C" : "#DDE3D9", background: resultado.feedback_util === false ? "#FAEEE9" : "white" }}><ThumbsDown size={14} /> Não</button>
                                            </div>
                                            <input value={diagnosticoReal} onChange={(e) => setDiagnosticoReal(e.target.value)} placeholder="Diagnóstico confirmado depois (opcional)" maxLength={160} className="mt-3 h-10 w-full rounded-lg border border-[#DDE3D9] bg-white px-3 text-xs outline-none focus:border-[#5D8C63]" />
                                            {!resultado.caso_id && !resultado.ponto_vistoria_id && (
                                                <button
                                                    onClick={iniciarQuarentena}
                                                    disabled={criandoQuarentena}
                                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#174D27] px-4 py-3 text-xs font-bold text-white disabled:opacity-50"
                                                >
                                                    {criandoQuarentena ? (
                                                        <LoaderCircle size={16} className="animate-spin" />
                                                    ) : (
                                                        <ShieldCheck size={16} />
                                                    )}
                                                    Acompanhar tratamento
                                                </button>
                                            )}
                                            {contexto && (
                                                <button
                                                    onClick={() => navigate(contexto.retorno)}
                                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#C8D5C6] bg-white px-4 py-3 text-xs font-bold text-[#31533A]"
                                                >
                                                    Ver histórico e comparação
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {!capacidades?.diagnostico_especializado && (
                        <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-[#E5D5AA] bg-[#FFFAEB] p-4 md:flex-row md:items-center md:px-5">
                            <div className="flex items-start gap-3">
                                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#8A6A10]" />
                                <div><p className="text-xs font-bold text-[#665215]">Modo atual: triagem visual segura</p><p className="mt-1 text-[11px] leading-5 text-[#7E6D3C]">Qualidade e sinais cromáticos estão ativos. Espécie, fungos, bactérias, vírus e pragas serão liberados ao conectar a chave do classificador especializado.</p></div>
                            </div>
                            <span className="shrink-0 rounded-full border border-[#E1CC8F] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7A6012]">Integração preparada</span>
                        </section>
                    )}

                    <section className="mt-8">
                        <div className="mb-4 flex items-end justify-between">
                            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#638069]">Linha do tempo</p><h2 className="mt-1 text-xl font-bold tracking-[-0.025em]">Análises recentes</h2></div>
                            <span className="text-xs text-[#7E887E]">{historico.length} registros</span>
                        </div>
                        {historico.length === 0 ? (
                            <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-[#CBD4C7] bg-white/50 p-6 text-center text-sm text-[#7C897B]">Sua primeira análise aparecerá aqui.</div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-[#DDE3D9] bg-white">
                                {historico.map((analise, indice) => {
                                    const meta = STATUS[analise.status_geral] ?? STATUS.inconclusivo;
                                    return (
                                        <div key={analise.id} className={`group flex items-center gap-3 px-4 py-4 md:px-5 ${indice ? "border-t border-[#E8ECE5]" : ""}`}>
                                            <button onClick={() => abrirHistorico(analise)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ color: meta.cor, background: meta.fundo }}><Leaf size={18} /></span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-semibold text-[#27352A]">{analise.hipoteses[0]?.nome ?? meta.titulo}</span>
                                                    <span className="mt-1 block truncate text-[11px] text-[#818C81]">{analise.cultura_detectada ?? analise.cultura_informada ?? "Cultura não informada"}{analise.propriedade?.nome ? ` · ${analise.propriedade.nome}` : ""}{` · ${formatarData(analise.criado_em)}`}</span>
                                                </span>
                                                <span className="hidden rounded-full px-2.5 py-1 text-[10px] font-bold md:block" style={{ color: meta.cor, background: meta.fundo }}>{percentual(analise.confianca)}</span>
                                                <ChevronRight size={17} className="shrink-0 text-[#A1AAA0]" />
                                            </button>
                                            {!analise.caso_id && !analise.ponto_vistoria_id && (
                                                <button onClick={() => removerAnalise(analise)} className="rounded-lg p-2 text-[#9AA39A] opacity-100 transition hover:bg-[#F9EDE8] hover:text-[#A14D37] md:opacity-0 md:group-hover:opacity-100" aria-label="Excluir análise"><Trash2 size={15} /></button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="mt-8 grid gap-4 border-t border-[#D8DED4] py-7 md:grid-cols-3">
                        <div className="flex gap-3"><Upload size={17} className="mt-0.5 shrink-0 text-[#3E7648]" /><div><p className="text-xs font-bold">2 a 3 fotos ajudam</p><p className="mt-1 text-[11px] leading-5 text-[#737E73]">Faça análises separadas da planta inteira, frente e verso da folha.</p></div></div>
                        <div className="flex gap-3"><Microscope size={17} className="mt-0.5 shrink-0 text-[#3E7648]" /><div><p className="text-xs font-bold">Confirme antes de tratar</p><p className="mt-1 text-[11px] leading-5 text-[#737E73]">Doenças e estresses podem produzir sintomas visualmente semelhantes.</p></div></div>
                        <div className="flex gap-3"><FlaskConical size={17} className="mt-0.5 shrink-0 text-[#3E7648]" /><div><p className="text-xs font-bold">Solo precisa de laboratório</p><p className="mt-1 text-[11px] leading-5 text-[#737E73]">Recomendação de adubo depende de solo, tecido, cultura, fase e histórico.</p></div></div>
                    </section>
                </div>
            </main>
        </div>
    );
}
