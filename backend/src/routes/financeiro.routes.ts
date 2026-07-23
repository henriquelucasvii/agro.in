import { FastifyInstance } from "fastify";
<<<<<<< HEAD
import { TipoFinanceiro } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

interface CreateFinanceiroBody {
    propriedade_id: number;
    tipo: TipoFinanceiro;
    categoria: string;
    descricao: string;
    valor: number;
    data: string;
}

interface UpdateFinanceiroBody {
    tipo?: TipoFinanceiro;
    categoria?: string;
    descricao?: string;
    valor?: number;
    data?: string;
}

export async function financeiroRoutes(app: FastifyInstance) {

    app.post<{ Body: CreateFinanceiroBody }>(
        "/",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const { propriedade_id, tipo, categoria, descricao, valor, data } = request.body;

                const propriedade = await prisma.propriedade.findFirst({
                    where: { id: propriedade_id, usuario_id: request.user.id }
                });

                if (!propriedade) {
                    return reply.status(403).send({ error: "Propriedade não encontrada." });
                }

                const financeiro = await prisma.financeiro.create({
                    data: { propriedade_id, tipo, categoria, descricao, valor, data: new Date(data) }
                });

                return reply.status(201).send(financeiro);
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao cadastrar lançamento financeiro." });
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

            const financeiros = await prisma.financeiro.findMany({
                where: { propriedade_id: { in: ids } }
            });

            return reply.send(financeiros);
        }
    );

    app.get<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            const financeiro = await prisma.financeiro.findUnique({
                where: { id: Number(request.params.id) }
            });

            if (!financeiro) return reply.status(404).send({ error: "Lançamento não encontrado." });

            const propriedade = await prisma.propriedade.findFirst({
                where: { id: financeiro.propriedade_id, usuario_id: request.user.id }
            });

            if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

            return reply.send(financeiro);
        }
    );

    app.put<{ Params: { id: string }; Body: UpdateFinanceiroBody }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            const financeiro = await prisma.financeiro.findUnique({
                where: { id: Number(request.params.id) }
            });

            if (!financeiro) return reply.status(404).send({ error: "Lançamento não encontrado." });

            const propriedade = await prisma.propriedade.findFirst({
                where: { id: financeiro.propriedade_id, usuario_id: request.user.id }
            });

            if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

            const atualizado = await prisma.financeiro.update({
                where: { id: Number(request.params.id) },
                data: request.body
            });

            return reply.send(atualizado);
        }
    );

    app.delete<{ Params: { id: string } }>(
        "/:id",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            const financeiro = await prisma.financeiro.findUnique({
                where: { id: Number(request.params.id) }
            });

            if (!financeiro) return reply.status(404).send({ error: "Lançamento não encontrado." });

            const propriedade = await prisma.propriedade.findFirst({
                where: { id: financeiro.propriedade_id, usuario_id: request.user.id }
            });

            if (!propriedade) return reply.status(403).send({ error: "Acesso negado." });

            await prisma.financeiro.delete({ where: { id: Number(request.params.id) } });
            return reply.status(204).send();
        }
    );
=======
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { CreateFinanceiroBody, UpdateFinanceiroBody } from "../types/financeiro.types.js"
import { financeiroController } from "../controllers/financeiro.controller.js";

export const financeiroRoutes = async (app: FastifyInstance) => {
    app.post<{ Body: CreateFinanceiroBody }>("/", { preHandler: [authMiddleware] }, financeiroController.create )
    app.get("/", { preHandler: [authMiddleware] }, financeiroController.findAll)
    app.get<{ Params: {id: string} }>("/:id", { preHandler: [authMiddleware] } , financeiroController.findById)
    app.put<{ Params: {id: string}, Body: UpdateFinanceiroBody }>("/:id", { preHandler: [authMiddleware] }, financeiroController.update)
    app.delete<{ Params: {id: string} }>(":/id", { preHandler: [authMiddleware] } , financeiroController.remove)
>>>>>>> develop-back
}