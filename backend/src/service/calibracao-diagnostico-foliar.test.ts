import assert from "node:assert/strict";
import test from "node:test";

import {
    calibrarConfiancaDiagnostica,
    culturasCompativeis,
    hipotesesConcordamEspecificamente,
} from "./calibracao-diagnostico-foliar.js";

test("reconhece o mesmo diagnóstico em português e inglês", () => {
    assert.equal(
        hipotesesConcordamEspecificamente(
            { nome: "Vírus do mosaico do milho", categoria: "virus" },
            { nome: "Maize mosaic virus", categoria: "virus" },
        ),
        true,
    );
});

test("não transforma concordância de categoria em concordância específica", () => {
    assert.equal(
        hipotesesConcordamEspecificamente(
            { nome: "Vírus do mosaico do milho", categoria: "virus" },
            { nome: "Maize streak virus", categoria: "virus" },
        ),
        false,
    );

    const resultado = calibrarConfiancaDiagnostica({
        categoria: "virus",
        confiancaIa: 0.86,
        confiancasEspecializadas: [0.82],
        concordanciaCategoria: true,
        concordanciaEspecifica: false,
    });
    assert.equal(resultado.nivel, "parcial");
    assert.ok(resultado.confianca <= 0.52);
});

test("diagnóstico viral não recebe confiança de laudo apenas pela foto", () => {
    const inicial = calibrarConfiancaDiagnostica({
        categoria: "virus",
        confiancaIa: 0.9,
        confiancasEspecializadas: [0.9],
        concordanciaCategoria: true,
        concordanciaEspecifica: true,
    });
    const revisado = calibrarConfiancaDiagnostica({
        categoria: "virus",
        confiancaIa: 0.9,
        confiancasEspecializadas: [0.9],
        concordanciaCategoria: true,
        concordanciaEspecifica: true,
        respostasDecisivas: 3,
    });
    assert.equal(inicial.confianca, 0.6);
    assert.equal(revisado.confianca, 0.7);
});

test("divergência de cultura derruba a confiança", () => {
    assert.equal(culturasCompativeis("milho", "Maize", "Zea mays"), true);
    assert.equal(culturasCompativeis("soja", "Maize", "Zea mays"), false);
    const resultado = calibrarConfiancaDiagnostica({
        categoria: "fungo_ou_oomiceto",
        confiancaIa: 0.8,
        confiancasEspecializadas: [0.8],
        concordanciaCategoria: true,
        concordanciaEspecifica: true,
        culturaDivergente: true,
    });
    assert.ok(resultado.confianca <= 0.3);
});
