import { FastifyRequest, FastifyReply } from "fastify"
import { CreateMetaBody, UpdateMetaBody } from "../types/meta.types.js"
import { metaService } from "../service/meta.service.js"


class MetaController {
    async create(request: FastifyRequest<{ Body: CreateMetaBody }>, reply: FastifyReply) {
        try {
            const meta = await metaService.create(request.body)
            
            return reply.status(201).send(meta)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao criar a meta" })
        }
    }

    findAll = async (_: FastifyRequest, reply: FastifyReply) => {
        const metas = await metaService.findAll()
        return reply.status(200).send(metas)
    }

    async findById (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply)  {
        try {
            const meta = await metaService.findById(Number(request.params.id))

            if (!meta) return reply.status(404).send({ error: "Meta não encontrada" })
            
            return reply.send(meta)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao obter meta" })
        }
    }

    async update(request: FastifyRequest<{ Params: { id: string }, Body: UpdateMetaBody }>, reply: FastifyReply) {
        try {
            const meta = await metaService.update(Number(request.params.id), request.body)
            return reply.send(meta)
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao atualizar a meta" })
        }
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            await metaService.delete(Number(request.params.id))
            return reply.status(204).send()
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({ error: "Erro: Não foi possível deletar a sua meta" })
        }
    }
}

export const metaController = new MetaController()