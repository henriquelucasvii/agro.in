# `Agro.in — Backend`

## Stack

| Tecnologia   | Função                        |
|--------------|-------------------------------|
| Node.js      | Runtime                       |
| TypeScript   | Tipagem estática              |
| Fastify      | Framework HTTP                |
| Prisma ORM   | Abstração do banco de dados   |
| PostgreSQL   | Banco de dados relacional     |
| JWT          | Autenticação                  |

---
## Changelog

### [29/06/2026] 

**Commit:** `feat: add meta.routes and new import for prismaClient`

**Autor:** `@Lucas`

---

## Feature: Nova Forma de Implementar o Prisma

**Problema:** Cada arquivo de rotas instanciava seu próprio `PrismaClient`

```ts
import { PrismaClient } from "@prisma/client";

// Instancia um novo objeto Prisma a cada rota
const prisma = new PrismaClient();    
```

Esse método instancia um novo objeto do Prisma a cada rota, o que pode resultar em um desgaste no banco de dados. Isso gera múltiplas conexões abertas ao banco de dados desnecessariamente.

**Solução:** Criado o arquivo `src/lib/prisma.ts`

```ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()
```

Todas as rotas agora importam essa instância única:

```ts
import { prisma } from "../lib/prisma.js"
```
---

### Arquivos Alterados
 - `src/lib/prisma.ts` — criado
 - `src/routes/` - criação das demais rotas e import do PrismaClient atualizado

---

## Próximos passos sugeridos

- Implementação da `middleware`
- Possível implementação da Arquitetura `MVC`