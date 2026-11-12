import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

import type { CategoriaRelatorio, RelatorioResponse } from "../types/relatorios.types.js";

const CORES = {
    verde: "#174F2F",
    verdeMedio: "#4E9462",
    verdeClaro: "#E8F3EA",
    amarelo: "#D5AD2B",
    vermelho: "#B44B3E",
    azul: "#4E829C",
    texto: "#25352B",
    textoSuave: "#66736B",
    linha: "#DCE4DA",
    fundo: "#F5F7F2",
    branco: "#FFFFFF",
};

const FONTE_REGULAR = fileURLToPath(
    new URL("../../node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff", import.meta.url),
);
const FONTE_NEGRITO = fileURLToPath(
    new URL("../../node_modules/@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff", import.meta.url),
);

const categoriaNome = (categoria: CategoriaRelatorio) =>
    ({ geral: "Geral", financeiro: "Financeiro", producao: "Produção", estoque: "Estoque" })[categoria];

const moeda = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

const numero = (valor: number, casas = 0) =>
    valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

const dataCurta = (valor: string | null) =>
    valor ? new Date(valor).toLocaleDateString("pt-BR") : "-";

const textoSeguro = (valor: string, limite: number) =>
    valor.length <= limite ? valor : `${valor.slice(0, Math.max(0, limite - 3))}...`;

const coletarPdf = (doc: PDFKit.PDFDocument) =>
    new Promise<Buffer>((resolve, reject) => {
        const partes: Buffer[] = [];
        doc.on("data", (parte) => partes.push(Buffer.from(parte)));
        doc.on("end", () => resolve(Buffer.concat(partes)));
        doc.on("error", reject);
    });

const desenharCabecalho = (
    doc: PDFKit.PDFDocument,
    relatorio: RelatorioResponse,
    categoria: CategoriaRelatorio,
) => {
    doc.rect(0, 0, doc.page.width, 104).fill(CORES.verde);
    doc.rect(0, 100, doc.page.width, 4).fill(CORES.amarelo);
    doc.fillColor(CORES.branco).font("Helvetica-Bold").fontSize(18).text("AGRO.IN", 42, 30);
    doc.fillColor("#B9D7BF").font("Helvetica").fontSize(8).text("GESTÃO RURAL", 42, 53, {
        characterSpacing: 1.5,
    });
    doc.fillColor(CORES.branco).font("Helvetica-Bold").fontSize(17).text(`Relatório ${categoriaNome(categoria)}`, 245, 29, {
        align: "right",
        width: 308,
    });
    doc.fillColor("#D5E5D8").font("Helvetica").fontSize(9).text(relatorio.propriedade, 245, 55, {
        align: "right",
        width: 308,
    });
    doc.fillColor("#B9D7BF").fontSize(8).text(`Gerado em ${dataCurta(relatorio.geradoEm)}`, 245, 73, {
        align: "right",
        width: 308,
    });
};

const desenharTituloSecao = (doc: PDFKit.PDFDocument, titulo: string, y: number) => {
    doc.fillColor(CORES.verde).font("Helvetica-Bold").fontSize(12).text(titulo, 42, y);
    doc.moveTo(42, y + 19).lineTo(553, y + 19).lineWidth(0.6).strokeColor(CORES.linha).stroke();
    return y + 31;
};

const desenharIndicadores = (
    doc: PDFKit.PDFDocument,
    indicadores: Array<{ rotulo: string; valor: string; cor?: string }>,
    y: number,
) => {
    const gap = 8;
    const largura = (511 - gap * 2) / 3;
    indicadores.slice(0, 6).forEach((item, indice) => {
        const coluna = indice % 3;
        const linha = Math.floor(indice / 3);
        const x = 42 + coluna * (largura + gap);
        const topo = y + linha * 67;
        doc.roundedRect(x, topo, largura, 56, 5).fillAndStroke(CORES.fundo, CORES.linha);
        doc.rect(x, topo, 4, 56).fill(item.cor ?? CORES.verdeMedio);
        doc.fillColor(CORES.textoSuave).font("Helvetica").fontSize(7.5).text(item.rotulo.toUpperCase(), x + 14, topo + 11, {
            characterSpacing: 0.4,
            width: largura - 24,
        });
        doc.fillColor(CORES.texto).font("Helvetica-Bold").fontSize(12).text(item.valor, x + 14, topo + 30, {
            width: largura - 24,
        });
    });
    return y + Math.ceil(Math.min(indicadores.length, 6) / 3) * 67;
};

