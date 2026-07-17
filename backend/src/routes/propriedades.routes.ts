import { FastifyInstance } from "fastify";
import { CreatePropertyBody, UpdatePropertyBody } from "../types/propriedades.types.js"
import { propriedadeController } from "../controllers/propriedades.controller.js"

export const propriedadesRoutes = async (app: FastifyInstance) => {
    app.post<{ Body: CreatePropertyBody} >("/", propriedadeController.create)
    app.get("/", propriedadeController.findAll)
    app.get<{ Params: {id: string} }>("/:id", propriedadeController.findById)
    app.put<{ Body: UpdatePropertyBody, Params: {id: string} }>("/id", propriedadeController.update)
    app.delete<{ Params: {id: string} }>(":/id", propriedadeController.remove)
}