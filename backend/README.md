# AGRO.IN — Backend

## Stack

| Tecnologia | Função |
|------------|--------|
| Node.js | Runtime |
| TypeScript | Tipagem estática |
| Fastify | Framework HTTP |
| Prisma ORM | ORM para comunicação com o banco |
| PostgreSQL | Banco de dados relacional |
| JWT | Autenticação e autorização |
| bcrypt | Criptografia de senhas |
| dotenv | Gerenciamento de variáveis de ambiente |

---

## Changelog

### [01/07/2026]

**Commit:** `feat: implement authentication middleware and complete backend routes`

**Autor:** `@Ruan`

---

## Novidades

### Autenticação

Foi implementado o sistema completo de autenticação utilizando JWT.

Funcionalidades:

- Cadastro de usuários
- Login
- Criptografia de senhas com bcrypt
- Geração de Token JWT
- Expiração configurável através do arquivo `.env`

Exemplo:

```env
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=1d
```

---

### Middleware de Autenticação

Foi criada uma middleware responsável por proteger as rotas da aplicação.

Responsabilidades:

- Verificar se existe um token no cabeçalho da requisição.
- Validar o JWT.
- Bloquear acessos não autorizados.
- Disponibilizar os dados do usuário autenticado durante a requisição.

---

### Organização do Prisma

Foi criada uma instância única do PrismaClient.

```ts
import { prisma } from "../lib/prisma.js"
```

Essa abordagem evita múltiplas conexões desnecessárias com o banco de dados.

---

### Rotas Implementadas

- Auth
    - Cadastro
    - Login

- Propriedades
    - Criar
    - Listar
    - Buscar por ID
    - Atualizar
    - Excluir

- Financeiro
    - CRUD completo

- Produções
    - CRUD completo

- Estoque
    - CRUD completo

- Relatórios
    - Endpoints para geração de informações do sistema

---

## Estrutura do Projeto

```text
src/
│
├── routes/
│   ├── auth.routes.ts
│   ├── propriedades.routes.ts
│   ├── financeiro.routes.ts
│   ├── producoes.routes.ts
│   ├── estoque.routes.ts
│   └── relatorios.routes.ts
│
├── middlewares/
│   └── auth.middleware.ts
│
├── lib/
│   └── prisma.ts
│
├── @types/
│   └── fastify.d.ts
│
├── server.ts
└── .env
```

---

## Próximos passos

- Testes da API (Postman)
- Documentação dos endpoints
- Integração com o Front-end
- Deploy da aplicação