const desenharGraficoMensal = (doc: PDFKit.PDFDocument, relatorio: RelatorioResponse, y: number) => {
    y = desenharTituloSecao(doc, "Fluxo financeiro dos últimos 6 meses", y);
    const x = 54;
    const largura = 487;
    const altura = 112;
    const base = y + altura;
    const maximo = Math.max(
        1,
        ...relatorio.financeiro.serieMensal.flatMap((item) => [item.entradas, item.saidas]),
    );

    doc.roundedRect(42, y - 4, 511, altura + 40, 5).fillAndStroke(CORES.branco, CORES.linha);
    doc.moveTo(x, base).lineTo(x + largura, base).strokeColor(CORES.linha).lineWidth(0.7).stroke();

    const grupo = largura / relatorio.financeiro.serieMensal.length;
    relatorio.financeiro.serieMensal.forEach((item, indice) => {
        const centro = x + grupo * indice + grupo / 2;
        const alturaEntrada = (item.entradas / maximo) * (altura - 16);
        const alturaSaida = (item.saidas / maximo) * (altura - 16);
        doc.rect(centro - 13, base - alturaEntrada, 10, alturaEntrada).fill(CORES.verdeMedio);
        doc.rect(centro + 3, base - alturaSaida, 10, alturaSaida).fill(CORES.vermelho);
        doc.fillColor(CORES.textoSuave).font("Helvetica").fontSize(7).text(item.mes, centro - 22, base + 7, {
            width: 44,
            align: "center",
        });
    });

    doc.rect(385, y + 4, 7, 7).fill(CORES.verdeMedio);
    doc.fillColor(CORES.textoSuave).fontSize(7).text("Entradas", 397, y + 3);
    doc.rect(455, y + 4, 7, 7).fill(CORES.vermelho);
    doc.text("Saídas", 467, y + 3);
    return y + altura + 50;
};

type ColunaPdf = { titulo: string; largura: number; alinhar?: "left" | "right" | "center" };

const desenharTabela = (
    doc: PDFKit.PDFDocument,
    titulo: string,
    colunas: ColunaPdf[],
    linhas: string[][],
    yInicial: number,
) => {
    let y = yInicial;
    const alturaLinha = 21;
    const larguraTotal = colunas.reduce((total, coluna) => total + coluna.largura, 0);

    const novaPagina = () => {
        doc.addPage();
        y = 42;
        doc.fillColor(CORES.verde).font("Helvetica-Bold").fontSize(9).text("AGRO.IN  /  RELATÓRIOS", 42, 25);
    };

    if (y > 720) novaPagina();
    y = desenharTituloSecao(doc, titulo, y);

    const desenharCabecalhoTabela = () => {
        doc.rect(42, y, larguraTotal, alturaLinha).fill(CORES.verde);
        let x = 42;
        colunas.forEach((coluna) => {
            doc.fillColor(CORES.branco).font("Helvetica-Bold").fontSize(7.5).text(coluna.titulo, x + 6, y + 7, {
                width: coluna.largura - 12,
                align: coluna.alinhar ?? "left",
            });
            x += coluna.largura;
        });
        y += alturaLinha;
    };

    desenharCabecalhoTabela();
    if (linhas.length === 0) {
        doc.rect(42, y, larguraTotal, 30).fill(CORES.fundo);
        doc.fillColor(CORES.textoSuave).font("Helvetica").fontSize(8).text("Nenhum registro para este período.", 50, y + 10);
        return y + 40;
    }

    linhas.forEach((linha, indice) => {
        if (y + alturaLinha > 750) {
            novaPagina();
            desenharCabecalhoTabela();
        }
        if (indice % 2 === 0) doc.rect(42, y, larguraTotal, alturaLinha).fill(CORES.fundo);
        let x = 42;
        linha.forEach((valor, colunaIndice) => {
            const coluna = colunas[colunaIndice];
            if (!coluna) return;
            doc.fillColor(CORES.texto).font("Helvetica").fontSize(7.5).text(textoSeguro(valor, Math.max(10, Math.floor(coluna.largura / 5))), x + 6, y + 7, {
                width: coluna.largura - 12,
                align: coluna.alinhar ?? "left",
                lineBreak: false,
            });
            x += coluna.largura;
        });
        y += alturaLinha;
    });
    return y + 12;
};

