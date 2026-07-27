import { FastifyInstance } from "fastify";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { RegisterBody, LoginBody, UpdateMeBody, UpdateSenhaBody } from "../types/auth.types.js";

export async function authRoutes(app: FastifyInstance) {
    app.post<{ Body: RegisterBody }>("/register", authController.register)
    app.post<{ Body: LoginBody }>("/login", authController.login)
    app.get("/me", { preHandler: [authMiddleware] }, authController.getMe)
    app.put<{ Body: UpdateMeBody }>("/me", { preHandler: [authMiddleware] }, authController.updateMe)
    app.put<{ Body: UpdateSenhaBody }>("/senha", { preHandler: [authMiddleware] }, authController.updateSenha)
}