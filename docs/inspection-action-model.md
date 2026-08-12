# Modelo de Inspeções e Plano de Ação

O módulo de inspeções organiza verificações reais por empresa e, quando aplicável, por setor. O plano de ação permite registrar medidas preventivas independentes ou vinculadas a uma inspeção, com responsável e prazo opcionais. Nenhum item é criado automaticamente.

| Entidade | Registros essenciais | Indicador derivado |
|---|---|---|
| Inspeção | Empresa, setor opcional, título, prazo, conclusão e observação | Inspeções planejadas e vencidas conforme o prazo informado |
| Ação preventiva | Empresa, inspeção/setor/pessoa opcionais, título, descrição, prazo e status | Ações abertas, em andamento e vencidas conforme o prazo informado |

> O modelo registra a ação preventiva e o acompanhamento operacional. Ele não substitui a avaliação técnica nem cria qualquer constatação sem que o TST a registre no ambiente correto.

## Implementação e validação

O módulo **Inspeções e plano de ação** está disponível em `/app/inspecoes`. Ele permite planejar inspeções reais por empresa ou setor, registrar observações opcionais e criar ações preventivas vinculadas ou não a uma inspeção. Cada ação pode receber setor, responsável e prazo quando esses vínculos já existirem na estrutura organizacional.

Os procedimentos respeitam a mesma política do portal: member consulta, enquanto owner e manager registram. A validação automatizada cobre leitura por membro, bloqueio de escrita, vínculo de ação somente à inspeção da mesma empresa e responsável pertencente ao ambiente correto.

O módulo foi validado visualmente no CLT `90002` e no Autônomo `60002`, ambos com empresas reais e estados vazios sem criação de demonstrações. A navegação exibiu **Inspeções e ações** nos dois contextos e os cartões de inspeções planejadas e ações em aberto ficaram em zero, conforme os dados existentes. A suíte passou com 66 testes.

## Visão CLT de risco e prevenção

O dashboard CLT recebeu uma seção exclusiva de **Risco e prevenção**. Ela consolida, em cartões acionáveis, os PGRs vinculados, inspeções planejadas, ações em aberto, alertas de EPI e ocorrências abertas; cada valor provém dos registros existentes no ambiente. A validação visual no ambiente CLT `90002` exibiu a nova seção com todos os valores em zero, coerente com o estado real sem cadastros operacionais.
