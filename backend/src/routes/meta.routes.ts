import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

interface CreateMetaBody {
    propriedade_id: number;
    descricao: string;
    categoria?: string;
    valor_alvo?: number;
    valor_atual?: number;
    unidade?: string;
    responsavel?: string;
    prazo: string;
    status?: string;
}

interface UpdateMetaBody {
    descricao?: string;
    categoria?: string;
    valor_alvo?: number;
    valor_atual?: number;
    unidade?: string;
    responsavel?: string;
    prazo?: string;
    status?: string;
}

export const metaRoutes = async (app: FastifyInstance) => {

    app.post<{ Body: CreateMetaBody }>(
        "/",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const { propriedade_id, descricao, categoria, valor_alvo, valor_atual, unidade, responsavel, prazo, status } = request.body;

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Propriedade não encontrada." });

                const meta = await prisma.meta.create({
                    data: {
                        propriedade_id,
                        descricao,
                        categoria: categoria ?? null,
                        valor_alvo: valor_alvo ?? null,
                        valor_atual: valor_atual ?? 0,
                        unidade: unidade ?? null,
                        responsavel: responsavel ?? null,
                        prazo: new Date(prazo),
                        status: status ?? "pendente",
                    }
                });

                return reply.status(201).send(meta);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao criar a meta" });
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

            const metas = await prisma.meta.findMany({
                where: { propriedade_id: { in: ids } }
            });

            return reply.status(200).send(metas);
        }
    );

    app.get<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const meta = await prisma.meta.findUnique({
                    where: { id: Number(request.params.id) }
                });

                if (!meta) return reply.status(404).send({ error: "Meta não encontrada" });

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: meta.propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

                return reply.send(meta);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao obter meta" });
            }
        }
    );

    app.put<{ Params: { id: string }; Body: UpdateMetaBody }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const meta = await prisma.meta.findUnique({
                    where: { id: Number(request.params.id) }
                });

                if (!meta) return reply.status(404).send({ error: "Meta não encontrada" });

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: meta.propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

                const { prazo, ...resto } = request.body;

                const atualizada = await prisma.meta.update({
                    where: { id: Number(request.params.id) },
                    data: {
                        ...resto,
                        ...(prazo ? { prazo: new Date(prazo) } : {}),
                    }
                });

                return reply.send(atualizada);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao atualizar a meta" });
            }
        }
    );

    app.delete<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const meta = await prisma.meta.findUnique({
                    where: { id: Number(request.params.id) }
                });

                if (!meta) return reply.status(404).send({ error: "Meta não encontrada" });

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: meta.propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

                await prisma.meta.delete({ where: { id: Number(request.params.id) } });
                return reply.status(204).send();
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao deletar a meta" });
            }
        }
    );
};