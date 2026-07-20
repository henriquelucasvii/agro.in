# AGRO.IN - Frontend

## Stack

| Tecnologia | Função |
| ---------- | ------ |
| Ferramenta de Building | Vite |
| Linguagem | TypeScript com React |
| Estilização | Tailwind CSS |

---

## Changelog

### [20/07/2026]

**Commit:** `feat: add SideBar container, Producao and Relatorios pages`

**Autor:** `@henriquelucasvii`

---

## Novidades

Desenvolvimento das novas telas do sistema e integração inicial com o backend.

- Criadas as páginas de **Produção**, **Relatórios** e um componente próprio para o aside - o **Sidebar.tsx**, permitindo o gerenciamento das informações da fazenda.
- Organização das requisições utilizando a instância da API para consumir os endpoints do backend.
- Implementado a responsividade ao Sidebar para telas menores.

```tsx
src/
├── pages/
│   ├── Dashboard.tsx
│   ├── Financeiro.tsx
│   ├── Estoque.tsx
│   ├── Metas.tsx
│   ├── Producao.tsx
│   ├── Relatorios.tsx
│   └── Propriedades.tsx
```

---

## Próximos Passos

- Exibir dados de Perfil e o Agente de IA no Dashboard
- Implementar proteção de rotas utilizando JWT