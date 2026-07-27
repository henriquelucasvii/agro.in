import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { RegisterBody, LoginBody, UpdateMeBody, UpdateSenhaBody, UsuarioPublico, UsuarioMe, LoginResponse } from "../types/auth.types.js";
import { AppError } from "../errors/AppError.js";

// Erro de domínio simples
export class AuthError extends AppError {}

class AuthService {
    register = async ({ nome, email, senha }: RegisterBody): Promise<UsuarioPublico> => {
        const userExists = await prisma.usuario.findUnique({ where: { email } });

        if (userExists) {
            throw new AuthError("Usuário já existe", 400);
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const user = await prisma.usuario.create({
            data: { nome, email, senha_hash: senhaHash },
        });

        return { id: user.id, nome: user.nome, email: user.email };
    };

    login = async ({ email, senha }: LoginBody): Promise<LoginResponse> => {
        const user = await prisma.usuario.findUnique({ where: { email } });

        if (!user) throw new AuthError("Usuário não encontrado", 401);

        const senhaValida = await bcrypt.compare(senha, user.senha_hash);

        if (!senhaValida) {
            throw new AuthError("Senha inválida", 401);
        }

        const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1d") as jwt.SignOptions["expiresIn"] & string;

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn }
        );

        return {
            token,
            user: { id: user.id, nome: user.nome, email: user.email },
        };
    };

    getMe = async (id: number): Promise<UsuarioMe> => {
        const user = await prisma.usuario.findUnique({ where: { id } });

        if (!user) {
            throw new AuthError("Usuário não encontrado", 404);
        }

        return {
            id: user.id,
            nome: user.nome,
            email: user.email,
            criado_em: user.criado_em,
        };
    };

    updateMe = async (id: number, data: UpdateMeBody): Promise<UsuarioPublico> => {
        const user = await prisma.usuario.update({
            where: { id },
            data,
        });

        return { id: user.id, nome: user.nome, email: user.email };
    };

    updateSenha = async (id: number, { senhaAtual, novaSenha }: UpdateSenhaBody): Promise<void> => {
        const user = await prisma.usuario.findUnique({ where: { id } });

        if (!user) {
            throw new AuthError("Usuário não encontrado.", 404);
        }

        const senhaValida = await bcrypt.compare(senhaAtual, user.senha_hash);

        if (!senhaValida) {
            throw new AuthError("Senha atual incorreta.", 401);
        }

        const novaHash = await bcrypt.hash(novaSenha, 10);

        await prisma.usuario.update({
            where: { id },
            data: { senha_hash: novaHash },
        });
    };
}

export const authService = new AuthService();