const finalizarPaginasPdf = (doc: PDFKit.PDFDocument, relatorio: RelatorioResponse) => {
    const paginas = doc.bufferedPageRange();
    for (let indice = paginas.start; indice < paginas.start + paginas.count; indice += 1) {
        doc.switchToPage(indice);
        doc.moveTo(42, 770).lineTo(553, 770).strokeColor(CORES.linha).lineWidth(0.5).stroke();
        doc.fillColor(CORES.textoSuave).font("Helvetica").fontSize(7).text(
            `${relatorio.propriedade}  |  Documento gerado pelo Agro.in`,
            42,
            778,
            { width: 400 },
        );
        doc.text(`Página ${indice + 1} de ${paginas.count}`, 450, 778, { width: 103, align: "right" });
    }
};

const criarPdf = async (relatorio: RelatorioResponse, categoria: CategoriaRelatorio) => {
    const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true, info: {
        Title: `Relatório ${categoriaNome(categoria)} - ${relatorio.propriedade}`,
        Author: "Agro.in",
        Subject: "Gestão rural",
    } });
    doc.registerFont("Helvetica", FONTE_REGULAR);
    doc.registerFont("Helvetica-Bold", FONTE_NEGRITO);
    const pronto = coletarPdf(doc);
    desenharCabecalho(doc, relatorio, categoria);

    let y = 127;
    doc.fillColor(CORES.textoSuave).font("Helvetica").fontSize(8.5).text(relatorio.periodo.descricao, 42, y);
    const contexto = [relatorio.propriedadeDetalhes.localizacao, relatorio.propriedadeDetalhes.tipoProducao]
        .filter(Boolean)
        .join("  •  ");
    if (contexto) doc.text(contexto, 42, y + 15);
    y += contexto ? 39 : 25;

    const indicadoresGerais = [
        { rotulo: "Entradas", valor: moeda(relatorio.financeiro.entradas), cor: CORES.verdeMedio },
        { rotulo: "Saídas", valor: moeda(relatorio.financeiro.saidas), cor: CORES.vermelho },
        { rotulo: "Saldo", valor: moeda(relatorio.financeiro.saldo), cor: relatorio.financeiro.saldo >= 0 ? CORES.verde : CORES.vermelho },
        { rotulo: "Produções", valor: numero(relatorio.producao.total), cor: CORES.azul },
        { rotulo: "Itens em estoque", valor: numero(relatorio.estoque.totalItens), cor: CORES.amarelo },
        { rotulo: "Estoque em atenção", valor: numero(relatorio.estoque.itensAbaixoMinimo), cor: CORES.vermelho },
    ];
    const indicadores = categoria === "financeiro"
        ? indicadoresGerais.slice(0, 3)
        : categoria === "producao"
            ? [
                { rotulo: "Registros", valor: numero(relatorio.producao.total), cor: CORES.azul },
                { rotulo: "Área utilizada", valor: `${numero(relatorio.producao.areaUtilizada, 1)} ha`, cor: CORES.verdeMedio },
                { rotulo: "Quantidade", valor: numero(relatorio.producao.quantidade, 1), cor: CORES.amarelo },
            ]
            : categoria === "estoque"
                ? indicadoresGerais.slice(4)
                : indicadoresGerais;
    y = desenharIndicadores(doc, indicadores, y);

    if (categoria === "geral" || categoria === "financeiro") {
        y = desenharGraficoMensal(doc, relatorio, y + 2);
        y = desenharTabela(
            doc,
            "Lançamentos financeiros recentes",
            [
                { titulo: "Data", largura: 58 },
                { titulo: "Tipo", largura: 52 },
                { titulo: "Categoria", largura: 92 },
                { titulo: "Descrição", largura: 211 },
                { titulo: "Valor", largura: 98, alinhar: "right" },
            ],
            relatorio.financeiro.lancamentos.slice(0, categoria === "geral" ? 8 : 25).map((item) => [
                dataCurta(item.data),
                item.tipo === "entrada" ? "Entrada" : "Saída",
                item.categoria,
                item.descricao,
                moeda(item.valor),
            ]),
            y,
        );
    }

    if (categoria === "geral" || categoria === "producao") {
        y = desenharTabela(
            doc,
            "Produção por cultura ou atividade",
            [
                { titulo: "Tipo", largura: 245 },
                { titulo: "Registros", largura: 120, alinhar: "right" },
                { titulo: "Quantidade", largura: 146, alinhar: "right" },
            ],
            relatorio.producao.porTipo.map((item) => [item.tipo, numero(item.registros), numero(item.quantidade, 1)]),
            y,
        );
    }

    if (categoria === "geral" || categoria === "estoque") {
        y = desenharTabela(
            doc,
            "Posição de estoque",
            [
                { titulo: "Item", largura: 174 },
                { titulo: "Categoria", largura: 120 },
                { titulo: "Quantidade", largura: 92, alinhar: "right" },
                { titulo: "Mínimo", largura: 70, alinhar: "right" },
                { titulo: "Situação", largura: 55, alinhar: "center" },
            ],
            relatorio.estoque.itens.slice(0, categoria === "geral" ? 12 : 40).map((item) => [
                item.item,
                item.categoria,
                `${numero(item.quantidade, 1)} ${item.unidade}`,
                item.quantidadeMinima === null ? "-" : numero(item.quantidadeMinima, 1),
                item.abaixoMinimo ? "Baixo" : "OK",
            ]),
            y,
        );
    }

    if (categoria === "geral" && relatorio.metas.length > 0) {
        desenharTabela(
            doc,
            "Metas acompanhadas",
            [
                { titulo: "Meta", largura: 245 },
                { titulo: "Atual", largura: 90, alinhar: "right" },
                { titulo: "Alvo", largura: 90, alinhar: "right" },
                { titulo: "Status", largura: 86 },
            ],
            relatorio.metas.slice(0, 12).map((item) => [
                item.descricao,
                `${numero(item.valorAtual, 1)} ${item.unidade}`.trim(),
                item.valorAlvo === null ? "-" : `${numero(item.valorAlvo, 1)} ${item.unidade}`.trim(),
                item.status,
            ]),
            y,
        );
    }

    finalizarPaginasPdf(doc, relatorio);
    doc.end();
    return pronto;
};

