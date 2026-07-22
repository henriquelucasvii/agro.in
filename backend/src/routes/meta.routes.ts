import { FastifyInstance } from "fastify"
import { metaController } from "../controllers/meta.controller.js"
import { CreateMetaBody, UpdateMetaBody } from "../types/meta.types.js"

export const metaRoutes = (app: FastifyInstance) => {
    app.post<{ Body: CreateMetaBody }>("/", metaController.create)
    app.get("/", metaController.findAll)
    app.get<{ Params: {id: string} }>("/:id", metaController.findById)
    app.put<{ Params: {id: string}, Body: UpdateMetaBody }>("/:id", metaController.update)
    app.delete<{ Params: {id: string} }>("/:id", metaController.delete)
}