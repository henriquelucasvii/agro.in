import { FastifyRequest, FastifyReply } from "fastify"
import { CreateFinanceiroBody, UpdateFinanceiroBody } from "../types/financeiro.types.js"
import { financeiroService } from "../service/financeiro.service.js"

class FinanceiroController {

    // Post
    async create(request: FastifyRequest< {Body: CreateFinanceiroBody}>, reply: FastifyReply) {
        try {
            const financeiro = await financeiroService.create(request.body)

            if (!financeiro) return reply.status(400).send({error: "Não foi possível criar a produção"})

            return reply.status(201).send(financeiro)
        } catch (error) {

            request.log.error(error)
            return reply.status(500).send({error: "Erro ao cadastrar lançamento financeiro de propriedade"})
        }
    }
    
    // Get all
    async findAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const financeiro = await financeiroService.findAll()

            return reply.status(200).send(financeiro)
        } catch (error) {
            
            request.log.error(error)
            return reply.status(500).send({error: "Erro ao listar financeiro"})
        }
    }

    // Get by Id
    async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params
            const financeiro = await financeiroService.findById(Number(id))

            if (!financeiro) return reply.status(404).send({ error: "Finanças não encontrado"})

            reply.status(200).send(financeiro)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({error: "Erro ao obter finanças"})
        }
    }

    // Put 
    async update(request: FastifyRequest<{ Params: { id: string }, Body: UpdateFinanceiroBody }>, reply: FastifyReply){
        try {
            const { id } = request.params

            const financeiro = await financeiroService.update(Number(id), request.body)

            return reply.status(200).send(financeiro)
        } catch (error) {
            
            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao atualizar finanças" })
        }
    }

    // Delete
    async remove(request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
        try {
            const { id } = request.params

            await financeiroService.remove(Number(id))

            return reply.status(204).send()
        } catch (error) {
            
            request.log.error(error)
            return reply.status(500).send({ error: "Erro ao deletar finanças" })
        }
    }
}

export const financeiroController = new FinanceiroController() 