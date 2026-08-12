# Validação visual do dashboard Empresa — 12/08/2026

A tentativa de capturar `/app/visao?workspace=180001` e `/app/operacao?workspace=180001` no preview mostrou o spinner de carregamento. Os logs de rede explicam o estado: o workspace 180001 retornou HTTP 403 com a mensagem `Você não possui acesso a este ambiente.` nos procedimentos `portal.operations`, `portal.planning`, `portal.certificates` e `portal.trainings`. Portanto, a captura não comprova a composição de dados reais de Empresa; ela comprova que a validação foi bloqueada por permissão e que o dashboard precisava de um estado de erro em vez de carregamento infinito.

A auditoria de código confirmou que o menu contextual do ambiente CLT contém `Controle de EPIs` com ícone `PackageCheck`, rota `/app/operacao`, e que os atalhos do dashboard Empresa também contêm o mesmo módulo com o texto `Entrega, estoque e ocorrências SST`. A nova Central de Pendências foi adicionada somente ao contexto Empresa e usa os agregados existentes de EPIs, ocorrências, documentos, inspeções, ações e treinamentos.

A validação local de TypeScript e dos testes específicos passou após as alterações. A validação final com uma sessão autenticada e workspace pertencente ao usuário ainda é necessária para confirmar o fluxo completo no navegador.
