import { FastifyInstance } from "fastify";
<<<<<<< HEAD
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js"
import { authMiddleware } from "../middlewares/auth.middleware.js";
import "dotenv/config";

// Tipos 
interface RegisterBody {
    nome: string;
    email: string;
    senha: string;
}

interface LoginBody {
    email: string;
    senha: string;
}

export async function authRoutes(app: FastifyInstance) {
    // REGISTER
    app.post<{ Body: RegisterBody }>("/register", async (request, reply) => {
        try {
            const { nome, email, senha } = request.body;

            const userExists = await prisma.usuario.findUnique({
                where: { email },
            });

            if (userExists) {
                return reply.status(400).send({ error: "Usuário já existe" });
            }

            const senhaHash = await bcrypt.hash(senha, 10);

            const user = await prisma.usuario.create({
                data: { nome, email, senha_hash: senhaHash },
            });

            return reply.status(201).send({
                id: user.id,
                nome: user.nome,
                email: user.email,
            });

        } catch (error) {
            request.log.error(error);

            return reply.status(500).send({ error: "Erro ao registrar usuário" });
        }
    });

    // LOGIN 
    app.post<{ Body: LoginBody }>("/login", async (request, reply) => {
        try {
            const { email, senha } = request.body;
            const user = await prisma.usuario.findUnique({
                where: { email },
            });

            if (!user) {
                return reply.status(401).send({ error: "Usuário não encontrado" });
            }

            const senhaValida = await bcrypt.compare(senha, user.senha_hash);

            if (!senhaValida) {
                return reply.status(401).send({ error: "Senha inválida" });
            }

            const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1d") as jwt.SignOptions["expiresIn"] & string;
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET as string,
                { expiresIn }
            );

            return reply.send({
                token,
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                },
            });

        } catch (error) {
            return reply.status(500).send({ error: "Erro ao fazer login" });
        }
    });

    // GET /auth/me — retorna dados do usuário logado
    app.get("/me", { preHandler: [authMiddleware] }, async (request, reply) => {
        const user = await prisma.usuario.findUnique({
            where: { id: request.user.id }
        });

        if (!user) return reply.status(404).send({ error: "Usuário não encontrado" });

        return reply.send({
            id: user.id,
            nome: user.nome,
            email: user.email,
            criado_em: user.criado_em,
        });
    });

    // PUT /auth/me — atualiza nome e email
    app.put<{ Body: { nome?: string; email?: string } }>(
        "/me",
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            const user = await prisma.usuario.update({
                where: { id: request.user.id },
                data: request.body,
            });

            return reply.send({
                id: user.id,
                nome: user.nome,
                email: user.email,
            });
        }
    );

    app.put<{ Body: { senhaAtual: string; novaSenha: string } }>(
    "/senha",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
        const { senhaAtual, novaSenha } = request.body;

        const user = await prisma.usuario.findUnique({ where: { id: request.user.id } });
        if (!user) return reply.status(404).send({ error: "Usuário não encontrado." });

        const senhaValida = await bcrypt.compare(senhaAtual, user.senha_hash);
        if (!senhaValida) return reply.status(401).send({ error: "Senha atual incorreta." });

        const novaHash = await bcrypt.hash(novaSenha, 10);
        await prisma.usuario.update({
            where: { id: request.user.id },
            data: { senha_hash: novaHash }
        });

        return reply.send({ message: "Senha alterada com sucesso." });
    }
);

=======
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { RegisterBody, LoginBody, UpdateMeBody, UpdateSenhaBody } from "../types/auth.types.js";

export async function authRoutes(app: FastifyInstance) {
    app.post<{ Body: RegisterBody }>("/register", authController.register)
    app.post<{ Body: LoginBody }>("/login", authController.login)
    app.get("/me", { preHandler: [authMiddleware] }, authController.getMe)
    app.put<{ Body: UpdateMeBody }>("/me", { preHandler: [authMiddleware] }, authController.updateMe)
    app.put<{ Body: UpdateSenhaBody }>("/senha", { preHandler: [authMiddleware] }, authController.updateSenha)
>>>>>>> develop-back
}