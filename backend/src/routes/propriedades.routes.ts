import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CreatePropertyBody {
    nome: string;
    area_total: number;
    tipo_producao: string;
    localizacao: string;
    usuario_id: number;
}

interface UpdatePropertyBody {
    nome?: string;
    area_total?: number;
    tipo_producao?: string;
    localizacao?: string;
}

export async function propriedadesRoutes(app: FastifyInstance) {

    // Criar propriedade
    app.post<{ Body: CreatePropertyBody }>("/", async (request, reply) => {
        try {
            const {
                nome,
                area_total,
                tipo_producao,
                localizacao,
                usuario_id
            } = request.body;

            const propriedade = await prisma.propriedade.create({
                data: {
                    nome,
                    area_total,
                    tipo_producao,
                    localizacao,
                    usuario_id
                }
            });

            return reply.status(201).send(propriedade);

        } catch (error) {
            request.log.error(error);

            return reply.status(500).send({
                error: "Erro ao cadastrar propriedade."
            });
        }
    });

    // Listar todas
    app.get("/", async (_, reply) => {
        const propriedades = await prisma.propriedade.findMany();
        return reply.send(propriedades);

    });

    // Buscar por id
    app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
        const propriedade = await prisma.propriedade.findUnique({
            where: {
                id: Number(request.params.id)
            }
        });

        if (!propriedade) {
            return reply.status(404).send({
                error: "Propriedade não encontrada."
            });
        }

        return reply.send(propriedade);

    });

    // Atualizar
    app.put<{
        Params: { id: string };
        Body: UpdatePropertyBody;
    }>("/:id", async (request, reply) => {

        const propriedade = await prisma.propriedade.update({
            where: {
                id: Number(request.params.id)
            },
            data: request.body
        });
        return reply.send(propriedade);

    });

    // Excluir
    app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
        await prisma.propriedade.delete({
            where: {
                id: Number(request.params.id)
            }
        });

        return reply.status(204).send();

    });

}