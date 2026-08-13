# Project TODO

- [x] Consolidar a tela de escolha entre TST Autônomo e TST CLT como a entrada autenticada do Portal TST Brasil.
- [x] Definir modelo de dados para organizações, ambientes de trabalho, empresas e membros.
- [x] Criar controle de permissões por perfil e contexto ativo, com isolamento de dados.
- [x] Preservar e integrar o Gerador de PGR como primeiro aplicativo do portal sem alterar suas regras funcionais.
- [x] Criar site público com proposta de valor, planos e entrada para cadastro.
- [x] Configurar produtos, checkout recorrente, retorno de pagamento e cancelamento.
- [x] Processar eventos de assinatura com verificação de assinatura e controle de acesso.
- [x] Adicionar cobertura de testes para permissões, contextos, PGR e estados de assinatura.
- [x] Adicionar testes automatizados para a rota protegida do PGR cobrindo autenticação, vínculo com ambiente e assinatura ativa.
- [x] Validar no fluxo real da rota do PGR o bloqueio e a liberação por estado de assinatura.
- [x] Validar visualmente os fluxos críticos do portal antes da entrega.
- [x] Implementar e validar enforcement de permissões por papel do workspace (owner, manager e member) nas ações do portal.
- [x] Homologar o PGR integrado com autosave, exportação, isolamento entre ambientes e bloqueio/liberação por assinatura.
- [x] Propagar os metadados de usuário e plano à assinatura para processar cancelamentos e alterações de status corretamente.
- [x] Exibir os estados de retorno e cancelamento de cobrança na interface do portal.
- [x] Registrar e testar o webhook em sandbox com um ciclo completo de assinatura.
- [x] Homologar checkout, webhook, cancelamento e bloqueio de acesso quando o sandbox Stripe estiver disponível.
- [x] Evoluir os fluxos do PGR e dos ambientes de trabalho sem dependência da homologação de pagamentos.
- [x] Criar os primeiros módulos compartilhados de Biblioteca e Certificados, conectados ao menu autenticado.
- [x] Implementar fluxos mínimos funcionais para abrir materiais da Biblioteca e iniciar registros reais de Certificados.
- [x] Criar o módulo de Treinamentos com cadastro real por ambiente, evitando conteúdos ou participantes fictícios.
- [x] Substituir a Biblioteca provisória por referências oficiais com abertura funcional em nova aba.
- [x] Adicionar testes para os procedimentos de Certificados, Treinamentos e fluxos protegidos por workspace.
- [x] Cobrir leitura de Treinamentos e bloqueios para usuário sem vínculo ao ambiente.
- [x] Criar um dashboard contextual por ambiente com indicadores reais de empresas, PGRs, treinamentos e certificados.
- [x] Corrigir e retestar o runtime do projeto para eliminar qualquer falha de importação da camada de dados.
- [x] Substituir a importação nomeada da camada de dados por acesso via namespace e retestar o runtime limpo.
- [x] Validar o dashboard contextual autenticado com um ambiente real e sem acesso ao ambiente.
- [x] Reposicionar a mensagem da landing page para apresentar o Portal TST como ecossistema, não como ferramenta de PGR.
- [x] Recriar a tela autenticada de escolha de ambientes com grupos Autônomo/CLT e recursos compartilhados.
- [x] Manter PGR, Biblioteca, Materiais, Suporte, Treinamentos e Certificados como ferramentas disponíveis em ambos os contextos.
- [x] Criar a página funcional de Materiais com registros reais e rota autenticada acessível em ambos os contextos.
- [x] Criar a página funcional de Suporte/chamados com estado vazio, persistência e acesso em ambos os contextos.
- [x] Adicionar Materiais e Suporte à navegação contextual e aos atalhos do dashboard para os dois tipos de ambiente.
- [x] Separar os procedimentos tRPC do portal em módulos por domínio, preservando os contratos de Workspace, PGR, capacitação, materiais, suporte e cobrança.
- [x] Separar o router do portal em domínios Workspace, PGR, Capacitação, Materiais e Suporte, mantendo Billing isolado.
- [x] Compor os routers de domínio sem alterar os caminhos tRPC existentes consumidos pela interface.
- [x] Cobrir a composição por domínio preservando os contratos e fluxos protegidos atuais.
- [x] Criar contratos Zod reutilizáveis para inputs e respostas dos módulos do portal, reduzindo duplicação de validações entre rotas e testes.
- [x] Criar schemas Zod de resposta para Workspace, PGR, Treinamentos, Certificados, Materiais, Suporte e Billing.
- [x] Aplicar schemas de resposta nos procedimentos tRPC e reutilizá-los nos testes de contratos do portal.
- [x] Aplicar outputs compartilhados às mutações de criação de Workspace, Empresa, PGR, Certificados, Treinamentos, Materiais e Suporte.
- [x] Criar contrato de resposta explícito para a criação de projeto PGR e validá-lo no procedimento próprio do domínio.
- [x] Criar testes de contrato para respostas de Workspace, PGR, Billing e módulos compartilhados, incluindo rejeição de payload incompatível.
- [x] Documentar a arquitetura do ecossistema, os limites entre contextos Autônomo/CLT e a matriz de permissão por papel.
- [x] Documentar o modelo de assinatura, as transições de acesso e o roteiro de homologação Stripe para execução quando o sandbox estiver disponível.
- [x] Criar um roteiro de qualidade local com critérios verificáveis para PGR, dashboards, Materiais, Suporte, Treinamentos e Certificados.
- [x] Definir o backlog técnico de próximos módulos: empresas, equipe, inventário de riscos, plano de ação, indicadores e marketplace futuro.
- [x] Corrigir a jornada de primeiro acesso para orientar a criação e a abertura do primeiro ambiente Autônomo ou CLT.
- [x] Validar que a criação de ambiente leva ao dashboard correspondente sem retornar ao bloqueio de ambiente vazio.
- [x] Tornar explícita na interface a diferença entre criar um novo ambiente e selecionar um ambiente existente.
- [x] Corrigir a leitura do parâmetro `workspace` no dashboard e no PGR para que ambientes existentes sejam abertos corretamente.
- [x] Propagar o ambiente ativo pela navegação lateral para que os módulos não retornem ao estado de seleção.
- [x] Fazer Materiais, Suporte, Treinamentos e Certificados respeitarem o ambiente recebido pela URL e refletirem a troca de contexto.
- [x] Extrair e testar o helper de leitura e propagação de `workspace` para impedir regressão da navegação por contexto.
- [x] Reproduzir e corrigir a abertura funcional do Gerador de PGR no ambiente selecionado.
- [x] Validar o cadastro inicial de empresa e projeto PGR antes da abertura do aplicativo legado.
- [x] Validar o carregamento do aplicativo legado do PGR dentro do contexto e projeto selecionados.
- [x] Criar uma autorização temporária e restrita para o iframe do PGR quando a sessão chegar ao portal por cabeçalho, sem expor acesso irrestrito ao aplicativo legado.
- [x] Cobrir em testes a emissão e validação da autorização temporária do PGR, incluindo escopo de usuário e ambiente.
- [x] Validar que a autorização do iframe só é emitida para projeto PGR pertencente ao ambiente selecionado.
- [x] Diagnosticar e corrigir a exceção React reportada durante o fluxo do Gerador de PGR.
- [x] Validar que a página de PGR não viola a ordem de hooks ao alternar entre estados de ambiente, assinatura e projeto.
- [x] Remover o login interno duplicado do aplicativo legado quando ele for aberto pelo Portal TST.
- [x] Impedir que o controle interno de saída do PGR reabra a tela de login quando o acesso for gerenciado pelo portal.
- [x] Adicionar logo opcional às empresas com upload seguro e persistência por ambiente.
- [x] Reorganizar a página de PGR para criar e abrir projetos a partir do card de cada empresa.
- [x] Exibir no card da empresa os PGRs vinculados, o status de criação e as ações de abertura do gerador.
- [x] Validar a jornada completa empresa-logo-projeto-PGR sem criar dados fictícios.
- [x] Validar no navegador o fluxo final de criar empresa, criar PGR pelo card e abrir o projeto recém-criado sem depender de registros preexistentes (homologação autorizada).
- [x] Comprovar o carregamento do app legado do PGR por evidência observável após a atualização da storage key integrada.
- [x] Adicionar teste automatizado que verifica o modo `portalAuth` e a ocultação do login interno no HTML legado publicado.
- [x] Corrigir a entrega do PGR integrado para impedir definitivamente a exibição da tela de login interna.
- [x] Adicionar um botão visível de retorno ao Portal TST dentro do aplicativo legado do PGR.
- [x] Validar a abertura do PGR e o retorno ao portal no navegador do usuário após a correção.
- [x] Validar no navegador que o botão de retorno do PGR navega para o ambiente correto no Portal TST sem reexibir o login legado.
- [x] Validar no navegador a abertura real do iframe do PGR após selecionar um projeto, registrando o conteúdo interno carregado.
- [x] Navegar diretamente para uma URL autorizada recente do PGR e confirmar a resposta HTML válida do aplicativo legado.
- [x] Corrigir o dimensionamento da abertura em tela cheia do PGR integrado para preservar a barra lateral e a área útil do aplicativo.
- [x] Validar visualmente a abertura em tela cheia do PGR e o retorno ao Portal TST após o ajuste de dimensionamento.
- [x] Validar no navegador o modo ampliado do PGR, confirmando que o iframe renderiza o conteúdo completo com a barra lateral interna visível e bem dimensionada.
- [x] Validar no navegador, após abrir o PGR em modo ampliado, que o retorno à carteira e o retorno interno ao Portal TST não reexibem o login legado nem quebram o layout.
- [x] Registrar evidência visual observável de que o iframe ampliado carregou o dashboard completo do PGR, com a barra lateral interna sem cortes horizontal ou vertical.
- [x] Capturar uma evidência adicional do navegador que relacione o dashboard completo renderizado à instância de iframe do modo ampliado antes do próximo checkpoint.
- [x] Exibir no modo ampliado um estado visual de carregamento concluído do iframe do PGR para tornar a validação observável no portal.
- [x] Diagnosticar e corrigir o erro React `insertBefore` ao montar ou desmontar o PGR em tela cheia.
- [x] Cobrir e validar os ciclos repetidos de abertura, retorno e atualização do PGR ampliado sem erro de reconciliação.
- [x] Adicionar cobertura automatizada de reabertura e fechamento do PGR ampliado com raiz de portal dedicada.
- [x] Validar no navegador uma reabertura após retorno, confirmando que o ErrorBoundary não é acionado e que não há novo erro `insertBefore` no console.
- [x] Executar no navegador, após a refatoração, o ciclo completo abrir → voltar à carteira → reabrir e registrar a ausência do ErrorBoundary.
- [x] Registrar um trecho de console pós-ciclo que comprove a ausência de novo `insertBefore` após a reabertura manual.
- [x] Reorganizar o dashboard TST Autônomo para priorizar carteira de empresas, entregas PGR, pendências de clientes e ações de atendimento.
- [x] Reorganizar o dashboard TST CLT para priorizar pessoas, conformidade, treinamentos, certificados e alertas operacionais.
- [x] Tornar a barra lateral contextual, destacando os atalhos e informações mais relevantes em cada ambiente sem remover as ferramentas compartilhadas.
- [x] Validar visualmente os dashboards Autônomo e CLT com a nova hierarquia de informações e ações.
- [x] Modelar entidades de pessoas, setores e funções vinculadas às empresas e aos ambientes de trabalho.
- [x] Criar o módulo de Pessoas e Funções para gestão operacional no contexto TST CLT e atendimento do TST Autônomo.
- [x] Criar o módulo de Setores para organizar a estrutura de cada empresa e sustentar PGR, treinamentos e indicadores.
- [x] Conectar Empresas, Pessoas, Setores e Funções aos atalhos e à navegação contextual sem remover ferramentas existentes.
- [x] Criar indicadores operacionais reais derivados dos registros de empresas, pessoas, setores, funções, treinamentos, certificados e PGRs.
- [x] Cobrir os novos domínios com contratos, permissões por workspace e testes automatizados.
- [x] Validar visualmente os módulos estruturantes nos dois contextos antes da homologação Stripe.
- [x] Exibir e validar no dashboard um indicador real derivado de funções ativas cadastradas por empresa e ambiente.
- [x] Modelar o controle de EPIs por empresa, função e ambiente, sem criar estoque ou entregas fictícias.
- [x] Modelar ocorrências SST com registro mínimo e sem dados médicos sensíveis.
- [x] Criar o módulo operacional de EPIs e Ocorrências, com permissões por workspace e estados vazios reais.
- [x] Integrar alertas de pendências de EPI e ocorrências abertas aos dashboards contextuais.
- [x] Cobrir os novos módulos operacionais com contratos, testes e validação visual em ambientes reais.
- [x] Modelar inspeções e ações preventivas por empresa, setor e ambiente, sem gerar pendências fictícias.
- [x] Criar o módulo de Inspeções e Plano de ação com registros reais, responsáveis e prazos opcionais.
- [x] Integrar ações em aberto e inspeções registradas aos dashboards contextuais.
- [x] Cobrir inspeções e ações com contratos, permissões por workspace e testes automatizados.
- [x] Validar visualmente o módulo de inspeções nos ambientes Autônomo e CLT sem inserir dados de demonstração.
- [x] Modelar a carteira comercial do TST Autônomo com status de cliente, agenda de visitas e vencimentos documentais reais.
- [x] Criar a Agenda de visitas do TST Autônomo vinculada a empresas reais, com objetivo, data e status.
- [x] Criar a visão de Documentos do TST Autônomo para consolidar PGRs, certificados e vencimentos por cliente.
- [x] Reorganizar a barra lateral do TST Autônomo nas seções Principal, Documentos, Negócio e Conhecimento, sem remover ferramentas compartilhadas.
- [x] Reorganizar o dashboard Autônomo como visão de carteira, agenda, vencimentos e operação comercial sem exibir métricas financeiras fictícias.
- [x] Criar para o TST CLT uma visão de riscos e ações preventivas a partir das inspeções, EPIs, ocorrências e plano de ação existentes.
- [x] Cobrir e validar visualmente as diferenças de navegação e dashboard entre Autônomo e CLT.
- [x] Adicionar mutação e interface para atualizar o status das visitas do TST Autônomo entre planejada, concluída e cancelada.
- [x] Exibir na visão de Documentos do TST Autônomo os vencimentos reais de certificados por cliente, incluindo status vencido e próximo do vencimento.
- [x] Cobrir e validar no navegador a gestão de status de visitas e os vencimentos documentais da carteira comercial.
- [x] Validar no navegador uma visita real do TST Autônomo, alterando o status entre planejada, concluída e cancelada e confirmando a persistência (homologação autorizada).
- [x] Validar no navegador o resumo documental com certificado real vencido ou próximo do vencimento por cliente (homologação autorizada).
- [x] Validar separadamente os fluxos críticos restantes: dashboard com e sem acesso, jornada empresa → logo → projeto → PGR e alternância Autônomo/CLT.
- [x] Confirmar no navegador a persistência do status de uma visita real após recarregar ou retornar à agenda (homologação autorizada).
- [x] Adicionar cobertura automatizada da lógica de resumo de vencimentos documentais por cliente na visão comercial do TST Autônomo.
- [x] Implementar regra de ambiente único por usuário, permitindo a escolha inicial entre TST Autônomo e TST CLT, sem criação de ambientes adicionais.
- [x] Remover da tela de entrada a listagem e os controles que exibem múltiplos ambientes para o mesmo usuário.
- [x] Bloquear no backend a criação de novo ambiente quando o usuário já possuir um ambiente principal.
- [x] Definir e aplicar o comportamento de compatibilidade para contas existentes com múltiplos ambientes.
- [x] Implementar regra de ambiente único por usuário, permitindo a escolha inicial entre TST Autônomo e TST CLT, sem criação de ambientes adicionais.
- [x] Remover da tela de entrada a listagem e os controles que exibem múltiplos ambientes para o mesmo usuário.
- [x] Bloquear no backend a criação de novo ambiente quando o usuário já possuir um ambiente principal.
- [x] Definir e aplicar o comportamento de compatibilidade para contas existentes com múltiplos ambientes.
- [x] Migrar ou consolidar com segurança os dados dos ambientes legados para o ambiente principal escolhido, sem misturar contextos Autônomo e CLT indevidamente.
- [x] Remover os ambientes legados que continham apenas dados de teste, mediante autorização expressa do usuário, antes da aplicação da regra de ambiente único.
- [x] Remover os ambientes e registros de teste duplicados autorizados, mantendo apenas o ambiente principal atual da conta.
- [x] Aplicar restrição de unicidade do proprietário na base de dados após a limpeza dos ambientes duplicados.
- [x] Validar no navegador a conta consolidada em Empresas, PGR e Certificados, confirmando que o ambiente principal remanescente funciona sem dependência dos ambientes de teste removidos.
- [x] Permitir temporariamente, durante a criação do produto, um ambiente TST Autônomo e um ambiente TST CLT por usuário.
- [x] Impedir a criação de ambientes duplicados do mesmo tipo para o mesmo usuário.
- [x] Reintroduzir uma alternância explícita entre os dois contextos de desenvolvimento na interface autenticada.
- [x] Restaurar e validar o ambiente CLT de desenvolvimento, mantendo o Autônomo já existente.

