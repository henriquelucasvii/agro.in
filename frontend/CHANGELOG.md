# AGRO.IN - Frontend

## Stack

| Tecnologia | Função |
| ---------- | ------ |
| Ferramenta de Building | Vite |
| Linguagem | TypeScript com React |
| Estilização | Tailwind CSS |

---

## Changelog

### [09/07/2026]

**Commit:** `feat: add dashboard, .env and fix logo.png and notebook.png`

**Autor:** `@henriquelucasvii`

---

## Novidades

Desenvolvimento do Dashboard Inicial

- Foram criadas as páginas de **Dashboard**, seguindo o protótipo definido para o projeto, mantendo a identidade visual do AGRO.IN.

- Meus tokens de I.A acabaram e é necessário adicionar responsividade ao aside, acabei não conseguindo fazer isso nesse commit.

Criado um arquivo .env, no qual o **"VITE_API_UR"** recebe o localhost do backend.

```tsx
src/
├── pages/
│   ├── Login.tsx
│   └── Register.tsx
│   └── Dashboard.tsx
├── assets/
│   ├── logo.png
│   └── notebook.png
```

---

## Próximos Passos

- Integração das telas com a API do backend
- Implementação da autenticação utilizando JWT
- Validação dos formulários
- Estrutura inicial do Dashboard
- Gerenciamento de rotas com React Router