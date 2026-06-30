import { FastifyInstance } from "fastify";
import { TipoFinanceiro } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

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

    // Criar lançamento financeiro
    app.post<{ Body: CreateFinanceiroBody }>("/", async (request, reply) => {
        try {
            const {
                propriedade_id,
                tipo,
                categoria,
                descricao,
                valor,
                data
            } = request.body;

            const financeiro = await prisma.financeiro.create({
                data: {
                    propriedade_id,
                    tipo,
                    categoria,
                    descricao,
                    valor,
                    data: new Date(data)
                }
            });

            return reply.status(201).send(financeiro);

        } catch (error) {
            request.log.error(error);

            return reply.status(500).send({
                error: "Erro ao cadastrar lançamento financeiro."
            });
        }
    });

    // Listar todos
    app.get("/", async (_, reply) => {
        const financeiros = await prisma.financeiro.findMany();
        return reply.send(financeiros);

    });

    // Buscar por ID
    app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
        const financeiro = await prisma.financeiro.findUnique({
            where: {
                id: Number(request.params.id)
            }
        });

        if (!financeiro) {
            return reply.status(404).send({
                error: "Lançamento não encontrado."
            });
        }

        return reply.send(financeiro);

    });

    // Atualizar
    app.put<{
        Params: { id: string };
        Body: UpdateFinanceiroBody;
    }>("/:id", async (request, reply) => {

        const financeiro = await prisma.financeiro.update({
            where: {
                id: Number(request.params.id)
            },
            data: request.body
        });

        return reply.send(financeiro);

    });

    // Excluir
    app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {

        await prisma.financeiro.delete({
            where: {
                id: Number(request.params.id)
            }
        });

        return reply.status(204).send();

    });

}

//id
//propriedade_id
//tipo
//categoria
//descricao
//valor
//data