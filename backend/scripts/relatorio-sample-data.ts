import type { RelatorioResponse } from "../src/types/relatorios.types.js";

export const relatorioAmostra: RelatorioResponse = {
    geradoEm: "2026-11-12T12:00:00.000Z",
    periodo: {
        inicio: "2026-06-01T00:00:00.000Z",
        fim: "2026-11-12T12:00:00.000Z",
        descricao: "Visão consolidada com evolução dos últimos 6 meses",
    },
    propriedade: "Fazenda Horizonte Verde",
    propriedadeDetalhes: {
        id: 1,
        areaTotal: 485.5,
        localizacao: "Rio Verde - GO",
        tipoProducao: "Soja, milho e pecuária",
    },
    financeiro: {
        entradas: 428750,
        saidas: 271430.5,
        saldo: 157319.5,
        serieMensal: [
            { mes: "Jun/26", entradas: 42000, saidas: 36800 },
            { mes: "Jul/26", entradas: 58500, saidas: 41200 },
            { mes: "Ago/26", entradas: 71000, saidas: 45500 },
            { mes: "Set/26", entradas: 64500, saidas: 49300 },
            { mes: "Out/26", entradas: 88300, saidas: 52200.5 },
            { mes: "Nov/26", entradas: 104450, saidas: 46430 },
        ],
        porCategoria: [
            { categoria: "Venda de grãos", valor: 326000 },
            { categoria: "Insumos", valor: -112400 },
            { categoria: "Pecuária", valor: 102750 },
            { categoria: "Máquinas", valor: -74300 },
        ],
        lancamentos: [
            { data: "2026-11-10T12:00:00.000Z", tipo: "entrada", categoria: "Venda de grãos", descricao: "Venda de 420 sacas de soja", valor: 67200 },
            { data: "2026-11-08T12:00:00.000Z", tipo: "saida", categoria: "Insumos", descricao: "Fertilizante para cobertura", valor: 18450 },
            { data: "2026-11-04T12:00:00.000Z", tipo: "saida", categoria: "Máquinas", descricao: "Manutenção preventiva do pulverizador", valor: 6800 },
            { data: "2026-10-28T12:00:00.000Z", tipo: "entrada", categoria: "Pecuária", descricao: "Venda de lote de novilhas", valor: 37250 },
            { data: "2026-10-20T12:00:00.000Z", tipo: "saida", categoria: "Combustível", descricao: "Abastecimento da frota", valor: 12880 },
            { data: "2026-10-12T12:00:00.000Z", tipo: "entrada", categoria: "Venda de grãos", descricao: "Venda de milho safrinha", valor: 88300 },
            { data: "2026-10-05T12:00:00.000Z", tipo: "saida", categoria: "Mão de obra", descricao: "Serviços temporários de colheita", valor: 15900 },
            { data: "2026-09-29T12:00:00.000Z", tipo: "saida", categoria: "Insumos", descricao: "Sementes certificadas", valor: 24100 },
        ],
    },
    producao: {
        total: 6,
        areaUtilizada: 437.5,
        quantidade: 8950,
        porTipo: [
            { tipo: "Soja", registros: 3, quantidade: 5400 },
            { tipo: "Milho", registros: 2, quantidade: 3300 },
            { tipo: "Pecuária", registros: 1, quantidade: 250 },
        ],
        registros: [
            { tipo: "Soja - Talhão Norte", status: "em andamento", areaUtilizada: 145, quantidade: 1800, inicio: "2026-10-01T12:00:00.000Z", fim: null },
            { tipo: "Soja - Talhão Leste", status: "em andamento", areaUtilizada: 132.5, quantidade: 1700, inicio: "2026-10-05T12:00:00.000Z", fim: null },
            { tipo: "Milho safrinha", status: "concluído", areaUtilizada: 110, quantidade: 3300, inicio: "2026-02-10T12:00:00.000Z", fim: "2026-07-20T12:00:00.000Z" },
        ],
    },
    estoque: {
        totalItens: 8,
        quantidadeTotal: 1406,
        itensAbaixoMinimo: 2,
        porCategoria: [
            { categoria: "Fertilizantes", itens: 3, quantidade: 780 },
            { categoria: "Sementes", itens: 2, quantidade: 410 },
            { categoria: "Defensivos", itens: 3, quantidade: 216 },
        ],
        itens: [
            { item: "Fertilizante NPK 04-14-08", categoria: "Fertilizantes", quantidade: 420, unidade: "kg", quantidadeMinima: 180, abaixoMinimo: false },
            { item: "Ureia agrícola", categoria: "Fertilizantes", quantidade: 95, unidade: "kg", quantidadeMinima: 120, abaixoMinimo: true },
            { item: "Semente de soja cultivar X", categoria: "Sementes", quantidade: 260, unidade: "kg", quantidadeMinima: 150, abaixoMinimo: false },
            { item: "Semente de milho híbrido", categoria: "Sementes", quantidade: 150, unidade: "kg", quantidadeMinima: 100, abaixoMinimo: false },
            { item: "Fungicida foliar", categoria: "Defensivos", quantidade: 16, unidade: "L", quantidadeMinima: 25, abaixoMinimo: true },
        ],
    },
    metas: [
        { descricao: "Atingir produtividade de soja", categoria: "produção", valorAtual: 58, valorAlvo: 64, unidade: "sc/ha", status: "em andamento", prazo: "2027-03-30T12:00:00.000Z" },
        { descricao: "Reduzir custo com combustível", categoria: "financeiro", valorAtual: 7, valorAlvo: 10, unidade: "%", status: "em andamento", prazo: "2026-12-31T12:00:00.000Z" },
    ],
};
