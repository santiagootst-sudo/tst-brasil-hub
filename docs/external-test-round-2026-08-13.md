# Rodada de testes externos — TST Brasil Hub

## Resultado executivo

O domínio público `https://tstportal-lhmdcupa.manus.space/` está adequado para distribuir uma rodada inicial de testes. A landing page carrega publicamente e a rota `/planos` exibe os planos PGR Pro, TST Autônomo e TST Empresa. O acesso a áreas internas deve continuar condicionado à autenticação.

A recomendação é distribuir o link para **avaliação da landing page, navegação pública, planos e primeiro acesso**, além de uma rodada controlada de uso autenticado. O pagamento deve ser tratado exclusivamente como **sandbox** nesta fase.

## Status por fluxo

| Fluxo | Situação | Orientação |
|---|---|---|
| Landing page pública | Aprovado | Pode compartilhar o domínio público. |
| Página de planos | Aprovado para demonstração | Pode compartilhar; informar que os valores são de teste e não representam cobrança real nesta rodada. |
| Login e Workspace Hub | Validado no ambiente autenticado | Cada tester deve entrar com sua própria conta OAuth; não compartilhar sessão, cookies ou credenciais. |
| Checkout Stripe | Validado em sandbox | Usar somente cartões oficiais de teste do Stripe, nunca cartão real. |
| Ativação por webhook | Validada no ciclo de homologação | Se o checkout retornar sucesso mas o PGR continuar bloqueado, aguardar o processamento do webhook e registrar o horário da tentativa. |
| Dados de trabalho | Validado com isolamento por workspace | Usar dados fictícios ou autorizados; não inserir CPF, documentos ou informações reais de clientes sem consentimento. |
| WhatsApp de suporte | Disponível | Canal oficial: `https://wa.me/5554999097610`. |

## Instruções para os testers

Compartilhar o endereço `https://tstportal-lhmdcupa.manus.space/`. Solicitar que cada pessoa teste primeiro a landing page, os planos, o FAQ, o contato por e-mail e o botão de WhatsApp. Para entrar no portal, cada tester deve usar sua própria autenticação.

Na etapa de pagamento, informar explicitamente que a rodada está em ambiente de teste. O tester não deve usar cartão, e-mail ou dados pessoais reais no checkout. Para testar a assinatura, usar dados sintéticos e um cartão oficial de teste do Stripe, como `4242 4242 4242 4242`, com validade futura e CVC de teste.

Após a confirmação do checkout, o tester deve retornar ao portal, selecionar o ambiente desejado e verificar se o recurso pago foi liberado. Caso a mensagem indique que a assinatura ainda será processada, não repetir pagamentos: registrar a mensagem, horário e e-mail de teste para investigação do webhook.

## Limites da rodada

A rodada não deve ser anunciada como lançamento comercial ou cobrança real. O checkout de sandbox comprova o fluxo técnico, mas não valida cobrança real, conciliação financeira, emissão fiscal, cancelamento real ou envio de e-mail por provedor externo.

O envio de certificados por e-mail continua adiado até que exista um provedor e um remetente verificados. O suporte via WhatsApp está disponível, mas o número deve ser usado apenas para atendimento autorizado.

## Critério de aprovação

Considerar a rodada aprovada quando pelo menos um tester externo conseguir acessar a landing page, consultar planos, autenticar-se com sua própria conta, navegar no Workspace Hub, concluir o checkout apenas em sandbox, observar a ativação após o webhook e criar/consultar somente registros de teste isolados no próprio workspace.
