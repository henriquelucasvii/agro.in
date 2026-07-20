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

### [17/07/2026]

**Commit:** `feat(MVC): implements MVC architecture at propriedades api`

**Autor:** `@henriquelucasvii`

---

## Novidades

### Organização de Pasta e Arquivos

- Criação do diretório **service** para a implementação das regras de negócios das api, com a nomenclatura padrão de `rota.service.ts`
- Adoção de Classes e Objetos para o desenvolvimento

```ts
import { prisma } from "../lib/prisma.js"
import { ApiProducaoBody, ApiProducaoBody } from "../types/producao.types.js"

class apiService {
    
    async create() { 
        // ... 
    }

    // ...
}

// Exportação da classe já instanciada
export const apiService = new ApiService()
```

- Criação de `api.controller.ts` no diretório controllers, responsável pelas requisições HTTP

```ts
import { apiService } from "../service/api.service.js"

class ApiController {
    /// ...
}

export const apiController = new ApiController()
```

- Criação do diretório `types` para a reutilização de interfaces para as requisiçoes

```ts
export interface CreateApiBody {
    // ...
}
```
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
    - CRUD completo + MVC

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
│   ├── meta.routes.ts
│   └── relatorios.routes.ts
│
├── controllers/
│   ├── propriedades.controller.ts
│   ├── financeiro.controller.ts
│   ├── producoes.controller.ts
│   ├── estoque.controller.ts
│   ├── meta.controller.ts
│   └── relatorios.controller.ts
│
├── service/
│   ├── propriedades.service.ts
│   ├── financeiro.service.ts
│   ├── producoes.service.ts
│   ├── estoque.service.ts
│   ├── meta.service.ts
│   └── relatorios.service.ts
│
├── types/
│   └── api.types.ts
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

- Implementação de todas as rotas para a MVC
- Testes da API (Postman)
- Documentação dos endpoints
- Integração com o Front-end
- Deploy da aplicação