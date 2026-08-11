# Validação do PGR Pro integrado

## Evidências verificadas

Em 11 de agosto de 2026, a cópia modernizada do Gerador de PGR foi aberta diretamente a partir do armazenamento do projeto e concluiu o login demo com sucesso. O dashboard, a navegação lateral, o catálogo de EPIs e os controles principais foram carregados sem erro de JavaScript observado no navegador.

Também foi validada a abertura com `portalAuth=1`: o gerador entrou diretamente no dashboard sem exigir um segundo login. Em seguida, a rota interna `/api/apps/pgr/1` foi acessada sem sessão e respondeu com a mensagem de autenticação obrigatória, confirmando que o aplicativo incorporado não é entregue pela rota protegida a usuários anônimos.

A versão destinada ao portal recebe o parâmetro `workspace` e prefixa as chaves locais iniciadas por `pgr`, separando o armazenamento local entre ambientes de trabalho. Quando `portalAuth=1` está presente, o login interno de demonstração é concluído automaticamente apenas para remover a duplicidade de acesso no iframe do portal.

A rota interna `/api/apps/pgr/:workspaceId` foi testada sem sessão e respondeu corretamente com bloqueio de autenticação. A rota também valida pertencimento ao ambiente e exige acesso de assinatura ativa ou perfil administrador antes de entregar o HTML do PGR.

## Limites para homologação final

A validação com usuário autenticado, ambiente criado e assinatura ativa depende da configuração final dos preços recorrentes e de uma conta de teste com acesso ao portal. Antes do lançamento, validar criação de ambiente, abertura do iframe autenticado, isolamento entre dois ambientes, autosave, geração Word/PDF e bloqueio após cancelamento de assinatura.

## Validação visual dos módulos compartilhados

As rotas autenticadas de Biblioteca e Certificados foram verificadas no preview. A Biblioteca apresenta a busca e seis materiais técnicos estruturais. Certificados mostra corretamente um estado vazio sem dados de usuários inventados e explica os próximos passos para registros reais. A navegação lateral não aparece nos screenshots de página inteira porque é um elemento fixo e a captura de página inteira o omite deliberadamente.

Após a evolução dos fluxos, Biblioteca continuou renderizando corretamente com ações de abertura de material; Certificados mostrou corretamente o bloqueio orientado quando não há ambiente criado, evitando registros fora de contexto. O cadastro persistente de certificado será exercitado quando houver um ambiente real na conta autenticada.

O módulo de Treinamentos foi incluído com persistência por ambiente, planejamento de cursos e estado vazio seguro. A validação visual confirmou que, sem ambiente criado, a tela apresenta o CTA `Criar ambiente` e mantém a navegação lateral disponível, sem criar registros fictícios.

O dashboard contextual foi validado em um estado sem ambiente selecionado. A tela informa que os indicadores dependem de registros reais e oferece o CTA `Escolher ambiente`, sem exibir números simulados.

Após o reinício do servidor, os logs recentes confirmaram inicialização normal do runtime e não registraram nova ocorrência do erro histórico de importação da camada de dados. A página pública foi renderizada novamente no preview sem falhas de runtime.

## Auditoria de runtime da camada de dados

O alerta antigo sobre `createCompanyForWorkspace` foi produzido antes da recompilação completa do servidor durante a migração do projeto para a estrutura full-stack. Para impedir nova resolução de exportação nomeada desatualizada, o roteador passou a carregar `server/db.ts` via importação de namespace (`portalDb`) e a extrair os helpers do módulo carregado. Após reinício limpo, as duas rotas que carregam a camada de dados responderam normalmente: `GET /api/apps/pgr/1` retornou `401 Autenticação necessária` e a chamada protegida `portal.workspaces` retornou `401 Please login (10001)`, sem nova ocorrência do erro no log atual. Isso confirma que o runtime atual atingiu a proteção de acesso, em vez de falhar ao importar `server/db.ts`.

