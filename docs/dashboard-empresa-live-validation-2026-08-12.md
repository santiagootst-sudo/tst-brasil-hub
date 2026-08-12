# Validação publicada — ambiente Empresa — 12/08/2026

A landing page publicada em `https://tstportal-lhmdcupa.manus.space/` carregou corretamente e exibiu o Choice Hub com as opções Prestador e Empresa. A ação `Acessar Empresa` encaminhou para o fluxo oficial de autenticação em `https://manus.im/app-auth` com `redirectUri` apontando para o callback OAuth do Portal TST.

A tela de autenticação abriu no navegador, mas permaneceu em carregamento sem elementos interativos visíveis. A confirmação da sessão e a inspeção da barra lateral do ambiente Empresa dependem de autenticação do proprietário da sessão. O código do portal já mantém `Controle de EPIs` na navegação CLT e nos atalhos do dashboard; esta etapa publicada precisa ser concluída com a sessão autenticada para confirmar a renderização final.

## Confirmação autenticada

Após a sessão ser autorizada, o navegador abriu `/app/visao?workspace=30002` no contexto **TST CLT · Minha empresa**. A barra lateral exibiu `Controle de EPIs` em `/app/operacao?workspace=30002`, e os atalhos do dashboard exibiram `Controle de EPIs — Entrega, estoque e ocorrências SST` apontando para a mesma rota. O dashboard também exibiu a `Central de Pendências`, o estado vazio correto e os indicadores Empresa sem registros fictícios. A confirmação da abertura interna do módulo de EPI ainda pode ser feita clicando no item da barra lateral; a visibilidade e o vínculo de rota já foram observados no navegador autenticado.

## Abertura real do módulo de EPIs

No ambiente publicado `TST CLT · Minha empresa`, o item da barra lateral `Controle de EPIs` abriu corretamente `/app/operacao?workspace=30002`. A página carregou o título `Controle de EPIs`, a seção `Rotina operacional`, os quatro indicadores `estoque crítico`, `validade a tratar`, `reposições próximas` e `ocorrências abertas`, todos com valor zero real, e o estado vazio `Cadastre uma empresa antes de controlar a operação.`. Isso confirma a visibilidade, a rota contextual e o carregamento do módulo sem registros fictícios.
