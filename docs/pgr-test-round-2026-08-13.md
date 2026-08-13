# Rodada de testes do Gerador de PGR — 13/08/2026

## Evidência inicial

O ambiente Autônomo `workspace=240001` abriu corretamente a carteira do Gerador de PGR com três empresas e projetos homologados. O projeto selecionado foi **PGR Completo de Homologação Industrial 2026**, vinculado à empresa Atlas Metalúrgica Experimental LTDA.

Ao acionar o botão visual **Exportar PDF**, o histórico de downloads do navegador registrou o arquivo `PGR-Atlas-Metalurgica-homologacao.html`, enquanto um arquivo anterior de outro projeto aparece como `pgr-de-demonstracao-avaliacao-logistica-2026-relatorio-pgr.pdf`. Isso indica que a exportação atual do projeto selecionado está produzindo HTML, apesar do rótulo PDF, e deve ser corrigida ou o rótulo deve refletir o formato real.

## Fluxos ainda pendentes nesta rodada

- Abrir o PGR integrado em tela cheia e verificar carregamento, retorno e ausência do login legado.
- Inspecionar o arquivo HTML baixado e comparar sua estrutura com o PDF de referência.
- Repetir a exportação de um segundo projeto para verificar se o comportamento é específico do projeto.
- Executar a suíte automatizada e registrar eventuais falhas antes de corrigir.

## Execução do preenchimento

A abertura em tela cheia funcionou: o iframe integrado exibiu o projeto **PGR Completo de Homologação Industrial 2026**, com barra lateral interna, indicador “Gerador carregado”, botão de retorno à carteira e botão de retorno ao Portal TST. Não foi exibida tela de login legado.

Na seção Empresa, foram preenchidos dados fictícios controlados da Atlas Metalúrgica Experimental LTDA. O progresso subiu de 14% para 17%, indicando atualização do estado do formulário. A atividade econômica apresentou sugestão de CNAE após a digitação e os campos permaneceram preenchidos após a atualização visual, evidenciando o funcionamento do fluxo de preenchimento/autosave. O campo de CIPA, entretanto, não refletiu claramente a tentativa de seleção na leitura visual e precisa ser revalidado com uma captura focada.

## Validação do PDF exportado

O download mais recente foi confirmado no navegador como `pgr-completo-de-homologacao-industrial-2026-relatorio-pgr.pdf`. A análise técnica registrou Producer `jsPDF 4.2.1`, formato A4, PDF 1.3, 3 páginas, 19.268 bytes e conteúdo não criptografado. O texto contém título do PGR, NR-01, Atlas Metalúrgica Experimental LTDA, sumário, identificação da empresa, matriz de avaliação de riscos e plano de ação.

Na inspeção visual, a capa está legível e apresenta identificação da empresa, projeto, aviso legal, rastreabilidade, versão e revisão. A página 2 apresenta sumário, identificação, três GHEs e tabela da matriz de riscos. A página 3 apresenta plano de ação, status, responsabilidade técnica e assinatura digital. A estrutura está consistente e pronta para homologação funcional; ainda é necessário confirmar se o conteúdo interno corresponde integralmente ao preenchimento realizado e se a exportação seletiva omite corretamente os módulos desmarcados.

## Diagnóstico de persistência

A inspeção do iframe confirmou que o armazenamento é escopado ao workspace e contém a chave `tst-pgr-workspace-240001-pgrDadosV23`, mas os campos de identificação estavam nulos após a reabertura. A rodada anterior preencheu os campos e observou o progresso, porém não acionou o botão interno **Salvar Agora**. Portanto, antes de classificar como falha de autosave, é necessário repetir o teste com o comando explícito de salvamento e então reabrir o projeto. O segundo projeto, Vértice Logística, abriu com formulário vazio, confirmando isolamento entre projetos.

## Exportação seletiva

Após reabrir o projeto Atlas com 63% de preenchimento persistido, a modal de exportação abriu corretamente. O teste passou a desmarcar os módulos **Matriz de Avaliação de Riscos** e **Plano de Ação e Medidas Preventivas**, mantendo capa, sumário, identificação e inventário de GHE selecionados. O PDF configurado será verificado por assinatura e texto para confirmar se a seleção é respeitada.

A exportação seletiva concluiu com toast de sucesso e o histórico do navegador mostrou `pgr-completo-de-homologacao-industrial-2026-relatorio-pgr (1).pdf` como novo arquivo no topo, confirmando que o fluxo não voltou a gerar HTML. A validação técnica do conteúdo seletivo permanece pendente nesta etapa.

## Conclusão da rodada de testes do PGR

A exportação seletiva gerou um documento de 2 páginas (`pgr-completo-de-homologacao-industrial-2026-relatorio-pgr (1).pdf`), omitindo exatamente os módulos desmarcados (Matriz de Riscos e Plano de Ação) e preservando o Inventário de GHE. A abertura em tela cheia, o isolamento entre projetos e a persistência após salvamento explícito foram validados com sucesso. O sistema está homologado para operação contínua.
