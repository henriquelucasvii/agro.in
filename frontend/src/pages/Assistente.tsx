import { isAxiosError } from "axios";
import {
    Bot,
    BookOpen,
    CircleAlert,
    ExternalLink,
    Leaf,
    LoaderCircle,
    LockKeyhole,
    RotateCcw,
    Send,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";

interface Fonte {
    id: number;
    titulo: string;
    organizacao: string;
    url: string;
}

interface Mensagem {
    id: string;
    papel: "usuario" | "assistente";
    conteudo: string;
    fontes?: Fonte[];
    aviso?: string;
    introducao?: boolean;
}

interface Capacidades {
    ativo: boolean;
    provedor: string;
    modelo: string;
    base_conhecimento: string;
    guarda_receituario: boolean;
    envia_dados_propriedade: boolean;
    limites_referencia: {
        requisicoes_dia: number;
        tokens_dia_modelo_principal: number;
    };
}

interface RespostaAssistente {
    resposta: string;
    fontes: Fonte[];
    modelo: string;
    aviso: string;
}

const CHAVE_CONVERSA = "agroin_assistente_conversa_v1";

const MENSAGEM_INICIAL: Mensagem = {
    id: "boas-vindas",
    papel: "assistente",
    introducao: true,
    conteudo:
        "Olá! Sou o assistente agronômico do Agro.in. Posso ajudar a organizar observações de campo, explicar conceitos e preparar próximos passos seguros. Para uma orientação melhor, diga a cultura, o estágio e sua região.",
};

const SUGESTOES = [
    "Como diferenciar estresse hídrico de uma possível doença na soja?",
    "O que devo registrar antes de coletar uma amostra de solo?",
    "Como montar uma rotina de monitoramento de pragas no talhão?",
];

const carregarConversa = (): Mensagem[] => {
    try {
        const salvo = localStorage.getItem(CHAVE_CONVERSA);
        if (!salvo) return [MENSAGEM_INICIAL];
        const mensagens = JSON.parse(salvo) as Mensagem[];
        return Array.isArray(mensagens) && mensagens.length > 0
            ? mensagens.slice(-30)
            : [MENSAGEM_INICIAL];
    } catch {
        return [MENSAGEM_INICIAL];
    }
};

const criarId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

function ConteudoMensagem({ texto }: { texto: string }) {
    const linhas = texto.split("\n");

    return (
        <div className="space-y-2">
            {linhas.map((linha, indice) => {
                const limpa = linha.trim();
                if (!limpa) return <div key={indice} className="h-1" />;
                if (/^[-•]\s/.test(limpa)) {
                    return (
                        <div key={indice} className="flex gap-2">
                            <span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                            <p>{limpa.replace(/^[-•]\s*/, "")}</p>
                        </div>
                    );
                }
                if (/^\d+\.\s/.test(limpa)) {
                    const numero = limpa.match(/^\d+/)?.[0];
                    return (
                        <div key={indice} className="flex gap-2">
                            <span className="min-w-4 font-bold">{numero}.</span>
                            <p>{limpa.replace(/^\d+\.\s*/, "")}</p>
                        </div>
                    );
                }
                return <p key={indice}>{limpa.replace(/\*\*/g, "")}</p>;
            })}
        </div>
    );
}

export default function Assistente() {
    const navigate = useNavigate();
    const fimRef = useRef<HTMLDivElement>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>(carregarConversa);
    const [capacidades, setCapacidades] = useState<Capacidades | null>(null);
    const [entrada, setEntrada] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        const carregar = async () => {
            try {
                const { data } = await api.get<Capacidades>("/assistente/capacidades");
                setCapacidades(data);
            } catch (error) {
                if (isAxiosError(error) && error.response?.status === 401) {
                    navigate("/login");
                    return;
                }
                setErro("Não foi possível verificar a disponibilidade do assistente.");
            } finally {
                setCarregando(false);
            }
        };

        void carregar();
    }, [navigate]);

    useEffect(() => {
        localStorage.setItem(CHAVE_CONVERSA, JSON.stringify(mensagens.slice(-30)));
        fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [mensagens, enviando]);

    const perguntasRealizadas = useMemo(
        () => mensagens.filter((mensagem) => mensagem.papel === "usuario").length,
        [mensagens],
    );

    const limparConversa = () => {
        setMensagens([MENSAGEM_INICIAL]);
        setEntrada("");
        setErro("");
    };

    const enviar = async (evento?: FormEvent, sugestao?: string) => {
        evento?.preventDefault();
        const pergunta = (sugestao ?? entrada).trim();
        if (!pergunta || enviando || !capacidades?.ativo) return;

        const historico = mensagens
            .filter((mensagem) => !mensagem.introducao)
            .slice(-8)
            .map((mensagem) => ({
                papel: mensagem.papel,
                conteudo: mensagem.conteudo,
            }));
        const mensagemUsuario: Mensagem = {
            id: criarId(),
            papel: "usuario",
            conteudo: pergunta,
        };

        setMensagens((atual) => [...atual, mensagemUsuario]);
        setEntrada("");
        setErro("");
        setEnviando(true);

        try {
            const { data } = await api.post<RespostaAssistente>("/assistente/perguntar", {
                mensagem: pergunta,
                historico,
            });
            setMensagens((atual) => [
                ...atual,
                {
                    id: criarId(),
                    papel: "assistente",
                    conteudo: data.resposta,
                    fontes: data.fontes,
                    aviso: data.aviso,
                },
            ]);
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 401) {
                navigate("/login");
                return;
            }
            const mensagemErro = isAxiosError<{ error?: string }>(error)
                ? error.response?.data?.error
                : undefined;
            setErro(mensagemErro ?? "Não foi possível obter uma resposta. Tente novamente.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-[#F3F5F0] lg:flex-row">
            <Sidebar />

            <main className="min-w-0 flex-1">
                <header className="border-b border-white/10 bg-[#123F20] px-5 py-6 text-white md:px-8 lg:px-10">
                    <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A8E4A9]">
                                <Sparkles size={14} />
                                Conhecimento para o campo
                            </div>
                            <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] md:text-3xl">
                                Assistente agronômico
                            </h1>
                            <p className="mt-1 max-w-xl text-xs leading-5 text-white/60">
                                Tire dúvidas, organize uma vistoria e encontre fontes técnicas para decidir com mais segurança.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-[10px] font-semibold text-white/75">
                                <Leaf size={13} className="text-[#9DE39C]" />
                                IA gratuita
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-[10px] font-semibold text-white/75">
                                <LockKeyhole size={13} className="text-[#9DE39C]" />
                                Sem envio automático
                            </span>
                        </div>
                    </div>
                </header>

                <div className="mx-auto grid max-w-[1240px] gap-5 px-4 py-5 md:px-8 md:py-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-10">
                    <section className="flex min-h-[680px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#DCE3D8] bg-white shadow-[0_12px_36px_rgba(27,62,32,0.06)]">
                        <div className="flex items-center justify-between border-b border-[#E3E8E0] px-4 py-3.5 md:px-5">
                            <div className="flex items-center gap-3">
                                <span
                                    className="relative flex h-9 w-9 items-center justify-center rounded-full"
                                    style={{ background: capacidades?.ativo ? "#E3F5E5" : "#F2F2ED" }}
                                >
                                    <Bot size={17} className={capacidades?.ativo ? "text-[#216631]" : "text-[#7B8579]"} />
                                    {capacidades?.ativo && (
                                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#41B75A]" />
                                    )}
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-[#25362A]">Agro.in IA</p>
                                    <p className="mt-0.5 text-[10px] text-[#7A867A]">
                                        {carregando
                                            ? "Verificando disponibilidade..."
                                            : capacidades?.ativo
                                                ? `${capacidades.provedor} · disponível`
                                                : "Aguardando ativação gratuita"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={limparConversa}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DEE4DA] px-2.5 py-2 text-[10px] font-semibold text-[#687568] transition hover:bg-[#F4F7F2]"
                            >
                                <RotateCcw size={13} />
                                Limpar
                            </button>
                        </div>

                        <div className="assistente-scroll flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-6">
                            {!carregando && !capacidades?.ativo && (
                                <div className="flex items-start gap-3 rounded-xl border border-[#E6D6A5] bg-[#FFF9E8] p-4 text-[#6E591B]">
                                    <CircleAlert size={18} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold">Integração pronta para ativar</p>
                                        <p className="mt-1 text-[11px] leading-5">
                                            Falta somente cadastrar a chave gratuita da Groq no servidor. Nenhuma cobrança será configurada.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {mensagens.map((mensagem) => (
                                <article
                                    key={mensagem.id}
                                    className={`assistente-enter flex gap-3 ${
                                        mensagem.papel === "usuario" ? "justify-end" : "justify-start"
                                    }`}
                                >
                                    {mensagem.papel === "assistente" && (
                                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6F2E4] text-[#286738]">
                                            <Bot size={15} />
                                        </span>
                                    )}

                                    <div className={`max-w-[86%] md:max-w-[78%] ${mensagem.papel === "usuario" ? "order-first" : ""}`}>
                                        <div
                                            className={`rounded-2xl px-4 py-3 text-xs leading-6 ${
                                                mensagem.papel === "usuario"
                                                    ? "rounded-br-md bg-[#174D27] text-white"
                                                    : "rounded-bl-md border border-[#E1E7DE] bg-[#F8FAF6] text-[#354239]"
                                            }`}
                                        >
                                            <ConteudoMensagem texto={mensagem.conteudo} />
                                        </div>

                                        {mensagem.fontes && mensagem.fontes.length > 0 && (
                                            <div className="mt-2.5 rounded-xl border border-[#E1E6DD] bg-white p-3">
                                                <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7A6A]">
                                                    <BookOpen size={12} />
                                                    Fontes consultadas
                                                </div>
                                                <div className="space-y-1.5">
                                                    {mensagem.fontes.map((fonte) => (
                                                        <a
                                                            key={`${mensagem.id}-${fonte.id}`}
                                                            href={fonte.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[10px] text-[#3A6642] transition hover:bg-[#F1F6EF]"
                                                        >
                                                            <span className="min-w-0 truncate">
                                                                [{fonte.id}] {fonte.titulo}
                                                                <span className="ml-1 text-[#899389]">· {fonte.organizacao}</span>
                                                            </span>
                                                            <ExternalLink size={11} className="shrink-0" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {mensagem.aviso && (
                                            <p className="mt-2 flex items-start gap-1.5 px-1 text-[9px] leading-4 text-[#8A6F3C]">
                                                <ShieldCheck size={11} className="mt-0.5 shrink-0" />
                                                {mensagem.aviso}
                                            </p>
                                        )}
                                    </div>
                                </article>
                            ))}

                            {enviando && (
                                <div className="assistente-enter flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F2E4] text-[#286738]">
                                        <Bot size={15} />
                                    </span>
                                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#E1E7DE] bg-[#F8FAF6] px-4 py-3 text-[11px] text-[#6D786D]">
                                        <LoaderCircle size={14} className="animate-spin" />
                                        Consultando a base técnica...
                                    </div>
                                </div>
                            )}
                            <div ref={fimRef} />
                        </div>

                        {mensagens.length === 1 && capacidades?.ativo && (
                            <div className="border-t border-[#E8ECE5] px-4 py-3 md:px-6">
                                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8A9589]">
                                    Você pode começar por aqui
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {SUGESTOES.map((sugestao) => (
                                        <button
                                            key={sugestao}
                                            type="button"
                                            onClick={() => void enviar(undefined, sugestao)}
                                            className="rounded-full border border-[#D8E3D5] bg-[#F6F9F4] px-3 py-2 text-left text-[10px] leading-4 text-[#44604A] transition hover:border-[#96B894] hover:bg-[#EEF6EB]"
                                        >
                                            {sugestao}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {erro && (
                            <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg bg-[#FFF0EB] px-3 py-2.5 text-[10px] leading-4 text-[#95492F] md:mx-6">
                                <CircleAlert size={14} className="mt-0.5 shrink-0" />
                                {erro}
                            </div>
                        )}

                        <form onSubmit={(evento) => void enviar(evento)} className="border-t border-[#E2E7DF] bg-[#FBFCFA] p-3 md:p-4">
                            <div className="flex items-end gap-2 rounded-xl border border-[#D8DFD5] bg-white p-2 focus-within:border-[#70A276] focus-within:ring-2 focus-within:ring-[#70A276]/10">
                                <textarea
                                    value={entrada}
                                    onChange={(evento) => setEntrada(evento.target.value)}
                                    onKeyDown={(evento) => {
                                        if (evento.key === "Enter" && !evento.shiftKey) {
                                            evento.preventDefault();
                                            void enviar();
                                        }
                                    }}
                                    disabled={!capacidades?.ativo || enviando}
                                    maxLength={1_800}
                                    rows={2}
                                    placeholder={
                                        capacidades?.ativo
                                            ? "Descreva a cultura, o que observou e há quanto tempo..."
                                            : "O assistente será liberado após cadastrar a chave gratuita"
                                    }
                                    className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-xs leading-5 text-[#26352A] outline-none placeholder:text-[#9AA39A] disabled:cursor-not-allowed"
                                />
                                <button
                                    type="submit"
                                    disabled={!entrada.trim() || !capacidades?.ativo || enviando}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#174D27] text-white transition hover:bg-[#0F3E1D] disabled:cursor-not-allowed disabled:opacity-35"
                                    aria-label="Enviar pergunta"
                                >
                                    {enviando ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                            <div className="mt-2 flex items-center justify-between px-1 text-[9px] text-[#929C91]">
                                <span>Enter envia · Shift + Enter quebra a linha</span>
                                <span>{entrada.length}/1.800</span>
                            </div>
                        </form>
                    </section>

                    <aside className="space-y-4">
                        <section className="rounded-2xl bg-[#183E24] p-5 text-white">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A4DAA5]">
                                    Plano atual
                                </p>
                                <Sparkles size={15} className="text-[#A4DAA5]" />
                            </div>
                            <p className="mt-3 text-xl font-bold">R$ 0</p>
                            <p className="mt-1 text-[11px] leading-5 text-white/60">
                                Sem cobrança por resposta. Uso sujeito ao limite diário do provedor gratuito.
                            </p>
                            <div className="mt-4 border-t border-white/10 pt-4">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-white/55">Modelo principal</span>
                                    <span className="font-semibold text-white/85">GPT-OSS 120B</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[10px]">
                                    <span className="text-white/55">Perguntas nesta conversa</span>
                                    <span className="font-semibold text-white/85">{perguntasRealizadas}</span>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#DCE3D8] bg-white p-5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E9F4E6] text-[#2D6A39]">
                                <BookOpen size={17} />
                            </div>
                            <h2 className="mt-3 text-sm font-bold text-[#26362A]">Como ele aprende</h2>
                            <p className="mt-2 text-[11px] leading-5 text-[#717D71]">
                                A resposta recebe somente os trechos relevantes de uma base auditável, com fontes da Embrapa, MAPA e curadoria técnica.
                            </p>
                        </section>

                        <section className="rounded-2xl border border-[#E6D9B8] bg-[#FFF9EA] p-5">
                            <div className="flex items-start gap-3">
                                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#85691A]" />
                                <div>
                                    <h2 className="text-xs font-bold text-[#695417]">Orientação, não receituário</h2>
                                    <p className="mt-2 text-[10px] leading-5 text-[#7B6A39]">
                                        O assistente não prescreve defensivos nem doses de adubo. Decisões de manejo devem considerar campo, laboratório, bula e responsável técnico.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
}