- [x] Criar painel de resumo na página inicial com gráficos dinâmicos mostrando o status de inspeções e planos de ação.
- [x] Implementar animações de carregamento e notificações visuais de sucesso ao alternar entre os perfis Autônomo e CLT.
- [x] Adicionar funcionalidade de exportar relatórios do Gerador de PGR e das Inspeções diretamente para o formato PDF.

- [x] Evoluir Controle Operacional de EPI com CA, validade, reposição e histórico de entrega por trabalhador.
- [x] Organizar Documentos Legais e Certificados por tipo (NR-09/PGR, LTCAT, OS, PCMAT) vinculados à empresa.
- [x] Criar modelos reutilizáveis de checklist de inspeção e conectar inspeções ao plano de ação.
- [x] Ampliar indicadores de SST com tendências e pendências reais nos dashboards.


- [x] Validar visualmente os novos módulos de SST nos ambientes Autônomo e CLT com estados reais existentes.
- [x] Confirmar que os estados vazios dos módulos não exibem métricas ou registros fictícios.
- [x] Registrar as evidências da validação local sem sandbox Stripe em docs/local-validation-2026-08-12.md.

- [x] Integrar o novo logo do Portal TST Brasil na navegação principal e na landing page.
- [x] Implementar a página/modal Meu perfil com dados reais do usuário, ambiente ativo e ações de sessão.

