import type { FastifyInstance } from "fastify";

import { analiseFoliarController } from "../controllers/analise-foliar.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import type {
    CriarAnaliseFoliarBody,
    FeedbackAnaliseFoliarBody,
} from "../types/analise-foliar.types.js";

export const analiseFoliarRoutes = async (app: FastifyInstance) => {
    app.get("/capacidades", { preHandler: [authMiddleware] }, analiseFoliarController.capacidades);
    app.get("/", { preHandler: [authMiddleware] }, analiseFoliarController.listar);
    app.post<{ Body: CriarAnaliseFoliarBody }>(
        "/",
        { preHandler: [authMiddleware] },
        analiseFoliarController.criar,
    );
    app.get<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        analiseFoliarController.buscar,
    );
    app.get<{ Params: { id: string } }>(
        "/:id/imagem",
        { preHandler: [authMiddleware] },
        analiseFoliarController.imagem,
    );
    app.patch<{
        Params: { id: string };
        Body: FeedbackAnaliseFoliarBody;
    }>(
        "/:id/feedback",
        { preHandler: [authMiddleware] },
        analiseFoliarController.feedback,
    );
    app.delete<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        analiseFoliarController.remover,
    );
};
