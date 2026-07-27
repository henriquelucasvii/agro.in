import type { Prisma } from "@prisma/client";

import { AppError } from "../errors/AppError.js";
import { prisma } from "../lib/prisma.js";
import type {
    CriarAnaliseFoliarBody,
    FeedbackAnaliseFoliarBody,
} from "../types/analise-foliar.types.js";
import { diagnosticoFoliarService } from "./diagnostico-foliar.service.js";
import { imagemFoliarService } from "./imagem-foliar.service.js";

export class AnaliseFoliarError extends AppError {}

const paraJson = (valor: unknown): Prisma.InputJsonValue =>
    JSON.parse(JSON.stringify(valor)) as Prisma.InputJsonValue;

const camposPublicos = {
    id: true,
    propriedade_id: true,
    cultura_informada: true,
    cultura_detectada: true,
    cultura_cientifica: true,
    cultura_confianca: true,
    status_geral: true,
    confianca: true,
    origem_diagnostico: true,
    referencia_provedor: true,
    versao_modelo: true,
    qualidade_foto: true,
    is_planta: true,
    hipoteses: true,
    recomendacoes: true,
    perguntas_confirmacao: true,
    metricas_visuais: true,
    avisos: true,
    latitude: true,
    longitude: true,
    observacoes: true,
    feedback_util: true,
    diagnostico_confirmado: true,
    imagem_mime: true,
    criado_em: true,
    atualizado_em: true,
    propriedade: {
        select: {
            id: true,
            nome: true,
        },
    },
} satisfies Prisma.AnaliseFoliarSelect;

class AnaliseFoliarService {
    private validarPropriedade = async (usuarioId: number, propriedadeId?: number) => {
        if (propriedadeId === undefined) return;
        if (!Number.isInteger(propriedadeId) || propriedadeId <= 0) {
            throw new AnaliseFoliarError("Propriedade inválida.", 400);
        }

        const propriedade = await prisma.propriedade.findFirst({
            where: {
                id: propriedadeId,
                usuario_id: usuarioId,
            },
            select: { id: true },
        });

        if (!propriedade) {
            throw new AnaliseFoliarError("Propriedade não encontrada.", 403);
        }
    };

    private validarCoordenadas = (latitude?: number, longitude?: number) => {
        if (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
            throw new AnaliseFoliarError("Latitude inválida.", 400);
        }
        if (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
            throw new AnaliseFoliarError("Longitude inválida.", 400);
        }
    };

