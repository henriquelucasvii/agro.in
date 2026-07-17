import { prisma } from "../lib/prisma.js"
import { CreateProducaoBody, UpdateProducaoBody } from "../types/producao.types.js"

class ProducaoService {

    async create(data: CreateProducaoBody) {
        return await prisma.producao.create({
            data: {
                ...data,
                data_inicio: new Date(data.data_inicio),
                data_fim: new Date(data.data_fim)
            }
        })
    }

    async findAll() {
        return await prisma.producao.findMany()
    }

    async findById(id: number) {
        return await prisma.producao.findUnique({ where: { id } })
    }

    async update(id: number, data: UpdateProducaoBody) {
        const update: any = {...data}

        if (data.data_inicio) {
            update.data_inicio = new Date(data.data_inicio)
        } 

        if (data.data_fim) {
            update.data_fim = new Date(data.data_fim)
        } 

        return await prisma.producao.update({ where: {id}, data: update })
    }

    async remove(id: number) {
        return await prisma.producao.delete({ where: {id} })
    }
}

export const producaoService = new ProducaoService()