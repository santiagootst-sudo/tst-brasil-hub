# Portal TST Brasil — Arquitetura-alvo e roteiro de evolução

## Decisão arquitetural recomendada

O Portal TST deve evoluir como um **monólito modular orientado a domínios**, mantendo React, tRPC, Express, Drizzle e MySQL/TiDB no mesmo repositório enquanto o produto consolida seus fluxos. A prioridade não é separar serviços por infraestrutura; é separar responsabilidades por negócio, manter cada registro vinculado a um ambiente de trabalho e preservar a possibilidade de extrair módulos no futuro sem reescrever regras críticas.

> **Princípio central:** TST Autônomo e TST CLT são experiências de operação distintas sobre o mesmo ecossistema de domínios. O contexto altera prioridades, linguagem e painel, mas não cria uma segunda plataforma nem duplica ferramentas. Na operação comercial, a conta terá **um único ambiente principal**; durante a fase de criação, a conta de desenvolvimento pode manter exatamente **um Autônomo e um CLT** para validar os dois cenários.

| Camada | Responsabilidade atual | Evolução recomendada |
|---|---|---|
| Interface | React, Tailwind e rotas autenticadas | Criar um contexto explícito de ambiente para evitar que páginas escolham silenciosamente o primeiro workspace disponível. |
| Aplicação | tRPC em `server/routers.ts` | Dividir os procedimentos por domínio sem alterar os contratos públicos durante a migração. |
| Domínio | Workspaces, PGR, capacitação, materiais, suporte e billing | Isolar regras de permissão, validação e transição de estado por domínio. |
| Persistência | Drizzle e MySQL/TiDB | Manter `workspaceId` como fronteira obrigatória de todos os dados operacionais. |
| Integrações | Manus OAuth, Stripe e armazenamento de PGR | Conter dependências de provedores em adaptadores próprios e cobri-las com testes locais. |

## Estrutura de código recomendada

Sem mudar imediatamente o comportamento do portal, a evolução deve deslocar o roteador e a camada de dados para módulos de domínio. A estrutura abaixo reduz acoplamento, mantém testes próximos às regras e facilita o crescimento do produto.

```text
server/
  domains/
    workspaces/
      workspace.router.ts
      workspace.repository.ts
      workspace.service.ts
      workspace.contract.ts
    pgr/
      pgr.router.ts
      pgr.repository.ts
      pgr-access.service.ts
      pgrLegacyRoute.ts
    learning/
      trainings.router.ts
      certificates.router.ts
      learning.repository.ts
    materials/
      materials.router.ts
      materials.repository.ts
    support/
      support.router.ts
      support.repository.ts
    billing/
      billing.router.ts
      stripe.gateway.ts
      subscription.service.ts
  _core/
    auth, trpc, express, ambiente e infraestrutura Manus
shared/
  contracts/
    workspace.ts
    pgr.ts
    learning.ts
    materials.ts
    support.ts
    billing.ts
```

O arquivo `server/routers.ts` permanece como ponto de composição do `appRouter`, importando routers de domínio. O arquivo `server/db.ts` deve ser gradualmente substituído por repositórios coesos, sem alterar a migração do banco nem o comportamento da interface. Essa abordagem é compatível com o estado atual e permite refatorar por domínio, com checkpoints entre cada etapa.

## Fronteiras de domínio e dados

| Domínio | Responsabilidade | Regra de isolamento | Papéis que podem alterar |
|---|---|---|---|
| Workspaces | Ambientes Autônomo e CLT, membros e empresas | Cada associação de usuário define acesso ao ambiente | `owner`, `manager` |
| PGR | Projetos, empresa associada e aplicativo legado | Projeto e chave de armazenamento vinculados ao workspace | `owner`, `manager` |
| Capacitação | Treinamentos e certificados | Registros pertencem a um workspace e, quando aplicável, a uma empresa | `owner`, `manager` |
| Materiais | Modelos, checklists e procedimentos reais | Material pertence ao ambiente que o cadastrou | `owner`, `manager` |
| Suporte | Chamados e futuras interações de atendimento | Chamado é exibido apenas no ambiente de origem | Todos os membros podem abrir; operação do status deve ser gerencial |
| Billing | Assinatura, plano e estado de acesso | Assinatura pertence ao usuário; acesso é aplicado na abertura de apps pagos | Provedor e regras do sistema |

## Regra de contextos por conta

O ambiente não representa cada empresa atendida. Ele representa a **forma de atuação profissional da conta**: o TST Autônomo usa um único ambiente para administrar sua carteira de clientes; o TST CLT usa um único ambiente para gerir a operação interna. Empresas, clientes, pessoas, documentos, PGRs e demais registros ficam organizados dentro de seu respectivo contexto, e não por meio da criação de vários ambientes do mesmo tipo.

| Situação | Comportamento do portal |
|---|---|
| Primeiro acesso sem ambiente | A interface apresenta as escolhas TST Autônomo e TST CLT. Cada escolha cria o contexto correspondente e abre seu painel. |
| Conta de desenvolvimento com um contexto | A entrada permite criar apenas o outro tipo de contexto para validar a segunda rotina. |
| Conta de desenvolvimento com dois contextos | A interface apresenta os dois contextos e permite alternância explícita por cards ou pela barra lateral. |
| Tentativa de duplicar Autônomo ou CLT | O procedimento protegido retorna conflito. O banco também garante unicidade por `ownerUserId` e `kind`. |
| Conta legada com ambientes duplicados | Registros produtivos permanecem preservados até que exista uma operação explícita de transferência; dados de teste só podem ser removidos com autorização expressa. |

