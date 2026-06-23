import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const router = Router();
const prisma = new PrismaClient();

/**
 * REGISTER
 */
router.post("/register", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        const userExists = await prisma.usuario.findUnique({
            where: { email }
        });

        if (userExists) {
            return res.status(400).json({ error: "Usuário já existe" });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const user = await prisma.usuario.create({
            data: {
                nome,
                email,
                senha_hash: senhaHash
            }
        });

        return res.status(201).json({
            id: user.id,
            nome: user.nome,
            email: user.email
        });

    } catch (error) {
        return res.status(500).json({ error: "Erro ao registrar usuário" });
    }
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        const user = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: "Usuário não encontrado" });
        }

        const senhaValida = await bcrypt.compare(senha, user.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ error: "Senha inválida" });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email
            }
        });

    } catch (error) {
        return res.status(500).json({ error: "Erro ao fazer login" });
    }
});

export default router;