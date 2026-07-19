# AGRO.IN - Frontend

## Stack

| Tecnologia | Função |
| ---------- | ------ |
| Ferramenta de Building | Vite |
| Linguagem | TypeScript com React |
| Estilização | Tailwind CSS |

---

## Changelog

### [19/07/2026]

**Commit:** `feat: add metas pages`

**Autor:** `@henriquelucasvii`

---

## Novidades

Desenvolvimento das novas telas do sistema e integração inicial com o backend.

- Criadas as páginas de **Metas**, permitindo o gerenciamento das informações da fazenda.

- Ajustada a função `carregarDashboard`, que agora realiza requisições para a API e exibe corretamente os dados das propriedades e do estoque no Dashboard.

- Organização das requisições utilizando a instância da API para consumir os endpoints do backend.

```tsx
src/
├── pages/
│   ├── Dashboard.tsx
│   ├── Financeiro.tsx
│   ├── Estoque.tsx
│   ├── Metas.ts
│   └── Propriedades.tsx
```

---

## Próximos Passos

- Exibir dados de Produção e Relatórios no Dashboard
- Implementar proteção de rotas utilizando JWT
- Melhorar responsividade das páginas