## Validação da arquitetura de ambientes

A landing page foi revisada para apresentar o Portal TST como plataforma completa para a rotina do TST, sem posicionar o PGR como sua proposta central. A tela autenticada de entrada foi validada visualmente e agora mostra os caminhos TST Autônomo e TST CLT como contextos distintos, seguidos por seis ferramentas compartilhadas: Gerador de PGR, Biblioteca, Materiais, Suporte, Treinamentos e Certificados.

## Materiais e Suporte compartilhados

Foram adicionadas as tabelas `materials` e `support_tickets`, ambas indexadas por ambiente de trabalho e criadas por migração não destrutiva. As páginas autenticadas de Materiais e Suporte permitem, respectivamente, registrar modelos, checklists e procedimentos reais; e abrir chamados relacionados ao ambiente selecionado. A validação de interface confirmou os estados vazios quando não há ambiente criado. A validação automatizada passou a cobrir leitura isolada, bloqueio para ambiente sem vínculo, cadastro de materiais por gestor e abertura de chamados por membro.

## Cobertura de acesso ao PGR e assinatura

A suíte automatizada agora exercita a rota protegida do PGR nos cenários de ausência de autenticação, ausência de vínculo com o ambiente, assinatura sem acesso e assinatura ativa. Também cobre a persistência de ativação e cancelamento de assinatura a partir de eventos Stripe processados pelo servidor. A validação técnica local concluiu com 24 testes aprovados; a homologação com checkout e webhook reais continua dependente do sandbox Stripe.

Também foram incluídos testes isolados para a criação de checkout recorrente, o reaproveitamento de cliente Stripe, as URLs de retorno de sucesso e cancelamento, o portal de gestão de assinatura e a verificação de assinatura de webhook por payload assinado localmente. A suíte técnica local passou a conter 28 testes aprovados. A confirmação contra preços, credenciais e eventos entregues pelo sandbox permanece como etapa de homologação externa.

## Correção da jornada de ambientes

Foi identificado que o dashboard e o PGR tentavam extrair `workspace` do valor retornado por `useLocation`. Esse valor contém apenas o caminho, sem a query string, e fazia o portal interpretar um ambiente válido como ausente. A leitura passou a usar `useSearch`, e a navegação lateral, os atalhos do dashboard e os módulos compartilhados agora preservam `?workspace=ID`.

A validação no navegador confirmou que um cartão de ambiente existente abre seu dashboard, que o PGR reconhece o mesmo contexto e que o módulo de Materiais exibe o ambiente ativo correspondente. A tela inicial também passou a separar de forma explícita a ação de **abrir painel** da ação de **criar outro ambiente**. A criação efetiva de um novo ambiente continua sem dados de demonstração e deve ser conferida na próxima sessão de uso real.

O formulário de criação também foi aberto e fechado sem submissão para confirmar os rótulos, o contexto Autônomo e a ação final `Criar e abrir painel`. Nenhum registro foi criado durante essa verificação. A seleção de ambiente e a propagação de contexto foram confirmadas sem depender de dados fictícios.

## Ponte autenticada do iframe PGR

O aplicativo legado é exibido em um iframe e, em previews onde a sessão chega ao portal por cabeçalho, esse iframe não recebe automaticamente a credencial de autorização. Para manter a proteção sem depender de cookie, a abertura passou a usar uma autorização JWT curta, com escopo de usuário, ambiente e projeto PGR. A rota do aplicativo valida o ticket, o vínculo do usuário com o ambiente e a assinatura antes de entregar o HTML.

A emissão do ticket agora exige que o projeto pertença ao ambiente informado. A suíte local cobre a emissão, a rejeição de ticket inválido, o bloqueio para projeto fora de escopo e a entrega do PGR por ticket temporário sem cookie; a validação técnica local alcançou 40 testes aprovados. A abertura visual do aplicativo legado ainda requer um projeto PGR real no ambiente selecionado, que não foi criado automaticamente para evitar dados de demonstração.

