# Portal TST Brasil — Critérios de qualidade para novos módulos

## Portão técnico local

| Critério | Evidência necessária |
|---|---|
| Tipos | `pnpm check` sem erro. |
| Testes | `pnpm test` com sucesso e cobertura de regra crítica. |
| Contratos | Zod valida entrada e saída nos procedimentos tRPC. |
| Banco | Schema, migração revisada e índices por `workspaceId` quando houver operação por ambiente. |
| Permissão | Cenários de vínculo válido, ausência de vínculo e papel sem escrita cobertos. |
| Dados | Sem seeds, registros fictícios ou conteúdo apresentado como dado real. |

## Portão de interface

Cada página autenticada deve oferecer estados de carregamento, vazio, erro e retorno para a seleção de ambiente. A interface precisa indicar o ambiente ativo e não pode escolher silenciosamente um ambiente diferente daquele usado na ação do usuário. Links externos exigem abertura segura; funcionalidades ainda não entregues não devem simular resultados.

## Portão de segurança e operação

Logs não devem revelar tokens, assinaturas, cookies ou payloads completos de cobrança. Rotas de aplicativo protegido precisam validar autenticação, vínculo de workspace e assinatura. Mudanças de schema devem ser executadas por migração revisada e checkpoints devem ser criados depois de testes aprovados.

## Portão externo de homologação

Os módulos que dependem de OAuth, Stripe, armazenamento externo ou navegador real só são aprovados após execução em ambiente autenticado. A aprovação deve incluir caso de sucesso, falha esperada, isolamento entre ambientes e registro da evidência técnica.