- [x] Refatorar a integração do logotipo para remover fundo quadriculado e usar proporções profissionais na landing page e no painel.

- [x] Criar painel administrativo seguro para gestão de usuários, renovação de acesso, suspensão e desligamento na rodada de testes.
- [x] Adicionar estado administrativo de acesso e validade de teste ao usuário, integrados ao bloqueio de rotas protegidas.
- [x] Criar procedimentos admin-only para listar usuários, renovar, suspender, reativar e encerrar acesso.
- [x] Criar auditoria das alterações administrativas de acesso.
- [x] Adicionar rota e interface do painel administrativo visível somente ao administrador.
- [x] Cobrir autorização, transições de acesso e isolamento do painel com testes automatizados.
- [x] Validar visualmente o painel administrativo e salvar checkpoint.
- [x] Validar no navegador o dashboard com usuário sem vínculo ao workspace ou com acesso administrativo suspenso, registrando o bloqueio.
- [x] Validar no navegador a jornada sem dados preexistentes: criar empresa, enviar logo, criar PGR pelo card e abrir o projeto recém-criado.
- [x] Validar separadamente no navegador a alternância Autônomo/CLT como fluxo completo, incluindo carregamento, troca e persistência da navegação.
- [x] Promover a conta autenticada mais recente de Vanderson a administrador sem remover o administrador existente e validar o painel `/admin`.
- [x] Diagnosticar e corrigir o erro React removeChild na reconciliação de componentes e portais.
- [x] Evoluir o gerenciador de EPI do ambiente TST CLT com ficha individual por trabalhador, aceite digital na entrega, devolução com condição do equipamento, histórico consolidado e central de alertas operacionais.
- [x] Reconstruir a landing page do Portal TST Brasil alinhada à referência visual (hero com gradiente teal e atmosfera luminosa, cards de ambiente estilizados, seções de recursos e 3 passos com conteúdos exclusivos sem duplicação).
- [x] Corrigir profundamente a direção visual da landing page para refletir com exatidão a referência enviada (hero escuro em teal com atmosfera luminosa, tipografia com contraste ideal, Choice Hub com cartões dourado-acobreado/teal e seções alinhadas).
- [x] Atualizar a terminologia pública da landing page de TST Autônomo / TST CLT para Prestador de serviço / Empresa, mantendo os fluxos técnicos inalterados.
- [x] Adicionar efeito de hover suave e destaque de seleção nos cartões do Choice Hub, incluir botões de chamada para ação claros e criar uma seção de benefícios detalhados para Prestador de serviço e Empresa.
- [x] Executar testes de eficiência máxima no Gerador de PGR (persistência, reabertura em tela cheia, exportação em PDF e validação de dados do prestador de serviço).
- [x] Automatizar e aprimorar a função Limpar dados no HTML do Gerador de PGR com confirmação segura e limpeza inteligente dos campos do formulário.
- [x] Substituir o alerta nativo por modal personalizado de confirmação e toast de sucesso estilizado na ação de limpar dados do PGR.
- [x] Criar barra de progresso inteligente no topo do formulário do Gerador de PGR para indicar o andamento das etapas preenchidas.
- [x] Realizar a revisão técnica completa da especificação do módulo COPSOQ-III (riscos psicossociais) e registrar parecer em docs/parecer-tecnico-copsoq-iii.md.
- [x] Implementar o módulo COPSOQ-III: questionário passo a passo anônimo, painel interativo das 21 dimensões e transferência automática de riscos psicossociais médios/altos para o inventário do PGR.
- [x] Implementar o módulo COPSOQ-III: questionário passo a passo anônimo, painel interativo das 21 dimensões e transferência automática de riscos psicossociais médios/altos para o inventário do PGR.
- [x] Adicionar exportação de resultados COPSOQ-III para CSV e PDF estruturado.
- [x] Implementar gráficos de radar e visualizações interativas das 21 dimensões psicométricas.
- [x] Implementar filtros agregados por departamento e grupo demográfico com blindagem de anonimato.
- [x] Implementar filtros agregados por departamento e grupo demográfico com blindagem de anonimato.
- [x] Adicionar tooltips explicativos ao gráfico de radar detalhando o significado de cada dimensão psicométrica.
- [x] Incluir seção de recomendações automáticas e planos de ação baseados nas menores pontuações no relatório PDF.
- [x] Implementar funcionalidade de comparação agregada entre períodos e benchmarks internos.
- [x] Adicionar tooltips explicativos ao gráfico de radar detalhando o significado de cada dimensão psicométrica.
- [x] Incluir seção de recomendações automáticas e planos de ação baseados nas menores pontuações no relatório PDF.
- [x] Implementar funcionalidade de comparação agregada entre períodos e benchmarks internos.
- [x] Adicionar editor de recomendações automáticas pré-exportação de PDF.
- [x] Implementar animações de carregamento, estados de sucesso e toasts para download de PDF/CSV.
- [x] Incluir alternador de modo claro e escuro dedicado no painel de visualização COPSOQ.
- [x] Adicionar editor pré-exportação de recomendações automáticas para relatórios em PDF.
- [x] Implementar animações de carregamento, estados de sucesso e feedback visual por toast para exportações em PDF e CSV.
- [x] Incluir alternador de modo claro e escuro no painel de visualização COPSOQ para máxima acessibilidade.
- [x] Integrar sugestões de planos de ação por IA para dimensões críticas no PDF do COPSOQ-III.
- [x] Criar painel de destaque na tela principal com alertas visuais para riscos médios e altos.
- [x] Analisar a referência da EasySST (gestão CIPA) e estruturar o novo módulo para o Portal TST Brasil.
- [x] Desenvolver o módulo CIPA integrado com eleições, atas de reunião, membros, calendário e plano de ação.
- [x] Criar painel de destaque no módulo CIPA com alertas visuais para eleições e reuniões pendentes.
- [x] Adicionar exportação em PDF formatado para atas de reuniões e calendário da CIPA.
- [x] Implementar análise de atas por IA para sugerir itens ao plano de ação com revisão humana.
- [x] Desenvolver a nova Biblioteca Visual com design moderno, abas de Documentos por NR, Cursos e Vídeos.
- [x] Implementar busca instantânea, filtros por categoria e abertura segura de materiais de SST.
- [x] Desenvolver a nova Biblioteca Visual com design moderno, abas de Documentos por NR, Cursos e Vídeos.
- [x] Implementar busca instantânea, filtros por categoria e abertura segura de materiais de SST.
- [x] Adicionar barra de pesquisa global e filtros avançados na Biblioteca de Conhecimento.
- [x] Implementar assistente de IA na Biblioteca para resumos de NRs e recomendação de cursos.
- [x] Criar painel de progresso visual na Biblioteca para monitorar cursos e vídeos iniciados, em andamento ou concluídos.
- [x] Criar wireframes de alta fidelidade para a Gestão de EPIs e fichas de entrega automatizadas.
- [x] Adicionar exportação de fichas de entrega de EPIs em formato PDF formatado para auditorias.
- [x] Implementar assistente de inteligência artificial para sugerir EPIs baseados no cargo e nos riscos da função.
- [x] Criar histórico detalhado no perfil de cada funcionário com todos os EPIs recebidos, devolvidos ou substituídos.
- [x] Implementar recurso de assinatura digital para os funcionários assinarem fichas de EPI diretamente na plataforma.
- [x] Adicionar painel de controle para monitorar validade de EPIs com alertas visuais de reposição ou troca.
- [x] Criar wireframes iniciais do módulo de Saúde Ocupacional para exames médicos periódicos e emissão de ASO.
- [x] Adicionar opção de gerar QR Code na entrega de EPI para funcionários assinarem diretamente pelo celular.
- [x] Criar painel visual no módulo de saúde ocupacional com alertas de exames e ASOs pendentes.
- [x] Adicionar sugestão automática de periodicidade de exames com base nos riscos da função.
- [x] Implementar tela de confirmação no celular após leitura do QR Code com detalhes de EPIs antes da assinatura.
- [x] Implementar animação de sucesso com ícone animado e feedback visual após a assinatura do EPI via QR Code no celular.
- [x] Adicionar opção de baixar o comprovante digital oficial da entrega de EPI em formato PDF formatado diretamente pelo celular.
- [x] Evoluir o dashboard principal com gráficos dinâmicos e atrativos baseados em indicadores reais.
- [x] Diferenciar as visualizações prioritárias dos ambientes Prestador de Serviço e Empresa.
- [x] Validar responsividade, estados vazios, tooltips, interações e acessibilidade dos gráficos.
- [x] Criar testes automatizados para os cálculos e a apresentação dos indicadores do dashboard.
- [x] Analisar a referência Excel do dashboard de Empresa e registrar os padrões visuais, indicadores e interações relevantes.
- [x] Mapear quais elementos da referência podem ser incorporados ao Portal TST usando somente dados reais do ambiente Empresa.
- [x] Implementar, após validação da referência, os aprimoramentos selecionados no dashboard Empresa.
- [x] Corrigir a exibição do módulo Controle de EPIs na navegação do ambiente Empresa e preservar o contexto ativo na rota.
- [x] Adicionar teste para garantir que o módulo de EPIs fique acessível no ambiente Empresa sem expor rotas indevidas em outros contextos.
- [x] Validar visualmente a entrada do módulo de EPIs no dashboard e na barra lateral da Empresa.
- [x] Redesenhar o cabeçalho do dashboard para reduzir a área escura e aliviar a fadiga visual.
- [x] Reestruturar os cartões de indicadores com hierarquia, contraste e densidade mais equilibrados.
- [x] Validar a revisão visual em desktop e mobile, incluindo contraste e estados sem dados.
- [x] Atualizar os testes e salvar checkpoint da nova direção visual.
- [x] Criar gradientes ricos, transparências em vidro (backdrop-blur) e cartões com profundidade dinâmica para o dashboard.
- [x] Adicionar indicadores de tendência, microinterações e gráficos imersivos.
- [x] Validar a nova experiência visual em desktop e mobile e cobrir com testes.
- [x] Salvar checkpoint e disponibilizar a nova versão imersiva do portal.
- [x] Corrigir o loop de entrada de login e estabilizar o retorno do callback OAuth.
- [x] Impedir redirecionamento infinito quando a sessão ou o callback falhar.
- [x] Cobrir com testes o fluxo de login, logout, callback e erro de autenticação.
- [x] Validar no navegador a entrada do portal após autenticação e salvar checkpoint da correção.
- [x] Confirmar no ambiente TST Empresa a visibilidade do módulo Controle de EPIs na barra lateral e nos atalhos do dashboard.
- [x] Mapear os indicadores reais do ambiente Empresa para uma visão operacional inspirada no dashboard Excel enviado.
- [x] Adicionar gráficos dinâmicos de status, pendências, treinamentos, inspeções e ações no dashboard Empresa sem inventar métricas.
- [x] Validar filtros, interações, estados sem dados, responsividade e acessibilidade dos novos gráficos.
- [x] Executar testes e salvar checkpoint da evolução do dashboard Empresa.
- [x] Remover a barra lateral de módulos da tela de escolha de perfil e ambiente.
- [x] Redesenhar a entrada com diferenças claras entre Prestador de Serviço e Empresa, usando transparência, profundidade e cores confortáveis.
- [x] Adicionar microinterações, ações de escolha e responsividade sem transformar a tela em dashboard.
- [x] Validar visualmente a nova entrada em desktop e mobile e salvar checkpoint.
- [x] Adicionar transições suaves e efeitos de hover/seleção aos cartões de perfil.
- [x] Implementar a opção opcional de lembrar a escolha do perfil no navegador, com possibilidade de alterar ou limpar a preferência.
- [x] Validar acessibilidade, responsividade, reduced motion e persistência da preferência.
- [x] Executar testes e salvar checkpoint da melhoria da entrada de perfis.
- [x] Adicionar botão de troca rápida de perfil no menu principal e topo do dashboard, com opção de zerar ou alterar a escolha lembrada.
- [x] Redesenhar os gráficos do dashboard com uma composição visualmente rica, usando transparências em camadas, gradientes fluidos e indicadores de tendências e status.
- [x] Validar a interatividade, as microinterações e a responsividade em desktop e mobile.
- [x] Salvar checkpoint e entregar a nova experiência visual expressiva.
- [x] Criar diretrizes de cores e kit de identidade visual para temas claro e escuro do TST Brasil Hub.
- [x] Gerar versão simplificada do logotipo e favicon baseados na nova identidade.
- [x] Atualizar a tela de login e escolha de perfil com a nova marca TST Brasil Hub.
- [x] Validar responsividade, testes e salvar checkpoint final.
- [x] Diagnosticar e corrigir o erro `invalid oauth state` no retorno do login OAuth.
- [x] Adicionar botão de logout visível e seguro no dashboard.
- [x] Implementar animações de carregamento fluidas para os dados do TST Autônomo.
- [x] Criar a seção de perfil no dashboard com edição de dados pessoais e preferências.
- [x] Auditar e documentar a lógica do gerador de certificados HTML enviado.
- [x] Criar interface premium do gerador de certificados integrada ao ambiente ativo.
- [x] Preservar seleção de NR, cursos, validade, marca d'água, logo e geração PDF frente/verso.
- [x] Integrar o gerador ao módulo de Certificados com contexto de workspace e estados de sucesso/erro.
- [x] Criar testes automatizados e validar visualmente o novo módulo de certificados.
- [x] Garantir visibilidade e acesso explícito ao gerador de certificados no ambiente Empresa (TST CLT).
- [x] Validar no navegador a visão de Documentos do TST Autônomo por cliente com certificado real vencido ou próximo.
- [x] Registrar evidência observável da rota ou captura que mostre o status documental por cliente.
- [x] Testar o fluxo completo de emissão de certificado no módulo integrado (prévia, PDF frente e verso, QR Code e acervo).
- [x] Permitir personalização de cor de fundo, paleta e logotipo da empresa no gerador de certificados.
- [x] Adicionar envio do PDF do certificado gerado para o e-mail do funcionário/participante (Explicitamente adiado por falta de provedor e remetente).
- [x] Criar testes automatizados para os controles de personalização visual do certificado (concluído; envio por e-mail pendente por falta de provedor).
- [x] Criar testes automatizados para os controles de personalização visual do certificado.
- [x] Documentar os requisitos e o procedimento futuro para ativar o envio de certificados por e-mail.



