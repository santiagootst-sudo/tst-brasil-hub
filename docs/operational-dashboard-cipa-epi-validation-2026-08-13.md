# Homologação operacional: dashboard, CIPA e Controle de EPIs

## Objetivo

Este registro consolida as evoluções recentes do TST Brasil Hub nas áreas de **Visão Geral**, **Assistant CIPA** e **Centro Operacional de EPIs**. O objetivo é preservar a intenção de produto, as regras de isolamento por ambiente e os critérios usados na validação visual e automatizada.

> O portal deve oferecer experiências diferentes para Prestador de Serviço e Empresa, mas manter uma base comum de segurança do trabalho. O ambiente ativo continua sendo a fronteira de acesso para empresas, pessoas, documentos, fichas e indicadores.

## Dashboard executivo

A página `WorkspaceOverview` passou a funcionar como uma visão executiva compacta. A barra superior fixa organiza os recortes **Resumo**, **CIPA**, **EPIs**, **Inspeções** e **Documentos**. O Resumo concentra os alertas críticos, o panorama do ambiente, as prioridades operacionais e o widget da CIPA, reduzindo a necessidade de rolagem para encontrar pendências.

Os badges de notificação utilizam contadores derivados dos registros reais do ambiente. Eles não devem ser preenchidos com dados fictícios. O filtro global de período é aplicado aos painéis temáticos, e o modo **Personalizar** permite ocultar, exibir e reordenar os widgets do Resumo. A preferência é persistida no navegador por workspace e pode ser restaurada ao layout padrão.

A escala tipográfica foi ampliada por meio do estilo `dashboard-readable`, com atenção especial a rótulos, indicadores e badges. A top bar possui margens internas suficientes para impedir o corte visual dos contadores em telas estreitas, mantendo rolagem horizontal quando necessário.

## Assistant CIPA

O Assistant CIPA está disponível nos ambientes Prestador de Serviço e Empresa. O fluxo guiado reúne os dados da empresa, grau de risco, número de empregados, composição inicial, dimensionamento orientativo conforme NR-04/NR-05, cronograma eleitoral, capacitação e prévias documentais.

O módulo mantém uma seção de histórico para consultar e baixar novamente documentos gerados na sessão. A exportação em PDF aplica a identidade visual do portal, reserva espaço para a logo da empresa e oferece geração de listas eleitorais, lista de candidatos e atas para reuniões concluídas. O calendário permite organizar as reuniões ordinárias, exportar eventos em `.ics` e destacar reuniões próximas ou pendências que exigem atenção.

Os tooltips de grau de risco e número de empregados foram mantidos como orientação de preenchimento. Eles devem ser interpretados como apoio operacional e não substituem a conferência do enquadramento legal pelo responsável técnico.

## Centro Operacional de EPIs

A página `client/src/pages/Operations.tsx` foi organizada como um centro operacional, com uma barra lateral interna que separa **Visão Geral**, **Estoque, CA e Fabricantes**, **Fichas de Entrega**, **Requisitos por Função**, **Fichas por Funcionário** e **Validades e Alertas**. Ocorrências SST permanecem fora da lista secundária de EPIs e são acompanhadas no dashboard e no módulo de inspeções e ações.

A aba **Fichas por Funcionário** contém uma busca dedicada por nome, matrícula, código ou CPF quando esse dado existir no registro. Também oferece filtros por status de assinatura e intervalo de datas. O componente visual `Armário de fichas arquivadas` comunica a metáfora documental por meio de uma área de arquivo, contadores de funcionários e pendências, gaveta expandível por pessoa e ações de consulta, devolução, troca e download do comprovante.

A abertura direta da aba pode ser usada durante a homologação pela query string `tab=employee_profile`, por exemplo:

```text
/app/operacao?workspace=<workspaceId>&tab=employee_profile
```

A aba não cria registros de funcionários ou fichas para preencher a tela. Quando não há colaboradores no ambiente, o armário apresenta estado vazio orientando o usuário a ajustar a busca ou os filtros. Quando o ambiente informado não pertence à conta autenticada, a página exibe um estado de acesso negado com retorno para a escolha de ambientes, sem repetir a consulta automaticamente.

## Validação realizada

| Área | Evidência | Resultado |
|---|---|---|
| Ordem dos hooks em `Operations.tsx` | `pnpm check` | Aprovado, sem erros de TypeScript após mover estados e mutações para antes dos retornos condicionais. |
| Suíte automatizada | `pnpm test` | Aprovado: 39 arquivos e 147 testes. |
| Build de produção | `pnpm build` | Aprovado na validação anterior ao ajuste final; deve ser repetido antes do checkpoint desta rodada. |
| Centro Operacional em estado vazio | Rota `/app/operacao?workspace=120001` | Aprovado visualmente em desktop e mobile, com empresa selecionada e contadores reais zerados. |
| Aba de fichas por funcionário | Rota com `tab=employee_profile` | Aprovada visualmente: busca, filtros, contadores e armário aparecem sem rolagem inesperada no desktop. |
| Responsividade | Captura em `375x812` | Aprovada visualmente: cabeçalho, indicadores, empresa em foco, navegação interna e cartões empilham de forma legível. |
| Workspace sem vínculo | Rota com workspace não autorizado | Aprovado após a correção: mensagem de acesso negado e botão de retorno substituem o spinner prolongado. |

## Critérios para a próxima homologação populada

A validação do estado expandido do armário deve ser executada com um usuário que possua vínculo com um ambiente contendo pelo menos um funcionário ativo e, preferencialmente, uma ficha assinada e uma pendente. A homologação deve verificar que a gaveta selecionada fica visível, que o status da ficha é compreensível, que o download usa os dados da pessoa correta e que a devolução ou troca atualiza o histórico e o estoque sem misturar empresas.

Não devem ser inseridos dados fictícios apenas para produzir uma captura. Caso o ambiente autorizado não possua registros, o estado vazio é a evidência correta. Para testar a gaveta populada, é necessário utilizar registros reais de homologação ou obter autorização explícita para criar dados de teste controlados.

## Arquivos principais

| Arquivo | Responsabilidade |
|---|---|
| `client/src/pages/WorkspaceOverview.tsx` | Dashboard executivo, top bar temática, badges, filtro global e personalização dos widgets. |
| `client/src/pages/Operations.tsx` | Centro Operacional de EPIs, busca de funcionários, armário de fichas e estados de acesso. |
| `client/src/pages/CipaAssistant.tsx` | Formulários guiados, calendário, documentos e exportações da CIPA. |
| `client/src/lib/summaryLayout.ts` | Normalização, visibilidade e reordenação dos widgets do Resumo. |
| `server/epi.navigation.test.ts` | Contratos textuais de navegação do módulo de EPIs e abertura direta da aba de fichas. |
| `client/src/index.css` | Tokens visuais e escala de legibilidade do dashboard. |
