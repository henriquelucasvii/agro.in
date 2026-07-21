import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma.js"

interface CreateMetaBody {
    propriedade_id: number,
    descricao: string,
    categoria?: string,
    valor_alvo?: number,
    valor_atual?: number,
    unidade?: string,
    responsavel?: string,
    prazo: string,
    status?: string
}

interface MetaById {
    id: string
}

interface UpdateMetaBody {
    descricao?: string,
    categoria?: string,
    valor_alvo?: number,
    valor_atual?: number,
    unidade?: string,
    responsavel?: string,
    prazo?: string,
    status?: string
}

export const metaRoutes = (app: FastifyInstance) => {

    // POST
    app.post<{ Body: CreateMetaBody }>("/", async (request, reply) => {
        try {
            const {
                propriedade_id,
                descricao,
                categoria,
                valor_alvo,
                valor_atual,
                unidade,
                responsavel,
                prazo,
                status
            } = request.body

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
            })

            return reply.status(201).send(meta)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao criar a meta" })
        }
    })

    // GET
    app.get("/", async (_, reply) => {
        const metas = await prisma.meta.findMany()
        return reply.status(200).send(metas)
    })

    // GET por ID
    app.get<{ Params: MetaById }>("/:id", async (request, reply) => {
        try {
            const meta = await prisma.meta.findUnique({
                where: { id: Number(request.params.id) }
            })

            if (!meta) return reply.status(404).send({ error: "Meta não encontrada" })

            return reply.send(meta)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao obter meta" })
        }
    })

    // PUT ← estava sem /:id
    app.put<{ Params: MetaById, Body: UpdateMetaBody }>("/:id", async (request, reply) => {
        try {
            const { prazo, ...resto } = request.body;

            const meta = await prisma.meta.update({
                where: { id: Number(request.params.id) },
                data: {
                    ...resto,
                    ...(prazo ? { prazo: new Date(prazo) } : {}),
                }
            })

            return reply.send(meta)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao atualizar a meta" })
        }
    })

    // DELETE ← estava usando reply.send(204) em vez de reply.status(204)
    app.delete<{ Params: MetaById }>("/:id", async (request, reply) => {
        try {
            await prisma.meta.delete({
                where: { id: Number(request.params.id) }
            })

            return reply.status(204).send()
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: "Erro: Não foi possível deletar a sua meta" })
        }
    })
}