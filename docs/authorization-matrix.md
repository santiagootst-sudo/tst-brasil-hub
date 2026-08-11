# Portal TST Brasil — Matriz de autorização

## Princípio de isolamento

Todo registro operacional pertence a um `workspaceId`. A leitura exige que o usuário seja membro do ambiente; a escrita é limitada pelo papel no ambiente. O papel global `admin` é reservado para as exceções já previstas pelo sistema, como o acesso administrativo aos aplicativos pagos.

| Ação | Membro (`member`) | Gestor (`manager`) | Proprietário (`owner`) | Observação |
|---|---:|---:|---:|---|
| Listar ambientes vinculados | Sim | Sim | Sim | Somente ambientes com vínculo do usuário. |
| Consultar um ambiente | Sim | Sim | Sim | Sem vínculo, a consulta não entrega dados. |
| Criar ambiente | Sim | Sim | Sim | O criador passa a ser `owner`. |
| Criar empresa | Não | Sim | Sim | Empresa é vinculada ao ambiente. |
| Criar projeto PGR | Não | Sim | Sim | Chave do legado usa o `workspaceId`. |
| Consultar treinamentos e certificados | Sim | Sim | Sim | Leitura sempre é filtrada pelo ambiente. |
| Registrar treinamento ou certificado | Não | Sim | Sim | Registros exigem autor identificado. |
| Consultar materiais | Sim | Sim | Sim | Material pertence ao ambiente de origem. |
| Registrar materiais | Não | Sim | Sim | Evita alteração documental por perfil de leitura. |
| Consultar chamados | Sim | Sim | Sim | Chamados não atravessam ambientes. |
| Abrir chamado | Sim | Sim | Sim | Qualquer membro pode solicitar apoio. |
| Abrir PGR legado | Assinatura ativa | Assinatura ativa | Assinatura ativa | Também requer vínculo com o ambiente. |

## Regras de acesso pago

| Estado | Usuário comum | Administrador global | Resultado esperado |
|---|---:|---:|---|
| `active` | Permitido | Permitido | PGR protegido é entregue. |
| `trialing` | Permitido | Permitido | PGR protegido é entregue. |
| `past_due` | Bloqueado | Permitido | Retorno de cobrança deve orientar a regularização. |
| `canceled` | Bloqueado | Permitido | PGR protegido não é entregue. |
| Sem assinatura | Bloqueado | Permitido | A interface apresenta planos ou gestão de cobrança. |

## Checklist para novos procedimentos

Antes de criar qualquer procedimento tRPC, declarar explicitamente o domínio, o `workspaceId` quando aplicável, a leitura permitida, a escrita permitida e o comportamento para usuário sem vínculo. O procedimento deve usar contratos de entrada e saída compartilhados, e receber teste de acesso autorizado e negado.
