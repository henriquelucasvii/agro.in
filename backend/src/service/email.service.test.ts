import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Resend } from "resend";
import { EmailService } from "./email.service.js";

type EmailPayload = Parameters<Resend["emails"]["send"]>[0];

const originalApiKey = process.env.RESEND_API_KEY;

before(() => {
    process.env.RESEND_API_KEY = "re_teste_relatorios";
});

after(() => {
    if (originalApiKey === undefined) {
        delete process.env.RESEND_API_KEY;
        return;
    }

    process.env.RESEND_API_KEY = originalApiKey;
});

test("prepara o e-mail do relatório com PDF e planilha anexados", async () => {
    let payloadEnviado: EmailPayload | undefined;

    const service = new EmailService(() => ({
        emails: {
            async send(payload) {
                payloadEnviado = payload;
                return {
                    data: { id: "email-relatorio-teste" },
                    error: null,
                    headers: null,
                };
            },
        },
    }));

    const id = await service.sendReport(
        "agricultor@example.com",
        "João",
        "Fazenda Boa Esperança",
        Buffer.from("pdf"),
        Buffer.from("xlsx"),
    );

    assert.equal(id, "email-relatorio-teste");
    assert.equal(payloadEnviado?.to, "agricultor@example.com");
    assert.match(String(payloadEnviado?.subject), /Fazenda Boa Esperança/);
    assert.equal(payloadEnviado?.attachments?.length, 2);
    assert.deepEqual(
        payloadEnviado?.attachments?.map((attachment) => attachment.filename),
        ["relatorio-agroin.pdf", "relatorio-agroin.xlsx"],
    );
});
