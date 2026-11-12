export type CategoriaRelatorio = "geral" | "financeiro" | "producao" | "estoque";

export interface SerieMensalRelatorio {
    mes: string;
    entradas: number;
    saidas: number;
}

export interface RelatorioResponse {
    geradoEm: string;
    periodo: {
        inicio: string;
        fim: string;
        descricao: string;
    };
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
        serieMensal: SerieMensalRelatorio[];
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

export interface ExportarRelatorioBody {
    formato: "pdf" | "xlsx";
    categoria?: CategoriaRelatorio;
}

export interface EnviarRelatorioBody {
    categoria?: CategoriaRelatorio;
}
