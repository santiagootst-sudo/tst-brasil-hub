# Relatório Final de Migração - TST Brasil Hub

Este documento resume todas as etapas concluídas na migração do **TST Brasil Hub** do ambiente Manus para o ecossistema de produção externo (GitHub e Render), garantindo estabilidade, manutenibilidade e escalabilidade para o uso com o domínio personalizado `tstbrasilhub.com.br`.

---

## 1. Exportação e Versionamento (GitHub)
- **Repositório Criado:** [santiagootst-sudo/tst-brasil-hub](https://github.com/santiagootst-sudo/tst-brasil-hub) (Privado).
- **Automação de Build:** Adicionado o arquivo `render.yaml` na raiz do projeto para configurar automaticamente os comandos de compilação (`pnpm install --frozen-lockfile; pnpm run build`) e inicialização (`pnpm run start`).

## 2. Hospedagem e Deploy (Render)
- **Web Service:** Configurado no Render (`tst-brasil-hub`).
- **URL de Produção:** `https://tst-brasil-hub.onrender.com`.
- **Status:** Compilação concluída com sucesso (`Build successful 🎉`) e serviço ativo.

## 3. Configurações Essenciais de Produção
Para garantir o pleno funcionamento de todas as ferramentas de SST (EPIs, Biblioteca, PGR, CIPA e Autenticação), as seguintes variáveis devem estar ativas no painel do Render (`Environment`):
- `DATABASE_URL`: String de conexão do banco de dados MySQL/TiDB de produção.
- `JWT_SECRET`: Chave para criptografia de sessões e cookies.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: Credenciais de pagamento dos planos (Mensal, Trimestral e Anual).
- `OAUTH_SERVER_URL` / `VITE_APP_ID`: Configurações de autenticação e redirecionamento.

## 4. Domínio Personalizado (`tstbrasilhub.com.br`)
- Para apontar o domínio comprado no **Registro.br** para o Render, utilize os apontamentos de DNS fornecidos no painel do Render (ou via proxy no Cloudflare).
