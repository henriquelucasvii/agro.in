import { prisma } from "../lib/prisma.js"
import { CreateMetaBody, UpdateMetaBody } from "../types/meta.types.js"

class MetaService {
    
    async create(data: CreateMetaBody) {
        return prisma.meta.create({
            data: {
                ...data,
                categoria: data.categoria ?? null,
                valor_alvo: data.valor_alvo ?? null,
                valor_atual: data.valor_atual ?? 0,
                unidade: data.unidade ?? null,
                responsavel: data.responsavel ?? null,
                prazo: new Date(data.prazo),
                status: data.status ?? "pendente",
            }
        })
    }
 
    async findAll() {
        return prisma.meta.findMany()
    }
 
    async findById(id: number) {
        return prisma.meta.findUnique({ where: { id } })
    }
 
    async update(id: number, data: UpdateMetaBody) {
        const { prazo, ...resto } = data
 
        return prisma.meta.update({
            where: { id },
            data: {
                ...resto,
                ...(prazo ? { prazo: new Date(prazo) } : {}),
            }
        })
    }
 
    async delete(id: number) {
        return prisma.meta.delete({ where: { id } })
    }
}
 
export const metaService = new MetaService()