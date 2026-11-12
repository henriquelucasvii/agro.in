import { isAxiosError } from "axios";
import {
    AlertTriangle,
    Camera,
    Check,
    CircleHelp,
    FlaskConical,
    Focus,
    ImagePlus,
    Leaf,
    LoaderCircle,
    Microscope,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    SunMedium,
    Upload,
} from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";

import logo from "../assets/logo.png";
import { api } from "../lib/api";

interface Hipotese {
    nome: string;
    nome_cientifico?: string;
    categoria: string;
    probabilidade: number;
    descricao?: string;
    evidencias_presentes?: string[];
    evidencias_ausentes?: string[];
}

interface Recomendacao {
    etapa: "agora" | "confirmacao" | "laboratorio";
    titulo: string;
    descricao: string;
}

interface MetricasVisuais {
    luminosidade: number;
    foco_aproximado: number;
    area_foliar_aproximada: number;
    tecido_verde: number;
    tecido_amarelado: number;
    tecido_marrom: number;
}

interface ResultadoPublico {
    cultura_informada?: string;
    cultura_detectada?: string;
    cultura_cientifica?: string;
    status_geral: string;
    confianca: number;
    origem_diagnostico: string;
    qualidade_foto: "boa" | "aceitavel" | "refazer";
    hipoteses: Hipotese[];
    recomendacoes: Recomendacao[];
    perguntas_confirmacao: string[];
    metricas_visuais: MetricasVisuais;
    avisos: string[];
    criado_em: string;
}

const PROCESSOS = [
    "Conferindo a qualidade da foto",
    "Lendo padrões do tecido",
    "Cruzando hipóteses visuais",
    "Montando o plano de confirmação",
];

const STATUS: Record<string, { titulo: string; cor: string; fundo: string }> = {
    aparentemente_saudavel: { titulo: "Aparentemente saudável", cor: "#176B35", fundo: "#E4F5E7" },
    possivel_doenca_fungica: { titulo: "Possível doença fúngica", cor: "#995016", fundo: "#FFF0DE" },
    possivel_doenca_bacteriana: { titulo: "Possível doença bacteriana", cor: "#995016", fundo: "#FFF0DE" },
    possivel_doenca_viral: { titulo: "Possível doença viral", cor: "#A33A35", fundo: "#FCE9E6" },
    possivel_praga: { titulo: "Possível presença de praga", cor: "#995016", fundo: "#FFF0DE" },
    possivel_estresse_nutricional: { titulo: "Possível estresse nutricional", cor: "#806000", fundo: "#FFF5C8" },
    possivel_necrose_ou_ressecamento: { titulo: "Possível necrose ou ressecamento", cor: "#8D4B2A", fundo: "#F7E8DD" },
    possivel_doenca_ou_estresse: { titulo: "Possível doença ou estresse", cor: "#995016", fundo: "#FFF0DE" },
    inconclusivo: { titulo: "Resultado inconclusivo", cor: "#5D675D", fundo: "#EEF1EC" },
};

const etapaRecomendacao = {
    agora: { rotulo: "Observe agora", icone: Leaf },
    confirmacao: { rotulo: "Confirme no campo", icone: CircleHelp },
    laboratorio: { rotulo: "Decisão técnica", icone: FlaskConical },
};

const percentual = (valor?: number | null) => `${Math.round((valor ?? 0) * 100)}%`;

const sessaoDemo = () => {
    const chave = "agroin:stand:session:v1";
    const existente = window.sessionStorage.getItem(chave);
    if (existente) return existente;
    const nova = globalThis.crypto?.randomUUID?.() ?? `stand-${Date.now()}-${Math.random()}`;
    window.sessionStorage.setItem(chave, nova);
    return nova;
};

const comprimirFoto = async (arquivo: File): Promise<string> => {
    if (!arquivo.type.startsWith("image/")) throw new Error("Escolha uma foto válida.");
    if (arquivo.size > 18 * 1024 * 1024) throw new Error("A foto deve ter no máximo 18 MB.");

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

function Barra({ label, valor, cor }: { label: string; valor: number; cor: string }) {
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-[#5F6B61]">
                <span>{label}</span><strong className="text-[#26362B]">{percentual(valor)}</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E8ECE5]">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: percentual(valor), background: cor }} />
            </div>
        </div>
    );
}

