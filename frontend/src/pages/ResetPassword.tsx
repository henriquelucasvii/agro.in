import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import logo from "../assets/logo.png";
import notebook from "../assets/notebook.png";
import { api } from "../lib/api.ts";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setErro("");

        if (!token) {
            setErro("Este link de redefinição é inválido.");
            return;
        }

        if (novaSenha.length < 8) {
            setErro("A nova senha deve ter pelo menos 8 caracteres.");
            return;
        }

        if (novaSenha !== confirmacao) {
            setErro("As senhas não coincidem.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/redefinir-senha", { token, novaSenha });
            setSucesso(true);
            setNovaSenha("");
            setConfirmacao("");
        } catch (error: unknown) {
            const apiError = isAxiosError<{ error?: string }>(error)
                ? error.response?.data?.error
                : undefined;
            setErro(apiError ?? "Não foi possível redefinir a senha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row">
            <div className="flex-1 bg-[#F8F8F8] flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <img src={logo} alt="Agro.in" className="w-20 mb-8" />

                    <h1 className="text-3xl font-bold text-[#111] mb-2">Crie uma nova senha</h1>
                    <p className="text-sm text-gray-500 mb-8">
                        Use pelo menos 8 caracteres e não reutilize uma senha antiga.
                    </p>

                    {sucesso ? (
                        <div>
                            <p className="rounded-lg bg-green-50 p-4 text-sm leading-relaxed text-green-800">
                                Sua senha foi redefinida com sucesso. Você já pode entrar na sua conta.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="mt-6 w-full h-12 rounded-xl bg-[#0D5006] text-white text-base font-semibold hover:brightness-110 transition"
                            >
                                Ir para o login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[#0D5006] text-base mb-1" htmlFor="nova-senha">
                                    Nova senha
                                </label>
                                <input
                                    id="nova-senha"
                                    type="password"
                                    value={novaSenha}
                                    onChange={(event) => setNovaSenha(event.target.value)}
                                    className="w-full h-12 rounded-md bg-[#E4E4E4] px-4 outline-none text-sm focus:ring-2 focus:ring-[#0D5006]/30"
                                    placeholder="Mínimo de 8 caracteres"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div>
                                <label className="block text-[#0D5006] text-base mb-1" htmlFor="confirmar-senha">
                                    Confirmar senha
                                </label>
                                <input
                                    id="confirmar-senha"
                                    type="password"
                                    value={confirmacao}
                                    onChange={(event) => setConfirmacao(event.target.value)}
                                    className="w-full h-12 rounded-md bg-[#E4E4E4] px-4 outline-none text-sm focus:ring-2 focus:ring-[#0D5006]/30"
                                    placeholder="Digite a senha novamente"
                                    autoComplete="new-password"
                                />
                            </div>

                            {erro && <p className="text-sm text-red-600">{erro}</p>}

                            <button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full h-12 rounded-xl bg-[#0D5006] text-white text-base font-semibold hover:brightness-110 transition disabled:opacity-60"
                            >
                                {loading ? "Salvando..." : "Salvar nova senha"}
                            </button>
                        </form>
                    )}

                    {!sucesso && (
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="mt-5 w-full text-center text-sm text-[#0D5006] font-semibold hover:underline"
                        >
                            Voltar para o login
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-[#0D5006] flex flex-col justify-between px-8 py-12 overflow-hidden">
                <div className="max-w-md self-center-safe">
                    <p className="text-[#48F36B] font-bold uppercase text-sm tracking-widest mb-4">
                        CONTA PROTEGIDA
                    </p>
                    <h2 className="text-white font-bold text-3xl lg:text-4xl xl:text-5xl leading-tight mb-6">
                        Segurança para os dados da sua propriedade
                    </h2>
                    <p className="text-white text-sm lg:text-base leading-relaxed opacity-90">
                        O link expira automaticamente e deixa de funcionar após a alteração.
                    </p>
                </div>
                <img src={notebook} alt="Sistema Agro.in" className="w-full max-w-lg mt-8 self-center" />
            </div>
        </div>
    );
}
