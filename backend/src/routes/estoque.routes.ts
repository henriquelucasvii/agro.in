import { FastifyInstance } from "fastify"
import { CreateEstoqueBody, UpdateEstoqueBody } from "../types/estoque.types.js"
import { estoqueController } from "../controllers/estoque.controller.js"

export const estoqueRoutes = async (app: FastifyInstance) => {
    app.post<{ Body: CreateEstoqueBody}>("/", estoqueController.create)
    app.get("/", estoqueController.findAll)
    app.get<{ Params: { id: string} }>("/:id", estoqueController.findById)
    app.put<{ Params: { id: string}, Body: UpdateEstoqueBody }>("/:id", estoqueController.update)
    app.delete<{ Params: { id: string} }>("/:id", estoqueController.remove)
}