- [x] Emitir certificado vinculado à empresa de homologação com data retroativa para testar status vencido e validar no acervo documental.

- [x] Adicionar NR-05 ao catálogo de certificados com cursos, validade e conteúdo programático sugerido.
- [x] Tornar o conteúdo programático editável pelo instrutor, preservando itens obrigatórios sugeridos e permitindo acréscimos.
- [x] Corrigir a pré-visualização para exibir frente e verso do certificado, incluindo o conteúdo programático editável.
- [x] Aplicar o conteúdo programático editável no verso do PDF e manter a persistência no acervo.
- [x] Adicionar testes e validar visualmente NR-05, edição do conteúdo e pré-visualização frente/verso.

- [x] Adicionar upload de assinatura digital do instrutor com aplicação automática na frente do certificado e na prévia.
- [x] Criar funcionalidade para salvar o conteúdo programático atual como modelo padrão (armazenado em localStorage por norma).
- [x] Garantir renderização do QR Code de validação no verso do PDF e na prévia interativa do verso.
- [x] Cobrir os novos recursos com testes automatizados e validar o build e a interface no navegador.

- [x] Criar painel de histórico operacional de certificados emitidos com busca por participante/CPF/norma e filtros de status.
- [x] Adicionar modal de detalhes e ação para gerar/baixar novamente o PDF do certificado registrado no acervo.
- [x] Implementar fluxo de reenvio por e-mail ou cópia de comprovante digital com confirmação visual.
- [x] Cobrir o histórico com testes automatizados e validar o build de produção.

