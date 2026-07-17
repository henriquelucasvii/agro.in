import { FastifyRequest, FastifyReply } from "fastify"
import { CreateEstoqueBody, UpdateEstoqueBody } from "../types/estoque.types.js"
import { estoqueService } from "../service/estoque.service.js"

class EstoqueController {
        async create(request: FastifyRequest< {Body: CreateEstoqueBody} >, reply: FastifyReply) {
            try {
                const estoque = await estoqueService.create(request.body)
    
                if (!estoque) return reply.send(404).send({ error: "Não foi possível criar a estoque" })
                
                return reply.status(201).send(estoque)
            } catch (error) {
    
                request.log.error(error)
                return reply.status(500).send({ error: "Erro ao cadastrar estoque "})
            }
        }
    
        async findAll(request: FastifyRequest, reply: FastifyReply) {
            try {
                const estoques = await estoqueService.findAll();
    
                return reply.status(200).send(estoques);
            } catch (error) {
    
                request.log.error(error)
                return reply.status(500).send({ error: "Erro ao listar estoques" })
            }
        }
    
        async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
            try {
                const { id } = request.body as {id: string}
                const estoque = await estoqueService.findById(Number(id))
    
                if (!estoque) return reply.status(404).send({ error: "Estoque não encontrada"} )
    
                return reply.status(200).send(estoque)
            } catch (error) {
    
                request.log.error(error)
                return reply.status(500).send({ error: "Erro ao obter estoque"})
            }
        }
    
        async update(request: FastifyRequest<{ Params: { id: string }, Body: UpdateEstoqueBody}>, reply: FastifyReply) {
            try {
                const { id } = request.params
    
                const estoque = await estoqueService.update(Number(id), request.body)
    
                return reply.status(200).send(estoque)
            } catch (error) {
    
                request.log.error(error)
                return reply.status(500).send({ error: "Erro ao atualizar estoque" })
            }
        }
    
        async remove(request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
            try {
                const { id } = request.params
    
                await estoqueService.remove(Number(id))
    
                return reply.status(204).send()
            } catch (error) {
    
                request.log.error(error)
                return reply.status(500).send({ error: "Erro ao deletar estoque" })
            }
        }
}

export const estoqueController = new EstoqueController()