const criarGraficoPlanilha = async (relatorio: RelatorioResponse) => {
    const largura = 820;
    const altura = 320;
    const maximo = Math.max(1, ...relatorio.financeiro.serieMensal.flatMap((item) => [item.entradas, item.saidas]));
    const areaGrafico = 220;
    const base = 260;
    const grupo = 710 / relatorio.financeiro.serieMensal.length;
    const barras = relatorio.financeiro.serieMensal.map((item, indice) => {
        const centro = 80 + grupo * indice + grupo / 2;
        const entrada = (item.entradas / maximo) * areaGrafico;
        const saida = (item.saidas / maximo) * areaGrafico;
        return `<rect x="${centro - 22}" y="${base - entrada}" width="18" height="${entrada}" fill="${CORES.verdeMedio}" rx="2"/>
            <rect x="${centro + 4}" y="${base - saida}" width="18" height="${saida}" fill="${CORES.vermelho}" rx="2"/>
            <text x="${centro}" y="286" text-anchor="middle" font-family="Arial" font-size="14" fill="${CORES.textoSuave}">${item.mes}</text>`;
    }).join("");
    const svg = `<svg width="${largura}" height="${altura}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#FFFFFF"/>
        <text x="30" y="30" font-family="Arial" font-size="19" font-weight="700" fill="${CORES.texto}">Fluxo financeiro - últimos 6 meses</text>
        <rect x="610" y="18" width="12" height="12" fill="${CORES.verdeMedio}"/><text x="630" y="29" font-family="Arial" font-size="12" fill="${CORES.textoSuave}">Entradas</text>
        <rect x="700" y="18" width="12" height="12" fill="${CORES.vermelho}"/><text x="720" y="29" font-family="Arial" font-size="12" fill="${CORES.textoSuave}">Saídas</text>
        <line x1="80" y1="260" x2="790" y2="260" stroke="${CORES.linha}" stroke-width="2"/>
        ${barras}
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
};

const estilizarCabecalhoPlanilha = (linha: ExcelJS.Row) => {
    linha.height = 24;
    linha.eachCell((celula) => {
        celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF174F2F" } };
        celula.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        celula.alignment = { vertical: "middle", horizontal: "center" };
        celula.border = { bottom: { style: "thin", color: { argb: "FFDCE4DA" } } };
    });
};

const estilizarTabelaPlanilha = (planilha: ExcelJS.Worksheet, inicio: number, fim: number, colunaValor?: number) => {
    for (let linha = inicio; linha <= fim; linha += 1) {
        const atual = planilha.getRow(linha);
        atual.height = 21;
        atual.eachCell((celula) => {
            celula.font = { name: "Arial", size: 9, color: { argb: "FF25352B" } };
            celula.alignment = { vertical: "middle" };
            if (linha % 2 === 0) {
                celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F7F2" } };
            }
            celula.border = { bottom: { style: "hair", color: { argb: "FFE3E9E1" } } };
        });
        if (colunaValor) atual.getCell(colunaValor).numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
    }
};

const configurarPlanilha = (planilha: ExcelJS.Worksheet) => {
    planilha.views = [{ showGridLines: false }];
    planilha.properties.defaultRowHeight = 20;
    planilha.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    planilha.headerFooter.oddFooter = "Agro.in - Gestão rural    &P de &N";
};

const criarXlsx = async (relatorio: RelatorioResponse, categoria: CategoriaRelatorio) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Agro.in";
    workbook.company = "Agro.in";
    workbook.subject = `Relatório ${categoriaNome(categoria)}`;
    workbook.created = new Date(relatorio.geradoEm);
    workbook.calcProperties.fullCalcOnLoad = true;

    const resumo = workbook.addWorksheet("Resumo", { properties: { tabColor: { argb: "FF174F2F" } } });
    configurarPlanilha(resumo);
    resumo.columns = [
        { width: 3 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 },
        { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 },
    ];
    resumo.mergeCells("B2:J3");
    const titulo = resumo.getCell("B2");
    titulo.value = `AGRO.IN  |  Relatório ${categoriaNome(categoria)}`;
    titulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF174F2F" } };
    titulo.font = { name: "Arial", size: 17, bold: true, color: { argb: "FFFFFFFF" } };
    titulo.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    resumo.getRow(2).height = 28;
    resumo.getRow(3).height = 28;
    resumo.mergeCells("B4:F4");
    resumo.getCell("B4").value = relatorio.propriedade;
    resumo.getCell("B4").font = { name: "Arial", size: 12, bold: true, color: { argb: "FF25352B" } };
    resumo.mergeCells("G4:J4");
    resumo.getCell("G4").value = `Gerado em ${dataCurta(relatorio.geradoEm)}`;
    resumo.getCell("G4").font = { name: "Arial", size: 9, color: { argb: "FF66736B" } };
    resumo.getCell("G4").alignment = { horizontal: "right" };

    const kpis = [
        ["Entradas", relatorio.financeiro.entradas, "FF4E9462"],
        ["Saídas", relatorio.financeiro.saidas, "FFB44B3E"],
        ["Saldo", relatorio.financeiro.saldo, relatorio.financeiro.saldo >= 0 ? "FF174F2F" : "FFB44B3E"],
        ["Produções", relatorio.producao.total, "FF4E829C"],
        ["Itens em estoque", relatorio.estoque.totalItens, "FFD5AD2B"],
        ["Estoque em atenção", relatorio.estoque.itensAbaixoMinimo, "FFB44B3E"],
    ] as const;
    kpis.forEach(([rotulo, valor, cor], indice) => {
        const coluna = 2 + (indice % 3) * 3;
        const linha = indice < 3 ? 6 : 9;
        resumo.mergeCells(linha, coluna, linha, coluna + 1);
        resumo.mergeCells(linha + 1, coluna, linha + 1, coluna + 1);
        const cabecalho = resumo.getCell(linha, coluna);
        cabecalho.value = rotulo;
        cabecalho.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5EF" } };
        cabecalho.font = { name: "Arial", size: 9, color: { argb: "FF66736B" } };
        cabecalho.alignment = { vertical: "middle", indent: 1 };
        const valorCell = resumo.getCell(linha + 1, coluna);
        valorCell.value = valor;
        valorCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5EF" } };
        valorCell.font = { name: "Arial", size: 14, bold: true, color: { argb: cor } };
        valorCell.alignment = { vertical: "middle", indent: 1 };
        if (indice < 3) valorCell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
        resumo.getRow(linha).height = 22;
        resumo.getRow(linha + 1).height = 30;
    });

    const grafico = await criarGraficoPlanilha(relatorio);
    const graficoId = workbook.addImage({ base64: grafico.toString("base64"), extension: "png" });
    resumo.addImage(graficoId, { tl: { col: 1, row: 12 }, ext: { width: 820, height: 320 } });

    const inicioDadosGrafico = 31;
    resumo.getRow(inicioDadosGrafico).values = [null, "Mês", "Entradas", "Saídas", "Saldo"];
    estilizarCabecalhoPlanilha(resumo.getRow(inicioDadosGrafico));
    relatorio.financeiro.serieMensal.forEach((item, indice) => {
        const linha = inicioDadosGrafico + 1 + indice;
        resumo.getRow(linha).values = [null, item.mes, item.entradas, item.saidas, item.entradas - item.saidas];
        resumo.getCell(linha, 3).numFmt = '"R$" #,##0.00';
        resumo.getCell(linha, 4).numFmt = '"R$" #,##0.00';
        resumo.getCell(linha, 5).numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
    });
    estilizarTabelaPlanilha(resumo, inicioDadosGrafico + 1, inicioDadosGrafico + relatorio.financeiro.serieMensal.length);
    resumo.autoFilter = `B${inicioDadosGrafico}:E${inicioDadosGrafico + relatorio.financeiro.serieMensal.length}`;
    resumo.views = [{ showGridLines: false, state: "frozen", ySplit: 4 }];

    if (categoria === "geral" || categoria === "financeiro") {
        const financeiro = workbook.addWorksheet("Financeiro", { properties: { tabColor: { argb: "FF4E829C" } } });
        configurarPlanilha(financeiro);
        financeiro.columns = [
            { header: "Data", key: "data", width: 14 },
            { header: "Tipo", key: "tipo", width: 13 },
            { header: "Categoria", key: "categoria", width: 22 },
            { header: "Descrição", key: "descricao", width: 42 },
            { header: "Valor", key: "valor", width: 18 },
        ];
        financeiro.addRows(relatorio.financeiro.lancamentos.map((item) => ({
            data: new Date(item.data),
            tipo: item.tipo === "entrada" ? "Entrada" : "Saída",
            categoria: item.categoria,
            descricao: item.descricao,
            valor: item.tipo === "entrada" ? item.valor : -item.valor,
        })));
        estilizarCabecalhoPlanilha(financeiro.getRow(1));
        estilizarTabelaPlanilha(financeiro, 2, financeiro.rowCount, 5);
        financeiro.getColumn(1).numFmt = "dd/mm/yyyy";
        financeiro.autoFilter = `A1:E${Math.max(1, financeiro.rowCount)}`;
        financeiro.views = [{ showGridLines: false, state: "frozen", ySplit: 1 }];
    }

    if (categoria === "geral" || categoria === "producao") {
        const producao = workbook.addWorksheet("Produção", { properties: { tabColor: { argb: "FF4E9462" } } });
        configurarPlanilha(producao);
        producao.columns = [
            { header: "Cultura ou atividade", key: "tipo", width: 28 },
            { header: "Status", key: "status", width: 18 },
            { header: "Área utilizada (ha)", key: "area", width: 20 },
            { header: "Quantidade", key: "quantidade", width: 18 },
            { header: "Início", key: "inicio", width: 14 },
            { header: "Fim", key: "fim", width: 14 },
        ];
        producao.addRows(relatorio.producao.registros.map((item) => ({
            tipo: item.tipo,
            status: item.status,
            area: item.areaUtilizada,
            quantidade: item.quantidade,
            inicio: item.inicio ? new Date(item.inicio) : null,
            fim: item.fim ? new Date(item.fim) : null,
        })));
        estilizarCabecalhoPlanilha(producao.getRow(1));
        estilizarTabelaPlanilha(producao, 2, producao.rowCount);
        producao.getColumn(3).numFmt = "#,##0.0";
        producao.getColumn(4).numFmt = "#,##0.0";
        producao.getColumn(5).numFmt = "dd/mm/yyyy";
        producao.getColumn(6).numFmt = "dd/mm/yyyy";
        producao.autoFilter = `A1:F${Math.max(1, producao.rowCount)}`;
        producao.views = [{ showGridLines: false, state: "frozen", ySplit: 1 }];
    }

    if (categoria === "geral" || categoria === "estoque") {
        const estoque = workbook.addWorksheet("Estoque", { properties: { tabColor: { argb: "FFD5AD2B" } } });
        configurarPlanilha(estoque);
        estoque.columns = [
            { header: "Item", key: "item", width: 30 },
            { header: "Categoria", key: "categoria", width: 22 },
            { header: "Quantidade", key: "quantidade", width: 16 },
            { header: "Unidade", key: "unidade", width: 12 },
            { header: "Estoque mínimo", key: "minimo", width: 18 },
            { header: "Situação", key: "situacao", width: 16 },
        ];
        estoque.addRows(relatorio.estoque.itens.map((item) => ({
            item: item.item,
            categoria: item.categoria,
            quantidade: item.quantidade,
            unidade: item.unidade,
            minimo: item.quantidadeMinima,
            situacao: item.abaixoMinimo ? "Abaixo do mínimo" : "Regular",
        })));
        estilizarCabecalhoPlanilha(estoque.getRow(1));
        estilizarTabelaPlanilha(estoque, 2, estoque.rowCount);
        estoque.getColumn(3).numFmt = "#,##0.0";
        estoque.getColumn(5).numFmt = "#,##0.0";
        for (let linha = 2; linha <= estoque.rowCount; linha += 1) {
            if (estoque.getCell(linha, 6).value === "Abaixo do mínimo") {
                estoque.getCell(linha, 6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9E4E0" } };
                estoque.getCell(linha, 6).font = { name: "Arial", size: 9, bold: true, color: { argb: "FFB44B3E" } };
            }
        }
        estoque.autoFilter = `A1:F${Math.max(1, estoque.rowCount)}`;
        estoque.views = [{ showGridLines: false, state: "frozen", ySplit: 1 }];
    }

    if (categoria === "geral" && relatorio.metas.length > 0) {
        const metas = workbook.addWorksheet("Metas", { properties: { tabColor: { argb: "FF617665" } } });
        configurarPlanilha(metas);
        metas.columns = [
            { header: "Meta", key: "descricao", width: 42 },
            { header: "Categoria", key: "categoria", width: 18 },
            { header: "Atual", key: "atual", width: 15 },
            { header: "Alvo", key: "alvo", width: 15 },
            { header: "Unidade", key: "unidade", width: 12 },
            { header: "Status", key: "status", width: 16 },
            { header: "Prazo", key: "prazo", width: 14 },
        ];
        metas.addRows(relatorio.metas.map((item) => ({
            descricao: item.descricao,
            categoria: item.categoria,
            atual: item.valorAtual,
            alvo: item.valorAlvo,
            unidade: item.unidade,
            status: item.status,
            prazo: item.prazo ? new Date(item.prazo) : null,
        })));
        estilizarCabecalhoPlanilha(metas.getRow(1));
        estilizarTabelaPlanilha(metas, 2, metas.rowCount);
        metas.getColumn(3).numFmt = "#,##0.0";
        metas.getColumn(4).numFmt = "#,##0.0";
        metas.getColumn(7).numFmt = "dd/mm/yyyy";
        metas.autoFilter = `A1:G${Math.max(1, metas.rowCount)}`;
        metas.views = [{ showGridLines: false, state: "frozen", ySplit: 1 }];
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
};

class RelatoriosExportService {
    gerarPdf = criarPdf;
    gerarXlsx = criarXlsx;
}

export const relatoriosExportService = new RelatoriosExportService();
