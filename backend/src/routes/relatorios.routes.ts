import { FastifyInstance } from "fastify";
import { relatorioController } from "../controllers/relatorios.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import type { EnviarRelatorioBody, ExportarRelatorioBody } from "../types/relatorios.types.js";

export async function relatoriosRoutes(app: FastifyInstance) {
    app.get<{ Params: { propriedadeId: string } }>(
        "/:propriedadeId",
        { preHandler: [authMiddleware] },
        relatorioController.gerar,
    );
    app.post<{ Params: { propriedadeId: string }; Body: ExportarRelatorioBody }>(
        "/:propriedadeId/exportar",
        { preHandler: [authMiddleware] },
        relatorioController.exportar,
    );
    app.post<{ Params: { propriedadeId: string }; Body: EnviarRelatorioBody }>(
        "/:propriedadeId/enviar-email",
        { preHandler: [authMiddleware] },
        relatorioController.enviarEmail,
    );
}
