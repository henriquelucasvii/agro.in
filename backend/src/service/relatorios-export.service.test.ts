import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import { relatorioAmostra } from "../../scripts/relatorio-sample-data.js";
import { relatoriosExportService } from "./relatorios-export.service.js";

test("gera PDF de relatório com conteúdo e metadados", async () => {
    const pdf = await relatoriosExportService.gerarPdf(relatorioAmostra, "geral");
    assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
    assert.ok(pdf.length > 5_000);
});

test("gera planilha formatada com resumo, gráfico e abas de detalhe", async () => {
    const arquivo = await relatoriosExportService.gerarXlsx(relatorioAmostra, "geral");
    assert.equal(arquivo.subarray(0, 2).toString(), "PK");
    assert.ok(arquivo.length > 15_000);

    const workbook = new ExcelJS.Workbook();
    const entrada = arquivo as unknown as Parameters<typeof workbook.xlsx.load>[0];
    await workbook.xlsx.load(entrada);
    assert.deepEqual(workbook.worksheets.map((item) => item.name), ["Resumo", "Financeiro", "Produção", "Estoque", "Metas"]);
    assert.equal(workbook.getWorksheet("Resumo")?.getCell("B2").value, "AGRO.IN  |  Relatório Geral");
    assert.ok((workbook.getWorksheet("Resumo")?.getImages().length ?? 0) >= 1);
});
