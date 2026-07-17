import { prisma } from "../lib/prisma.js"
import { CreateEstoqueBody, UpdateEstoqueBody } from "../types/estoque.types.js"

class EstoqueService {
    async create(data: CreateEstoqueBody) {
        return await prisma.estoque.create({ data: {...data} })
    }

    async findAll(){
        return await prisma.estoque.findMany()
    }

    async findById(id: number){
        return await prisma.estoque.findUnique({ where: { id }})
    }

    async update(id: number, data: UpdateEstoqueBody) {
        const update: any = {...data}

        return await prisma.estoque.update({ where: {id}, data: update})
    }

    async remove(id: number) {
        return await prisma.estoque.delete({ where: {id}})
    }
}

export const estoqueService = new EstoqueService()