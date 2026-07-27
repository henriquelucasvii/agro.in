import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import notebook from "../assets/notebook.png";
import { api } from "../lib/api.ts";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
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
        } catch (error: any) {
            setErro(error.response?.data?.error ?? "Erro ao fazer login.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row">

            <div className="flex-1 bg-[#F8F8F8] flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">

                    <img src={logo} alt="Logo" className="w-20 mb-8" />

                    <h1 className="text-3xl font-bold text-[#111] mb-1">Bem-Vindo de Volta!</h1>
                    <p className="text-sm text-gray-500 mb-8">Entre com suas credenciais para acessar sua conta</p>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-[#0D5006] text-base mb-1">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 rounded-md bg-[#E4E4E4] px-4 outline-none text-sm"
                                placeholder="Insira seu e-mail"
                            />
                        </div>
                        <div>
                            <label className="block text-[#0D5006] text-base mb-1">Senha</label>
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full h-12 rounded-md bg-[#E4E4E4] px-4 outline-none text-sm"
                                placeholder="Insira sua senha"
                            />
                        </div>
                    </div>

                    {erro && (
                        <p className="mt-4 text-sm text-red-500">{erro}</p>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="mt-8 w-full h-12 rounded-xl bg-[#0D5006] text-white text-base font-semibold hover:brightness-110 transition disabled:opacity-60"
                    >
                        {loading ? "Entrando..." : "Login"}
                    </button>

                    <p className="text-center mt-6 text-sm">
                        Não possui uma conta?{" "}
                        <span onClick={() => navigate("/")} className="text-[#0D5006] font-semibold cursor-pointer">
                            Registre-se
                        </span>
                    </p>

                </div>
            </div>

            <div className="flex-1 bg-[#0D5006] flex flex-col justify-between px-8 py-12 overflow-hidden">
                <div className="max-w-md self-center-safe">
                    <p className="text-[#48F36B] font-bold uppercase text-sm tracking-widest mb-4">TUDO EM UM SÓ LUGAR</p>
                    <h2 className="text-white font-bold text-3xl lg:text-4xl xl:text-5xl leading-tight mb-6">
                        Conheça o melhor software de gestão de fazendas
                    </h2>
                    <p className="text-white text-sm lg:text-base leading-relaxed opacity-90">
                        O Agro.in é um sistema que ajuda a gerenciar as atividades da fazenda, desde a operação até o controle de máquinas.
                    </p>
                </div>
                <img src={notebook} alt="Notebook" className="w-full max-w-lg mt-8 self-center" />
            </div>

        </div>
    );
}