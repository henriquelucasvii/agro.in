# AGRO.IN - Frontend

## Stack

| Tecnologia | Função |
| ---------- | ------ |
| Ferramenta de Building | Vite |
| Linguagem | TypeScript com React |
| Estilização | Tailwind CSS |

## Changelog

### [07/07/2026]

**Commit:** `feat: add tailwindcss @tailwindcss/vite`

**Autor:** `@henriquelucasvii`

---

## Novidades

Implementação do Tailwind CSS no projeto principal pelo npm


```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()],
})

```

## Próximos Passos

- Estrutura Inicial do Dashboard
- Página de Login e Registro
- Integração com o Backend