- [x] Redesenhar a landing page para destacar o ecossistema completo do TST Brasil Hub (PGR, CIPA, EPIs, exames, biblioteca e certificados).
- [x] Adicionar seção interativa de explicação detalhada de como funciona para Prestador de Serviço e Empresa (CLT).
- [x] Criar a seção de Contato e Suporte com formulário de envio de dúvidas e orientações de atendimento.
- [x] Executar testes automatizados, verificar responsividade e publicar a nova landing page.

- [x] Criar componente de botão flutuante do WhatsApp com link direto para o suporte oficial em todas as páginas do portal.
- [x] Adicionar seção de Perguntas Frequentes (FAQ) na landing page cobrindo PGR, certificados, EPIs e perfis.
- [x] Executar suíte de testes automatizados e validar o build de produção.

- [x] Aprimorar a seção de contato por e-mail na landing page com instruções claras para envio de dúvidas e confirmação visual robusta.

- [x] Adicionar campo de seleção de assunto (Suporte, Vendas, Dúvidas) no formulário de contato da landing page.
- [x] Atualizar todos os números de WhatsApp e links de suporte para o número oficial 54999097610.
- [x] Executar suíte de testes e validar o build de produção.

- [x] Criar a habilidade reutilizável tst-hub-evolution-workflow para padronizar o desenvolvimento, homologação e suporte de plataformas SaaS de SST.

