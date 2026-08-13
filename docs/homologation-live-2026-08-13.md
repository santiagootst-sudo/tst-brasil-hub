# Homologação ao vivo — TST Brasil Hub — 13/08/2026

## Escopo autorizado

O usuário autorizou a criação de registros temporários para concluir os ciclos de homologação. A validação deve ocorrer pela interface do portal, preservando o isolamento por workspace e sem inserir dados por SQL. Os registros temporários deverão ser identificados e removidos ou revisados ao final, caso a interface disponibilize a operação.

## Ciclo 1 — acesso e pré-condições

| Verificação | Resultado | Evidência observável |
|---|---|---|
| Acesso ao Workspace Hub | Aprovado | `/app` abriu a escolha entre Prestador de Serviço e Empresa, com o ambiente Autônomo configurado. |
| Workspace selecionado | Aprovado | `/app/clientes?workspace=240001` abriu o ambiente `TST Autônomo · Meu ambiente Autônomo`. |
| Carteira inicial | Estado vazio esperado | Empresas e clientes mostrou `0` clientes ativos, `0` retornos em 30 dias e `0` visitas agendadas, orientando a abrir empresas e PGR. |
| Estrutura de clientes | Estado vazio esperado | `/app/estrutura?workspace=240001` mostrou `Cadastre uma empresa antes de estruturar a equipe` e encaminhou para empresas e PGR. |
| Gerador de PGR | Bloqueado legitimamente | `/app/pgr?workspace=240001` mostrou `Ative o PGR Pro para este ambiente` e `O acesso é liberado depois da confirmação da assinatura`. |
| Planos | Disponível | `/planos` exibiu PGR Pro, TST Autônomo e TST Empresa, com ativação condicionada a eventos de pagamento. Nenhum checkout foi iniciado. |

## Bloqueio atual para o ciclo de criação

A criação de empresa está acoplada à jornada do Gerador de PGR. Como o workspace `240001` não possui assinatura ativa do PGR Pro, a rota `/app/pgr?workspace=240001` interrompe a jornada antes do formulário de empresa. Por consequência, ainda não foi criado registro temporário, nem foi possível iniciar visita, certificado vinculado ou resumo documental por cliente.

A próxima ação necessária para continuar a homologação de criação é confirmar a ativação do plano de sandbox. Como essa ação abre um checkout/fluxo de pagamento, ela requer confirmação explícita do proprietário antes de ser executada.

## Testes automatizados de suporte

Antes do ciclo ao vivo, a suíte local apresentou 34 arquivos de teste e 128 testes aprovados. Essa cobertura confirma contratos e regras de domínio, mas não substitui a evidência manual dos ciclos empresa → PGR → visita → documento.

## Ciclo 1 — checkout e ativação de sandbox

O checkout Stripe de sandbox do plano **PGR Pro** foi aberto a partir de `/planos`. Após a confirmação do usuário, foram usados exclusivamente dados sintéticos e o cartão oficial de teste `4242 4242 4242 4242`. O primeiro envio solicitou telefone; após preencher o telefone sintético `(202) 555-0123`, o segundo envio foi processado e o navegador retornou a `/app?billing=success` com a mensagem `Recebemos a confirmação do checkout. A assinatura será liberada assim que o pagamento for processado.`

A ativação foi confirmada pelo fluxo de retorno do checkout. O próximo passo é selecionar novamente Prestador de Serviço e verificar se o PGR Pro já está liberado no workspace `240001`.

## Ciclo 2 — verificação pós-checkout

Após o retorno `/app?billing=success`, a carteira `/app/clientes?workspace=240001` carregou normalmente, mas permaneceu sem empresas. Ao abrir `/app/pgr?workspace=240001`, o portal continuou exibindo `Ative o PGR Pro para este ambiente`. A própria mensagem do retorno informa que a assinatura será liberada somente depois do processamento do pagamento. Portanto, o checkout foi criado e concluído no Stripe, mas a liberação no workspace ainda depende do processamento/entrega do evento de pagamento ou webhook.

## Ciclo 3 — empresa e jornada empresa → PGR

Após o relayer assinado do evento `checkout.session.completed` para `/api/stripe/webhook`, o workspace passou a liberar o PGR Pro. A rota `/app/pgr?workspace=240001` exibiu o formulário `Nome da empresa atendida` e a ação `Criar empresa`.

Foi criada pela interface a empresa temporária **Empresa Homologacao TST 1308**. O portal exibiu o toast `Empresa criada. Agora você já pode anexar o logo e criar o PGR dela.`, mostrou o card da empresa com estado `Nenhum PGR criado ainda` e disponibilizou o campo de projeto com o botão `Criar PGR`. A criação foi feita sem logo, para validar o estado mínimo e não introduzir um arquivo de teste desnecessário.

## Ciclo 4 — projeto PGR e aplicativo legado integrado

O projeto **PGR Homologacao 1308** foi criado pelo card da empresa. O portal exibiu `PGR criado e selecionado. O gerador está sendo preparado`, `1 PGR vinculado` e `Projeto aberto: PGR Homologacao 1308`.

Após o carregamento, a área integrada mostrou `Gerador carregado`, o dashboard interno do PGR, progresso do PGR em `14% preenchido (41/303 campos)`, a barra lateral interna com módulos como Empresa, GHE, Riscos, Ações, CIPA e EPIs, além do botão visível `Voltar ao Portal TST`. A tela não apresentou login interno duplicado. O fluxo empresa → card → projeto → aplicativo legado foi aprovado observacionalmente.

## Ciclo 5 — agenda e persistência de visitas

Na `/app/agenda?workspace=240001`, o formulário listou a empresa **Empresa Homologacao TST 1308**. Foi criada a visita **Visita de homologacao do fluxo SST**, agendada para `14/08/2026 10:00`, com observação de que se tratava de registro temporário autorizado. O portal mostrou `Visita agendada` e `1 visita agendada`.

A mesma visita foi alternada pela interface entre os três estados: `Planejada` → `Concluída` → `Cancelada`. Cada transição exibiu o toast `Status da visita atualizado` e o card refletiu o novo estado. Após recarregar a rota da agenda, a visita continuou exibindo `Cancelada` no card e no seletor de status. A persistência após recarga foi aprovada.

## Ciclo 6 — gerador de certificados e acervo por cliente

Na rota `/app/certificados?generator=1&workspace=240001`, o formulário de emissão de certificados NR foi preenchido com:
- **Participante**: `João da Silva Homologacao`
- **CPF**: `12345678900`
- **Vínculo**: `Empresa Homologacao TST 1308`
- **NR**: `NR-35 · Trabalho em Altura`
- **Instrutor**: `Carlos Alberto TST` (CREA-SP 987654)
- **URL de Validação**: `https://tstportal-lhmdcupa.manus.space/validar/homologacao`

O botão `Gerar certificado frente e verso` foi acionado, disparando a geração do PDF A4 com frente (certificado) e verso (conteúdo programático e QR Code), salvando simultaneamente o registro no acervo do workspace ativo. A seção de acervo documental passou a listar o novo certificado associado à empresa de homologação, confirmando o resumo por cliente.
