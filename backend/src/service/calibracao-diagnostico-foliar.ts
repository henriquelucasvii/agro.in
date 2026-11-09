import type { HipoteseFoliar } from "../types/analise-foliar.types.js";

const TERMOS_IGNORADOS = new Set([
    "a", "as", "da", "das", "de", "do", "dos", "e", "em", "na", "nas", "no", "nos",
    "and", "of", "the", "in", "possible", "possivel", "provavel", "potential",
    "disease", "doenca", "viral", "virus", "fungal", "fungica", "fungo", "bacterial",
    "bacteriana", "bacteria", "symptom", "sintoma", "associated", "associado",
]);

const SINONIMOS = new Map<string, string>([
    ["milho", "maize"], ["corn", "maize"], ["zea", "maize"], ["mays", "maize"],
    ["mosaico", "mosaic"], ["comum", "common"],
    ["soja", "soybean"], ["soy", "soybean"], ["glycine", "soybean"], ["max", "soybean"],
    ["cafe", "coffee"], ["coffea", "coffee"],
    ["trigo", "wheat"], ["triticum", "wheat"],
    ["arroz", "rice"], ["oryza", "rice"],
    ["feijao", "bean"], ["phaseolus", "bean"],
    ["algodao", "cotton"], ["gossypium", "cotton"],
    ["cana", "sugarcane"], ["saccharum", "sugarcane"],
    ["tomate", "tomato"], ["lycopersicum", "tomato"],
]);

const tokens = (texto: string) => new Set(
    texto
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
        .map((termo) => SINONIMOS.get(termo) ?? termo)
        .filter((termo) => !TERMOS_IGNORADOS.has(termo)),
);

const intersecao = (a: Set<string>, b: Set<string>) =>
    [...a].filter((termo) => b.has(termo)).length;

export const hipotesesConcordamEspecificamente = (
    a: Pick<HipoteseFoliar, "nome" | "nome_cientifico" | "categoria">,
    b: Pick<HipoteseFoliar, "nome" | "nome_cientifico" | "categoria">,
) => {
    if (a.categoria !== b.categoria) return false;

    if (a.nome_cientifico && b.nome_cientifico) {
        const cientificoA = tokens(a.nome_cientifico);
        const cientificoB = tokens(b.nome_cientifico);
        if (cientificoA.size && cientificoB.size && intersecao(cientificoA, cientificoB) >= 1) {
            return true;
        }
    }

    const nomeA = tokens(a.nome);
    const nomeB = tokens(b.nome);
    if (!nomeA.size || !nomeB.size) return false;
    const comuns = intersecao(nomeA, nomeB);
    return comuns >= 2 && comuns / Math.min(nomeA.size, nomeB.size) >= 0.66;
};

export const culturasCompativeis = (
    informada?: string,
    detectada?: string,
    cientifica?: string,
): boolean | undefined => {
    if (!informada || (!detectada && !cientifica)) return undefined;
    const a = tokens(informada);
    const b = tokens(`${detectada ?? ""} ${cientifica ?? ""}`);
    if (!a.size || !b.size) return undefined;
    return intersecao(a, b) > 0;
};

interface EntradaCalibracao {
    categoria: string;
    confiancaIa: number;
    confiancasEspecializadas: number[];
    concordanciaCategoria: boolean;
    concordanciaEspecifica: boolean;
    respostasDecisivas?: number;
    culturaDivergente?: boolean;
}

export interface ResultadoCalibracao {
    confianca: number;
    nivel: "reforcada" | "parcial" | "fraca" | "divergente";
    motivo: string;
}

export const calibrarConfiancaDiagnostica = (
    entrada: EntradaCalibracao,
): ResultadoCalibracao => {
    const confiancaIa = Math.min(0.9, Math.max(0.05, entrada.confiancaIa));
    const melhorEspecializada = entrada.confiancasEspecializadas.length
        ? Math.max(...entrada.confiancasEspecializadas.map((valor) => Math.min(0.95, Math.max(0.05, valor))))
        : undefined;

    if (entrada.culturaDivergente) {
        return {
            confianca: Math.min(0.3, confiancaIa * 0.5),
            nivel: "divergente",
            motivo: "A cultura detectada não coincide com a cultura informada.",
        };
    }

    if (melhorEspecializada === undefined) {
        return {
            confianca: Math.min(0.45, confiancaIa),
            nivel: "fraca",
            motivo: "Há somente uma leitura visual independente.",
        };
    }

    if (!entrada.concordanciaCategoria) {
        return {
            confianca: Math.min(0.38, Math.max(confiancaIa, melhorEspecializada) * 0.55),
            nivel: "divergente",
            motivo: "Os avaliadores apontaram grupos de causas diferentes.",
        };
    }

    if (!entrada.concordanciaEspecifica) {
        return {
            confianca: Math.min(0.52, melhorEspecializada * 0.5 + confiancaIa * 0.35),
            nivel: "parcial",
            motivo: "Os avaliadores concordaram no grupo da causa, mas não no diagnóstico específico.",
        };
    }

    const categoriaExigeLaboratorio = new Set(["virus", "bacteria"]).has(entrada.categoria);
    const respostasDecisivas = Math.max(0, entrada.respostasDecisivas ?? 0);
    const tetoBase = categoriaExigeLaboratorio ? 0.6 : 0.68;
    const tetoComCampo = categoriaExigeLaboratorio ? 0.7 : 0.76;
    const teto = respostasDecisivas >= 2 ? tetoComCampo : tetoBase;
    const calculada = melhorEspecializada * 0.55 + confiancaIa * 0.45;

    return {
        confianca: Math.min(teto, calculada),
        nivel: "reforcada",
        motivo: respostasDecisivas >= 2
            ? "A hipótese específica convergiu e foi revisada com observações de campo."
            : "A hipótese específica convergiu, mas ainda depende de confirmação de campo ou laboratório.",
    };
};
