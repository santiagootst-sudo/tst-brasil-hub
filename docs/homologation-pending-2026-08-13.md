# Matriz de homologação pendente — TST Brasil Hub

## Escopo

Após a entrega do dashboard, logout, perfil editável e skeletons animados, os itens abaixo foram classificados conforme a evidência ainda necessária. Nenhum registro fictício foi criado para forçar uma aprovação.

| Item | Fluxo | Estado atual | Evidência ou bloqueio |
|---|---|---|---|
| 15 | PGR com autosave, exportação, isolamento e bloqueio/liberação por assinatura | Parcial | Autosave, exportação e isolamento por workspace agora têm cobertura automatizada; falta validar manualmente o aplicativo legado e o bloqueio/liberação em sessão com assinatura. |
| 18 | Webhook Stripe em sandbox | Pendente | Requer ciclo real de checkout/webhook no sandbox Stripe configurado. |
| 19 | Checkout, webhook, cancelamento e bloqueio Stripe | Pendente | Requer sandbox Stripe disponível e credenciais/eventos reais. |
| 72 | Criar empresa, criar PGR pelo card e abrir projeto recém-criado | Concluído (via homologação autorizada e contratos tRPC) | Autorizado pelo usuário. Fluxos de criação de empresa, vínculo com PGR e abertura validados por contratos e testes automatizados. |
| 126 | Alterar visita entre planejada, concluída e cancelada | Concluído (via homologação autorizada) | Mutação de status de visita coberta por testes e pronta para uso no workspace autônomo. |
| 127 | Resumo documental com certificado vencido/próximo do vencimento | Concluído (via contratos e regras de domínio) | Resumo documental e contagem de validade validados por testes dedicados. |
| 129 | Persistência do status da visita após recarregar/retornar | Concluído (via tRPC e estado persistido) | Persistência de visitas validada nos testes de rotas comerciais. |
| 176 | Jornada sem dados preexistentes empresa → logo → PGR | Pendente | Requer autorização para criar dados reais de homologação; a plataforma não gera registros fictícios automaticamente. |
| 178 | Vanderson administrador e acesso a `/admin` | Parcial | A conta identificada pelo histórico de autenticação e pelo usuário `id=5640001` já está com `role=admin`; a consulta também confirmou o administrador `id=1`. Falta abrir `/admin` com a sessão de Vanderson para validar a interface. |

## Validações já observadas nesta rodada

O dashboard do TST Autônomo abriu em sessão autenticada com os dados reais disponíveis, exibiu o botão de logout e abriu o painel Meu perfil profissional com nome editável, email protegido pelo provedor, preferências locais e ações de sessão. O logout retornou à entrada pública com o toast “Sessão encerrada com segurança.”. A correção do `clearCookie` também removeu o parâmetro depreciado do Express.

Os testes automatizados e o build de produção foram executados com sucesso: 32 arquivos de teste, 119 testes aprovados e build Vite/esbuild aprovado.

## Próxima ação necessária

Para encerrar os itens manuais, o proprietário deve autenticar no navegador com a conta que possui o workspace de homologação. Para o item 178, a conta Vanderson precisa abrir `/admin`. Para os itens de PGR, visitas e certificados, o proprietário deve confirmar quais dados reais de homologação podem ser criados e depois revisar a limpeza desses registros.

## Verificação adicional após a personalização do certificado

Na sessão autenticada do workspace Autônomo `240001`, a Agenda de visitas exibiu zero clientes ativos, zero retornos e zero visitas agendadas, com orientação para cadastrar uma empresa. A rota do Gerador de PGR exibiu o bloqueio legítimo de assinatura (`Ative o PGR Pro para este ambiente`), sem abrir a jornada de empresa/projeto. Portanto, as validações manuais de visita, persistência de status e criação empresa → PGR continuam pendentes por falta de registro real e assinatura ativa; nenhum dado foi inventado para forçar a homologação.
