import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import logo from "../assets/logo.png";
import notebook from "../assets/notebook.png";
import { api } from "../lib/api.ts";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setErro("");
        setMensagem("");

        if (!email.trim()) {
            setErro("Informe seu e-mail.");
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post("/auth/esqueci-senha", {
                email: email.trim(),
            });
            setMensagem(data.message);
        } catch (error: unknown) {
            const apiError = isAxiosError<{ error?: string }>(error)
                ? error.response?.data?.error
                : undefined;
            setErro(apiError ?? "Não foi possível solicitar a redefinição.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row">
            <div className="flex-1 bg-[#F8F8F8] flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <img src={logo} alt="Agro.in" className="w-20 mb-8" />

                    <h1 className="text-3xl font-bold text-[#111] mb-2">Redefinir senha</h1>
                    <p className="text-sm text-gray-500 mb-8">
                        Digite o e-mail da sua conta para receber um link seguro.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <label className="block text-[#0D5006] text-base mb-1" htmlFor="email">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full h-12 rounded-md bg-[#E4E4E4] px-4 outline-none text-sm focus:ring-2 focus:ring-[#0D5006]/30"
                            placeholder="Insira seu e-mail"
                            autoComplete="email"
                        />

                        {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}
                        {mensagem && (
                            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm leading-relaxed text-green-800">
                                {mensagem}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-8 w-full h-12 rounded-xl bg-[#0D5006] text-white text-base font-semibold hover:brightness-110 transition disabled:opacity-60"
                        >
                            {loading ? "Enviando..." : "Enviar link"}
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="mt-5 inline-flex min-h-11 w-full items-center justify-center text-center text-sm font-semibold text-[#0D5006] hover:underline"
                    >
                        Voltar para o login
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[#0D5006] flex flex-col justify-between px-8 py-12 overflow-hidden">
                <div className="max-w-md self-center-safe">
                    <p className="text-[#48F36B] font-bold uppercase text-sm tracking-widest mb-4">
                        ACESSO SEGURO
                    </p>
                    <h2 className="text-white font-bold text-3xl lg:text-4xl xl:text-5xl leading-tight mb-6">
                        Retome o controle da sua fazenda
                    </h2>
                    <p className="text-white text-sm lg:text-base leading-relaxed opacity-90">
                        Enviaremos um link de uso único para proteger sua conta e seus dados.
                    </p>
                </div>
                <img src={notebook} alt="Sistema Agro.in" className="w-full max-w-lg mt-8 self-center" />
            </div>
        </div>
    );
}