- [x] Conduzir auditoria de prontidão do portal para testes por usuários terceiros (link público, Stripe sandbox, webhook, isolamento e suporte via WhatsApp).

- [x] Definir estrutura comercial de planos (mensal, trimestral, anual) com sugestão de valores, descontos e descrições para o Stripe.

- [x] Criar tabela comparativa de ciclos (Mensal, Trimestral, Anual) destacando que a entrega é integral e o foco é o desconto progressivo.

- [x] Atualizar o hero da landing page com verde translúcido em camadas (glassmorphism/gradient) e imagem de fundo temática de Segurança do Trabalho com tratamento escuro e legível.

- [x] Implementar animações de entrada suaves e refinadas para textos, imagem de fundo e painel do hero.
- [x] Aprimorar o contraste e adicionar micro-interações de hover e foco nos botões de ação do hero.
- [x] Otimizar o comportamento da imagem de fundo e do vidro fosco em dispositivos móveis (mobile).

- [x] Criar modal de visualização prévia do PDF do certificado com navegação e download.
- [x] Implementar marcas d'água visuais dinâmicas por NR no certificado, mantendo legibilidade e alta resolução.
- [x] Adicionar testes automatizados para o modal de prévia e catálogo de marcas d'água.
- [x] Verificar build e salvar checkpoint da nova versão do gerador de certificados.

- [x] Remover QR Code do certificado, da prévia, do PDF e dos textos de validação por enquanto.
- [x] Substituir as marcas d'água abstratas por imagens temáticas coerentes e discretas por NR.
- [x] Persistir a identidade visual da empresa e reaplicá-la automaticamente nas próximas emissões.
- [x] Adicionar impressão direta ao modal de pré-visualização do certificado.
- [x] Criar testes para identidade visual, remoção do QR Code, impressão e novas marcas d'água.
- [x] Validar testes, build e salvar checkpoint da nova versão.

- [x] Criar galeria de temas visuais alternativos de marca d'água por NR.
- [x] Permitir que o instrutor selecione variações de estilo (Fotografia temática, Contorno industrial, Painel técnico, Fundo minimalista).
- [x] Atualizar o gerador em PDF e a pré-visualização interativa para respeitar a variação escolhida.
- [x] Adicionar testes automatizados e validar build e interface.

- [x] Adicionar upload de imagem personalizada para marca d'água (separado do logo institucional).
- [x] Implementar validação de arquivo, prévia e opção de remover para voltar à imagem temática da NR.
- [x] Integrar a imagem customizada à galeria de estilos, prévia HTML e PDF frente/verso.
- [x] Atualizar suíte de testes, validar build e interface.

- [x] Executar teste controlado do Gerador de PGR com dados fictícios, preencher etapas e exportar PDF para revisão.

