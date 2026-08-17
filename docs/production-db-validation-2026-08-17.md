# Validação de banco em produção — 17/08/2026

## Alteração aplicada

- A variável `DATABASE_URL` foi atualizada no serviço `tst-brasil-hub` no Render com a conexão TiDB do projeto.
- O Render confirmou a atualização das variáveis de ambiente e o serviço foi reiniciado em seguida, às 18:59 (GMT-3).

## Verificação inicial do banco

- O banco TiDB está acessível a partir do projeto e contém as tabelas operacionais esperadas, incluindo `users`, `workspaces`, `workspace_members`, `subscriptions`, `companies`, `pgr_projects`, `employees` e módulos de EPI.
- A tabela `__drizzle_migrations` existe, porém não contém registros. Como as tabelas do schema já existem, não é seguro reaplicar automaticamente os arquivos SQL históricos sem uma comparação de schema e estratégia de baseline.

## Leitura dos logs e estado do portal

Os logs filtrados por `DATABASE_URL` exibem avisos de contingência em memória entre 18:48 e 18:50, ou seja, antes da atualização e reinicialização das 18:59. Ainda não havia uma nova solicitação autenticada após o reinício para produzir uma evidência pós-alteração. A landing page pública respondeu normalmente após a atualização e o modal de acesso direto por e-mail e senha foi disponibilizado sem erro de carregamento.

O formulário de login do administrador mestre foi preenchido no ambiente de produção para gerar uma chamada autenticada posterior ao reinício. O envio ainda depende de confirmação explícita para não iniciar uma sessão administrativa sem autorização imediata.

Após a confirmação, o login do administrador mestre foi concluído com sucesso e a aplicação navegou para `/app`, exibindo a tela de seleção dos ambientes Prestador de Serviço e Empresa. Não houve retorno ao modal de login, nem aviso de indisponibilidade de banco na interface.

Uma consulta direta ao TiDB não retornou o registro do administrador. Isso impede concluir a persistência apenas pela navegação: o próximo passo é inspecionar o ambiente efetivo do processo no Render para confirmar que `DATABASE_URL` foi realmente carregada após o reinício, sem expor a credencial.

O Web Shell da instância ativa do Render foi aberto para executar apenas uma verificação booleana da presença de `DATABASE_URL`, sem imprimir a URL ou qualquer segredo.

Foi enviada ao terminal uma checagem que retorna somente `DATABASE_URL_SET` ou `DATABASE_URL_MISSING`. O resultado está sendo aguardado para confirmar o ambiente efetivamente carregado pelo processo de produção.

O terminal remoto aceitou o texto, mas não retornou a execução pelo canal interativo disponível nesta sessão. Como a variável foi salva usando a opção sem deploy, a próxima medida é disparar uma implantação do commit atual no Render para garantir que a nova configuração de ambiente seja incorporada a uma instância recém-criada.

Às 19:05 (GMT-3), foi iniciado um novo deploy do commit `c186f71` no Render. Esta implantação é necessária para disponibilizar a configuração `DATABASE_URL` salva à nova instância do serviço.

O build do Render concluiu a compilação da aplicação sem erro. Foram observados apenas avisos de variáveis analíticas opcionais não configuradas (`VITE_ANALYTICS_ENDPOINT` e `VITE_ANALYTICS_WEBSITE_ID`) e de tamanho de bundle; eles não bloqueiam a implantação nem a conexão com o banco.

Os logs do deploy confirmaram a execução de `pnpm run start`, a inicialização do serviço Node e a abertura do servidor na nova instância. A validação seguinte será uma autenticação nova seguida de uma leitura direta no TiDB.

Após o envio da instrumentação de conexão ao GitHub, o painel do Render ainda apontava para o commit anterior `c186f71`. Será iniciado um novo deploy manual do commit mais recente para que os logs revelem, de forma segura, o resultado efetivo da validação TiDB.

O Render iniciou o deploy do commit `70b1973`, que contém a validação `SELECT 1` e os logs seguros de conexão. Acompanhar a inicialização dessa versão permitirá distinguir entre variável ausente, falha de TLS/credencial e conexão confirmada.

O build da versão `70b1973` foi concluído sem falhas e o Render iniciou a nova instância. Os mesmos avisos analíticos opcionais e de tamanho de bundle permaneceram não bloqueantes.

Os logs passaram à etapa `pnpm run start` na nova instância. A próxima chamada autenticada ao portal acionará a validação de banco e registrará o resultado seguro no log de aplicação.

A consulta histórica dos logs confirmou que, antes desta rodada, o processo executava em contingência: `DATABASE_URL ausente` e operações de usuário simuladas em memória. Os resultados exibidos nessa busca são anteriores ao deploy de `70b1973`; a confirmação da instância atual seguirá após atualização dos logs e nova chamada ao portal.

