import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import AuthLayout from "../components/AuthLayout";
import { api } from "../lib/api.ts";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (event: FormEvent) => {
        event.preventDefault();
        setErro("");

        if (!email || !senha) {
            setErro("Preencha todos os campos.");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/auth/login", { email, senha });
            localStorage.setItem("token", data.token);
            navigate("/dashboard");
        } catch (error: unknown) {
            const apiError = isAxiosError<{ error?: string }>(error)
                ? error.response?.data?.error
                : undefined;
            setErro(apiError ?? "Erro ao fazer login.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Bem-Vindo de Volta!"
            description="Entre com suas credenciais para acessar sua conta"
        >
            <form onSubmit={handleLogin} className="space-y-5">
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
                        autoComplete="current-password"
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
                    {loading ? "Entrando..." : "Login"}
                </button>
            </form>

            <button
                type="button"
                onClick={() => navigate("/esqueci-senha")}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-center text-sm font-semibold text-[#0D5006] hover:underline"
            >
                Esqueceu sua senha?
            </button>

            <p className="mt-4 text-center text-sm text-[#454B46]">
                Não possui uma conta?{" "}
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="inline-flex min-h-11 items-center font-semibold text-[#0D5006] hover:underline"
                >
                    Registre-se
                </button>
            </p>
        </AuthLayout>
    );
}
