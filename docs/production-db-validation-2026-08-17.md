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

Após a troca de instância, o navegador retornou ao painel `/app` usando a sessão já existente. Essa sessão comprova que a aplicação está disponível, mas não é suficiente para comprovar gravação no banco, pois a autenticação anterior pode ter sido emitida pelo modo de contingência. A validação de persistência seguirá por diagnóstico do processo e por consulta ao TiDB, sem criar ambiente de teste no portal sem nova autorização.

O painel de variáveis do Render continua exibindo `DATABASE_URL` como segredo configurado. O navegador preserva a sessão existente e o menu de saída não está exposto ao mecanismo de automação nesta tela, portanto a próxima validação será feita por observabilidade do backend e consulta ao banco, em vez de forçar uma sessão nova por uma ação não suportada pela interface automatizada.

## Pendências de validação

- Confirmar, nos logs pós-reinicialização, que não há mensagem de `DATABASE_URL` ausente, erro TLS ou erro de acesso ao TiDB.
- Validar, em produção, criação e permanência de um workspace após reinício do serviço.
- Corrigir a requisição de autenticação externa que ainda registra `project_id is required` nos logs, pois ela é independente da conectividade com o banco.
