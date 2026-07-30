import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import AuthLayout from "../components/AuthLayout";
import { api } from "../lib/api.ts";

export default function Register() {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (event: FormEvent) => {
        event.preventDefault();
        setErro("");

        if (!nome || !email || !senha) {
            setErro("Preencha todos os campos.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/register", { nome, email, senha });
            navigate("/login");
        } catch (error: unknown) {
            const apiError = isAxiosError<{ error?: string }>(error)
                ? error.response?.data?.error
                : undefined;
            setErro(apiError ?? "Erro ao registrar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Comece agora!"
        >
            <form onSubmit={handleRegister} className="space-y-5">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#0D5006]" htmlFor="nome">
                        Nome
                    </label>
                    <input
                        id="nome"
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="h-12 w-full rounded-md border border-transparent bg-[#E4E4E4] px-4 text-sm outline-none transition placeholder:text-[#89918A] focus:border-[#4D8758] focus:bg-white focus:ring-3 focus:ring-[#4D8758]/10"
                        placeholder="Insira seu nome"
                        autoComplete="name"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#0D5006]" htmlFor="email">
                        E-mail
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 w-full rounded-md border border-transparent bg-[#E4E4E4] px-4 text-sm outline-none transition placeholder:text-[#89918A] focus:border-[#4D8758] focus:bg-white focus:ring-3 focus:ring-[#4D8758]/10"
                        placeholder="Insira seu e-mail"
                        autoComplete="email"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#0D5006]" htmlFor="senha">
                        Senha
                    </label>
                    <input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="h-12 w-full rounded-md border border-transparent bg-[#E4E4E4] px-4 text-sm outline-none transition placeholder:text-[#89918A] focus:border-[#4D8758] focus:bg-white focus:ring-3 focus:ring-[#4D8758]/10"
                        placeholder="Insira sua senha"
                        autoComplete="new-password"
                    />
                </div>

                {erro && (
                    <p className="rounded-md border border-[#E8B9AB] bg-[#FFF1EC] px-3 py-2.5 text-xs text-[#9B442C]" role="alert">
                        {erro}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center rounded-md bg-[#0D5006] text-sm font-bold text-white transition hover:bg-[#0A4205] focus:outline-none focus:ring-3 focus:ring-[#48F36B]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Registrando..." : "Registrar"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#454B46]">
                Já possui uma conta?{" "}
                <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="inline-flex min-h-11 items-center font-semibold text-[#0D5006] hover:underline"
                >
                    Entre
                </button>
            </p>
        </AuthLayout>
    );
}
