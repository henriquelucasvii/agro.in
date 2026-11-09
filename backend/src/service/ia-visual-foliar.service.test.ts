import assert from "node:assert/strict";
import test from "node:test";

import type { ResultadoDiagnostico } from "../types/analise-foliar.types.js";
import { iaVisualFoliarService } from "./ia-visual-foliar.service.js";

const especializado: ResultadoDiagnostico = {
    status_geral: "possivel_doenca_viral",
    confianca: 0.82,
    origem: "plantnet",
    hipoteses: [{
        nome: "Maize streak virus",
        categoria: "virus",
        probabilidade: 0.82,
        sintomas: [],
    }],
    recomendacoes: [],
    perguntas: [],
    avisos: [],
};

test("Claude observa às cegas antes de adjudicar e categoria genérica não infla a confiança", async () => {
    const fetchOriginal = globalThis.fetch;
    const gatewayOriginal = process.env.AI_GATEWAY_API_KEY;
    const oidcOriginal = process.env.VERCEL_OIDC_TOKEN;
    const groqOriginal = process.env.GROQ_API_KEY;
    const corpos: Array<Record<string, unknown>> = [];

    process.env.AI_GATEWAY_API_KEY = "teste";
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.GROQ_API_KEY;
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
        corpos.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
        const texto = corpos.length === 1
            ? JSON.stringify({
                qualidade_diagnostica: "boa",
                orgao: "folha",
                padrao_cor: ["faixas cloróticas longitudinais"],
                distribuicao_lesoes: ["entre nervuras"],
                morfologia_lesoes: [],
                sinais_visiveis: ["clorose em faixas"],
                sinais_nao_visiveis: ["vetor não visível"],
                limitacoes: ["uma única folha"],
            })
            : JSON.stringify({
                concordancia: "alta",
                confianca: 0.86,
                hipoteses: [{
                    nome: "Vírus do mosaico do milho",
                    categoria: "virus",
                    probabilidade: 0.86,
                    descricao: "Há faixas, mas faltam sinais de distribuição no talhão.",
                    sintomas: ["clorose"],
                    evidencias_presentes: ["faixas cloróticas"],
                    evidencias_ausentes: ["vetor e padrão em plantas vizinhas"],
                    exige_confirmacao: true,
                }],
                recomendacoes: [],
                perguntas: ["Há plantas vizinhas com o mesmo padrão?"],
                avisos: [],
            });
        return new Response(JSON.stringify({ content: [{ type: "text", text: texto }] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }) as typeof fetch;

    try {
        const resultado = await iaVisualFoliarService.analisar({
            imagem: Buffer.from("imagem"),
            cultura: "milho",
            metricas: {
                largura: 100,
                altura: 100,
                luminosidade: 0.5,
                contraste: 0.5,
                foco_aproximado: 0.8,
                area_foliar_aproximada: 0.8,
                tecido_verde: 0.6,
                tecido_amarelado: 0.35,
                tecido_marrom: 0.03,
                tecido_escuro: 0.02,
            },
            resultadosEspecializados: [especializado],
        });

        assert.equal(corpos.length, 2);
        assert.match(JSON.stringify(corpos[0]), /Não nomeie doenças/);
        assert.match(JSON.stringify(corpos[1]), /leitura_visual_cega/);
        assert.equal(resultado.concordancia, "parcial");
        assert.ok(resultado.confianca <= 0.52);
        assert.deepEqual(resultado.hipoteses[0]?.evidencias_presentes, ["faixas cloróticas"]);
    } finally {
        globalThis.fetch = fetchOriginal;
        if (gatewayOriginal === undefined) delete process.env.AI_GATEWAY_API_KEY;
        else process.env.AI_GATEWAY_API_KEY = gatewayOriginal;
        if (oidcOriginal === undefined) delete process.env.VERCEL_OIDC_TOKEN;
        else process.env.VERCEL_OIDC_TOKEN = oidcOriginal;
        if (groqOriginal === undefined) delete process.env.GROQ_API_KEY;
        else process.env.GROQ_API_KEY = groqOriginal;
    }
});