    criar = async (usuarioId: number, entrada: CriarAnaliseFoliarBody) => {
        if (!entrada?.consentimento) {
            throw new AnaliseFoliarError(
                "Confirme o envio da foto para realizar e armazenar a análise.",
                400,
            );
        }
        if (!entrada.imagem) {
            throw new AnaliseFoliarError("Selecione uma foto da folha.", 400);
        }

        const cultura = entrada.cultura?.trim().slice(0, 100) || undefined;
        const observacoes = entrada.observacoes?.trim().slice(0, 600) || undefined;

        await this.validarPropriedade(usuarioId, entrada.propriedade_id);
        this.validarCoordenadas(entrada.latitude, entrada.longitude);

        const imagem = await imagemFoliarService.processar(entrada.imagem);
        const diagnostico = await diagnosticoFoliarService.analisar({
            imagem: imagem.dadosParaAnalise,
            qualidade: imagem.qualidade,
            alertasQualidade: imagem.alertas,
            metricas: imagem.metricas,
            ...(entrada.latitude !== undefined ? { latitude: entrada.latitude } : {}),
            ...(entrada.longitude !== undefined ? { longitude: entrada.longitude } : {}),
        });

        return prisma.analiseFoliar.create({
            data: {
                usuario_id: usuarioId,
                ...(entrada.propriedade_id !== undefined
                    ? { propriedade_id: entrada.propriedade_id }
                    : {}),
                ...(cultura ? { cultura_informada: cultura } : {}),
                ...(diagnostico.cultura_detectada
                    ? { cultura_detectada: diagnostico.cultura_detectada }
                    : {}),
                ...(diagnostico.cultura_cientifica
                    ? { cultura_cientifica: diagnostico.cultura_cientifica }
                    : {}),
                ...(diagnostico.cultura_confianca !== undefined
                    ? { cultura_confianca: diagnostico.cultura_confianca }
                    : {}),
                status_geral: diagnostico.status_geral,
                confianca: diagnostico.confianca,
                origem_diagnostico: diagnostico.origem,
                ...(diagnostico.referencia_provedor
                    ? { referencia_provedor: diagnostico.referencia_provedor }
                    : {}),
                ...(diagnostico.versao_modelo
                    ? { versao_modelo: diagnostico.versao_modelo }
                    : {}),
                qualidade_foto: imagem.qualidade,
                ...(diagnostico.is_planta !== undefined
                    ? { is_planta: diagnostico.is_planta }
                    : {}),
                hipoteses: paraJson(diagnostico.hipoteses),
                recomendacoes: paraJson(diagnostico.recomendacoes),
                perguntas_confirmacao: paraJson(diagnostico.perguntas),
                metricas_visuais: paraJson(imagem.metricas),
                avisos: paraJson(diagnostico.avisos),
                ...(entrada.latitude !== undefined ? { latitude: entrada.latitude } : {}),
                ...(entrada.longitude !== undefined ? { longitude: entrada.longitude } : {}),
                ...(observacoes ? { observacoes } : {}),
                imagem_preview: Uint8Array.from(imagem.preview),
                imagem_mime: imagem.mime,
            },
            select: camposPublicos,
        });
    };

    listar = async (usuarioId: number) =>
        prisma.analiseFoliar.findMany({
            where: { usuario_id: usuarioId },
            orderBy: { criado_em: "desc" },
            take: 24,
            select: camposPublicos,
        });

    buscar = async (usuarioId: number, id: number) => {
        if (!Number.isInteger(id) || id <= 0) {
            throw new AnaliseFoliarError("Análise inválida.", 400);
        }

        const analise = await prisma.analiseFoliar.findFirst({
            where: { id, usuario_id: usuarioId },
            select: camposPublicos,
        });

        if (!analise) throw new AnaliseFoliarError("Análise não encontrada.", 404);
        return analise;
    };

    buscarImagem = async (usuarioId: number, id: number) => {
        const analise = await prisma.analiseFoliar.findFirst({
            where: { id, usuario_id: usuarioId },
            select: {
                imagem_preview: true,
                imagem_mime: true,
            },
        });

        if (!analise) throw new AnaliseFoliarError("Análise não encontrada.", 404);
        return analise;
    };

    registrarFeedback = async (
        usuarioId: number,
        id: number,
        entrada: FeedbackAnaliseFoliarBody,
    ) => {
        await this.buscar(usuarioId, id);
        const diagnosticoConfirmado = entrada.diagnostico_confirmado?.trim().slice(0, 160);

        return prisma.analiseFoliar.update({
            where: { id },
            data: {
                feedback_util: Boolean(entrada.util),
                ...(diagnosticoConfirmado
                    ? { diagnostico_confirmado: diagnosticoConfirmado }
                    : { diagnostico_confirmado: null }),
            },
            select: camposPublicos,
        });
    };

    remover = async (usuarioId: number, id: number) => {
        await this.buscar(usuarioId, id);
        await prisma.analiseFoliar.delete({ where: { id } });
    };

    capacidades = () => ({
        pre_analise_local: true,
        diagnostico_especializado: Boolean(process.env.KINDWISE_CROP_HEALTH_API_KEY?.trim()),
        provedor_especializado: process.env.KINDWISE_CROP_HEALTH_API_KEY?.trim()
            ? "crop.health"
            : null,
        analise_solo_por_foto: false,
        nota:
            "A foto permite triagem visual. Nutrientes e fertilidade do solo exigem análises químicas de solo e tecido.",
    });
}

export const analiseFoliarService = new AnaliseFoliarService();