- [x] Incluir capa personalizada, sumário automático, matriz de riscos e plano de ação no PDF gerado.
- [x] Criar interface de seleção modular para o usuário escolher quais seções incluir na exportação do PGR.
- [x] Atualizar testes automatizados e validar build de produção sem regressões.

- [x] Auditar a estrutura do PGR-MIRAMAR.pdf (capa, controle de revisão, identificação da empresa e da contratada, GHE, matriz de riscos, plano de ação e assinaturas).
- [x] Incorporar na exportação PDF do Portal TST a renderização completa das seções do PGR (capa institucional com logo, sumário dinâmico, identificação completa, inventário GHE, matriz de riscos e plano de ação estruturado).
- [x] Validar a integridade dos testes automatizados e o build de produção após a evolução da exportação do PGR.

- [x] Executar validação prática do Gerador de PGR preenchendo dados fictícios, exportando o PDF nativo e comparando paginação, capa, tabelas, matrizes e assinaturas com os arquivos de referência fornecidos.

- [x] Ajustar a capa do PGR para reproduzir os elementos legais dos exemplos: logotipos, local/data, aviso de guarda documental, declaração de assinatura eletrônica, responsável técnico e quadro de versão/identificação/revisão.
- [x] Garantir que a primeira página e o controle de revisão reflitam a identidade visual e os campos configuráveis da empresa/consultoria.
- [x] Validar e documentar o mapa de risco: o PDF deve informar claramente quando a planta e os círculos ainda não foram cadastrados, sem apresentar a área vazia como mapa final completo.
- [x] Reexportar o PGR de homologação após os ajustes e repetir a comparação visual com os dois PDFs de referência.

- [x] Implementar na capa do PGR os elementos legais dos documentos de referência: faixa superior com logotipos da empresa e da consultoria, título formal, local, mês/ano, aviso de guarda documental por 20 anos, declaração de assinatura eletrônica e quadro de versão/identificação/revisão.
- [x] Adicionar suporte a upload e persistência de imagens reais do mapa de risco e gráficos de matriz visual para renderização direta no relatório exportado.
- [x] Criar modal e fluxo de pré-visualização (preview) rica na interface do portal, permitindo inspecionar o documento formatado antes do download definitivo.
- [x] Executar suíte completa de testes automatizados e validar o build de produção com as novas melhorias visuais e funcionais.

- [x] Reestruturar a página de Controle de EPIs transformando-a em um centro operacional com barra lateral dedicada (sidebar interna) separando as visões: Visão Geral, Estoque e CAs, Entregas e Assinatura Digital, Fichas de EPI por Funcionário, Devoluções e Substituições, e Alertas de Validade.
- [x] Remover Acompanhamento SST / Ocorrências da lista secundária de EPIs e integrá-lo ao Dashboard principal (ou painel dedicado de acompanhamento) com alertas visuais e estatísticas críticas.
- [x] Atualizar a suíte de testes automatizados e verificar o build de produção.

- [x] Implementar sistema de busca textual e filtros avançados no Centro Operacional de EPIs para localizar equipamentos por nome, número de CA ou requisito de função.
- [x] Aprimorar a geração de PDF do recibo de entrega em pdfReports.ts para estruturá-lo como uma Ficha de Entrega e Devolução formal pronta para a assinatura física e digital do funcionário.
- [x] Adicionar gráficos interativos no Dashboard Principal para visualizar o status das ocorrências SST e o nível de estoque dos EPIs.
- [x] Executar suíte completa de testes automatizados e validar o build de produção.

- [x] Implementar alertas visuais e acionáveis no Dashboard Principal para notificar automaticamente sobre EPIs com estoque baixo ou Certificados de Aprovação (CA) próximos do vencimento.
- [x] Adicionar fluxo de assinatura digital na plataforma para a Ficha de Entrega de EPI, salvando o comprovante/recibo assinado no perfil e histórico documental do funcionário.
- [x] Executar suíte completa de testes automatizados e validar o build de produção.

- [x] Criar um painel dedicado no perfil/histórico do funcionário para visualizar, baixar e gerenciar todas as Fichas de Entrega de EPI assinadas digitalmente.
- [x] Executar suíte completa de testes automatizados e validar o build de produção.

- [x] Criar alerta visual no painel do funcionário para destacar rapidamente fichas de EPI pendentes de assinatura digital.
- [x] Implementar ação de registrar devolução ou troca de EPI direto no painel do funcionário, atualizando o estoque automaticamente.
- [x] Adicionar filtros de data e status de assinatura no painel do funcionário.
- [x] Executar suíte completa de testes automatizados e validar o build de produção.

- [x] Auditar e adaptar a estrutura funcional do HTML enviado para o padrão React/tRPC do Portal TST.
- [x] Criar o módulo Assistant CIPA com formulário de empresa, composição, cronograma eleitoral e sugestão de dimensionamento.
- [x] Integrar o Assistant CIPA à navegação contextual dos ambientes Prestador de Serviço e Empresa.
- [x] Implementar a geração e o gerenciamento visual dos documentos da CIPA sem dados fictícios persistidos.
- [x] Validar responsividade, acessibilidade, permissões por workspace e cobertura automatizada do módulo Assistant CIPA.
- [x] Publicar checkpoint da integração do Assistant CIPA e registrar instruções de homologação.

- [x] Adicionar seção de histórico de documentos gerados na sessão para visualização e re-download a qualquer momento.
- [x] Personalizar a exportação em PDF para incluir identidade visual do TST Brasil Hub, cabeçalho profissional e espaço dedicado à logo da empresa.
- [x] Adicionar tooltips interativos nos campos de grau de risco e número de empregados com orientações detalhadas da NR-04 e NR-05.
- [x] Atualizar testes automatizados, verificar build de produção e publicar checkpoint da nova evolução.

- [x] Implementar calendário interativo de reuniões ordinárias mensais da CIPA com agendamento, status e lembretes visuais.
- [x] Implementar importação de planilhas de funcionários (CSV/TXT) para preencher a lista de votação e o cadastro de candidatos.
- [x] Atualizar suíte de testes automatizados com validação para o calendário e a importação de planilhas.
- [x] Publicar checkpoint da evolução e registrar instruções de homologação.

- [x] Implementar geração automática de ata de reunião em PDF para encontros concluídos da CIPA.
- [x] Implementar exportação do calendário de reuniões para arquivo iCalendar (.ics).
- [x] Atualizar suíte de testes unitários com validação para atas e formato .ics.
- [x] Publicar checkpoint da evolução e registrar instruções de homologação.

