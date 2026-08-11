# Validação do PGR Pro integrado

## Evidências verificadas

Em 11 de agosto de 2026, a cópia modernizada do Gerador de PGR foi aberta diretamente a partir do armazenamento do projeto e concluiu o login demo com sucesso. O dashboard, a navegação lateral, o catálogo de EPIs e os controles principais foram carregados sem erro de JavaScript observado no navegador.

Também foi validada a abertura com `portalAuth=1`: o gerador entrou diretamente no dashboard sem exigir um segundo login. Em seguida, a rota interna `/api/apps/pgr/1` foi acessada sem sessão e respondeu com a mensagem de autenticação obrigatória, confirmando que o aplicativo incorporado não é entregue pela rota protegida a usuários anônimos.

A versão destinada ao portal recebe o parâmetro `workspace` e prefixa as chaves locais iniciadas por `pgr`, separando o armazenamento local entre ambientes de trabalho. Quando `portalAuth=1` está presente, o login interno de demonstração é concluído automaticamente apenas para remover a duplicidade de acesso no iframe do portal.

A rota interna `/api/apps/pgr/:workspaceId` foi testada sem sessão e respondeu corretamente com bloqueio de autenticação. A rota também valida pertencimento ao ambiente e exige acesso de assinatura ativa ou perfil administrador antes de entregar o HTML do PGR.

## Limites para homologação final

A validação com usuário autenticado, ambiente criado e assinatura ativa depende da configuração final dos preços recorrentes e de uma conta de teste com acesso ao portal. Antes do lançamento, validar criação de ambiente, abertura do iframe autenticado, isolamento entre dois ambientes, autosave, geração Word/PDF e bloqueio após cancelamento de assinatura.
