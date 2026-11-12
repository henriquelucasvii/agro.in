export type CategoriaRelatorio = "financeiro" | "producao" | "estoque" | "geral";
export type StatusRelatorio = "pronto" | "agendado";

export interface RelatorioPropriedadeAPI {
    geradoEm: string;
    periodo: { inicio: string; fim: string; descricao: string };
    propriedade: string;
    propriedadeDetalhes: {
        id: number;
        areaTotal: number | null;
        localizacao: string | null;
        tipoProducao: string | null;
    };
    financeiro: {
        entradas: number;
        saidas: number;
        saldo: number;
        serieMensal: Array<{ mes: string; entradas: number; saidas: number }>;
        porCategoria: Array<{ categoria: string; valor: number }>;
        lancamentos: Array<{
            data: string;
            tipo: "entrada" | "saida";
            categoria: string;
            descricao: string;
            valor: number;
        }>;
    };
    producao: {
        total: number;
        areaUtilizada: number;
        quantidade: number;
        porTipo: Array<{ tipo: string; registros: number; quantidade: number }>;
        registros: Array<{
            tipo: string;
            status: string;
            areaUtilizada: number | null;
            quantidade: number | null;
            inicio: string | null;
            fim: string | null;
        }>;
    };
    estoque: {
        totalItens: number;
        quantidadeTotal: number;
        itensAbaixoMinimo: number;
        porCategoria: Array<{ categoria: string; itens: number; quantidade: number }>;
        itens: Array<{
            item: string;
            categoria: string;
            quantidade: number;
            unidade: string;
            quantidadeMinima: number | null;
            abaixoMinimo: boolean;
        }>;
    };
    metas: Array<{
        descricao: string;
        categoria: string;
        valorAtual: number;
        valorAlvo: number | null;
        unidade: string;
        status: string;
        prazo: string | null;
    }>;
}

export interface RelatorioGerado {
    id: string;
    categoria: CategoriaRelatorio;
    titulo: string;
    geradoEm: Date;
    status: StatusRelatorio;
    compartilhado: boolean;
    dados: RelatorioPropriedadeAPI | null;
}

export const CHAVE_HISTORICO_RELATORIOS = "agroin:relatorios:historico";

export const reviveHistoricoRelatorios = (bruto: unknown): RelatorioGerado[] =>
    (bruto as RelatorioGerado[]).map((r) => ({ ...r, geradoEm: new Date(r.geradoEm) }));

export const tempoRelativo = (data: Date) => {
    const diffMs = data.getTime() - Date.now();

    if (diffMs > 0) {
        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        return `agendado para ${dia}/${mes}`;
    }

    const passadoMs = -diffMs;
    const min = Math.floor(passadoMs / 60000);
    if (min < 1) return "agora mesmo";
    if (min < 60) return `há ${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `há ${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
    const semanas = Math.floor(dias / 7);
    if (semanas < 5) return `há ${semanas} ${semanas === 1 ? "semana" : "semanas"}`;
    const meses = Math.floor(dias / 30);
    return `há ${meses} ${meses === 1 ? "mês" : "meses"}`;
};
