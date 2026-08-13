
## Atualização após vínculo por empresa

A rota `/app/certificados?workspace=120001&generator=1` agora mostra o seletor **Vincular ao cliente** com `nutrela` pré-selecionada, preenche o campo textual da empresa e mantém o certificado real vencido no acervo geral. Isso confirma visualmente que uma nova emissão pode ser persistida com `companyId` relacional.

A rota `/app/clientes?workspace=120001` continua mostrando, corretamente, `nutrela · Sem certificados registrados`, pois o único certificado real existente no workspace ainda não tem `companyId` associado. Portanto, o resumo por cliente permanece pendente de uma emissão real vinculada à empresa; nenhuma emissão foi criada automaticamente para fabricar evidência.
