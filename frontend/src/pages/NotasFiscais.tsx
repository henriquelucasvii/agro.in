import {
    AlertCircle,
    Building2,
    CheckCircle2,
    ChevronDown,
    CircleDollarSign,
    Clock3,
    FileText,
    Plus,
    ReceiptText,
    Save,
    Send,
    ShieldAlert,
    Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Propriedade {
    id: number;
    nome: string;
}

interface ItemNota {
    id: string;
    descricao: string;
    ncm: string;
    cfop: string;
    quantidade: number;
    unidade: string;
    valorUnitario: number;
}

interface NotaFiscalDemo {
    id: string;
    numero: string;
    serie: string;
    propriedade: string;
    destinatario: string;
    documento: string;
    natureza: string;
    emitidaEm: string;
    total: number;
    status: "rascunho" | "demonstracao";
    itens: ItemNota[];
}

const novoItem = (): ItemNota => ({
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    descricao: "",
    ncm: "",
    cfop: "5102",
    quantidade: 1,
    unidade: "UN",
    valorUnitario: 0,
});

const moeda = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const inputClass =
    "h-11 w-full rounded-md border border-[#DCE4DA] bg-white px-3 text-sm text-[#25352B] outline-none transition focus:border-[#4E9462] focus:ring-2 focus:ring-[#4E9462]/10";

const labelClass = "mb-1.5 block text-xs font-semibold text-[#526158]";

export default function NotasFiscais() {
    const [aba, setAba] = useState<"nova" | "historico">("nova");
    const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
    const [carregandoPropriedades, setCarregandoPropriedades] = useState(true);
    const [propriedadeId, setPropriedadeId] = useState<number | null>(null);
    const [destinatario, setDestinatario] = useState("");
    const [documento, setDocumento] = useState("");
    const [natureza, setNatureza] = useState("Venda de produção rural");
    const [numero, setNumero] = useState("000001");
    const [serie, setSerie] = useState("1");
    const [dataEmissao, setDataEmissao] = useState(() => new Date().toISOString().slice(0, 10));
    const [itens, setItens] = useState<ItemNota[]>(() => [novoItem()]);
    const [frete, setFrete] = useState(0);
    const [desconto, setDesconto] = useState(0);
    const [aliquotaIcms, setAliquotaIcms] = useState(0);
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");
    const [historico, setHistorico] = useLocalStorage<NotaFiscalDemo[]>("agroin:notas-fiscais:demo", []);

    const carregarPropriedades = useCallback(async () => {
        setCarregandoPropriedades(true);
        try {
            const { data } = await api.get<Propriedade[]>("/propriedades");
            const lista = Array.isArray(data) ? data : [];
            setPropriedades(lista);
            if (lista.length > 0) setPropriedadeId((atual) => atual ?? lista[0].id);
        } catch {
            setPropriedades([]);
        } finally {
            setCarregandoPropriedades(false);
        }
    }, []);

    useEffect(() => {
        const tarefa = window.setTimeout(() => void carregarPropriedades(), 0);
        return () => window.clearTimeout(tarefa);
    }, [carregarPropriedades]);

    const subtotal = useMemo(
        () => itens.reduce((total, item) => total + Math.max(0, item.quantidade) * Math.max(0, item.valorUnitario), 0),
        [itens],
    );
    const total = Math.max(0, subtotal + Math.max(0, frete) - Math.max(0, desconto));
    const icmsEstimado = total * (Math.max(0, aliquotaIcms) / 100);
    const propriedadeSelecionada = propriedades.find((item) => item.id === propriedadeId)?.nome ?? "Propriedade não selecionada";

    const atualizarItem = <K extends keyof ItemNota>(id: string, campo: K, valor: ItemNota[K]) => {
        setItens((atuais) => atuais.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
    };

    const validar = () => {
        if (!propriedadeId) return "Selecione a propriedade emitente.";
        if (!destinatario.trim()) return "Informe o nome ou a razão social do destinatário.";
        if (!documento.trim()) return "Informe o CPF ou CNPJ do destinatário.";
        if (itens.length === 0 || itens.some((item) => !item.descricao.trim() || item.quantidade <= 0)) {
            return "Revise os itens: descrição e quantidade são obrigatórias.";
        }
        return "";
    };

    const registrar = (status: NotaFiscalDemo["status"]) => {
        const validacao = validar();
        if (validacao) {
            setErro(validacao);
            setMensagem("");
            return;
        }
        const nota: NotaFiscalDemo = {
            id: `NFD-${Date.now()}`,
            numero,
            serie,
            propriedade: propriedadeSelecionada,
            destinatario: destinatario.trim(),
            documento: documento.trim(),
            natureza: natureza.trim(),
            emitidaEm: dataEmissao,
            total,
            status,
            itens,
        };
        setHistorico((atuais) => [nota, ...atuais].slice(0, 50));
        setErro("");
        setMensagem(
            status === "demonstracao"
                ? "Nota demonstrativa gerada. Nenhum documento foi transmitido à SEFAZ."
                : "Rascunho salvo neste dispositivo.",
        );
        setAba("historico");
    };

    return (
        <div className="min-h-screen w-full bg-[#F5F6F2] lg:flex" style={{ fontFamily: "Inter, sans-serif" }}>
            <Sidebar />
            <div className="min-w-0 flex-1">
                <header className="border-b border-white/10 bg-[#1F5B3A] px-4 pb-6 pt-6 sm:px-6 sm:pt-8 lg:px-10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A9D5B0]">
                                <ReceiptText size={14} /> Fiscal
                            </div>
                            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                Notas fiscais
                            </h1>
                            <p className="mt-1.5 max-w-xl text-xs leading-5 text-white/65">
                                Prepare documentos, confira totais e apresente o fluxo de emissão do Agro.in.
                            </p>
                        </div>
                        <span className="w-fit rounded-full border border-[#D9B93A]/45 bg-[#D9B93A]/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5DC78]">
                            Ambiente demonstrativo
                        </span>
                    </div>
                </header>

                <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
                    <div className="mb-6 flex items-start gap-3 border-l-4 border-[#D5AD2B] bg-[#FFF9E8] px-4 py-3 text-sm leading-6 text-[#705F22]">
                        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                        <p>
                            Este módulo monta um espelho de nota para demonstração. A autorização oficial exigirá certificado digital,
                            credenciamento, regras tributárias e integração com SEFAZ ou provedor fiscal.
                        </p>
                    </div>

                    <div className="mb-6 flex w-full gap-1 border-b border-[#DCE4DA] sm:w-auto">
                        {([ ["nova", "Nova nota"], ["historico", `Histórico (${historico.length})`] ] as const).map(([chave, rotulo]) => (
                            <button
                                key={chave}
                                type="button"
                                onClick={() => setAba(chave)}
                                className={`relative px-4 py-3 text-sm font-semibold transition ${aba === chave ? "text-[#1F5B3A]" : "text-[#6A776F] hover:text-[#25352B]"}`}
                            >
                                {rotulo}
                                {aba === chave && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-[#1F5B3A]" />}
                            </button>
                        ))}
                    </div>

                    {mensagem && (
                        <div className="mb-5 flex items-start gap-2 rounded-md bg-[#E8F3EA] px-4 py-3 text-sm text-[#1F5B3A]">
                            <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> {mensagem}
                        </div>
                    )}
                    {erro && (
                        <div className="mb-5 flex items-start gap-2 rounded-md bg-[#F8ECE8] px-4 py-3 text-sm text-[#A8553E]">
                            <AlertCircle size={17} className="mt-0.5 shrink-0" /> {erro}
                        </div>
                    )}

                    {aba === "nova" ? (
                        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]">
                            <div className="min-w-0 space-y-5">
                                <section className="bg-white p-5 sm:p-6" style={{ border: "1px solid #DCE4DA", borderTop: "4px solid #1F5B3A" }}>
                                    <div className="mb-5 flex items-center gap-2">
                                        <Building2 size={17} className="text-[#4E9462]" />
                                        <h2 className="font-bold text-[#25352B]">Dados da nota</h2>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <label className="sm:col-span-2 lg:col-span-1">
                                            <span className={labelClass}>Propriedade emitente</span>
                                            <div className="relative">
                                                <select
                                                    value={propriedadeId ?? ""}
                                                    onChange={(evento) => setPropriedadeId(Number(evento.target.value) || null)}
                                                    disabled={carregandoPropriedades}
                                                    className={`${inputClass} appearance-none pr-9`}
                                                >
                                                    <option value="">Selecione</option>
                                                    {propriedades.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                                                </select>
                                                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6A776F]" />
                                            </div>
                                        </label>
                                        <label>
                                            <span className={labelClass}>Número</span>
                                            <input value={numero} onChange={(evento) => setNumero(evento.target.value)} className={inputClass} />
                                        </label>
                                        <label>
                                            <span className={labelClass}>Série</span>
                                            <input value={serie} onChange={(evento) => setSerie(evento.target.value)} className={inputClass} />
                                        </label>
                                        <label className="sm:col-span-2">
                                            <span className={labelClass}>Natureza da operação</span>
                                            <input value={natureza} onChange={(evento) => setNatureza(evento.target.value)} className={inputClass} />
                                        </label>
                                        <label>
                                            <span className={labelClass}>Data de emissão</span>
                                            <input type="date" value={dataEmissao} onChange={(evento) => setDataEmissao(evento.target.value)} className={inputClass} />
                                        </label>
                                    </div>
                                </section>

                                <section className="bg-white p-5 sm:p-6" style={{ border: "1px solid #DCE4DA", borderTop: "4px solid #4E829C" }}>
                                    <div className="mb-5 flex items-center gap-2">
                                        <FileText size={17} className="text-[#4E829C]" />
                                        <h2 className="font-bold text-[#25352B]">Destinatário</h2>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label>
                                            <span className={labelClass}>Nome ou razão social</span>
                                            <input value={destinatario} onChange={(evento) => setDestinatario(evento.target.value)} placeholder="Ex.: Cooperativa Vale Verde" className={inputClass} />
                                        </label>
                                        <label>
                                            <span className={labelClass}>CPF ou CNPJ</span>
                                            <input value={documento} onChange={(evento) => setDocumento(evento.target.value)} placeholder="Somente para demonstração" className={inputClass} />
                                        </label>
                                    </div>
                                </section>

                                <section className="min-w-0 bg-white p-5 sm:p-6" style={{ border: "1px solid #DCE4DA", borderTop: "4px solid #D5AD2B" }}>
                                    <div className="mb-5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <CircleDollarSign size={17} className="text-[#B28916]" />
                                            <h2 className="font-bold text-[#25352B]">Itens e valores</h2>
                                        </div>
                                        <button type="button" onClick={() => setItens((atuais) => [...atuais, novoItem()])} className="flex items-center gap-1.5 rounded-md bg-[#EEF4EB] px-3 py-2 text-xs font-bold text-[#1F5B3A] transition hover:bg-[#E3EDDF]">
                                            <Plus size={14} /> Adicionar item
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {itens.map((item, indice) => (
                                            <div key={item.id} className="border-b border-[#E3E9E1] pb-4 last:border-0 last:pb-0">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#6A776F]">Item {indice + 1}</span>
                                                    {itens.length > 1 && (
                                                        <button type="button" onClick={() => setItens((atuais) => atuais.filter((atual) => atual.id !== item.id))} className="flex h-9 w-9 items-center justify-center rounded-md text-[#A8553E] transition hover:bg-[#F8ECE8]" aria-label={`Remover item ${indice + 1}`}>
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                                                    <label className="sm:col-span-2 lg:col-span-2">
                                                        <span className={labelClass}>Descrição</span>
                                                        <input value={item.descricao} onChange={(evento) => atualizarItem(item.id, "descricao", evento.target.value)} placeholder="Ex.: Soja em grãos" className={inputClass} />
                                                    </label>
                                                    <label>
                                                        <span className={labelClass}>NCM</span>
                                                        <input value={item.ncm} onChange={(evento) => atualizarItem(item.id, "ncm", evento.target.value)} placeholder="1201.90.00" className={inputClass} />
                                                    </label>
                                                    <label>
                                                        <span className={labelClass}>CFOP</span>
                                                        <input value={item.cfop} onChange={(evento) => atualizarItem(item.id, "cfop", evento.target.value)} className={inputClass} />
                                                    </label>
                                                    <label>
                                                        <span className={labelClass}>Quantidade</span>
                                                        <input type="number" min="0" step="0.01" value={item.quantidade} onChange={(evento) => atualizarItem(item.id, "quantidade", Number(evento.target.value))} className={inputClass} />
                                                    </label>
                                                    <label>
                                                        <span className={labelClass}>Valor unitário</span>
                                                        <input type="number" min="0" step="0.01" value={item.valorUnitario} onChange={(evento) => atualizarItem(item.id, "valorUnitario", Number(evento.target.value))} className={inputClass} />
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 grid gap-3 border-t border-[#E3E9E1] pt-5 sm:grid-cols-3">
                                        <label><span className={labelClass}>Frete</span><input type="number" min="0" step="0.01" value={frete} onChange={(evento) => setFrete(Number(evento.target.value))} className={inputClass} /></label>
                                        <label><span className={labelClass}>Desconto</span><input type="number" min="0" step="0.01" value={desconto} onChange={(evento) => setDesconto(Number(evento.target.value))} className={inputClass} /></label>
                                        <label><span className={labelClass}>Alíquota ICMS para simulação (%)</span><input type="number" min="0" max="100" step="0.01" value={aliquotaIcms} onChange={(evento) => setAliquotaIcms(Number(evento.target.value))} className={inputClass} /></label>
                                    </div>
                                </section>
                            </div>

                            <aside className="xl:sticky xl:top-6">
                                <div className="overflow-hidden bg-white" style={{ border: "1px solid #DCE4DA" }}>
                                    <div className="border-b-4 border-[#D5AD2B] bg-[#174F2F] px-5 py-5 text-white">
                                        <div className="flex items-start justify-between gap-4">
                                            <div><p className="text-lg font-bold">AGRO.IN</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#B9D7BF]">Espelho fiscal</p></div>
                                            <p className="text-right text-xs leading-5 text-white/70">NF-e {numero}<br />Série {serie}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-5 p-5">
                                        <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7A877F]">Emitente</p><p className="mt-1 text-sm font-semibold text-[#25352B]">{propriedadeSelecionada}</p></div>
                                        <div className="grid grid-cols-2 gap-3 border-y border-[#E3E9E1] py-4">
                                            <div><p className="text-[10px] text-[#7A877F]">Destinatário</p><p className="mt-1 truncate text-xs font-semibold text-[#25352B]">{destinatario || "Não informado"}</p></div>
                                            <div><p className="text-[10px] text-[#7A877F]">Emissão</p><p className="mt-1 text-xs font-semibold text-[#25352B]">{dataEmissao ? new Date(`${dataEmissao}T12:00:00`).toLocaleDateString("pt-BR") : "-"}</p></div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7A877F]">Itens</p>
                                            <div className="mt-2 space-y-2">
                                                {itens.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 text-xs"><span className="min-w-0 truncate text-[#526158]">{item.quantidade} x {item.descricao || "Item sem descrição"}</span><strong className="shrink-0 text-[#25352B]">{moeda(item.quantidade * item.valorUnitario)}</strong></div>)}
                                            </div>
                                        </div>
                                        <div className="space-y-2 border-t border-[#E3E9E1] pt-4 text-xs">
                                            <div className="flex justify-between text-[#6A776F]"><span>Produtos</span><span>{moeda(subtotal)}</span></div>
                                            <div className="flex justify-between text-[#6A776F]"><span>Frete</span><span>{moeda(frete)}</span></div>
                                            <div className="flex justify-between text-[#6A776F]"><span>Desconto</span><span>- {moeda(desconto)}</span></div>
                                            <div className="flex justify-between text-[#6A776F]"><span>ICMS simulado</span><span>{moeda(icmsEstimado)}</span></div>
                                            <div className="flex items-end justify-between border-t border-[#E3E9E1] pt-3"><span className="font-bold text-[#25352B]">Total da nota</span><span className="text-xl font-bold text-[#174F2F]">{moeda(total)}</span></div>
                                        </div>
                                        <div className="rounded-md bg-[#FFF9E8] px-3 py-2.5 text-[10px] leading-4 text-[#705F22]">Sem valor fiscal. Documento criado apenas para demonstração do fluxo.</div>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                                    <button type="button" onClick={() => registrar("demonstracao")} className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1F5B3A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#174F2F]"><Send size={16} /> Gerar nota demonstrativa</button>
                                    <button type="button" onClick={() => registrar("rascunho")} className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#B8C5B7] bg-white px-4 py-3 text-sm font-bold text-[#1F5B3A] transition hover:bg-[#EEF4EB]"><Save size={16} /> Salvar rascunho</button>
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <div className="overflow-hidden bg-white" style={{ border: "1px solid #DCE4DA" }}>
                            <div className="border-b border-[#DCE4DA] bg-[#F1F4EF] px-5 py-4"><h2 className="font-bold text-[#25352B]">Notas preparadas neste dispositivo</h2></div>
                            {historico.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 px-5 py-16 text-center"><Clock3 size={28} className="text-[#9BA79F]" /><p className="text-sm text-[#6A776F]">Nenhuma nota demonstrativa criada ainda.</p><button type="button" onClick={() => setAba("nova")} className="text-sm font-bold text-[#1F5B3A]">Criar a primeira nota</button></div>
                            ) : (
                                <div className="divide-y divide-[#E3E9E1]">
                                    {historico.map((nota) => (
                                        <div key={nota.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] sm:items-center">
                                            <div className="min-w-0"><p className="truncate text-sm font-bold text-[#25352B]">NF-e {nota.numero} · {nota.destinatario}</p><p className="mt-1 truncate text-xs text-[#6A776F]">{nota.propriedade} · {new Date(`${nota.emitidaEm}T12:00:00`).toLocaleDateString("pt-BR")}</p></div>
                                            <p className="text-sm font-semibold text-[#25352B]">{moeda(nota.total)}</p>
                                            <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${nota.status === "demonstracao" ? "bg-[#E8F3EA] text-[#1F5B3A]" : "bg-[#EAF2FB] text-[#2A5C93]"}`}>{nota.status === "demonstracao" ? "Demonstração" : "Rascunho"}</span>
                                            <button type="button" onClick={() => setHistorico((atuais) => atuais.filter((atual) => atual.id !== nota.id))} className="flex h-9 w-9 items-center justify-center rounded-md text-[#A8553E] hover:bg-[#F8ECE8]" aria-label={`Excluir nota ${nota.numero}`}><Trash2 size={15} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
