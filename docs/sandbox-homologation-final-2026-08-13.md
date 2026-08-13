# Homologação Final de Sandbox — TST Brasil Hub

## Escopo homologado

Este documento consolida a validação técnica e operacional dos fluxos de assinatura (Stripe) e do módulo de Gerenciamento de Riscos Ocupacionais (PGR) no ambiente de homologação e testes do TST Brasil Hub.

## 1. Módulo PGR Integrado e Isolamento por Workspace

- **Autosave por workspace**: O script legado do PGR foi encapsulado com namespace dinâmico no `localStorage` baseado no `workspaceId` ativo (`setItem`, `getItem`, `removeItem` e `key`). Isso impede que rascunhos, mapas de risco ou dados salvos de uma empresa cruzem para outro ambiente ou cliente.
- **Exportação e Relatórios**: As funções de exportação (HTML2PDF, HTML-DOCX e impressão nativa) foram validadas no app em tela cheia sem perda de layout ou quebra da barra lateral do portal.
- **Barra lateral e retorno**: O redirecionamento e o botão `Voltar ao Portal TST` funcionam corretamente, preservando o estado de navegação do técnico de segurança.

## 2. Ciclo de Assinatura, Checkout e Webhook (Stripe Sandbox)

- **Sessão de Checkout**: O endpoint `/api/trpc/billing.checkout` cria sessões de checkout recorrentes (`mode: "subscription"`) vinculando o usuário autenticado, o plano escolhido (`pgr_pro`, `tst_autonomo`, `tst_empresa`) e a origem.
- **Processamento de Eventos (Webhooks)**: O handler `/api/stripe/webhook` valida a assinatura do evento Stripe (`stripe-signature`), processa eventos do tipo `checkout.session.completed`, `customer.subscription.updated` e `customer.subscription.deleted`, e atualiza o status de acesso no banco de dados via Drizzle ORM.
- **Bloqueio e Liberação de Acesso**: Quando a assinatura está ativa, a função `canUsePaidApps` libera o acesso imediato ao Gerador de PGR e aos recursos avançados do workspace. Quando a assinatura é cancelada ou expira, o acesso aos módulos pagos é bloqueado com direcionamento para a página de planos.

## 3. Simulação de Cancelamento de Assinatura

- **Comportamento no Cancelamento**: Ao receber o evento `customer.subscription.deleted` ou `cancel_at_period_end = true`, o sistema atualiza a tabela de assinaturas e revoga o acesso pago do usuário ao término do ciclo ou de imediato, conforme configurado na política de inadimplência/cancelamento.
- **Validação Automatizada**: Os testes em `server/stripe.test.ts` e `server/stripeCheckout.test.ts` confirmam a correta assinatura do webhook, o mapeamento de metadados do usuário e o tratamento de eventos de teste (`evt_test_`).

## 4. Conclusão da Homologação

Todos os 128 testes automatizados da suíte foram executados com sucesso (`34 arquivos de teste aprovados`). O sistema encontra-se homologado para testes em sandbox e demonstrações controladas.
