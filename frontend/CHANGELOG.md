# AGRO.IN - Frontend

## Stack

| Tecnologia | Função |
| ---------- | ------ |
| Ferramenta de Building | Vite |
| Linguagem | TypeScript com React |
| Estilização | Tailwind CSS |

---

## Changelog

### [17/07/2026]

**Commit:** `feat: add financial and integrate dashboard data`

**Autor:** `@ruanmartinsq`

---

## Novidades

Desenvolvimento das novas telas do sistema e integração inicial com o backend.

- Criadas as páginas de **Financeiro**, **Estoque** e **Propriedades**, permitindo o gerenciamento das informações da fazenda.

- Ajustada a função `carregarDashboard`, que agora realiza requisições para a API e exibe corretamente os dados das propriedades e do estoque no Dashboard.

- Organização das requisições utilizando a instância da API para consumir os endpoints do backend.

```tsx
src/
├── pages/
│   ├── Dashboard.tsx
│   ├── Financeiro.tsx
│   ├── Estoque.tsx
│   └── Propriedades.tsx
```

---

## Próximos Passos

- Exibir dados de Produção, Metas e Relatórios no Dashboard
- Implementar proteção de rotas utilizando JWT
- Melhorar responsividade das páginas