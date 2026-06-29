import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";

import { authRoutes } from "./routes/auth.routes.js";
import { propriedadesRoutes } from "./routes/propriedades.routes.js";
import { financeiroRoutes } from "./routes/financeiro.routes.js";
// import { producoesRoutes } from "./routes/producoes.routes.js";
// import { estoqueRoutes } from "./routes/estoque.routes.js";
// import { relatoriosRoutes } from "./routes/relatorios.routes.js";

const app = Fastify({
    logger: true,
});

const port = 3333;

app.get("/", async () => {
    return {
        msg: "AGRO.IN API"
    };
});

const start = async () => {
    await app.register(cors);

    // Rotas de autenticação
    await app.register(authRoutes, {
        prefix: "/auth",
    });

    // Rotas de propriedades
    await app.register(propriedadesRoutes, {
        prefix: "/propriedades",
    });

    // Rotas financeiras
    await app.register(financeiroRoutes, {
        prefix: "/financeiro",
    });

    // Rotas de produção
    // await app.register(producoesRoutes, {
    //     prefix: "/producoes",
    // });

    // Rotas de estoque
    // await app.register(estoqueRoutes, {
    //     prefix: "/estoque",
    // });

    // Rotas de relatórios
    // await app.register(relatoriosRoutes, {
    //     prefix: "/relatorios",
    // });

    await app.listen({
        port,
        host: "0.0.0.0",
    });

    console.log(`Servidor rodando em http://localhost:${port}`);
};

start().catch((error) => {
    app.log.error(error);
    process.exit(1);
});