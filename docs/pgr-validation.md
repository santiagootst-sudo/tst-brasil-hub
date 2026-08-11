# Validação do PGR Pro integrado

## Evidências verificadas

Em 11 de agosto de 2026, a cópia modernizada do Gerador de PGR foi aberta diretamente a partir do armazenamento do projeto e concluiu o login demo com sucesso. O dashboard, a navegação lateral, o catálogo de EPIs e os controles principais foram carregados sem erro de JavaScript observado no navegador.

Também foi validada a abertura com `portalAuth=1`: o gerador entrou diretamente no dashboard sem exigir um segundo login. Em seguida, a rota interna `/api/apps/pgr/1` foi acessada sem sessão e respondeu com a mensagem de autenticação obrigatória, confirmando que o aplicativo incorporado não é entregue pela rota protegida a usuários anônimos.

A versão destinada ao portal recebe o parâmetro `workspace` e prefixa as chaves locais iniciadas por `pgr`, separando o armazenamento local entre ambientes de trabalho. Quando `portalAuth=1` está presente, o login interno de demonstração é concluído automaticamente apenas para remover a duplicidade de acesso no iframe do portal.

A rota interna `/api/apps/pgr/:workspaceId` foi testada sem sessão e respondeu corretamente com bloqueio de autenticação. A rota também valida pertencimento ao ambiente e exige acesso de assinatura ativa ou perfil administrador antes de entregar o HTML do PGR.

## Limites para homologação final

A validação com usuário autenticado, ambiente criado e assinatura ativa depende da configuração final dos preços recorrentes e de uma conta de teste com acesso ao portal. Antes do lançamento, validar criação de ambiente, abertura do iframe autenticado, isolamento entre dois ambientes, autosave, geração Word/PDF e bloqueio após cancelamento de assinatura.

## Validação visual dos módulos compartilhados

As rotas autenticadas de Biblioteca e Certificados foram verificadas no preview. A Biblioteca apresenta a busca e seis materiais técnicos estruturais. Certificados mostra corretamente um estado vazio sem dados de usuários inventados e explica os próximos passos para registros reais. A navegação lateral não aparece nos screenshots de página inteira porque é um elemento fixo e a captura de página inteira o omite deliberadamente.

Após a evolução dos fluxos, Biblioteca continuou renderizando corretamente com ações de abertura de material; Certificados mostrou corretamente o bloqueio orientado quando não há ambiente criado, evitando registros fora de contexto. O cadastro persistente de certificado será exercitado quando houver um ambiente real na conta autenticada.

O módulo de Treinamentos foi incluído com persistência por ambiente, planejamento de cursos e estado vazio seguro. A validação visual confirmou que, sem ambiente criado, a tela apresenta o CTA `Criar ambiente` e mantém a navegação lateral disponível, sem criar registros fictícios.
