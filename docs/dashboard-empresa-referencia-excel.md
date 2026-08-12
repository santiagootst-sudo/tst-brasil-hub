# Referência Excel — Dashboard Empresa do Portal TST

## Leitura executiva

A planilha enviada apresenta um ecossistema de SST muito mais amplo do que um dashboard único. Ela organiza a operação em painéis especializados para colaboradores, acidentes, pendências, treinamentos, EPIs, auditorias e desvios, planos 5W2H, riscos ambientais, extintores e hidrantes. A principal qualidade da referência não é apenas a quantidade de gráficos, mas a forma como cada tela responde a uma pergunta operacional específica.

> A referência funciona como um centro de controle de SST: primeiro mostra o que exige atenção, depois permite aprofundar por domínio, setor, período ou colaborador.

## Padrões aproveitáveis

| Padrão observado | Como aparece na referência | Aplicação recomendada no Portal TST |
|---|---|---|
| Filtros contextuais | Ano, setor, função, norma ou tipo de ocorrência | Filtros por período, setor, empresa, status e módulo, sempre aplicados aos dados reais do ambiente |
| Cartões de decisão | Total, vencido, a vencer, em aberto, concluído, atrasado | Cards com número, severidade, link para o módulo e texto explicativo; nunca usar `###` como valor de fallback |
| Grade modular | Vários painéis pequenos em uma mesma tela | Dashboard Empresa com blocos independentes e responsivos, priorizando pendências e prevenção |
| Comparação por status | Válido/vencido, concluído/em aberto, agendado/cancelado | Barras empilhadas e donuts para status operacionais que já existem no backend |
| Recortes operacionais | Setor, função, sexo, idade, turno, parte do corpo, tipo de risco | Recortes permitidos por permissão, com proteção para dados pessoais e sem expor informações médicas sensíveis |
| Drill-down | Pesquisa individual e impressão de histórico | Links para Pessoas, Operações, Inspeções, Certificados e PGR, com contexto `workspace` preservado |
| Especialização por domínio | Colaboradores, Acidentes, Treinamentos, EPI, Auditorias, Riscos e equipamentos | Evolução incremental do dashboard e criação de hubs especializados, sem concentrar todos os detalhes em uma tela única |

## Mapeamento para o Portal TST atual

| Referência | Correspondência existente | Próximo aprimoramento seguro |
|---|---|---|
| Colaboradores | `Estrutura e equipe` e cards de Pessoas/Setores/Funções | Adicionar composição por setor e função ao dashboard Empresa, usando somente registros ativos |
| Pendentes | Alertas de certificados, EPIs, ocorrências, inspeções e ações | Criar uma faixa única de “Central de pendências” agrupada por severidade e com links diretos |
| Treinamentos | Módulo `Treinamentos` e indicador de treinamentos planejados | Evoluir para status planejado/concluído e validade apenas quando os registros estiverem disponíveis |
| EPI | `Controle operacional` com estoque, validade, CA e histórico | Manter donut de alertas e acrescentar movimentação por status quando houver histórico persistido |
| Auditorias e desvios | `Inspeções e ações` | Usar barras de status, atrasos e distribuição por setor; não renomear inspeção como auditoria sem modelo específico |
| 5W2H | Plano de ação dentro de `Inspeções e ações` | Adicionar visualização de prioridade e prazo, respeitando os estados existentes |
| Riscos | PGR e COPSOQ-III | Mostrar resumo de riscos registrados e encaminhados, sem criar classificações que não estejam no inventário real |
| Extintores/hidrantes | Ainda não há domínio dedicado no Portal TST | Manter como roadmap de módulo operacional, sem inserir números fictícios no dashboard atual |
| Pesquisa por colaborador | Estrutura, operações e Saúde Ocupacional | Criar perfil operacional detalhado em rota própria, protegido por permissão e com cuidado para dados pessoais/sensíveis |

## Direção visual proposta

A referência deve ser incorporada em uma linguagem mais moderna: fundo claro esverdeado, cartões brancos com sombras suaves, azul-marinho/teal para estrutura, âmbar para atenção e coral para risco. O dashboard deve preservar a identidade do Portal TST, usar tipografia e espaçamento consistentes e substituir o visual rígido da planilha por componentes com hover, tooltip, estados de carregamento, filtros acessíveis e responsividade mobile.

A evolução prioritária deve ser uma **Central de Pendências da Empresa**, seguida por gráficos de execução de inspeções e ações, estrutura de pessoas por setor, treinamentos e alertas de EPI/documentos. A parte de acidentes, extintores, hidrantes e auditorias formais deve ser incorporada somente quando os respectivos registros e contratos de dados estiverem disponíveis.
