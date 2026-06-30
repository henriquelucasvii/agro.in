import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma.js"

interface CreateEstoqueBody {
    propriedade_id: number,
    item: string,
    categoria: string,
    quantidade: number,
    unidade: string,
    quantidade_minima: number
}

interface EstoqueById {
    id: string
}

interface UpdateEstoqueBody {
    propriedade_id?: number,
    item?: string,
    categoria?: string,
    quantidade?: number,
    unidade?: string,
    quantidade_minima?: number
}

export const estoqueRoutes = async (app: FastifyInstance) => {

    // POST 
    app.post<{Body: CreateEstoqueBody }>("/", async (request, reply) => {
        try {
            const { propriedade_id, item, categoria, quantidade, unidade, quantidade_minima } = request.body

            const estoque = await prisma.estoque.create({
                data: { propriedade_id, item, categoria, quantidade, unidade, quantidade_minima }
            })

            if (!estoque) return reply.send(404).send({ error: "Não foi possível cadastrar o estoque"})

            return reply.status(201).send(estoque)
        } catch (error) {
            request.log.error(error)

            return reply.status(500).send({ error: "Erro ao cadastrar o estoque" })
        }
    })
    
    // GET
    app.get("/", async (_, reply) => {
        const estoque = await prisma.estoque.findMany()
        return reply.status(200).send(estoque)
    })

    // GET por ID
    app.get<{ Params: EstoqueById }>("/:id", async (request, reply) => {

        try {
            const estoque = await prisma.estoque.findUnique({
                where: { id: Number(request.params.id) }
            })

            if (!estoque) return reply.status(404).send({ error: "Estoque não encontrado" })

           return reply.send(estoque)     
        } catch (error) {
            request.log.error(error)

            return reply.status(500).send({ error: "Erro ao obter estoque" })
        }
    })

    // PUT
    app.put<{Params: EstoqueById, Body: UpdateEstoqueBody}>("/:id", async (request, reply) => {

        try {
            const estoque = await prisma.estoque.update({
                where: { id: Number(request.params.id)},
                data: request.body
            })

            return reply.send(estoque)
        } catch (error) {
            request.log.error(error)

            return reply.status(500).send({ error: "Erro ao atualizar o estoque" })
        }
    })
    
    // DELETE
    app.delete<{ Params: EstoqueById }>("/:id", async (request, reply) => {

        try {
            await prisma.estoque.delete({
                where: { id: Number( request.params.id ) }
            })

            return reply.status(204).send()
        } catch (error) {
            request.log.error(error)

            return reply.status(500).send({ error: "Erro ao deletar o estoque" })
        }
    })
}