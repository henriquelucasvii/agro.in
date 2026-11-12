import { TipoFinanceiro, type Propriedade } from "@prisma/client";

import { AppError } from "../errors/AppError.js";
import { prisma } from "../lib/prisma.js";
import { RelatorioResponse } from "../types/relatorios.types.js";

export class RelatorioError extends AppError {}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const somarPorChave = <T>(itens: T[], chave: (item: T) => string, valor: (item: T) => number) => {
    const mapa = new Map<string, number>();
    for (const item of itens) {
        const nome = chave(item) || "Sem categoria";
        mapa.set(nome, (mapa.get(nome) ?? 0) + valor(item));
    }
    return mapa;
};

class RelatorioService {
    private assertPropriedadePertenceAoUsuario = async (usuarioId: number, propriedadeId: number) => {
        const propriedade = await prisma.propriedade.findFirst({
            where: { id: propriedadeId, usuario_id: usuarioId },
        });

        if (!propriedade) {
            throw new RelatorioError("Propriedade não encontrada.", 404);
        }

        return propriedade;
    };

    private getDadosRelatorios = async (
        propriedadeId: number,
        propriedade: Propriedade,
    ): Promise<RelatorioResponse> => {
        const agora = new Date();
        const inicioPeriodo = new Date(agora.getFullYear(), agora.getMonth() - 5, 1);

        const [financeiros, producoes, estoque, metas] = await Promise.all([
            prisma.financeiro.findMany({
                where: { propriedade_id: propriedadeId },
                orderBy: { data: "desc" },
                take: 500,
            }),
            prisma.producao.findMany({
                where: { propriedade_id: propriedadeId },
                orderBy: [{ data_inicio: "desc" }, { id: "desc" }],
                take: 300,
            }),
            prisma.estoque.findMany({
                where: { propriedade_id: propriedadeId },
                orderBy: { item: "asc" },
                take: 500,
            }),
            prisma.meta.findMany({
                where: { propriedade_id: propriedadeId },
                orderBy: [{ prazo: "asc" }, { id: "desc" }],
                take: 100,
            }),
        ]);

        const totalEntrada = financeiros
            .filter((item) => item.tipo === TipoFinanceiro.entrada)
            .reduce((total, item) => total + item.valor, 0);
        const totalSaida = financeiros
            .filter((item) => item.tipo === TipoFinanceiro.saida)
            .reduce((total, item) => total + item.valor, 0);

        const serieMensal = Array.from({ length: 6 }, (_, indice) => {
            const data = new Date(agora.getFullYear(), agora.getMonth() - (5 - indice), 1);
            const doMes = financeiros.filter(
                (item) => item.data.getFullYear() === data.getFullYear() && item.data.getMonth() === data.getMonth(),
            );
            return {
                mes: `${MESES[data.getMonth()]}/${String(data.getFullYear()).slice(-2)}`,
                entradas: doMes
                    .filter((item) => item.tipo === TipoFinanceiro.entrada)
                    .reduce((total, item) => total + item.valor, 0),
                saidas: doMes
                    .filter((item) => item.tipo === TipoFinanceiro.saida)
                    .reduce((total, item) => total + item.valor, 0),
            };
        });

        const financeiroPorCategoria = somarPorChave(
            financeiros,
            (item) => item.categoria ?? "Sem categoria",
            (item) => (item.tipo === TipoFinanceiro.entrada ? item.valor : -item.valor),
        );

        const producaoPorTipo = new Map<string, { registros: number; quantidade: number }>();
        for (const item of producoes) {
            const atual = producaoPorTipo.get(item.tipo) ?? { registros: 0, quantidade: 0 };
            atual.registros += 1;
            atual.quantidade += item.quantidade ?? 0;
            producaoPorTipo.set(item.tipo, atual);
        }

        const estoquePorCategoria = new Map<string, { itens: number; quantidade: number }>();
        for (const item of estoque) {
            const categoria = item.categoria ?? "Sem categoria";
            const atual = estoquePorCategoria.get(categoria) ?? { itens: 0, quantidade: 0 };
            atual.itens += 1;
            atual.quantidade += item.quantidade;
            estoquePorCategoria.set(categoria, atual);
        }

        return {
            geradoEm: agora.toISOString(),
            periodo: {
                inicio: inicioPeriodo.toISOString(),
                fim: agora.toISOString(),
                descricao: "Visão consolidada com evolução dos últimos 6 meses",
            },
            propriedade: propriedade.nome,
            propriedadeDetalhes: {
                id: propriedade.id,
                areaTotal: propriedade.area_total,
                localizacao: propriedade.localizacao,
                tipoProducao: propriedade.tipo_producao,
            },
            financeiro: {
                entradas: totalEntrada,
                saidas: totalSaida,
                saldo: totalEntrada - totalSaida,
                serieMensal,
                porCategoria: [...financeiroPorCategoria.entries()]
                    .map(([categoria, valor]) => ({ categoria, valor }))
                    .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor)),
                lancamentos: financeiros.slice(0, 30).map((item) => ({
                    data: item.data.toISOString(),
                    tipo: item.tipo,
                    categoria: item.categoria ?? "Sem categoria",
                    descricao: item.descricao ?? "Sem descrição",
                    valor: item.valor,
                })),
            },
            producao: {
                total: producoes.length,
                areaUtilizada: producoes.reduce((total, item) => total + (item.area_utilizada ?? 0), 0),
                quantidade: producoes.reduce((total, item) => total + (item.quantidade ?? 0), 0),
                porTipo: [...producaoPorTipo.entries()]
                    .map(([tipo, valores]) => ({ tipo, ...valores }))
                    .sort((a, b) => b.registros - a.registros),
                registros: producoes.slice(0, 30).map((item) => ({
                    tipo: item.tipo,
                    status: item.status ?? "Não informado",
                    areaUtilizada: item.area_utilizada,
                    quantidade: item.quantidade,
                    inicio: item.data_inicio?.toISOString() ?? null,
                    fim: item.data_fim?.toISOString() ?? null,
                })),
            },
            estoque: {
                totalItens: estoque.length,
                quantidadeTotal: estoque.reduce((total, item) => total + item.quantidade, 0),
                itensAbaixoMinimo: estoque.filter(
                    (item) => item.quantidade_minima !== null && item.quantidade <= item.quantidade_minima,
                ).length,
                porCategoria: [...estoquePorCategoria.entries()]
                    .map(([categoria, valores]) => ({ categoria, ...valores }))
                    .sort((a, b) => b.itens - a.itens),
                itens: estoque.map((item) => ({
                    item: item.item,
                    categoria: item.categoria ?? "Sem categoria",
                    quantidade: item.quantidade,
                    unidade: item.unidade ?? "un.",
                    quantidadeMinima: item.quantidade_minima,
                    abaixoMinimo:
                        item.quantidade_minima !== null && item.quantidade <= item.quantidade_minima,
                })),
            },
            metas: metas.map((item) => ({
                descricao: item.descricao,
                categoria: item.categoria ?? "geral",
                valorAtual: item.valor_atual ?? 0,
                valorAlvo: item.valor_alvo,
                unidade: item.unidade ?? "",
                status: item.status ?? "pendente",
                prazo: item.prazo?.toISOString() ?? null,
            })),
        };
    };

    gerarRelatorio = async (usuarioId: number, propriedadeId: number): Promise<RelatorioResponse> => {
        if (!Number.isInteger(propriedadeId) || propriedadeId <= 0) {
            throw new RelatorioError("Identificador da propriedade inválido.", 400);
        }

        const propriedade = await this.assertPropriedadePertenceAoUsuario(usuarioId, propriedadeId);
        return this.getDadosRelatorios(propriedadeId, propriedade);
    };

    obterDestinatario = async (usuarioId: number) => {
        const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { nome: true, email: true },
        });
        if (!usuario) {
            throw new RelatorioError("Usuário não encontrado.", 404);
        }
        return usuario;
    };
}

export const relatorioService = new RelatorioService();
