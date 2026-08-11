# Portal TST Brasil — Backlog técnico priorizado

## Regra de priorização

Os próximos módulos devem aumentar a capacidade operacional do TST antes de ampliar canais de venda. Cada entrega precisa reutilizar `workspaceId`, contratos tRPC, matriz de permissão e critérios de qualidade já definidos.

| Prioridade | Módulo | Público principal | Resultado de negócio | Dependência |
|---|---|---|---|---|
| P1 | Empresas e unidades | Autônomo e CLT | Base organizada para clientes, unidades e PGRs | Já iniciado; consolidar CRUD e contexto ativo |
| P1 | Equipe e funções | CLT e Autônomo | Pessoas, setores e cargos para capacitação e gestão | Empresas/unidades |
| P1 | Inventário de riscos | Ambos | Registro contínuo de riscos, controles e responsáveis | Empresas e PGR |
| P1 | Plano de ação | Ambos | Execução e acompanhamento de medidas de controle | Inventário de riscos |
| P2 | Inspeções e checklists | CLT | Rotina de campo, evidências e pendências operacionais | Equipe e plano de ação |
| P2 | Indicadores SST | CLT | Painel com dados calculados, sem números simulados | Ocorrências, inspeções e treinamentos |
| P2 | Entregas e carteira | Autônomo | Visão de prazos, clientes e serviços contratados | Empresas e PGR |
| P3 | Catálogo de serviços | Autônomo | Preparação para ofertar serviços sem iniciar marketplace completo | Empresas e materiais |
| P3 | Marketplace | Autônomo | Venda de serviços e materiais com governança de oferta | Catálogo, pagamento e moderação |

## Próximo incremento recomendado: operação de empresas e equipe

O próximo ciclo de desenvolvimento deve criar um domínio próprio para **empresas, unidades, setores, funções e pessoas**, porque ele reduz retrabalho nos módulos de PGR, treinamentos, certificados, inspeções e indicadores. O contexto Autônomo poderá relacionar várias empresas atendidas; o contexto CLT poderá operar uma empresa principal com múltiplas unidades e setores.

| Entidade | Campos mínimos | Regra de isolamento |
|---|---|---|
| Empresa | Nome, documento, status, contato principal | Pertence a um workspace |
| Unidade | Empresa, nome, localidade e status | Pertence a uma empresa do workspace |
| Setor | Unidade, nome e responsável | Pertence a uma unidade do workspace |
| Função | Empresa, título e descrição | Pertence a uma empresa do workspace |
| Pessoa | Empresa, unidade, setor, função e status | Pertence a uma empresa do workspace |

## Critérios de aceite por módulo

Cada módulo só deve sair do backlog quando tiver schema e migração, router isolado, contrato Zod de entrada e saída, tela com contexto de ambiente explícito, estados vazio/carregamento/erro, testes de autorização e documentação de regra de negócio. Para módulos que alimentam indicadores, a fonte do indicador deve ser rastreável até registros reais.

## Itens deliberadamente adiados

O marketplace, automações externas, IA de preenchimento e integrações de mensageria não devem ser implementados antes da consolidação de empresas, equipe, riscos e plano de ação. Essas frentes aumentam custo de suporte e dependem de modelos de dados estáveis; antecipá-las agora aumentaria o acoplamento e reduziria a velocidade do produto.
