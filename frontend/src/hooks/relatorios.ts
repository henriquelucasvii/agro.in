export type CategoriaRelatorio = "financeiro" | "producao" | "estoque" | "geral";
export type StatusRelatorio = "pronto" | "agendado";

export interface RelatorioPropriedadeAPI {
    propriedade: string;
    financeiro: { entradas: number; saidas: number; saldo: number };
    producao: { total: number };
    estoque: { totalItens: number };
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