Após acionar o painel autenticado, a tela de logs ainda retornou somente a instância antiga identificada como `[4htjh]`. Portanto, não é possível concluir a validação até que o deploy `70b1973` seja marcado como ativo e seus logs sejam disponibilizados pelo Render.

O deploy `70b1973` foi marcado como ativo às 19:15 (GMT-3) e a aplicação foi chamada novamente pelo caminho `/app` para disparar a verificação de banco no processo atual. A interface apresentou estado inicial de carregamento durante essa chamada.

A página `/app` concluiu o carregamento na instância `70b1973`. Foi aberta uma nova consulta de logs filtrada por `Database` para registrar o resultado da operação no processo ativo.

Com autorização do administrador, foi iniciada a prova de persistência de workspace. O portal autenticado carregou a jornada de perfis e será usado para criar o ambiente principal de Prestador de Serviço antes de reiniciar novamente o serviço.

O ambiente `TST Brasil Hub — Administração` foi criado no perfil Prestador e aberto com sucesso no dashboard. O TiDB confirmou o registro `workspaces.id = 270001`, do tipo `autonomo`, pertencente ao administrador `19080001`, com vínculo `owner` correspondente em `workspace_members`.

O serviço `tst-brasil-hub` foi reiniciado no Render às 19:27 (GMT-3), após a gravação do ambiente. A próxima verificação abrirá novamente o dashboard e relerá o registro no TiDB para confirmar que a instância nova preservou o contexto.

## Estratégia de schema

O banco TiDB já contém as 31 tabelas descritas no schema atual e a validação `drizzle-kit check` foi aprovada. A pasta de snapshots histórica não possui os arquivos SQL correspondentes, portanto o comando legado `generate && migrate` não consegue reconstruir uma cadeia de migrações confiável e falha antes de qualquer DDL. A tentativa de `drizzle-kit push` foi interrompida de forma segura: a introspecção do TiDB interpretou chaves primárias existentes como ausentes e tentou reaplicá-las, resultando em `ER_MULTIPLE_PRI_KEY`; nenhuma tabela foi truncada. Para este banco existente, o comando operacional `db:push` agora executa somente `drizzle-kit check`. Alterações futuras de schema serão revisadas e aplicadas com SQL explícito e idempotente, em vez de depender de DDL automático incompatível.

Após a troca de instância, o navegador retornou ao painel `/app` usando a sessão já existente. Essa sessão comprova que a aplicação está disponível, mas não é suficiente para comprovar gravação no banco, pois a autenticação anterior pode ter sido emitida pelo modo de contingência. A validação de persistência seguirá por diagnóstico do processo e por consulta ao TiDB, sem criar ambiente de teste no portal sem nova autorização.

O painel de variáveis do Render continua exibindo `DATABASE_URL` como segredo configurado. O navegador preserva a sessão existente e o menu de saída não está exposto ao mecanismo de automação nesta tela, portanto a próxima validação será feita por observabilidade do backend e consulta ao banco, em vez de forçar uma sessão nova por uma ação não suportada pela interface automatizada.

## Pendências de validação

- Confirmar, nos logs pós-reinicialização, que não há mensagem de `DATABASE_URL` ausente, erro TLS ou erro de acesso ao TiDB.
- Validar, em produção, criação e permanência de um workspace após reinício do serviço.
- Corrigir a requisição de autenticação externa que ainda registra `project_id is required` nos logs, pois ela é independente da conectividade com o banco.

## Stripe — conta de teste correta

O diagnóstico da conta `acct_1U3LnQLIEYTVZdbw` mostrou que o catálogo estava vazio. Foram criados diretamente no Stripe, em modo de teste, três produtos com preços recorrentes em BRL: **Plano Mensal** (R$ 99,90 por mês), **Plano Trimestral** (R$ 269,70 a cada três meses) e **Plano Anual** (R$ 898,80 por ano). A próxima etapa é criar o desconto único de lançamento do mensal e confirmar a abertura de checkout de cada ciclo no portal.

O cupom de lançamento foi preparado com o identificador `portal_tst_launch`, desconto fixo de R$ 30,00 em BRL e duração única, preservando a regra comercial de R$ 69,90 na primeira cobrança mensal e R$ 99,90 nas seguintes.

O cupom foi criado no Stripe de teste e a variável `STRIPE_LAUNCH_COUPON_ID=portal_tst_launch` foi salva no Render. O serviço foi reiniciado às 19:56 (GMT-3) para carregar essa configuração antes da nova rodada de checkout.

Para tornar a homologação auditável, a aplicação agora registra, sem valores secretos, o plano, o preço selecionado, a presença do cupom e o identificador da sessão quando o Stripe cria o checkout. Se a criação falhar, o processo registra apenas o motivo e o contexto não sensível. A cobertura automatizada confirma os dois caminhos.
