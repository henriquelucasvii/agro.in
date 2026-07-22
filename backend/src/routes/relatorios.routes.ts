import { FastifyInstance } from "fastify";
import { TipoFinanceiro } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export async function relatoriosRoutes(app: FastifyInstance) {

    app.get<{ Params: { propriedadeId: string } }>(
        "/:propriedadeId",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const propriedadeId = Number(request.params.propriedadeId);

                const propriedade = await prisma.propriedade.findFirst({
                    where: {
                        id: propriedadeId,
                        usuario_id: request.user.id,
                    }
                });

                if (!propriedade) {
                    return reply.status(404).send({ error: "Propriedade não encontrada." });
                }

                const entradas = await prisma.financeiro.aggregate({
                    _sum: { valor: true },
                    where: { propriedade_id: propriedadeId, tipo: TipoFinanceiro.entrada }
                });

                const saidas = await prisma.financeiro.aggregate({
                    _sum: { valor: true },
                    where: { propriedade_id: propriedadeId, tipo: TipoFinanceiro.saida }
                });

                const totalProducoes = await prisma.producao.count({
                    where: { propriedade_id: propriedadeId }
                });

                const totalItensEstoque = await prisma.estoque.count({
                    where: { propriedade_id: propriedadeId }
                });

                const totalEntrada = entradas._sum.valor ?? 0;
                const totalSaida = saidas._sum.valor ?? 0;

                return reply.send({
                    propriedade: propriedade.nome,
                    financeiro: {
                        entradas: totalEntrada,
                        saidas: totalSaida,
                        saldo: totalEntrada - totalSaida
                    },
                    producao: { total: totalProducoes },
                    estoque: { totalItens: totalItensEstoque }
                });

            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: "Erro ao gerar relatório." });
            }
        }
    );
}