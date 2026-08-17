# Instruções de Migração para o Render e Registro.br

O código-fonte do **TST Brasil Hub** foi exportado com sucesso para o seu GitHub privado:
👉 **Repositório:** `https://github.com/santiagootst-sudo/tst-brasil-hub`

Um arquivo de configuração (`render.yaml`) já foi adicionado ao repositório para automatizar a detecção de build e start no Render.

---

## Passo 1: Configuração do Serviço no Render

1. Acesse o [Dashboard do Render](https://dashboard.render.com).
2. Como o repositório já está conectado ao seu GitHub, selecione **New** > **Web Service** e escolha o repositório `tst-brasil-hub`.
3. Preencha ou confirme os campos do serviço:
   - **Name:** `tst-brasil-hub`
   - **Environment:** `Node`
   - **Region:** Escolha a mais próxima (ex: `Oregon` ou `Frankfurt`)
   - **Branch:** `main`
   - **Build Command:** `pnpm install --frozen-lockfile && pnpm build`
   - **Start Command:** `pnpm start`
   - **Plan:** Free (ou Individual pago, caso queira evitar o modo de suspensão por inatividade).

---

## Passo 2: Variáveis de Ambiente (Environment Variables)

Na seção **Environment Variables** do Render, insira as chaves necessárias para a aplicação rodar em produção:

| Chave | Descrição / Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | String de conexão do seu banco MySQL/TiDB (ex: TiDB Cloud ou PlanetScale) |
| `JWT_SECRET` | Chave secreta de sessão (ex: `AcHgrYS4WLsm8GWryzeFRp`) |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe (modo teste ou live) |
| `STRIPE_WEBHOOK_SECRET` | Chave do webhook do Stripe |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Chave publicável do Stripe |
| `BUILT_IN_FORGE_API_KEY` | Chave de integração de serviços |
| `BUILT_IN_FORGE_API_URL` | `https://forge.manus.ai` |

---

## Passo 3: Vinculação do Domínio `.com.br` (Registro.br)

Assim que o deploy inicial for concluído com sucesso e o Render gerar uma URL temporária (ex: `tst-brasil-hub.onrender.com`):

1. No painel do Render, abra o seu serviço `tst-brasil-hub`.
2. Vá em **Settings** > **Custom Domains** e clique em **Add Custom Domain**.
3. Digite `tstbrasilhub.com.br` e clique em Save. O Render fornecerá os registros DNS (geralmente um registro `A` apontando para o IP do Render e um `TXT` de validação).
4. Acesse o painel do [Registro.br](https://registro.br/), abra o domínio `tstbrasilhub.com.br` e vá em **Configurar Zona DNS**.
5. Cadastre os registros indicados pelo Render.
6. Aguarde a propagação do DNS. O Render emitirá e renovará o certificado SSL (HTTPS) automaticamente para o seu domínio.

---
Autor: **Manus AI**