export default function AnaliseFoliarPublica() {
    const cameraRef = useRef<HTMLInputElement>(null);
    const galeriaRef = useRef<HTMLInputElement>(null);
    const [imagem, setImagem] = useState("");
    const [cultura, setCultura] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [consentimento, setConsentimento] = useState(false);
    const [resultado, setResultado] = useState<ResultadoPublico | null>(null);
    const [processando, setProcessando] = useState(false);
    const [erro, setErro] = useState("");

    const status = STATUS[resultado?.status_geral ?? "inconclusivo"] ?? STATUS.inconclusivo;

    const selecionarFoto = async (evento: ChangeEvent<HTMLInputElement>) => {
        const arquivo = evento.target.files?.[0];
        if (!arquivo) return;
        setErro("");
        setResultado(null);
        try {
            setImagem(await comprimirFoto(arquivo));
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível abrir a foto.");
        } finally {
            evento.target.value = "";
        }
    };

    const analisar = async () => {
        if (!imagem) return setErro("Tire uma foto da folha para começar.");
        if (!consentimento) return setErro("Confirme o processamento temporário da foto.");
        setErro("");
        setProcessando(true);
        try {
            const { data } = await api.post<ResultadoPublico>(
                "/analise-foliar/publica",
                {
                    imagem,
                    cultura: cultura.trim() || undefined,
                    observacoes: observacoes.trim() || undefined,
                    consentimento: true,
                },
                { headers: { "X-Demo-Session": sessaoDemo() } },
            );
            setResultado(data);
            window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
        } catch (error) {
            if (isAxiosError<{ error?: string }>(error)) {
                setErro(error.response?.data?.error ?? "Não foi possível concluir a análise.");
            } else {
                setErro(error instanceof Error ? error.message : "Não foi possível concluir a análise.");
            }
        } finally {
            setProcessando(false);
        }
    };

    const reiniciar = () => {
        setImagem("");
        setCultura("");
        setObservacoes("");
        setConsentimento(false);
        setResultado(null);
        setErro("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-[#F4F6F0] text-[#26362B]">
            <header className="border-b border-white/10 bg-[#123D25] text-white">
                <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Agro.in" className="h-10 w-10 object-contain" />
                        <div><p className="text-sm font-bold">Agro.in</p><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">Diagnóstico foliar</p></div>
                    </div>
                    <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/75">Demonstração no stand</span>
                </div>
            </header>

            <main>
                <section className="bg-[#123D25] text-white">
                    <div className="mx-auto max-w-6xl px-4 pb-9 pt-7 sm:px-6 sm:pb-11 sm:pt-9">
                        <div className="max-w-2xl">
                            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A9E596]"><Sparkles size={14} /> Experiência Agro.in</div>
                            <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-5xl">Fotografe uma folha.<br />Entenda os sinais.</h1>
                            <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">Sem cadastro. Uma triagem visual rápida para levantar hipóteses e orientar o que observar no campo.</p>
                        </div>
                        <div className="mt-7 flex items-center gap-2 text-[11px] text-white/55">
                            {["Foto", "Contexto", "Resultado"].map((item, indice) => (
                                <div key={item} className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${resultado || (indice === 0 && imagem) ? "bg-[#A9E596] text-[#123D25]" : "border border-white/25"}`}>{resultado || (indice === 0 && imagem) ? <Check size={11} /> : indice + 1}</span><span>{item}</span>{indice < 2 && <span className="mx-1 h-px w-5 bg-white/15 sm:w-10" />}</div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
                    {erro && <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg border border-[#E9C8BA] bg-[#FFF2EC] p-4 text-sm text-[#91472E]"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><span>{erro}</span></div>}

                    {!imagem ? (
                        <div className="foliar-enter overflow-hidden rounded-2xl border border-[#DDE5DA] bg-white">
                            <div className="grid min-h-[430px] items-center lg:grid-cols-[1.1fr_0.9fr]">
                                <div className="flex min-h-[330px] flex-col items-center justify-center bg-[#183E28] px-6 py-12 text-center text-white sm:min-h-[430px]">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/8"><Camera size={34} className="text-[#B9F0A7]" /></div>
                                    <h2 className="mt-6 text-2xl font-bold tracking-[-0.03em]">Enquadre uma folha por vez</h2>
                                    <p className="mt-3 max-w-md text-sm leading-6 text-white/60">Use luz natural, aproxime a câmera e mostre bem manchas, bordas e nervuras.</p>
                                    <button onClick={() => cameraRef.current?.click()} className="mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-[#B9F0A7] px-5 text-sm font-bold text-[#143521] transition active:scale-[0.99] lg:hidden"><Camera size={18} /> Abrir câmera</button>
                                </div>
                                <div className="p-6 sm:p-10">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3F7D4C]">Comece agora</p>
                                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em]">Tire a foto da amostra</h2>
                                    <p className="mt-3 text-sm leading-6 text-[#687469]">O resultado aparece nesta mesma página e a imagem não entra no histórico do sistema.</p>
                                    <button onClick={() => cameraRef.current?.click()} className="mt-7 hidden h-13 w-full items-center justify-center gap-2 rounded-lg bg-[#1F6538] px-5 text-sm font-bold text-white transition hover:bg-[#174F2D] active:scale-[0.99] lg:flex"><Camera size={18} /> Abrir câmera</button>
                                    <button onClick={() => galeriaRef.current?.click()} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#D9E1D6] bg-white px-5 text-sm font-semibold text-[#38503E] transition hover:bg-[#F5F8F2]"><Upload size={17} /> Escolher da galeria</button>
                                    <p className="mt-5 text-center text-[10px] leading-4 text-[#879187]">Formatos de imagem do celular · até 18 MB</p>
                                </div>
                            </div>
                        </div>
                    ) : resultado ? (
                        <div className="foliar-enter grid overflow-hidden rounded-2xl border border-[#DDE5DA] bg-white lg:grid-cols-[0.8fr_1.2fr]">
                            <aside className="relative min-h-80 bg-[#143521] lg:min-h-[720px]">
                                <img src={imagem} alt="Folha analisada" className="absolute inset-0 h-full w-full object-cover opacity-85" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0D2E1A] via-transparent to-black/15" />
                                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                                    <span className="rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur">Captura analisada</span>
                                    <div className="mt-5 flex gap-5">
                                        <div><p className="text-[9px] uppercase tracking-wider text-white/50">Foco</p><p className="mt-1 text-sm font-bold">{percentual(resultado.metricas_visuais.foco_aproximado)}</p></div>
                                        <div><p className="text-[9px] uppercase tracking-wider text-white/50">Luz</p><p className="mt-1 text-sm font-bold">{percentual(resultado.metricas_visuais.luminosidade)}</p></div>
                                        <div><p className="text-[9px] uppercase tracking-wider text-white/50">Folha</p><p className="mt-1 text-sm font-bold">{percentual(resultado.metricas_visuais.area_foliar_aproximada)}</p></div>
                                    </div>
                                </div>
                            </aside>

                            <div className="min-w-0">
                                <div className="border-b border-[#E5EAE2] p-5 sm:p-8">
                                    <div className="flex items-start justify-between gap-4">
                                        <div><span className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: status.cor, background: status.fundo }}>{status.titulo}</span><h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{resultado.hipoteses[0]?.nome ?? status.titulo}</h2><p className="mt-2 text-sm text-[#69756B]">{resultado.cultura_detectada ?? resultado.cultura_informada ?? "Cultura não informada"}{resultado.cultura_cientifica ? ` · ${resultado.cultura_cientifica}` : ""}</p></div>
                                        <div className="flex h-17 w-17 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${status.cor} ${percentual(resultado.confianca)}, #E7EBE4 0)` }}><div className="flex h-13 w-13 flex-col items-center justify-center rounded-full bg-white text-sm font-bold"><span>{percentual(resultado.confianca)}</span><span className="text-[7px] uppercase tracking-wide text-[#7B847B]">suporte</span></div></div>
                                    </div>
                                    <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-[#E8DDAA] bg-[#FFF9E5] p-3 text-[11px] leading-5 text-[#705C16]"><ShieldCheck size={17} className="mt-0.5 shrink-0" /><span><strong>Hipótese visual, não laudo.</strong> O resultado precisa ser confirmado com observação de campo e, quando necessário, análise técnica.</span></div>
                                </div>

                                <div className="divide-y divide-[#E5EAE2]">
                                    <div className="p-5 sm:p-8"><h3 className="text-sm font-bold">Leitura visual do tecido</h3><div className="mt-5 grid gap-3"><Barra label="Verde" valor={resultado.metricas_visuais.tecido_verde} cor="#3A9C55" /><Barra label="Amarelado" valor={resultado.metricas_visuais.tecido_amarelado} cor="#D5B23C" /><Barra label="Marrom / necrosado" valor={resultado.metricas_visuais.tecido_marrom} cor="#9B6740" /></div></div>

                                    <div className="p-5 sm:p-8"><h3 className="text-sm font-bold">Hipóteses visuais</h3><div className="mt-4 space-y-5">{resultado.hipoteses.slice(0, 3).map((hipotese, indice) => <div key={`${hipotese.nome}-${indice}`} className="grid grid-cols-[28px_1fr_auto] gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF4EB] text-[11px] font-bold text-[#2F683B]">{indice + 1}</span><div><p className="text-sm font-semibold">{hipotese.nome}</p>{hipotese.nome_cientifico && <p className="mt-0.5 text-[11px] italic text-[#879087]">{hipotese.nome_cientifico}</p>}{indice === 0 && hipotese.descricao && <p className="mt-2 text-xs leading-5 text-[#687469]">{hipotese.descricao}</p>}</div><strong className="text-xs text-[#47624C]">{percentual(hipotese.probabilidade)}</strong></div>)}</div></div>

                                    <div className="p-5 sm:p-8"><h3 className="text-sm font-bold">O que fazer a seguir</h3><div className="mt-5 space-y-5">{resultado.recomendacoes.map((item, indice) => { const meta = etapaRecomendacao[item.etapa]; const Icone = meta.icone; return <div key={`${item.titulo}-${indice}`} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF4E7] text-[#397247]"><Icone size={17} /></span><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#5B8764]">{meta.rotulo}</p><p className="mt-1 text-sm font-semibold">{item.titulo}</p><p className="mt-1 text-xs leading-5 text-[#6C776D]">{item.descricao}</p></div></div>; })}</div></div>

                                    {resultado.perguntas_confirmacao.length > 0 && <div className="p-5 sm:p-8"><h3 className="text-sm font-bold">Confira no campo</h3><p className="mt-2 text-xs leading-5 text-[#748075]">Estas perguntas ajudam a separar causas visualmente parecidas.</p><ul className="mt-4 space-y-2">{resultado.perguntas_confirmacao.slice(0, 4).map((pergunta) => <li key={pergunta} className="flex gap-3 rounded-lg bg-[#F5F7F3] p-3 text-xs leading-5 text-[#5F6B61]"><CircleHelp size={16} className="mt-0.5 shrink-0 text-[#5C8B65]" />{pergunta}</li>)}</ul></div>}
                                </div>

                                <div className="border-t border-[#E5EAE2] bg-[#F7F9F5] p-5 sm:p-8"><button onClick={reiniciar} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1F6538] text-sm font-bold text-white transition hover:bg-[#174F2D]"><RefreshCw size={17} /> Analisar outra folha</button><Link to="/" className="mt-3 flex h-11 items-center justify-center text-xs font-semibold text-[#55705B] hover:text-[#1F6538]">Conhecer o Agro.in completo</Link></div>
                            </div>
                        </div>
                    ) : (
                        <div className="foliar-enter grid overflow-hidden rounded-2xl border border-[#DDE5DA] bg-white lg:grid-cols-[1.05fr_0.95fr]">
                            <div className="relative min-h-[390px] overflow-hidden bg-[#143521] sm:min-h-[560px]">
                                <img src={imagem} alt="Folha selecionada" className="absolute inset-0 h-full w-full object-contain" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#102F1C]/90 via-transparent to-black/15" />
                                {processando && <div className="foliar-scan pointer-events-none absolute inset-x-[8%] top-[12%] h-px bg-[#9EFF82] shadow-[0_0_18px_3px_rgba(158,255,130,0.75)]" />}
                                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7"><div className="flex gap-4 text-white"><Focus size={18} className="text-[#B7F6A8]" /><SunMedium size={18} className="text-[#B7F6A8]" /><ImagePlus size={18} className="text-[#B7F6A8]" /></div>{!processando && <button onClick={() => cameraRef.current?.click()} className="rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-[#18351F]">Trocar foto</button>}</div>
                            </div>
                            <div className="flex min-h-[560px] flex-col p-5 sm:p-8">
                                {processando ? <div className="my-auto"><div className="flex items-center gap-3"><LoaderCircle className="animate-spin text-[#2F7A43]" size={22} /><div><p className="text-sm font-bold">Analisando sua amostra</p><p className="mt-1 text-xs text-[#7A857B]">Isso pode levar alguns segundos.</p></div></div><div className="mt-8 space-y-5">{PROCESSOS.map((processo, indice) => <div key={processo} className="flex items-center gap-3"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${indice === 0 ? "foliar-processing-dot border border-[#5C9C68] text-[#367B44]" : "border border-[#D9E0D6] text-[#A1AAA1]"}`}>{indice + 1}</span><span className={`text-sm ${indice === 0 ? "font-semibold text-[#304235]" : "text-[#98A198]"}`}>{processo}</span></div>)}</div></div> : <><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3F7D4C]">Contexto da amostra</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.035em]">Conte o que você sabe</h2><p className="mt-3 text-sm leading-6 text-[#6B776D]">É opcional, mas melhora a comparação entre causas parecidas.</p></div><div className="mt-7 space-y-5"><div><label htmlFor="cultura-stand" className="mb-2 block text-xs font-semibold">Cultura ou planta</label><input id="cultura-stand" value={cultura} onChange={(event) => setCultura(event.target.value)} placeholder="Ex.: soja, milho, café" maxLength={100} className="h-12 w-full rounded-lg border border-[#DCE2D8] bg-[#F8FAF6] px-4 text-sm outline-none transition focus:border-[#4A8A55] focus:bg-white" /></div><div><label htmlFor="observacoes-stand" className="mb-2 block text-xs font-semibold">O que chamou sua atenção?</label><textarea id="observacoes-stand" value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder="Manchas, amarelamento, ressecamento, insetos..." maxLength={600} className="min-h-24 w-full resize-none rounded-lg border border-[#DCE2D8] bg-[#F8FAF6] px-4 py-3 text-sm leading-5 outline-none transition focus:border-[#4A8A55] focus:bg-white" /></div><label className="flex cursor-pointer items-start gap-3 rounded-lg bg-[#F2F6EF] p-4"><input type="checkbox" checked={consentimento} onChange={(event) => setConsentimento(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1F6538]" /><span className="text-[11px] leading-5 text-[#607063]">Autorizo o processamento temporário desta foto pelos provedores de diagnóstico. Ela não será adicionada ao histórico do Agro.in.</span></label></div><div className="mt-auto pt-7"><button onClick={analisar} disabled={!consentimento} className="flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-[#1F6538] text-sm font-bold text-white transition hover:bg-[#174F2D] disabled:cursor-not-allowed disabled:opacity-45"><Microscope size={18} /> Processar análise</button><p className="mt-3 text-center text-[10px] leading-4 text-[#899289]">Triagem educativa. Não substitui diagnóstico agronômico ou análise laboratorial.</p></div></>}
                            </div>
                        </div>
                    )}

                    <div className="mx-auto mt-6 flex max-w-2xl items-start justify-center gap-2 text-center text-[10px] leading-5 text-[#758176]"><ShieldCheck size={15} className="mt-0.5 shrink-0" /><span>A imagem é usada somente para gerar esta resposta e não fica disponível no histórico público. Evite fotografar pessoas ou informações pessoais.</span></div>
                </section>
            </main>

            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={selecionarFoto} className="hidden" />
            <input ref={galeriaRef} type="file" accept="image/*" onChange={selecionarFoto} className="hidden" />
        </div>
    );
}
