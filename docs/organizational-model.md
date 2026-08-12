# Modelo Organizacional Estruturante

Os módulos de **Setores**, **Funções** e **Pessoas** formam a base operacional do Portal TST. Eles são vinculados ao ambiente e à empresa, permitindo que o TST Autônomo mantenha a estrutura de cada cliente separada e que o TST CLT represente a operação interna sem perder o isolamento por workspace.

| Entidade | Vínculo obrigatório | Finalidade imediata | Uso futuro |
|---|---|---|---|
| Setor | Ambiente e empresa | Organizar áreas de trabalho e procedimentos | GHE, inventário de riscos e planos de ação |
| Função | Ambiente e empresa; setor opcional | Registrar atividades e responsabilidades | Matriz de treinamentos, riscos por função e requisitos de EPI |
| Pessoa | Ambiente e empresa; setor e função opcionais | Registrar composição da equipe com dados mínimos | Participação em treinamentos, certificados e indicadores |

> O modelo não registra CPF, dados médicos, acidentes ou outros dados pessoais sensíveis nesta fase. As métricas iniciais são calculadas apenas com cadastros e registros operacionais já existentes.

O nível de acesso segue a matriz vigente: **owner** e **manager** podem criar ou alterar a estrutura; **member** possui acesso somente de leitura quando vinculado ao ambiente.

## Implementação e validação

O módulo **Estrutura e equipe** está disponível em `/app/estrutura` e permite selecionar uma empresa real do ambiente para cadastrar setores, funções e pessoas. A interface permanece vazia até que o usuário registre dados reais; nenhum dado de demonstração é inserido. Os dados de pessoas e setores alimentam os dashboards imediatamente, exibindo contagens de pessoas ativas, setores ativos e pendências de vínculo de setor/função quando existirem.

A validação visual foi realizada com os ambientes reais disponíveis: no CLT (`90002`), a barra lateral priorizou Estrutura e equipe, Capacitação e Conformidade, enquanto o painel apontou **Mapear os setores da operação**; no Autônomo (`60002`), a navegação priorizou Estrutura dos clientes e o painel apontou **Mapear os setores da empresa atendida**. A suíte técnica passou com 58 testes, incluindo permissões de leitura para member, bloqueio de escrita para member e validação de vínculos de empresa, setor e função.

O painel CLT também foi revisado após a ampliação dos indicadores. A faixa superior exibiu, com valores provenientes dos registros do ambiente, **Pessoas ativas**, **Setores ativos**, **Funções ativas**, **Treinamentos planejados** e **Certificados a tratar**. Assim, funções deixaram de ser apenas um cadastro e passaram a compor explicitamente os indicadores operacionais do portal.