Essa compatibilidade evita perda de dados enquanto o produto deixa de reforçar o modelo antigo. A transferência de empresas, projetos PGR ou registros de um ambiente legado para o principal deve ocorrer apenas por operação explícita e revisada, pois pode misturar contextos Autônomo e CLT indevidamente. Na base de desenvolvimento, os ambientes duplicados que continham apenas registros de teste foram removidos mediante autorização do usuário antes da aplicação da restrição por tipo. Antes do lançamento comercial, a exceção de desenvolvimento deve ser encerrada e a política final de ambiente único deve ser aplicada conforme a definição de produto.

## Prioridades que independem de autenticação externa

| Prioridade | Entrega concreta | Por que fazer agora | Dependência externa |
|---|---|---|---|
| P0 | Modularizar routers, contratos Zod e repositórios | Reduz o risco de crescimento do arquivo central e protege as interfaces antes de novos módulos | Nenhuma |
| P0 | Formalizar `workspaceId` como contexto ativo de navegação | Evita que páginas escolham o primeiro ambiente e torna a troca de contexto previsível | Nenhuma |
| P0 | Completar matriz de autorização por procedimento | Mantém owner, manager e member consistentes à medida que o portal cresce | Nenhuma |
| P1 | Evoluir Suporte com atualização de status por gestor | Converte o cadastro de chamados em fluxo operacional rastreável | Nenhuma |
| P1 | Criar Empresa, Equipe e funções de trabalho como módulos próprios | Fornece a base de dados necessária para PGR, treinamentos, certificados e indicadores | Nenhuma |
| P1 | Criar Inventário de Riscos e Plano de Ação | Conecta o PGR à gestão contínua, sem transformá-lo no centro da plataforma | Nenhuma |
| P2 | Criar Inspeções, ocorrências e indicadores de rotina CLT | Dá ao contexto CLT visão de conformidade e gestão do dia a dia | Nenhuma |
| P2 | Criar catálogo de serviços e materiais do Autônomo | Prepara a transição futura para marketplace sem acoplar pagamentos prematuramente | Nenhuma |
| P3 | Homologar checkout, webhook, cancelamento e PGR protegido | Valida a integração real de pagamento e o acesso com conta de teste | Sandbox Stripe e ambiente autenticado |

## Roteiro de documentação

| Documento | Conteúdo esperado | Momento recomendado |
|---|---|---|
| `architecture-roadmap.md` | Visão-alvo, fronteiras de domínio e sequência de evolução | Criado nesta etapa |
| `data-dictionary.md` | Entidades, campos de negócio, chaves de isolamento e retenção | Antes de Equipe e Inventário de Riscos |
| `authorization-matrix.md` | Procedimentos por papel e ações permitidas | Antes de ampliar membros, suporte e gestão CLT |
| `stripe-runbook.md` | Credenciais, preços, URLs, eventos, testes e plano de reversão | Antes da homologação Stripe |
| `quality-gates.md` | Critérios locais e externos para liberar módulo novo | Antes da primeira publicação comercial |
| ADRs | Decisões curtas sobre workspace, PGR legado, cobrança e marketplace | Sempre que uma escolha difícil for consolidada |

## Roteiro de qualidade local

Enquanto o acesso externo não está disponível, cada novo domínio deve cumprir os seguintes critérios antes de entrar na interface.

1. **Schema e migração:** a entidade possui `workspaceId` quando representa operação do cliente ou empresa, índices de consulta e migração revisada sem perda de dados.
2. **Contrato:** entradas e respostas são validadas por Zod e compartilhadas entre router, interface e testes quando houver reutilização.
3. **Autorização:** leitura exige vínculo com o ambiente; escrita declara de forma explícita se é permitida a membro, gerente ou proprietário.
4. **Interface:** existem estado de carregamento, vazio, erro e retorno ao hub de ambientes, sem conteúdo fictício.
5. **Testes:** a suíte cobre acesso autorizado, acesso negado, criação válida e uma transição crítica do domínio.
6. **Observabilidade:** erros de integração são registrados sem vazar dados sensíveis, e o procedimento consegue ser rastreado pelo workspace e usuário responsável.

## Marcos sugeridos

| Marco | Resultado mensurável |
|---|---|
| 1. Organização interna | Routers e contratos separados por domínio, sem mudança de rotas do cliente e com testes preservados. |
| 2. Contexto consistente | Todas as páginas operacionais recebem ou solicitam explicitamente o ambiente ativo. |
| 3. Gestão operacional | Empresas, equipe, riscos e plano de ação persistentes e isolados por ambiente. |
| 4. Gestão CLT ampliada | Inspeções, pendências, indicadores e acompanhamento interno disponíveis no dashboard CLT. |
| 5. Ecossistema Autônomo | Carteira, entregas, modelos, suporte e catálogo de serviços organizados para o profissional independente. |
| 6. Receita validada | Checkout, webhook, cancelamento e bloqueio de PGR homologados com o sandbox Stripe. |

## Limites atuais e decisão de execução

As pendências de homologação — login real, workspace real, checkout, webhook, cancelamento e bloqueio do PGR — devem permanecer sem dados de demonstração. A arquitetura, a modularização, a documentação, os testes locais e os novos domínios de produto podem avançar agora. Quando o acesso for disponibilizado, a homologação deve ser executada sobre os mesmos contratos e checklists já documentados, sem refazer a base funcional.
