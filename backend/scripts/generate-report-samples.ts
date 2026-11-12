import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { relatoriosExportService } from "../src/service/relatorios-export.service.js";
import { relatorioAmostra } from "./relatorio-sample-data.js";

const raiz = resolve(process.cwd(), "..");
const pastaPdf = resolve(raiz, "output", "pdf");
const pastaXlsx = resolve(raiz, "outputs", "agroin-relatorios");
await Promise.all([mkdir(pastaPdf, { recursive: true }), mkdir(pastaXlsx, { recursive: true })]);

const [pdf, xlsx] = await Promise.all([
    relatoriosExportService.gerarPdf(relatorioAmostra, "geral"),
    relatoriosExportService.gerarXlsx(relatorioAmostra, "geral"),
]);
await Promise.all([
    writeFile(resolve(pastaPdf, "relatorio-agroin-amostra.pdf"), pdf),
    writeFile(resolve(pastaXlsx, "relatorio-agroin-amostra.xlsx"), xlsx),
]);

console.log(`PDF: ${pdf.length} bytes`);
console.log(`XLSX: ${xlsx.length} bytes`);
