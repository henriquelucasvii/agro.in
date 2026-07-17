import { prisma } from "../lib/prisma.js"
import { CreatePropertyBody, UpdatePropertyBody } from "../types/propriedades.types.js"

class PropriedadesService {

    async create(data: CreatePropertyBody) {
        return await prisma.propriedade.create({
            data: {
                ...data
            }
        })
    }

    async findAll() {
        return await prisma.propriedade.findMany()
    }

    async findById(id: number) {
        return await prisma.propriedade.findUnique({ where: { id }})
    }

    async update(id: number, data: UpdatePropertyBody) {
        const update: any = {...data}

        return await prisma.propriedade.update({ where: {id}, data: update})
    }

    async remove(id: number) {
        return await prisma.propriedade.delete({ where: {id} })
    }
}

export const propriedadesService = new PropriedadesService()