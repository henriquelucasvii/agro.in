import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

interface CreatePropertyBody {
    nome: string;
    area_total: number;
    tipo_producao: string;
    localizacao: string;
}

interface UpdatePropertyBody {
    nome?: string;
    area_total?: number;
    tipo_producao?: string;
    localizacao?: string;
}

export async function propriedadesRoutes(app: FastifyInstance) {

    app.post<{ Body: CreatePropertyBody }>(
        "/",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const { nome, area_total, tipo_producao, localizacao } = request.body;

                const propriedade = await prisma.propriedade.create({
                    data: {
                        nome,
                        area_total,
                        tipo_producao,
                        localizacao,
                        usuario_id: request.user.id,
                    }
                });

                return reply.status(201).send(propriedade);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao cadastrar propriedade." });
            }
        }
    );

    app.get(
        "/",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            const propriedades = await prisma.propriedade.findMany({
                where: { usuario_id: request.user.id }
            });
            return reply.send(propriedades);
        }
    );

    app.get<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            const propriedade = await prisma.propriedade.findFirst({
                where: {
                    id: Number(request.params.id),
                    usuario_id: request.user.id,
                }
            });

            if (!propriedade) {
                return reply.status(404).send({ error: "Propriedade não encontrada." });
            }

            return reply.send(propriedade);
        }
    );

    app.put<{ Params: { id: string }; Body: UpdatePropertyBody }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            const propriedade = await prisma.propriedade.findFirst({
                where: { id: Number(request.params.id), usuario_id: request.user.id }
            });

            if (!propriedade) {
                return reply.status(404).send({ error: "Propriedade não encontrada." });
            }

            const atualizada = await prisma.propriedade.update({
                where: { id: Number(request.params.id) },
                data: request.body
            });

            return reply.send(atualizada);
        }
    );

    app.delete<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            const propriedade = await prisma.propriedade.findFirst({
                where: { id: Number(request.params.id), usuario_id: request.user.id }
            });

            if (!propriedade) {
                return reply.status(404).send({ error: "Propriedade não encontrada." });
            }

            await prisma.propriedade.delete({ where: { id: Number(request.params.id) } });
            return reply.status(204).send();
        }
    );
}