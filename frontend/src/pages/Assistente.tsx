import { isAxiosError } from "axios";
import {
    ArrowUpRight,
    Bot,
    BookOpen,
    CircleAlert,
    ExternalLink,
    Leaf,
    LoaderCircle,
    MapPin,
    RotateCcw,
    Send,
    ShieldCheck,
    Sprout,
} from "lucide-react";
import {
    useEffect,
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
}

interface RespostaAssistente {
    resposta: string;
    fontes: Fonte[];
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
    "Como diferenciar estresse hídrico de doença na soja?",
    "O que registrar antes de coletar uma amostra de solo?",
    "Como organizar o monitoramento de pragas no talhão?",
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
        <div className="space-y-2.5">
            {linhas.map((linha, indice) => {
                const limpa = linha.trim();
                if (!limpa) return <div key={indice} className="h-1" />;
                if (/^[-•]\s/.test(limpa)) {
                    return (
                        <div key={indice} className="flex gap-2.5">
                            <span className="mt-[0.65em] h-1 w-1 shrink-0 rounded-full bg-current opacity-45" />
                            <p>{limpa.replace(/^[-•]\s*/, "")}</p>
                        </div>
                    );
                }
                if (/^\d+\.\s/.test(limpa)) {
                    const numero = limpa.match(/^\d+/)?.[0];
                    return (
                        <div key={indice} className="flex gap-2.5">
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
    const conversaRef = useRef<HTMLDivElement>(null);
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
        const conversa = conversaRef.current;
        if (conversa) {
            conversa.scrollTo({
                top: conversa.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [mensagens, enviando]);

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
        <div className="flex min-h-screen w-full flex-col bg-[#F4F5EF] text-[#1F3024] lg:flex-row">
            <Sidebar />

            <main className="min-w-0 flex-1">
                <header className="relative overflow-hidden bg-[#123F20] px-5 py-7 text-white md:px-8 lg:px-10 lg:py-8">
                    <span className="pointer-events-none absolute -right-16 -top-28 h-64 w-64 rounded-full border border-white/[0.07]" />
                    <span className="pointer-events-none absolute -right-2 -top-14 h-36 w-36 rounded-full border border-[#9BE6A4]/10" />

                    <div className="relative mx-auto flex max-w-[1180px] items-end justify-between gap-8">
                        <div>
                            <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#A7DBAE]">
                                <Leaf size={13} />
                                Agro.in Assistente
                            </p>
                            <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] md:text-[32px]">
                                Assistente agronômico
                            </h1>
                            <p className="mt-2 max-w-2xl text-xs leading-5 text-white/62 md:text-[13px]">
                                Organize o que você observou no campo e receba orientação com fontes técnicas.
                            </p>
                        </div>

                        <div className="hidden items-center gap-2 pb-1 text-[11px] font-semibold text-white/72 sm:flex">
                            <span className={`h-2 w-2 rounded-full ${capacidades?.ativo ? "bg-[#63DB7B]" : "bg-[#E2B95B]"}`} />
                            {carregando
                                ? "Conectando..."
                                : capacidades?.ativo
                                    ? "Pronto para orientar"
                                    : "Temporariamente indisponível"}
                        </div>
                    </div>
                </header>

                <div className="mx-auto grid max-w-[1180px] gap-6 px-3 py-4 sm:px-5 md:px-8 md:py-6 lg:grid-cols-[minmax(0,1fr)_250px] lg:px-10">
                    <section className="flex h-[calc(100svh-240px)] min-h-[560px] max-h-[790px] min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#D7DED3] bg-white shadow-[0_18px_48px_rgba(28,57,32,0.07)]">
                        <div className="flex items-center justify-between border-b border-[#E5E9E2] px-4 py-3.5 md:px-5">
                            <div className="flex items-center gap-3">
                                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F3E5] text-[#236537]">
                                    <Bot size={17} />
                                    {capacidades?.ativo && (
                                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#4DBD65]" />
                                    )}
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-[#25362A]">Assistente Agro.in</p>
                                    <p className="mt-0.5 text-[10px] text-[#7A867A]">
                                        {carregando
                                            ? "Preparando a conversa..."
                                            : capacidades?.ativo
                                                ? "Orientação com referências técnicas"
                                                : "Serviço temporariamente indisponível"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={limparConversa}
                                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[10px] font-semibold text-[#687568] transition hover:bg-[#F1F4EF] hover:text-[#34513A]"
                            >
                                <RotateCcw size={13} />
                                <span className="hidden sm:inline">Nova conversa</span>
                            </button>
                        </div>

                        <div
                            ref={conversaRef}
                            className="assistente-scroll flex-1 space-y-5 overflow-y-auto px-3 py-5 sm:px-4 md:px-6"
                        >
                            {!carregando && !capacidades?.ativo && (
                                <div className="flex items-start gap-3 rounded-xl border border-[#E7D8A8] bg-[#FFF9E7] p-4 text-[#6E591B]">
                                    <CircleAlert size={18} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold">Assistente indisponível neste momento</p>
                                        <p className="mt-1 text-[11px] leading-5">
                                            Tente novamente em alguns instantes. Seus outros módulos continuam funcionando.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {mensagens.map((mensagem) => (
                                <article
                                    key={mensagem.id}
                                    className={`assistente-enter flex gap-2.5 sm:gap-3 ${
                                        mensagem.papel === "usuario" ? "justify-end" : "justify-start"
                                    }`}
                                >
                                    {mensagem.papel === "assistente" && (
                                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F3E5] text-[#286738]">
                                            <Bot size={15} />
                                        </span>
                                    )}

                                    <div className={`max-w-[88%] md:max-w-[78%] ${mensagem.papel === "usuario" ? "order-first" : ""}`}>
                                        <div
                                            className={`rounded-[18px] px-4 py-3 text-[12px] leading-6 sm:text-[13px] ${
                                                mensagem.papel === "usuario"
                                                    ? "rounded-br-md bg-[#164D28] text-white shadow-[0_8px_18px_rgba(22,77,40,0.12)]"
                                                    : "rounded-bl-md bg-[#F4F7F1] text-[#354239]"
                                            }`}
                                        >
                                            <ConteudoMensagem texto={mensagem.conteudo} />
                                        </div>

                                        {mensagem.fontes && mensagem.fontes.length > 0 && (
                                            <div className="mt-3 border-l-2 border-[#B7CDB4] pl-3">
                                                <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#738073]">
                                                    <BookOpen size={12} />
                                                    Fontes usadas nesta resposta
                                                </p>
                                                <div className="mt-2 space-y-1">
                                                    {mensagem.fontes.map((fonte) => (
                                                        <a
                                                            key={`${mensagem.id}-${fonte.id}`}
                                                            href={fonte.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center justify-between gap-3 rounded-lg py-1.5 pr-1 text-[10px] text-[#376244] transition hover:text-[#174D27]"
                                                        >
                                                            <span className="min-w-0 truncate">
                                                                [{fonte.id}] {fonte.titulo}
                                                                <span className="ml-1 text-[#8C958B]">· {fonte.organizacao}</span>
                                                            </span>
                                                            <ExternalLink size={11} className="shrink-0" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {mensagem.aviso && (
                                            <p className="mt-2.5 flex items-start gap-1.5 px-1 text-[9px] leading-4 text-[#846E3D]">
                                                <ShieldCheck size={11} className="mt-0.5 shrink-0" />
                                                {mensagem.aviso}
                                            </p>
                                        )}
                                    </div>
                                </article>
                            ))}

                            {enviando && (
                                <div className="assistente-enter flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F3E5] text-[#286738]">
                                        <Bot size={15} />
                                    </span>
                                    <div className="flex items-center gap-2 rounded-[18px] rounded-bl-md bg-[#F4F7F1] px-4 py-3 text-[11px] text-[#6D786D]">
                                        <LoaderCircle size={14} className="animate-spin" />
                                        Consultando referências técnicas...
                                    </div>
                                </div>
                            )}
                        </div>

                        {mensagens.length === 1 && capacidades?.ativo && (
                            <div className="border-t border-[#E8ECE5] px-3 py-3 sm:px-4 md:px-6">
                                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8A9589]">
                                    Perguntas para começar
                                </p>
                                <div className="assistente-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                                    {SUGESTOES.map((sugestao) => (
                                        <button
                                            key={sugestao}
                                            type="button"
                                            onClick={() => void enviar(undefined, sugestao)}
                                            className="min-w-[210px] flex-1 rounded-xl bg-[#F3F7F1] px-3 py-2.5 text-left text-[10px] leading-4 text-[#3F5D46] transition hover:bg-[#EAF3E7] hover:text-[#174D27]"
                                        >
                                            {sugestao}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {erro && (
                            <div className="mx-3 mb-3 flex items-start gap-2 rounded-xl bg-[#FFF0EB] px-3 py-2.5 text-[10px] leading-4 text-[#95492F] sm:mx-4 md:mx-6">
                                <CircleAlert size={14} className="mt-0.5 shrink-0" />
                                {erro}
                            </div>
                        )}

                        <form onSubmit={(evento) => void enviar(evento)} className="border-t border-[#E2E7DF] bg-[#FAFBF8] p-3 md:p-4">
                            <div className="flex items-end gap-2 rounded-2xl border border-[#D4DDD1] bg-white p-2 shadow-[0_6px_18px_rgba(30,58,34,0.04)] transition focus-within:border-[#70A276] focus-within:ring-3 focus-within:ring-[#70A276]/10">
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
                                            ? "Conte o que observou na lavoura..."
                                            : "Assistente temporariamente indisponível"
                                    }
                                    className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-xs leading-5 text-[#26352A] outline-none placeholder:text-[#9AA39A] disabled:cursor-not-allowed"
                                />
                                <button
                                    type="submit"
                                    disabled={!entrada.trim() || !capacidades?.ativo || enviando}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#174D27] text-white shadow-[0_6px_14px_rgba(23,77,39,0.16)] transition hover:bg-[#0F3E1D] active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                                    aria-label="Enviar pergunta"
                                >
                                    {enviando ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
                                </button>
                            </div>
                            <div className="mt-2 flex items-center justify-between px-1 text-[9px] text-[#929C91]">
                                <span className="hidden sm:inline">Enter envia · Shift + Enter quebra a linha</span>
                                <span className="sm:hidden">Digite sua dúvida com detalhes</span>
                                <span>{entrada.length}/1.800</span>
                            </div>
                        </form>
                    </section>

                    <aside className="hidden flex-col gap-7 pt-2 lg:flex">
                        <section className="border-l border-[#CBD7C7] pl-5">
                            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#66806A]">
                                Uma boa pergunta inclui
                            </p>
                            <ol className="mt-5 space-y-5">
                                {[
                                    ["01", "Cultura e fase", "Ex.: soja em floração"],
                                    ["02", "Local e clima", "Região, chuva ou seca recente"],
                                    ["03", "Sinais observados", "Onde começou e como evoluiu"],
                                ].map(([numero, titulo, detalhe]) => (
                                    <li key={numero} className="flex gap-3">
                                        <span className="pt-0.5 text-[9px] font-bold text-[#8AA08C]">{numero}</span>
                                        <span>
                                            <span className="block text-xs font-bold text-[#2C3E31]">{titulo}</span>
                                            <span className="mt-1 block text-[10px] leading-4 text-[#7B877B]">{detalhe}</span>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <button
                            type="button"
                            onClick={() => navigate("/analise-foliar")}
                            className="group border-y border-[#D7DED3] py-5 text-left"
                        >
                            <span className="flex items-center justify-between">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F2E4] text-[#2B6B39]">
                                    <Sprout size={17} />
                                </span>
                                <ArrowUpRight size={16} className="text-[#859087] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#275D34]" />
                            </span>
                            <span className="mt-3 block text-xs font-bold text-[#293A2E]">Tem uma foto da folha?</span>
                            <span className="mt-1 block text-[10px] leading-5 text-[#758176]">
                                Abra a análise foliar para registrar a imagem e acompanhar a evolução.
                            </span>
                        </button>

                        <section className="flex gap-3 text-[#78652E]">
                            <ShieldCheck size={17} className="mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[11px] font-bold">Orientação responsável</p>
                                <p className="mt-1 text-[10px] leading-5 text-[#82764F]">
                                    Confirme diagnósticos, defensivos e doses com análise e responsável técnico.
                                </p>
                            </div>
                        </section>

                        <p className="flex items-center gap-2 text-[9px] leading-4 text-[#8A948A]">
                            <MapPin size={12} className="shrink-0" />
                            Informe apenas a região necessária para contextualizar a resposta.
                        </p>
                    </aside>
                </div>
            </main>
        </div>
    );
}
