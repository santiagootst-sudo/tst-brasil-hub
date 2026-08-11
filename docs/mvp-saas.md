# Portal TST Brasil — MVP SaaS

## Proposta entregue

O portal possui uma entrada pública de venda, uma área autenticada e dois contextos de trabalho independentes: **TST Autônomo** e **TST CLT**. O primeiro aplicativo é o **PGR Pro**, aberto dentro do contexto selecionado e protegido por autenticação, assinatura e pertencimento ao ambiente.

| Camada | Implementação |
|---|---|
| Site público | Página institucional, proposta de valor, planos e entrada para autenticação. |
| Ambientes | Workspaces Autônomo e CLT, com membros, empresas e dados separados por contexto. |
| PGR Pro | Aplicativo legado modernizado, aberto em iframe por rota protegida e com armazenamento local prefixado por workspace. |
| Assinaturas | Produtos mensais em BRL, Checkout recorrente, portal de cobrança e eventos de assinatura. |
| Segurança | Autenticação, checagem de pertencimento ao workspace, acesso pago ou administrativo e validação de assinatura de webhook. |

## Planos de teste criados

| Plano | Preço mensal | Lookup key |
|---|---:|---|
| PGR Pro | R$ 79,90 | `portal_tst_pgr_pro_monthly_brl` |
| TST Autônomo | R$ 149,90 | `portal_tst_autonomo_monthly_brl` |
| TST Empresa | R$ 249,90 | `portal_tst_empresa_monthly_brl` |

Os preços são localizados pelos `lookup keys`, em vez de serem fixados no código. Isso permite substituir preço, moeda ou oferta no provedor de pagamentos sem alterar a interface.

## Evidências técnicas

Foram executados com sucesso `pnpm check`, `pnpm test` e `pnpm build`. O PGR foi testado em modo direto e em modo integrado de portal, chegando ao dashboard. A rota interna do PGR foi testada sem sessão e bloqueou o acesso corretamente.

## Homologação obrigatória antes de publicar

O PGR é uma função crítica. Faça a homologação com uma conta de teste autenticada antes de vender o acesso: crie um ambiente Autônomo e um CLT, alterne entre ambos, complete dados, valide autosave, exportação Word/PDF, catálogos de EPIs, medições e o bloqueio de acesso após cancelamento.

No ambiente de testes, use o cartão `4242 4242 4242 4242` para validar checkout. Confirme também a entrega dos eventos no painel do provedor de pagamentos e valide a sequência checkout → webhook → assinatura ativa → PGR liberado → cancelamento → PGR bloqueado.

## Próximos módulos

Depois da homologação do PGR, a ordem recomendada é ampliar o ambiente CLT com treinamentos, certificados, inspeções e plano de ação; ampliar o ambiente Autônomo com cadastro de clientes e modelos de documentos; e, por fim, implementar Biblioteca, comunidade e Marketplace com o mesmo sistema de workspace e assinatura.
