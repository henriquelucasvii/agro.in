import { FastifyRequest, FastifyReply } from "fastify"
import { CreateProducaoBody, UpdateProducaoBody } from "../types/producao.types.js"
import { producaoService } from "../service/producao.service.js"

class ProducaoController {

    // Post - Produção
    async create(request: FastifyRequest< {Body: CreateProducaoBody} >, reply: FastifyReply) {
        try {
            const producao = await producaoService.create(request.body)
            
            if (!producao) return reply.status(404).send({error: "Não foi possível criar a produção"})

            return reply.status(201).send(producao)
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({error: "Erro ao cadastrar produção de propriedade"})
        }
    }

    // Get - Produção
    async findAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const producao = await producaoService.findAll()
            
            return reply.status(200).send(producao)
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({error: "Erro ao listar produções"})
        }
    }

    // Get by Id - Produção
    async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params
            const producao = await producaoService.findById(Number(id))

            if (!producao) return reply.status(404).send({ error: "Produção não encontrada" })

            reply.status(200).send(producao)
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({error: "Erro ao obter produção"})
        }
    }

    async update(request: FastifyRequest<{ Params: { id: string }, Body: UpdateProducaoBody }>, reply: FastifyReply) {
        try {
            const { id } = request.params
            
            const producao = await producaoService.update(Number(id), request.body)
            
            return reply.status(200).send(producao)
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao atualizar produção" })
        }
    }

    async remove(request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
        try {
            const { id } = request.params
            
            await producaoService.remove(Number(id))

            return reply.status(204).send()
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao deletar produção" })
        }
    }
}

export const producaoController = new ProducaoController()