# Operação independente da Manus

Esta branch deixa o TST Brasil Hub preparado para executar no Render usando somente serviços configurados pelo proprietário do projeto.

## Caminho de produção

- Aplicação: Render Web Service.
- Banco: TiDB Cloud ou MySQL compatível sob uma conta controlada pelo proprietário.
- Objetos: Cloudflare R2 ou AWS S3 por meio do SDK S3.
- Sessões: JWT local assinado por `JWT_SECRET`.
- Login: credencial local com hash `scrypt`; OAuth externo fica desativado quando não configurado.
- E-mail: Resend opcional para notificações e recuperação de acesso.
- IA, mapas e transcrição: APIs externas opcionais; não bloqueiam o portal básico.

## Variáveis obrigatórias

```text
NODE_ENV=production
DATABASE_URL=mysql://...
JWT_SECRET=<segredo aleatório longo>
OWNER_OPEN_ID=<identificador estável do proprietário>
MASTER_ADMIN_EMAIL=<e-mail do administrador>
MASTER_ADMIN_PASSWORD_HASH=<hash gerado com pnpm auth:hash>
```

## Storage S3/R2

```text
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<bucket>
S3_ACCESS_KEY_ID=<chave>
S3_SECRET_ACCESS_KEY=<segredo>
S3_PUBLIC_BASE_URL=<domínio público opcional>
S3_FORCE_PATH_STYLE=false
```

Para gerar o hash da senha local sem armazenar a senha no repositório:

```bash
MASTER_ADMIN_PASSWORD='senha forte' pnpm auth:hash
```

Copie somente a saída `salt:hash` para `MASTER_ADMIN_PASSWORD_HASH` no Render. Não faça commit do valor.

## Deploy

O `render.yaml` usa o seguinte fluxo:

```yaml
buildCommand: pnpm install --frozen-lockfile && pnpm build
preDeployCommand: pnpm db:migrate
startCommand: pnpm start
```

A migração roda uma vez no pré-deploy, não durante o build e não a cada reinicialização do processo. O bootstrap e as migrações usam DDL idempotente, mas o primeiro deploy deve ser feito sobre uma cópia ou base validada.

## Dados existentes

Antes de apontar o Render para uma nova base, exporte a base histórica e valide as contagens de `users`, `workspaces`, `companies` e tabelas de negócio. Não use `drizzle-kit push` em uma base de produção sem histórico confiável. Para uma base existente, faça uma baseline controlada; para uma base nova, use `drizzle-kit generate` e `drizzle-kit migrate`.

## Arquivos antigos

Os assets públicos essenciais estão em `client/public/assets`. Uploads de negócio devem ser copiados para o bucket externo preservando suas chaves antes de remover a origem antiga. O proxy `/manus-storage/*` foi mantido apenas como compatibilidade de rota e agora lê do bucket externo; ele não chama nenhum serviço Manus.

## Rollback

Se o deploy independente falhar, faça rollback do serviço Render para o último commit funcional. Não reverta o banco automaticamente. Preserve a base e os logs para investigação; restaure dados somente a partir de uma cópia confirmada.
