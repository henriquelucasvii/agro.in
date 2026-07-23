# AGRO.IN - Frontend

## Stack

| Tecnologia | Função |
| ---------- | ------ |
| Ferramenta de Building | Vite |
| Linguagem | TypeScript com React |
| Estilização | Tailwind CSS |

---

## Changelog

### [21/07/2026]

**Commit:** `feat: add SideBar container, Producao and Relatorios pages`
**Autor:** `@ruanmartinsq`

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

### [21/07/2026]

**Commit:** `fix: fix save on producao and way that shows on dashboard`
**Autor:** `@ruanmartinsq`

---

## Novidades

Correções de bugs nas páginas de Produção e Dashboard.

- Corrigido o salvamento de novas produções — o `propriedade_id` agora é buscado automaticamente do banco, resolvendo o erro de foreign key constraint que impedia o cadastro.
- Removido `categoria` e `unidade` do payload enviado ao backend, pois esses campos não existiam no schema do Prisma.
- Adicionada a função `deletar` que havia sido removida acidentalmente durante as atualizações.
- Corrigida a exibição do card de **Produção** no Dashboard — em vez de mostrar "1 ton" (fallback incorreto do `length`), agora exibe a **área total utilizada em hectares**, somando todas as produções cadastradas.
- O gráfico de barras do card agora reflete a `area_utilizada` de cada produção.

---

### [23/07/2026]

**Commit:** `fix: fix relatorio pages`
**Autor:** `@henriquelucasvii`

---

## Novidades

Correções de bugs nas páginas de Relatórios e Dashboard.

- Dados do relatórios agora são armazenados no localStorage
- Adicionado os diretórios de hooks, responsáveis pelo codigo do localStorage e outros

---

## Próximos Passos

- Exibir o Agente de IA no Dashboard
- Implementar proteção de rotas utilizando JWT