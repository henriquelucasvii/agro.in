import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import logo from "../assets/logo.png";
import notebook from "../assets/notebook.png";
import { api } from "../lib/api.ts";

export default function Register() {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
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
        <div className="min-h-screen w-full flex flex-col lg:flex-row">

            <div className="flex-1 bg-[#F8F8F8] flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">

                    <img src={logo} alt="Logo" className="w-20 mb-8" />

                    <h1 className="text-3xl font-bold text-[#111] mb-8">Comece agora!</h1>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-[#1F5B3A] text-base mb-1">Nome</label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full h-12 rounded-md bg-[#EFF2EE] px-4 outline-none text-sm"
                                placeholder="Insira seu nome"
                            />
                        </div>
                        <div>
                            <label className="block text-[#1F5B3A] text-base mb-1">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 rounded-md bg-[#EFF2EE] px-4 outline-none text-sm"
                                placeholder="Insira seu e-mail"
                            />
                        </div>
                        <div>
                            <label className="block text-[#1F5B3A] text-base mb-1">Senha</label>
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full h-12 rounded-md bg-[#EFF2EE] px-4 outline-none text-sm"
                                placeholder="Insira sua senha"
                            />
                        </div>
                    </div>

                    {erro && (
                        <p className="mt-4 text-sm text-red-500">{erro}</p>
                    )}

                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="mt-8 w-full h-12 rounded-md bg-[#1F5B3A] text-white text-base font-semibold hover:brightness-110 transition disabled:opacity-60"
                    >
                        {loading ? "Registrando..." : "Registrar"}
                    </button>

                    <p className="text-center mt-6 text-sm">
                        Já possui uma conta?{" "}
                        <button type="button" onClick={() => navigate("/login")} className="inline-flex min-h-11 items-center font-semibold text-[#1F5B3A]">
                            Entre
                        </button>
                    </p>

                </div>
            </div>

            <div className="flex-1 bg-[#1F5B3A] flex flex-col px-8 py-12 overflow-hidden">
                <div className="flex-1 flex flex-col justify-center max-w-md self-center-safe">
                    <p className="text-[#A9E7AF] font-bold uppercase text-sm tracking-widest mb-4">TUDO EM UM SÓ LUGAR</p>
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
