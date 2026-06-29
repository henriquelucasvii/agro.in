import { FastifyInstance } from "fastify"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface CreateProducaoBody {
    propriedade_id: number
    tipo: string
    area_utilizada: number
    quantidade: number
    data_inicio: string
    data_fim: string
    status: string
}

interface ProducaoById {
    id: string
}

interface UpdateProducaoBody {
    propriedade_id?: number
    tipo?: string
    area_utilizada?: number
    quantidade?: number
    data_inicio?: string
    data_fim?: string
    status?: string
}

export const producaoRoutes = async (app: FastifyInstance) => {
    
    // POST
    app.post<{ Body: CreateProducaoBody}>("/", async (request, reply) => {
        try {
            const {
                propriedade_id,
                tipo,
                area_utilizada,
                quantidade,
                data_inicio,
                data_fim,
                status
            } = request.body

            const producao = await prisma.producao.create({
                data: {
                    propriedade_id,
                    tipo,
                    area_utilizada,
                    quantidade,
                    data_inicio: new Date(data_inicio),
                    data_fim: new Date(data_fim),
                    status
                }
            })

            if (!producao) return reply.status(404).send({error: "Não foi possível criar a produção"})


            return reply.status(200).send(producao)
        } catch (error) {
            request.log.error(error)

            return reply.status(500).send({error: "Erro ao cadastrar produção de propriedade"})
        }
    })

    // GET
    app.get("/", async (_, reply) => {
        const producao = await prisma.producao.findMany()
        return reply.status(200).send(producao)
    })
    
    // GET por ID
    app.get<{ Params: ProducaoById}>("/:id", async (request, reply) => {

        try {
            const { id } = request.params

            const producao = await prisma.producao.findUnique({
                where: {
                    id: Number(id)
                }
            })

            if (!producao) return reply.status(404).send({error: "Produção não encontrada"})
            
            return reply.send(producao)
        } catch (error) {
            request.log.error(error)

            return reply.status(500).send({error: "Erro ao obter produção"})
        }
    })

    // PUT
    app.put<{ Params: ProducaoById, Body: UpdateProducaoBody}>("/:id", async (request, reply) => {
            
        try {
            const { id } = request.params 

            const producao = await prisma.producao.update({
                where: {
                    id: Number(id)
                },
                data: request.body
            })

            // Código "morto"
            // if (!producao) return reply.status(404).send({error: "Não foi possível atualizar os dados da produção"})

            return reply.send(producao)
        } catch (error) {
            request.log.error(error)

            return reply.status(500).send({error: "Erro ao atualizar produção"})
        }
    })

    // DELETE
    app.delete<{ Params: ProducaoById }>("/:id", async (request, reply) => {
        try {
            const { id } = request.params

            await prisma.producao.delete({
                where: {
                    id: Number(id)
                }
            })

            return reply.status(204).send()
        } catch (error) {
            request.log.error(error)

            return reply.status(500).send({error: "Erro ao deletar produção."})
        }
    })
}