## Correção da exceção React no PGR

O erro de console reportado foi identificado como `Rendered more hooks than during the previous render`. A consulta de autorização do iframe era executada somente depois de retornos condicionais de carregamento, ambiente e assinatura, o que alterava a ordem de hooks entre renderizações. A consulta foi movida para a seção estável de hooks do componente e é apenas habilitada quando existe um projeto PGR e acesso pago.

Após a correção, a página de PGR voltou a carregar o fluxo de empresa e projeto no ambiente selecionado sem a exceção React. A validação visual do iframe legado permanece pendente de um projeto PGR real, sem criação automática de dados de demonstração.

## Fluxo por empresa e entrada integrada

O PGR foi reorganizado para que a empresa atendida seja o ponto de partida. No ambiente validado, o card da empresa `pepsico` apresentou seu projeto PGR vinculado, a ação de envio de logo e o botão de abertura do gerador. A área de iframe começou a renderizar abaixo do card do projeto e a interface comunica que a entrada ocorre pelo Portal TST, sem um segundo login.

A nova versão do HTML legado foi enviada ao armazenamento do projeto e, quando recebe `portalAuth=1`, oculta a tela de e-mail e senha e inicia o container de PGR diretamente. A validação final deve confirmar o conteúdo completo do iframe após o carregamento da página, incluindo isolamento entre projetos e persistência do logo enviado pelo usuário.

Após o reinício do servidor, o iframe do projeto vinculado carregou o dashboard interno do PGR e exibiu `Portal TST` como contexto de acesso. A tela de e-mail e senha não apareceu no carregamento do aplicativo legado, confirmando a entrada integrada pelo portal.

Na inspeção visual do iframe, foi possível identificar o cabeçalho do aplicativo legado com o título `Dashboard` e a identificação `Portal TST`, sem o formulário de login. A ação interna de saída passou a ser ocultada no modo `portalAuth` e, caso seja chamada por uma interação antiga, não pode voltar a expor a tela de e-mail e senha.

A abertura da URL temporária do PGR diretamente no navegador encontrou uma indisponibilidade transitória do conector. Por isso, a última validação do iframe seguirá buscando uma resposta direta da rota e uma captura do conteúdo interno carregado; essa etapa permanece pendente no checklist.

Essa limitação foi superada com uma URL autorizada recém-gerada. A rota direta abriu `PGR Pro | Portal TST Brasil`, exibiu o dashboard funcional sem formulário de e-mail ou senha e apresentou o botão fixo **← Voltar ao Portal TST** no canto superior direito. A resposta da rota passa a injetar o modo de portal antes da renderização do HTML legado, de modo que mesmo uma versão estática anterior do aplicativo não pode reexibir a tela interna de login.

O retorno também foi validado no navegador. Ao acionar **← Voltar ao Portal TST**, a página navegou para `/app/pgr?workspace=60002`; após o carregamento, o Portal TST exibiu novamente a carteira de empresas do ambiente **Meu ambiente Autônomo**, o card da empresa e o PGR selecionado, sem reexibir o login legado. O controle do navegador reportou uma falha de conexão após iniciar o clique, mas a URL final e a tela autenticada carregada confirmaram a navegação esperada.

## Evidência direta do aplicativo legado

A abertura em tela cheia da URL autorizada do projeto foi concluída. O navegador exibiu a página `PGR Pro | Portal TST Brasil`, com o dashboard funcional, navegação de inventário e plano de ação, campos de edição e ações de salvar, visualizar, exportar Word e gráficos. A identificação do cabeçalho mostrou `Portal TST` e `Projeto vinculado ao ambiente ativo`; não foi solicitado e-mail ou senha. Esta validação confirmou a entrega do HTML legado pela rota autorizada e o funcionamento do gerador dentro do contexto selecionado.
