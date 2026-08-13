# Validação do OAuth — 13/08/2026

A tentativa de login iniciada pela landing page da pré-visualização foi concluída selecionando a conta Santiago (`santiagootst@gmail.com`). O retorno não exibiu mais `invalid oauth state`: o navegador abriu diretamente `/app/visao?workspace=240001` e carregou o ambiente TST Autônomo.

A tela autenticada confirmou a barra lateral contextual, a troca entre Autônomo e CLT e o nome **TST Brasil Hub** no lockup. O callback observado corresponde ao fluxo corrigido com cookie de estado compatível com o protocolo da origem, deduplicação de tentativas e validação server-side do nonce.
