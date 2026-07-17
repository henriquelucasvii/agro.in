import { FastifyInstance } from "fastify";
import { CreateFinanceiroBody, UpdateFinanceiroBody } from "../types/financeiro.types.js";
import { financeiroController } from "../controllers/financeiro.controller.js";

export const financeiroRoutes = async (app: FastifyInstance) => {
    app.post<{ Body: CreateFinanceiroBody }>("/", financeiroController.create )
    app.get("/",financeiroController.findAll)
    app.get<{ Params: {id: string} }>("/:id", financeiroController.findById)
    app.put<{ Params: {id: string}, Body: UpdateFinanceiroBody }>("/:id", financeiroController.update)
    app.delete<{ Params: {id: string} }>(":/id", financeiroController.remove)
}