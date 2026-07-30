import type { ReactNode } from "react";

import logo from "../assets/logo.png";
import notebook from "../assets/notebook.png";

interface AuthLayoutProps {
    title: string;
    description?: string;
    children: ReactNode;
}

export default function AuthLayout({ title, description, children }: AuthLayoutProps) {
    return (
        <main className="min-h-screen bg-[#F8F8F8] text-[#111] lg:grid lg:h-screen lg:min-h-[680px] lg:grid-cols-2 lg:overflow-hidden">
            <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8 lg:min-h-0 lg:px-12 lg:py-8">
                <div className="auth-enter w-full max-w-sm">
                    <img src={logo} alt="Agro.in" className="mb-7 h-20 w-20 object-contain lg:mb-8" />
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold tracking-[-0.035em] text-[#111]">{title}</h1>
                        {description && <p className="mt-2 text-sm leading-6 text-[#6B746D]">{description}</p>}
                    </header>
                    {children}
                </div>
            </section>

            <aside className="hidden h-screen min-h-[680px] flex-col overflow-hidden bg-[#0D5006] px-10 pb-5 pt-12 text-white lg:flex xl:px-14 2xl:px-20">
                <div className="w-full max-w-lg self-center">
                    <p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-[#48F36B]">
                        Tudo em um só lugar
                    </p>
                    <h2 className="mb-5 text-4xl font-bold leading-[1.17] tracking-[-0.035em] xl:text-5xl">
                        Conheça o melhor software de gestão de fazendas
                    </h2>
                    <p className="max-w-lg text-sm leading-6 text-white/88 xl:text-base xl:leading-7">
                        O Agro.in é um sistema que ajuda a gerenciar as atividades da fazenda, desde a operação até o controle de máquinas.
                    </p>
                </div>

                <img
                    src={notebook}
                    alt="Notebook exibindo o painel do Agro.in"
                    className="mt-auto max-h-[52vh] w-auto max-w-[94%] self-center object-contain"
                />
            </aside>
        </main>
    );
}
