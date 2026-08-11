# Portal TST Brasil — Roteiro de homologação Stripe

## Objetivo

Homologar o ciclo completo de assinatura sem alterar dados de produção: seleção de plano, checkout recorrente, retorno à aplicação, evento assinado, atualização da assinatura e bloqueio/liberação do PGR.

## Pré-requisitos

| Item | Verificação |
|---|---|
| Credencial de teste | `STRIPE_SECRET_KEY` aponta para ambiente de testes. |
| Assinatura de webhook | `STRIPE_WEBHOOK_SECRET` corresponde ao endpoint configurado. |
| Preços | Lookup keys dos três planos retornam preços mensais ativos em BRL. |
| URL pública | O endpoint `/api/stripe/webhook` é alcançável pelo provedor. |
| Conta autenticada | Há um usuário de teste com pelo menos um ambiente Autônomo e um CLT. |

## Fluxo obrigatório

1. Abrir `/planos` autenticado e iniciar checkout do plano selecionado.
2. Concluir o pagamento de teste e confirmar o retorno para `/app?billing=success`.
3. Confirmar que `checkout.session.completed` chega ao endpoint com assinatura válida.
4. Conferir no banco a assinatura com usuário, cliente, plano e estado `active`.
5. Abrir `/api/apps/pgr/:workspaceId` com ambiente vinculado e confirmar resposta `200`.
6. Cancelar a assinatura no portal de cobrança.
7. Confirmar o evento de atualização ou exclusão, a persistência do novo estado e o bloqueio `402` na rota protegida do PGR.
8. Repetir a abertura do PGR para um workspace sem vínculo e confirmar `403`.

## Eventos esperados

| Evento | Efeito esperado no Portal TST |
|---|---|
| `checkout.session.completed` | Cria ou atualiza assinatura associada ao usuário e plano. |
| `customer.subscription.updated` | Atualiza preço, status, vigência e flag de cancelamento. |
| `customer.subscription.deleted` | Persiste estado cancelado e impede acesso pago ao PGR. |

## Evidências de aprovação

Registrar para cada execução o identificador do evento, o usuário de teste, o plano, o workspace, o código HTTP da rota do PGR antes/depois da alteração e uma captura das telas de retorno. Eventos ou respostas devem ser registrados sem expor credenciais, payloads completos ou dados pessoais.

## Plano de reversão

Se um preço ou endpoint estiver incorreto, interromper o checkout público, corrigir a configuração no provedor e repetir apenas no ambiente de teste. Não compensar estados diretamente no banco sem registrar o motivo, pois a fonte de verdade de cobrança é o evento assinado do provedor.
