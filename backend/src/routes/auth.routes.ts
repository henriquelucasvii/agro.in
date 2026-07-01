import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js"
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
                return reply.status(401).send({ error: "Usu2ário não encontrado" });
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
}