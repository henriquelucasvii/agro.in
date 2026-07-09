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

**Commit:** `feat: add login and register pages`

**Autor:** `@ruanmartinsq`

---

## Novidades

Desenvolvimento das telas iniciais de autenticação do sistema utilizando React, TypeScript e Tailwind CSS.

Foram criadas as páginas de **Login** e **Registro**, seguindo o protótipo definido para o projeto, mantendo a identidade visual do AGRO.IN.

As telas possuem estrutura responsiva, separação entre área de autenticação e apresentação do sistema, além da organização dos componentes para facilitar a futura integração com o backend.

```tsx
src/
├── pages/
│   ├── Login.tsx
│   └── Register.tsx
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