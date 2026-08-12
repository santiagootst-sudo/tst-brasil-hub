# Validação visual do Painel Administrativo

A rota `/admin` foi capturada em viewport desktop de 1280×900 e em viewport móvel de 390×844. O layout apresenta o hero em teal escuro, cartões de métricas com estados reais, busca, seleção de períodos, ações de renovação/desligamento e bloco de auditoria. Em móvel, o cabeçalho compacto, o empilhamento das métricas, os controles de busca e as ações por usuário permanecem legíveis e utilizáveis.

A captura foi realizada com os dados existentes no ambiente, sem criação de usuários ou registros fictícios. A base atual contém duas contas, uma conta comum e a conta administrativa do proprietário; os estados exibidos refletem os valores retornados pelo banco.

O painel usa a marca persistente do Portal TST no shell autenticado e mantém a distinção visual entre ação primária teal, estado ativo mint e ação destrutiva coral. A revisão visual independente sugeriu reforçar futuramente o símbolo da marca no shell e humanizar estados de dados incompletos, mas não identificou quebra de layout na implementação atual.

## Validação dos fluxos críticos

A primeira captura com IDs antigos exibiu corretamente os estados de seleção de ambiente, sem indicar erro de renderização. Após consultar a base, os IDs reais foram confirmados como Autônomo `120001`, CLT `150001` para o proprietário e CLT `30002` para outra conta. Com os IDs reais, o dashboard Autônomo exibiu a carteira de João Almeida, 1 cliente ativo, 2 entregas PGR e indicadores reais; o dashboard CLT exibiu o foco em pessoas, conformidade e operação, com estados vazios reais. A carteira comercial exibiu a empresa `nutrela`, PGRs vinculados e formulário de agenda; o PGR exibiu a empresa, dois projetos e o botão de abertura em tela cheia; a agenda e as inspeções exibiram seus formulários e estados atuais sem criar registros fictícios.

## Cenário sem vínculo ao workspace

Com a conta administrativa autenticada, o workspace real `30002` pertence a outra conta e não possui vínculo com o proprietário. A captura de `/app/visao?workspace=30002` exibiu o estado seguro de seleção de ambiente, sem indicadores nem dados de outra conta. Em contraste, os workspaces vinculados `120001` e `150001` exibiram seus dashboards Autônomo e CLT com dados e estados próprios. A evidência confirma o isolamento contextual do dashboard para o caso sem vínculo, sem alterar qualquer registro.
