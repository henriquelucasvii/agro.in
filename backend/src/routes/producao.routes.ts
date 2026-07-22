import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { CreateProducaoBody, UpdateProducaoBody } from "../types/producao.types.js";

export const producaoRoutes = async (app: FastifyInstance) => {

    app.post<{ Body: CreateProducaoBody }>(
        "/",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: request.body.propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Propriedade não encontrada." });

                const producao = await prisma.producao.create({
                    data: {
                        ...request.body,
                        data_inicio: request.body.data_inicio ? new Date(request.body.data_inicio) : null,
                        data_fim: request.body.data_fim ? new Date(request.body.data_fim) : null,
                    }
                });

                return reply.status(201).send(producao);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao cadastrar produção" });
            }
        }
    );

    app.get(
        "/",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const propriedades = await prisma.propriedade.findMany({
                    where: { usuario_id: request.user.id },
                    select: { id: true }
                });

                const ids = propriedades.map((p) => p.id);

                const producoes = await prisma.producao.findMany({
                    where: { propriedade_id: { in: ids } }
                });

                return reply.status(200).send(producoes);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao listar produções" });
            }
        }
    );

    app.get<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const producao = await prisma.producao.findUnique({
                    where: { id: Number(request.params.id) }
                });

                if (!producao) return reply.status(404).send({ error: "Produção não encontrada" });

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: producao.propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

                return reply.status(200).send(producao);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao obter produção" });
            }
        }
    );

    app.put<{ Params: { id: string }; Body: UpdateProducaoBody }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const producao = await prisma.producao.findUnique({
                    where: { id: Number(request.params.id) }
                });

                if (!producao) return reply.status(404).send({ error: "Produção não encontrada" });

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: producao.propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

                const { data_inicio, data_fim, ...resto } = request.body;

                const atualizada = await prisma.producao.update({
                    where: { id: Number(request.params.id) },
                    data: {
                        ...resto,
                        ...(data_inicio ? { data_inicio: new Date(data_inicio) } : {}),
                        ...(data_fim ? { data_fim: new Date(data_fim) } : {}),
                    }
                });

                return reply.status(200).send(atualizada);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao atualizar produção" });
            }
        }
    );

    app.delete<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const producao = await prisma.producao.findUnique({
                    where: { id: Number(request.params.id) }
                });

                if (!producao) return reply.status(404).send({ error: "Produção não encontrada" });

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: producao.propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

                await prisma.producao.delete({ where: { id: Number(request.params.id) } });
                return reply.status(204).send();
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao deletar produção" });
            }
        }
    );
};