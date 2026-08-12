# Modelo Operacional de EPIs e Ocorrências

O módulo operacional amplia a estrutura já cadastrada sem simular estoque, entregas ou ocorrências. Cada registro é separado por ambiente e empresa, permitindo que o TST Autônomo administre clientes distintos e que o TST CLT mantenha a operação interna centralizada.

| Entidade | Dados registrados | Alerta derivado | Limite de privacidade |
|---|---|---|---|
| Item de EPI | Nome, CA, fabricante, estoque, mínimo e validade | Estoque abaixo do mínimo ou validade próxima | Não registra entrega individual nesta etapa |
| Requisito de EPI | Função vinculada ao item de EPI | Funções com requisito operacional mapeado | Não deduz exposição ou condição de saúde |
| Ocorrência SST | Tipo, data, empresa, setor ou pessoa opcional, resumo e status | Ocorrências abertas ou em análise | Não armazena diagnóstico, lesão, prontuário ou dados médicos |

> Os indicadores só refletem registros inseridos pelo usuário. Em um ambiente vazio, o portal informa a ausência de pendências calculadas em vez de apresentar números fictícios.

## Implementação e validação

O módulo **Controle operacional** está disponível em `/app/operacao`. Ele permite cadastrar itens de EPI com estoque, mínimo, CA, fabricante e validade; vincular EPI a funções já cadastradas; e registrar ocorrências SST com resumo objetivo, status inicial aberto e vínculos opcionais a setor ou pessoa. A interface informa explicitamente que não devem ser incluídos diagnósticos, lesões ou dados médicos.

As mesmas permissões da estrutura organizacional foram aplicadas: membros vinculados podem consultar, enquanto owner e manager podem registrar. A validação incluiu leitura para member, bloqueio de escrita para member, isolamento entre empresa/função/item de EPI e criação de ocorrência somente para empresa e pessoa do mesmo ambiente.

No ambiente CLT `90002`, a navegação apresentou **Controle operacional** e os cartões vazios de estoque crítico, validade a tratar e ocorrências abertas. No Autônomo `60002`, a navegação apresentou **Controle por cliente** com a empresa real selecionada. O dashboard CLT apresentou os indicadores derivados do estado real vazio: Alertas de EPI e Ocorrências abertas, ambos em zero. A suíte técnica passou com 62 testes.
