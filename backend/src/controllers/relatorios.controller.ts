import { FastifyReply, FastifyRequest } from "fastify";

import { emailService } from "../service/email.service.js";
import { relatoriosExportService } from "../service/relatorios-export.service.js";
import { RelatorioError, relatorioService } from "../service/relatorios.service.js";
import type {
    CategoriaRelatorio,
    EnviarRelatorioBody,
    ExportarRelatorioBody,
} from "../types/relatorios.types.js";

const CATEGORIAS: CategoriaRelatorio[] = ["geral", "financeiro", "producao", "estoque"];

const categoriaValida = (categoria: unknown): CategoriaRelatorio =>
    typeof categoria === "string" && CATEGORIAS.includes(categoria as CategoriaRelatorio)
        ? (categoria as CategoriaRelatorio)
        : "geral";

const nomeArquivo = (propriedade: string, extensao: "pdf" | "xlsx") => {
    const base = propriedade
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
    return `relatorio-agroin-${base || "propriedade"}.${extensao}`;
};

class RelatorioController {
    private responderErro = (request: FastifyRequest, reply: FastifyReply, error: unknown, mensagem: string) => {
        if (error instanceof RelatorioError) {
            return reply.status(error.statusCode).send({ error: error.message });
        }
        request.log.error(error);
        return reply.status(500).send({ error: mensagem });
    };

    gerar = async (request: FastifyRequest<{ Params: { propriedadeId: string } }>, reply: FastifyReply) => {
        try {
            const relatorio = await relatorioService.gerarRelatorio(
                request.user.id,
                Number(request.params.propriedadeId),
            );
            return reply.send(relatorio);
        } catch (error) {
            return this.responderErro(request, reply, error, "Erro ao gerar relatório.");
        }
    };

    exportar = async (
        request: FastifyRequest<{ Params: { propriedadeId: string }; Body: ExportarRelatorioBody }>,
        reply: FastifyReply,
    ) => {
        try {
            const formato = request.body?.formato;
            if (formato !== "pdf" && formato !== "xlsx") {
                return reply.status(400).send({ error: "Formato de exportação inválido." });
            }
            const categoria = categoriaValida(request.body?.categoria);
            const relatorio = await relatorioService.gerarRelatorio(
                request.user.id,
                Number(request.params.propriedadeId),
            );
            const arquivo = formato === "pdf"
                ? await relatoriosExportService.gerarPdf(relatorio, categoria)
                : await relatoriosExportService.gerarXlsx(relatorio, categoria);
            const tipo = formato === "pdf"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            return reply
                .type(tipo)
                .header("Content-Disposition", `attachment; filename="${nomeArquivo(relatorio.propriedade, formato)}"`)
                .header("Cache-Control", "no-store")
                .send(arquivo);
        } catch (error) {
            return this.responderErro(request, reply, error, "Erro ao exportar relatório.");
        }
    };

    enviarEmail = async (
        request: FastifyRequest<{ Params: { propriedadeId: string }; Body: EnviarRelatorioBody }>,
        reply: FastifyReply,
    ) => {
        try {
            const categoria = categoriaValida(request.body?.categoria);
            const [relatorio, destinatario] = await Promise.all([
                relatorioService.gerarRelatorio(request.user.id, Number(request.params.propriedadeId)),
                relatorioService.obterDestinatario(request.user.id),
            ]);
            const [pdf, planilha] = await Promise.all([
                relatoriosExportService.gerarPdf(relatorio, categoria),
                relatoriosExportService.gerarXlsx(relatorio, categoria),
            ]);
            await emailService.sendReport(
                destinatario.email,
                destinatario.nome,
                relatorio.propriedade,
                pdf,
                planilha,
            );

            const [usuario, dominio] = destinatario.email.split("@");
            const emailMascarado = usuario && dominio
                ? `${usuario.slice(0, 2)}${"*".repeat(Math.max(2, usuario.length - 2))}@${dominio}`
                : destinatario.email;
            return reply.send({
                message: "Relatório enviado por e-mail com PDF e planilha anexos.",
                destinatario: emailMascarado,
            });
        } catch (error) {
            return this.responderErro(request, reply, error, "Erro ao enviar relatório por e-mail.");
        }
    };
}

export const relatorioController = new RelatorioController();
