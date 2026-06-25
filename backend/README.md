# Agro.in | Backend

## Tecnologias
    - Node.Js
    - TypeScript
    - Fastify
    - Prisma ORM
    - PostgreSQL
    - JWT

## ALTERAÇÕES - 25/06/2026 | Commit: "fix: repair prisma client error"

### Rotas de autenticação

- Adicionado o tipo FastifyInstance em auth.routes.ts para melhorar a tipagem e integração das rotas com o Fastify.
- Implementadas as rotas de cadastro e login de usuários.
- Integração com JWT para autenticação.
- Integração com Bcrypt para criptografia de senhas.

### Prisma

- Realizado downgrade do Prisma 7 para o Prisma 6.19.3.
- Ajustada a configuração do Prisma Client.
- Corrigidos problemas de inicialização do servidor relacionados ao Prisma Client.
- Regenerado o Prisma Client utilizando:
npx prisma generate

## Atenção ao Prisma e Detalhes Adicionais

Durante o desenvolvimento houve problemas relacionados às versões do Prisma. Atualmente o projeto está utilizando:

- prisma: 6.19.3
- @prisma/client: 6.19.3

Anteriormente, o prisma estava configurado na versão 7, porém estava acontecendo erros de desenvolvimento relacionados ao .env e a autenticação das rotas. Acontecimento de bugs ao rodar o servidor 

Pesquisei e vi que o Prisma 7 é novo e não há praticamente nenhum suporte sobre os bugs dessa versão. Por isso, optei pelo Prisma 6, que além de ser mais estável, é mais seguro e menos complicado de mexer, além de que essa versão possui mais tutoriais e exemplos já consolidados

---

Tentei cadastrar um novo usuário na rota auth/register. Deu erro 500. Não entendi o porquê. Talvez você saiba resolver.

## Próximos passos sugeridos

- Middleware de autenticação JWT.
- Controle de permissões.
- CRUD de propriedades rurais.
- CRUD de produtores.
- CRUD de culturas/plantios.