<<<<<<< HEAD
import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

interface CreateEstoqueBody {
    propriedade_id: number;
    item: string;
    categoria: string;
    quantidade: number;
    unidade: string;
    quantidade_minima: number;
}

interface UpdateEstoqueBody {
    item?: string;
    categoria?: string;
    quantidade?: number;
    unidade?: string;
    quantidade_minima?: number;
}

export const estoqueRoutes = async (app: FastifyInstance) => {

    app.post<{ Body: CreateEstoqueBody }>(
        "/",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const { propriedade_id, item, categoria, quantidade, unidade, quantidade_minima } = request.body;

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Propriedade não encontrada." });

                const estoque = await prisma.estoque.create({
                    data: { propriedade_id, item, categoria, quantidade, unidade, quantidade_minima }
                });

                return reply.status(201).send(estoque);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao cadastrar o estoque" });
            }
        }
    );

    app.get(
        "/",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            const propriedades = await prisma.propriedade.findMany({
                where: { usuario_id: request.user.id },
                select: { id: true }
            });

            const ids = propriedades.map((p) => p.id);

            const estoque = await prisma.estoque.findMany({
                where: { propriedade_id: { in: ids } }
            });

            return reply.status(200).send(estoque);
        }
    );

    app.get<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const estoque = await prisma.estoque.findUnique({
                    where: { id: Number(request.params.id) }
                });

                if (!estoque) return reply.status(404).send({ error: "Estoque não encontrado" });

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: estoque.propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

                return reply.send(estoque);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao obter estoque" });
            }
        }
    );

    app.put<{ Params: { id: string }; Body: UpdateEstoqueBody }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const estoque = await prisma.estoque.findUnique({
                    where: { id: Number(request.params.id) }
                });

                if (!estoque) return reply.status(404).send({ error: "Estoque não encontrado" });

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: estoque.propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

                const atualizado = await prisma.estoque.update({
                    where: { id: Number(request.params.id) },
                    data: request.body
                });

                return reply.send(atualizado);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao atualizar o estoque" });
            }
        }
    );

    app.delete<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const estoque = await prisma.estoque.findUnique({
                    where: { id: Number(request.params.id) }
                });

                if (!estoque) return reply.status(404).send({ error: "Estoque não encontrado" });

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: estoque.propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

                await prisma.estoque.delete({ where: { id: Number(request.params.id) } });
                return reply.status(204).send();
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao deletar o estoque" });
            }
        }
    );
};
=======
import { FastifyInstance } from "fastify"
import { CreateEstoqueBody, UpdateEstoqueBody } from "../types/estoque.types.js"
import { estoqueController } from "../controllers/estoque.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

export const estoqueRoutes = async (app: FastifyInstance) => {
    app.post<{ Body: CreateEstoqueBody }>("/", { preHandler: [authMiddleware]}, estoqueController.create)
    app.get("/", { preHandler: [authMiddleware]}, estoqueController.findAll)
    app.get<{ Params: { id: string } }>("/:id", { preHandler: [authMiddleware]}, estoqueController.findById)
    app.put<{ Params: { id: string }, Body: UpdateEstoqueBody }>("/:id", { preHandler: [authMiddleware]}, estoqueController.update)
    app.delete<{ Params: { id: string } }>("/:id", { preHandler: [authMiddleware]}, estoqueController.remove)
}
>>>>>>> develop-back
