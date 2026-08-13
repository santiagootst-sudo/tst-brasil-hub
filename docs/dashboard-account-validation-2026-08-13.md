# Validação do dashboard — conta e carregamento — 13/08/2026

A pré-visualização autenticada abriu o dashboard do TST Autônomo com os dados reais do ambiente e confirmou o novo botão **Sair** no cabeçalho, identificado com o hint `Encerrar sessão`.

Ao abrir o botão do perfil, o painel **Meu perfil profissional** exibiu nome de exibição editável, email somente leitura, preferências de notificações visuais e redução de movimento, além das ações **Salvar alterações**, **Trocar perfil ou ambiente**, **Encerrar sessão** e **Fechar painel**. O modal apresentou rolagem interna e permaneceu utilizável em viewport reduzida.

A tela de carregamento foi substituída por skeletons de cartões e indicadores, com `aria-busy`, `motion-safe:animate-pulse`, spinner contextual e suporte a `motion-reduce`.
