# Evolução de SST — 12 de agosto de 2026

## Escopo entregue

A evolução transforma quatro aprendizados da análise competitiva em módulos funcionais do Portal TST Brasil, preservando o isolamento por ambiente, as permissões owner/manager/member e o princípio de não criar dados fictícios.

## Controle de EPI

O módulo Controle Operacional passou a registrar CA, fabricante, estoque atual, estoque mínimo, validade e reposição. A nova área de entrega e reposição vincula cada movimento a um EPI, trabalhador e empresa do ambiente, registra quantidade, data de entrega, validade individual e observação, além de manter histórico persistente e baixa de estoque. O dashboard operacional exibe estoque crítico, validade a tratar e reposições próximas.

## Documentos legais e evidências

A central de Certificados passou a aceitar categorias `certificate`, `pgr`, `ltcat`, `os`, `pcmat`, `laudo` e `other`, com URL de referência e notas. Os registros continuam vinculados ao ambiente e podem ser associados a uma empresa, permitindo organizar PGR, LTCAT, Ordem de Serviço, PCMAT, laudos e certificados em uma mesma visão de conformidade.

## Checklists reutilizáveis

Inspeções agora podem ser criadas a partir de modelos reutilizáveis por empresa, setor, tipo de risco e rotina. Cada modelo possui itens ordenados, orientação opcional e obrigatoriedade. A inspeção preserva o vínculo opcional ao modelo, e o plano de ação continua podendo ser relacionado à inspeção, setor e responsável.

## Indicadores de SST

O dashboard exibe um snapshot calculado somente a partir dos dados reais do ambiente: inspeções registradas, percentual de inspeções concluídas, inspeções atrasadas, ações atrasadas e percentual de ações concluídas. Quando não há registros suficientes, o portal mostra estado vazio ou `—`, sem inventar tendência. A mensagem informa que séries históricas serão habilitadas quando houver períodos reais suficientes.

## Qualidade

A checagem TypeScript passou sem erros. A suíte completa passou com **22 arquivos e 82 testes**. A validação visual cobriu Visão geral, Inspeções, Certificados e Controle Operacional no ambiente Autônomo, incluindo os estados vazios e o registro documental real existente.

## Pendências independentes

Continuam fora deste escopo as homologações que dependem de sandbox Stripe e as validações comerciais que exigem uma nova visita ou certificado real criado pelo usuário. Essas pendências permanecem explicitamente abertas no `todo.md`.
