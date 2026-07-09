import { FastifyInstance } from "fastify"
import { producaoController } from "../controllers/producao.controller.js"
import { CreateProducaoBody, UpdateProducaoBody } from "../types/producao.types.js"

export const producaoRoutes = async (app: FastifyInstance) => {
    app.post<{ Body: CreateProducaoBody }>("/", producaoController.create)
    app.get("/", producaoController.findAll)
    app.get<{Params: {id: string}}>("/:id", producaoController.findById)
    app.put<{Params: {id: string}, Body: UpdateProducaoBody}>("/:id", producaoController.update)
    app.delete<{Params: {id: string}}>("/:id", producaoController.remove)
}