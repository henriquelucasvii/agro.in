import { Resend } from "resend";

const escapeHtml = (value: string) =>
    value.replace(
        /[&<>"']/g,
        (character) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
            })[character] as string,
    );

class EmailService {
    private getClient() {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            throw new Error("RESEND_API_KEY não configurada.");
        }

        return new Resend(apiKey);
    }

    async sendPasswordReset(to: string, nome: string, token: string) {
        const frontendUrl = process.env.FRONTEND_URL ?? "https://agro-in.vercel.app";
        const resetUrl = new URL("/redefinir-senha", frontendUrl);
        resetUrl.searchParams.set("token", token);

        const from = process.env.RESEND_FROM_EMAIL ?? "Agro.in <onboarding@resend.dev>";
        const safeName = escapeHtml(nome);
        const safeResetUrl = escapeHtml(resetUrl.toString());

        const { error } = await this.getClient().emails.send({
            from,
            to,
            subject: "Redefinição de senha — Agro.in",
            html: `
                <div style="margin:0;background:#f5f7f4;padding:40px 16px;font-family:Arial,sans-serif;color:#172015">
                    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5eadf">
                        <p style="margin:0 0 12px;color:#0d5006;font-weight:700;font-size:14px;letter-spacing:.08em">AGRO.IN</p>
                        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25">Redefina sua senha</h1>
                        <p style="margin:0 0 16px;line-height:1.6">Olá, ${safeName}.</p>
                        <p style="margin:0 0 24px;line-height:1.6">
                            Recebemos uma solicitação para redefinir a senha da sua conta.
                            O link abaixo é válido por 30 minutos e pode ser usado uma única vez.
                        </p>
                        <a href="${safeResetUrl}" style="display:inline-block;background:#0d5006;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700">
                            Redefinir minha senha
                        </a>
                        <p style="margin:24px 0 8px;font-size:13px;line-height:1.5;color:#647060">
                            Se o botão não funcionar, copie e cole este endereço no navegador:
                        </p>
                        <p style="margin:0;word-break:break-all;font-size:12px;color:#0d5006">${safeResetUrl}</p>
                        <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#647060">
                            Se você não solicitou esta alteração, ignore este e-mail.
                        </p>
                    </div>
                </div>
            `,
            text: `Olá, ${nome}. Redefina sua senha do Agro.in em: ${resetUrl.toString()} O link é válido por 30 minutos.`,
        });

        if (error) {
            throw new Error(`Falha ao enviar e-mail de redefinição: ${error.message}`);
        }
    }
}

export const emailService = new EmailService();