- [x] Implementar suporte para anexar fotos de inspeções e documentos nas reuniões e atas de CIPA.
- [x] Criar widget no painel principal (WorkspaceOverview) com próximas reuniões e tarefas da CIPA.
- [x] Atualizar testes unitários e verificar build de produção.
- [x] Publicar checkpoint final e registrar instruções de homologação.

- [x] Implementar alertas visuais de urgência no widget da CIPA para reuniões nos próximos 3 dias.
- [x] Atualizar suíte de testes e verificar build de produção.
- [x] Publicar checkpoint final e registrar instruções de homologação.

- [x] Implementar top bar de painéis temáticos (Resumo, CIPA, EPIs, Inspeções e Documentos) na Visão Geral.
- [x] Compactar o dashboard principal para priorizar alertas críticos e reduzir a rolagem excessiva.
- [x] Atualizar testes unitários e verificar build de produção.
- [x] Publicar checkpoint final e registrar instruções de homologação.

- [x] Implementar badges vermelhos de notificação nas abas da top bar para EPIs, CIPA e Documentos.
- [x] Adicionar botões de ação rápida (*Resolver* ou *Marcar como lida*) nos alertas críticos do Resumo.
- [x] Implementar filtro global de período na top bar com sincronização em todos os painéis e gráficos.
- [x] Atualizar testes unitários e verificar build de produção.
- [x] Publicar checkpoint final e registrar instruções de homologação.

- [x] Implementar sistema de customização do painel de Resumo com reordenação e visibilidade de widgets.
- [x] Persistir preferências de layout por workspace no navegador com opção de restaurar o padrão.
- [x] Atualizar testes unitários e verificar build de produção.
- [x] Publicar checkpoint final e registrar instruções de homologação.

- [x] Ampliar tamanhos e contraste da tipografia na Visão Geral (dashboard e top bar) para garantir leitura confortável.
- [x] Atualizar testes unitários, verificar build de produção e capturar prova visual.
- [x] Publicar checkpoint final da melhoria de acessibilidade tipográfica.

- [x] Ajustar posicionamento e margens dos badges de notificação na top bar da Visão Geral para eliminar o corte visual.
- [x] Validar testes unitários, build de produção e captura de tela.
- [x] Publicar checkpoint final da correção visual dos badges.

- [x] Adicionar campo dedicado de busca por funcionário no Centro Operacional de EPIs.
- [x] Criar armário de arquivo físico visual para fichas de EPI arquivadas com gavetas, status e ações claras.
- [x] Atualizar testes unitários, verificar build de produção e capturar prova visual.
- [x] Publicar checkpoint final da melhoria do centro de EPIs.

- [x] Exibir estado de acesso negado no Centro Operacional de EPIs quando o workspace informado na URL não pertence ao usuário autenticado.
- [x] Atualizar a documentação de homologação do dashboard, CIPA e armário de fichas de EPI.
- [x] Publicar checkpoint final da melhoria do centro de EPIs.

- [x] Adicionar filtro por setor no arquivo de fichas de EPI.
- [x] Adicionar filtro por função no arquivo de fichas de EPI.
- [x] Manter a ficha completa do funcionário recolhida até a abertura explícita da gaveta.
- [x] Implementar rolagem automática e expansão animada até a gaveta aberta.
- [x] Atualizar testes, validar a interface em desktop/mobile e publicar a nova versão.

- [x] Corrigir a renderização do arquivo de fichas para ocultar completamente a ficha do funcionário quando nenhuma gaveta estiver aberta.
- [x] Validar o ciclo abrir → rolar até a ficha → fechar e confirmar que a ficha desaparece novamente.
- [x] Atualizar testes, revisar responsividade, executar build e publicar a correção.

- [x] Adicionar botão explícito de “Fechar gaveta” dentro da ficha expandida.
- [x] Persistir busca e filtros do arquivo de fichas por empresa no navegador e restaurá-los ao recarregar.
- [x] Adicionar animação de carregamento suave durante a abertura da gaveta.
- [x] Atualizar testes, validar desktop/mobile, executar build e publicar a melhoria.

- [x] Padronizar o rótulo de navegação e títulos de “Visão Geral” para “Dashboard” no Prestador de Serviço e na Empresa.
- [x] Revisar e esclarecer a apresentação do módulo Estrutura e Equipe nos dois ambientes, mantendo seu propósito operacional compartilhado.
- [x] Atualizar testes e documentação, validar os dois contextos, executar build e publicar a padronização.

- [x] Remover o balão expansivo do WhatsApp que cobre conteúdo da interface.
- [x] Manter um acesso discreto ao suporte sem obstruir elementos em desktop ou mobile.
- [x] Atualizar testes, validar responsividade, executar build e publicar a correção.

- [x] Auditar e reorganizar o módulo COPSOQ-III em abas claras: Preenchimento do Questionário, Acompanhamento de Respostas e Resultados e Relatórios.
- [x] Melhorar o design e a clareza dos passos, eliminando a poluição visual e orientando o preenchimento por dimensões psicossociais.
- [x] Validar e testar a exportação de resultados em PDF e CSV.
- [x] Atualizar testes unitários, executar build de produção e verificar responsividade.

- [x] Adicionar barra de pesquisa e filtros na aba de Acompanhamento & PGR.
- [x] Permitir customização de logotipo e rodapé nos relatórios em PDF gerados na aba Planos de Ação.
- [x] Implementar gráficos de radar interativos na aba Resultados & Indicadores.
- [x] Atualizar testes, validar build de produção e revisar visualmente.

- [x] Corrigir a persistência do formulário do PGR: dados preenchidos devem permanecer ao sair e reabrir o mesmo projeto.
- [x] Revalidar isolamento entre projetos e confirmar que o PDF usa os dados persistidos após reabertura.

- [x] Implementar preenchimento assistido por IA para sugerir inventários de GHE e perigos com base na atividade econômica.
- [x] Implementar upload e gerenciamento de fotos e laudos complementares na aba de Identificação do PGR.
- [x] Atualizar testes unitários, exportação PDF e validação de build de produção.

- [x] Implementar inserção com um clique das sugestões de GHE da IA no inventário do PGR com revisão humana e proteção contra duplicidades.

- [x] Adicionar o módulo Marketplace ao final da barra lateral para ambos os perfis (Prestador e Empresa).
- [x] Criar a página de pré-lançamento do Marketplace com mensagem de construção, carinha feliz e caixa de feedback interativa.

- [x] Adicionar animação de sucesso fluida e mensagem de agradecimento dedicada após o envio do feedback no Marketplace.

- [x] Atualizar o módulo Biblioteca com cards menores, capas ilustradas e catálogo completo de Normas Regulamentadoras (NRs).
