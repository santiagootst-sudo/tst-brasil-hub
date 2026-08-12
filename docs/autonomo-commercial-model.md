# Modelo Comercial do TST Autônomo

O TST Autônomo trabalha com a carteira de clientes como unidade de negócio. Cada empresa já cadastrada pode receber uma situação comercial e uma próxima ação de relacionamento; visitas são registradas com objetivo, data e estado. Este módulo não cria faturamento ou valores estimados automaticamente.

| Entidade | Dados reais registrados | Uso no portal |
|---|---|---|
| Carteira de cliente | Empresa, situação, próxima ação e observações | Priorizar clientes ativos e acompanhamentos pendentes |
| Agenda de visitas | Empresa, data, objetivo, observações e estado | Organizar visitas planejadas, concluídas ou canceladas |
| Documentos do cliente | PGRs e certificados existentes | Consolidar pendências documentais sem duplicar registros |

> Financeiro, portfólio e marketplace serão desenvolvidos em domínios próprios quando houver regras comerciais e de transação aprovadas; o dashboard não exibe valores fictícios.

## Navegação e dashboard contextual

A barra lateral Autônoma foi organizada nas seções **Principal**, **Documentos**, **Negócio** e **Conhecimento**. Ela prioriza Dashboard, Empresas e clientes, Agenda de visitas, PGR e materiais, mantendo controles por cliente, inspeções, treinamentos, biblioteca e suporte disponíveis na sequência adequada à carteira.

O dashboard não replica o faturamento apresentado na referência porque não existe registro financeiro real no banco. Em seu lugar, mostra **Clientes ativos**, **Retornos em 30 dias**, **Visitas agendadas**, **Entregas PGR** e **Documentos a tratar**, todos derivados exclusivamente da carteira, agenda, PGRs e certificados persistidos.

Na validação visual do ambiente Autônomo `60002`, a navegação exibiu as quatro seções comerciais e o dashboard apresentou uma entrega PGR real, com os demais indicadores em zero por não haver registros comerciais inseridos. A página Empresas e clientes exibiu a empresa existente sem classificá-la automaticamente e ofereceu o cadastro explícito de situação comercial e visita.

As visitas agora podem transitar entre **Planejada**, **Concluída** e **Cancelada** pela própria agenda, sem alterar os dados da empresa. A visão documental mostra por cliente a presença de PGR, a quantidade de certificados com validade e o estado real de vencimento: vencido, com vencimento em até 30 dias ou sem vencimentos próximos. No ambiente validado, a empresa existente apresentou PGR vinculado e nenhum certificado registrado; a agenda permaneceu vazia e orientou que o status estará disponível após o registro de uma visita real.
