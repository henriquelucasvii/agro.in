import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL?.trim()) {
    console.log("DATABASE_URL ausente; migrations ignoradas neste ambiente.");
    process.exit(0);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const resultado = spawnSync(npx, ["prisma", "migrate", "deploy"], {
    env: process.env,
    stdio: "inherit",
});

if (resultado.error) {
    console.error("Não foi possível iniciar as migrations do Prisma.", resultado.error);
    process.exit(1);
}

process.exit(resultado.status ?? 1);
