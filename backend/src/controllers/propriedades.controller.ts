import { FastifyRequest, FastifyReply } from "fastify"
import { CreatePropertyBody, UpdatePropertyBody } from "../types/propriedades.types.js"
import { propriedadesService } from "../service/propriedades.service.js"

class PropriedadeController {
    
    async create(request: FastifyRequest< {Body: CreatePropertyBody} >, reply: FastifyReply) {
        try {
            const propriedade = await propriedadesService.create(request.body)

            if (!propriedade) return reply.send(404).send({ error: "Não foi possível criar a propriedade" })
            
            return reply.status(201).send(propriedade)
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao cadastrar propriedade "})
        }
    }

    async findAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const propriedades = await propriedadesService.findAll();

            return reply.status(200).send(propriedades);
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao listar propriedades" })
        }
    }

    async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.body as {id: string}
            const propriedade = await propriedadesService.findById(Number(id))

            if (!propriedade) return reply.status(404).send({ error: "Propriedade não encontrada"} )

            return reply.status(200).send(propriedade)
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao obter propriedade"})
        }
    }

    async update(request: FastifyRequest<{ Params: { id: string }, Body: UpdatePropertyBody}>, reply: FastifyReply) {
        try {
            const { id } = request.params

            const propriedade = await propriedadesService.update(Number(id), request.body)

            return reply.status(200).send(propriedade)
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao atualizar propriedade" })
        }
    }

    async remove(request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
        try {
            const { id } = request.params

            await propriedadesService.remove(Number(id))

            return reply.status(204).send()
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao deletar propriedade" })
        }
    }
}

export const propriedadeController = new PropriedadeController()