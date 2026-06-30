import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma.js"
import { request } from "node:http"

interface CreateMetaBody {
    propriedade_id: number,
    descricao: string,
    valor_alvo: number,
    valor_atual: number,
    prazo: string
    status: string
}

interface MetaById {
    id: string
}

interface UpdateMetaBody {
    propriedade_id?: number,
    descricao?: string,
    valor_alvo?: number,
    valor_atual?: number,
    prazo?: string
    status?: string
}

export const metaRoutes = (app: FastifyInstance) => {
    
    // POST
    app.post<{ Body: CreateMetaBody }>("/", async (request, reply) => {
        
        try {
            const { propriedade_id, descricao, valor_alvo, valor_atual, prazo, status } = request.body
            
            const meta = await prisma.meta.create({
                data: { propriedade_id, descricao, valor_alvo, valor_atual, prazo, status}
            })

            if (!meta) return reply.status(404).send({ error: "Não foi possível criar a meta" })

            return reply.status(201).send(meta)
        } catch (error) {
            request.log.error(error)

            return reply.status(500).send({ error: "Erro ao criar a meta" })
        }
    })

    // GET
    app.get("/", async (_, reply) => {
        const meta = await prisma.meta.findMany()
        return reply.status(200).send(meta)
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

            return reply.status(500).send({ error: "Erro ao obter estoque" })
        }
    })

    // PUT
    app.put<{Params: MetaById, Body: UpdateMetaBody}>("/", async (request, reply) => {

        try {
            const meta = await prisma.meta.update({
                where: { id: Number(request.params.id)},
                data: request.body
            })

            return reply.send(meta)
        } catch (error) {
            request.log.error(error)

            return reply.status(500).send({ error: "Erro ao atualizar as metas" })
        }
    })

    // DELETE
    app.delete<{ Params: MetaById }>("/:id", async (request, reply) => {
        try {
            await prisma.meta.delete({
                where: { id: Number(request.params.id) }
            })

            return reply.send(204).send()
        } catch (error) {
            request.log.error(error)

            return reply.send(500).send({ error: "Erro: Não foi possível deletar a sua meta" })
        }
    })
}