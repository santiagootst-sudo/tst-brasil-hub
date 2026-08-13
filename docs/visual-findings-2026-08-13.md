# Evidências visuais recentes

A rota `/app/certificados?workspace=150001&generator=1` abriu o workspace real **Meu ambiente CLT**, exibiu o cabeçalho TST CLT, o gerador NR aberto, prévia frente do certificado, campos de validade, marca d’água, logo e o estado vazio do acervo sem registros artificiais.

A rota `/app/pgr?workspace=120001` abriu o ambiente **TST Autônomo · João almeida**, exibiu a carteira de empresas, a empresa atendida `nutrela`, dois projetos PGR vinculados, o botão de criação por empresa, exportação PDF e o acesso ao PGR em tela cheia. Essa captura confirma a composição da jornada existente, mas não comprova por si só criação de novo registro, autosave ou bloqueio por assinatura.

A consulta somente leitura dos workspaces confirmou seis ambientes reais no banco. Os ambientes CLT identificados foram `150001` (Meu ambiente CLT, owner 1), `210001` (Minha empresa, owner 5640001) e `30002` (Minha empresa, owner 300001). O uso de `30002` na prévia anterior caiu no workspace padrão porque a sessão corrente não possuía acesso a ele; a validação CLT correta da sessão disponível foi feita com `150001`.
