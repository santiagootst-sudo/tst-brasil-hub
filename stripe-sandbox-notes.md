# Stripe Sandbox — notas de configuração

Fonte oficial consultada: https://dashboard.stripe.com/acct_1U5R52LGo8ce8nDz/test/apikeys
Catálogo consultado: https://dashboard.stripe.com/acct_1U5R52LGo8ce8nDz/test/products?active=true

A conta aberta é um ambiente Sandbox/Test, sem impacto em cobranças reais. O catálogo começou vazio e já recebeu três produtos recorrentes:

| Plano | Valor | Intervalo |
|---|---:|---|
| Plano Mensal TST Brasil Hub | R$ 99,90 | mensal |
| Plano Trimestral TST Brasil Hub | R$ 269,70 | a cada 3 meses |
| Plano Anual TST Brasil Hub | R$ 898,80 | anual |

A aplicação resolve os preços por `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_QUARTERLY` e `STRIPE_PRICE_ANNUAL` quando disponíveis; caso contrário, procura preços ativos pelos lookup keys padrão definidos em `server/products.ts`.

A chave de teste foi localizada na área Developers > API keys, mas seu valor não deve ser registrado neste arquivo, no GitHub, no chat ou em relatórios. Ainda falta configurar as variáveis privadas no Render e confirmar/configurar os lookup keys ou IDs dos preços, o cupom mensal de lançamento e o webhook de teste.

Última URL de produto consultada: https://dashboard.stripe.com/acct_1U5R52LGo8ce8nDz/test/products/prod_V5cODNGT0D5YXg


A área de Webhooks do Stripe Sandbox foi aberta em `https://dashboard.stripe.com/acct_1U5R52LGo8ce8nDz/test/webhooks`. O ambiente oferece o botão **Add destination** para criar um endpoint; ainda não há endpoint configurado para o portal.


Na criação do webhook, o evento `checkout.session.completed` foi selecionado. A categoria Customer foi aberta para selecionar eventos de assinatura e cliente; ainda não foi finalizada nem criada a destination.


Eventos atualmente selecionados para a destination de teste: `checkout.session.completed`, `customer.subscription.created` e `customer.subscription.deleted`. O fluxo está na etapa Select events; ainda falta escolher o tipo de destino e informar a URL.


A destination foi preenchida no Stripe Sandbox com o nome `TST Brasil Hub - Render Test`, URL `https://tstbrasilhub.com.br/api/stripe/webhook` e descrição de homologação. Ela escutará três eventos: checkout concluído, assinatura criada e assinatura cancelada. Ainda aguarda o clique de criação.


A destination de teste foi criada com sucesso: ID `we_1U5REiLGo8ce8nDz4UtF7H33`, status Active, endpoint `https://tstbrasilhub.com.br/api/stripe/webhook`, escutando os três eventos definidos. O signing secret foi revelado somente para transferência segura ao Render; seu valor não foi e não será salvo em arquivo, GitHub ou relatório.


O signing secret foi copiado pelo botão oficial do Stripe sem ser exibido em arquivo. O painel do Render foi aberto em `/web/srv-da1fsiu7bikc7392aup0/env`, mas a página ainda permanece em `Loading...`; aguardamos a interface de variáveis carregar.


No Render, o formulário de variável está aberto com a chave `STRIPE_WEBHOOK_SECRET`. O signing secret permanece somente na área de transferência do navegador; não foi impresso em arquivo ou mensagem.


O campo `STRIPE_WEBHOOK_SECRET` do Render foi preenchido com o signing secret da destination criada. A variável ainda aguarda o salvamento junto com a `STRIPE_SECRET_KEY`; o valor sensível não será persistido neste arquivo.


A tentativa de abrir a página de API keys do Stripe Sandbox resultou em `about:blank`/página sem elementos no navegador. Nenhuma chave foi copiada ou exposta; a configuração do Render permanece pendente de `STRIPE_SECRET_KEY`.


A página de API keys do Stripe continua carregando como tela vazia mesmo após reabrir a rota `/test/apikeys`; nenhuma chave de API foi copiada. A destination do webhook permanece criada e o signing secret já foi preenchido no formulário do Render, ainda sem salvar/redeploy.


Após criar o webhook, a área de API keys, a rota alternativa de settings e a página de produtos passaram a carregar como tela branca no navegador, embora a sessão do Stripe permaneça autenticada. O catálogo e o webhook já foram confirmados anteriormente; a `STRIPE_SECRET_KEY` ainda não foi copiada.


O Environment do Render carregou novamente, mas a lista de variáveis está vazia e o formulário anterior não foi preservado após a navegação. O `STRIPE_WEBHOOK_SECRET` será cadastrado novamente; a chave `STRIPE_SECRET_KEY` ainda depende do painel Stripe API keys, que permanece sem renderização.


Após acionar o salvamento do Environment, o botão ficou desabilitado, mas a confirmação visual não apareceu. Ao recarregar a página, o painel do Render voltou a carregar em branco no navegador; não é possível confirmar ainda se `STRIPE_WEBHOOK_SECRET` foi persistido ou se o redeploy começou.


O dashboard do Render voltou a apresentar carregamento em branco ao abrir Environment e Events. O salvamento do signing secret foi disparado pelo DOM, mas ainda não há confirmação visual do redeploy. A chave Stripe de API também continua pendente porque as telas do Stripe API keys/catalog estão brancas.
