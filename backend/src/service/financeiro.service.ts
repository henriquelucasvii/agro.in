import { prisma } from "../lib/prisma.js"
import { CreateFinanceiroBody, UpdateFinanceiroBody } from "../types/financeiro.types.js"

class FinanceiroService {
    
    async create(data: CreateFinanceiroBody){
        return await prisma.financeiro.create({
            data: {
                ...data,
                data: new Date(data.data)
            }
        })
    }

    async findAll(){
        return await prisma.financeiro.findMany()
    }

    async findById(id: number){
        return await prisma.financeiro.findUnique({ where: { id }})
    }

    async update(id: number, data: UpdateFinanceiroBody){
        const update: any = {...data}

        if (data) {
            update.data = new Date()
        }
        return await prisma.financeiro.update({ where: {id}, data: update})
    }

    async remove(id: number){
        return await prisma.financeiro.delete({ where: {id} })
    }
}

export const financeiroService = new FinanceiroService()