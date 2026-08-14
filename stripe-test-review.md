# Revisão do Stripe de teste

## Homologação de checkout

As três sessões foram criadas, consultadas e expiradas após validação:

| Ciclo | Preço recorrente | URL de sucesso | URL de cancelamento | Resultado |
|---|---:|---|---|---|
| Mensal | R$ 99,90/mês, com cupom único de R$ 30,00 na primeira cobrança | `/app?billing=success` | `/planos?billing=cancelled` | Aprovado |
| Trimestral | R$ 269,70 a cada 3 meses | `/app?billing=success` | `/planos?billing=cancelled` | Aprovado |
| Anual | R$ 898,80 por ano | `/app?billing=success` | `/planos?billing=cancelled` | Aprovado |

Todas as sessões foram expiradas após o teste; não houve cobrança real.

## Revisão comercial e fiscal

Os três preços estão ativos, em BRL, com os intervalos corretos. O produto está ativo com nome `TST Brasil Hub` e descrição de assinatura do ecossistema.

A conta de teste ainda exibe dados que precisam ser substituídos no painel Stripe antes do convite externo: nome comercial `Área restrita de Portal TST Brasil`, URL `https://accessible.stripe.com`, telefone de suporte americano e ausência de e-mail de suporte. O descritor de extrato atual é `AREA RESTRITA DE PORTA`, que também deve ser revisado.

O Stripe Tax informou que não está disponível para este país/conta de teste. Portanto, a configuração fiscal não foi alterada automaticamente. A ativação ou definição fiscal deve ser tratada no painel Stripe com os dados legais da empresa e orientação contábil antes de cobrança real.
