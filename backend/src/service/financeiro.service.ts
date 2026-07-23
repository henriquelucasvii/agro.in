import { prisma } from "../lib/prisma.js";
import { CreateFinanceiroBody, UpdateFinanceiroBody } from "../types/financeiro.types.js";

// Erro de domínio simples, com statusCode para o controller mapear a resposta HTTP
export class FinanceiroError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = "FinanceiroError";
    }
}

class FinanceiroService {
    
    // Garante que a propriedade existe e pertence ao usuário
    private assertPropriedadePertenceAoUsuario = async (propriedadeId: number, usuarioId: number) => {
        const propriedade = await prisma.propriedade.findFirst({
            where: { id: propriedadeId, usuario_id: usuarioId },
        });

        if (!propriedade) {
            throw new FinanceiroError("Propriedade não encontrada.", 403);
        }
    };

    // Busca o lançamento e garante que ele pertence a uma propriedade do usuário
    private findOwnedOrFail = async (id: number, usuarioId: number) => {
        const financeiro = await prisma.financeiro.findUnique({ where: { id } });

        if (!financeiro) {
            throw new FinanceiroError("Lançamento não encontrado.", 404);
        }

        const propriedade = await prisma.propriedade.findFirst({
            where: { id: financeiro.propriedade_id, usuario_id: usuarioId },
        });

        if (!propriedade) {
            throw new FinanceiroError("Acesso negado.", 403);
        }

        return financeiro;
    };

    create = async (usuarioId: number, data: CreateFinanceiroBody) => {
        await this.assertPropriedadePertenceAoUsuario(data.propriedade_id, usuarioId);

        return prisma.financeiro.create({
            data: {...data},
        });
    };

    findAll = async (usuarioId: number) => {
        const propriedades = await prisma.propriedade.findMany({
            where: { usuario_id: usuarioId },
            select: { id: true },
        });

        const ids = propriedades.map((p) => p.id);

        return prisma.financeiro.findMany({
            where: { propriedade_id: { in: ids } },
        });
    };

    findById = async (usuarioId: number, id: number) => {
        return this.findOwnedOrFail(id, usuarioId);
    };

    update = async (usuarioId: number, id: number, data: UpdateFinanceiroBody) => {
        await this.findOwnedOrFail(id, usuarioId);

        return prisma.financeiro.update({
            where: { id },
            data,
        });
    };

    delete = async (usuarioId: number, id: number): Promise<void> => {
        await this.findOwnedOrFail(id, usuarioId);

        await prisma.financeiro.delete({ where: { id } });
    };
}

export const financeiroService = new FinanceiroService();