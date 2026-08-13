# Referências de comparação do Gerador de PGR

## Arquivos fornecidos pelo usuário

- `/home/ubuntu/upload/PGR-MIRAMAR.pdf`
- `/home/ubuntu/upload/PGR_-_Industria_e_Comercio_de_Ferro_Bertoncini_Ltda_-_2023.pdf`

## Critérios observados

O `PGR-MIRAMAR.pdf` apresenta uma capa institucional com logos da empresa e da consultoria, título formal do Programa de Gerenciamento de Riscos, unidade/local, mês e ano, aviso de guarda documental, aviso de assinatura eletrônica, responsável técnico e rodapé de controle contendo versão, identificação e revisão. A segunda página traz o quadro de controle de revisão em tabela. As páginas seguintes usam cabeçalho institucional repetido, numeração e rodapé, além de tabelas formais de identificação da empresa e da contratada.

O `PGR_-_Industria_e_Comercio_de_Ferro_Bertoncini_Ltda_-_2023.pdf` possui 55 páginas e mostra uma estrutura ainda mais extensa: cabeçalho/rodapé repetidos, identificação do documento e período de validade, sumário com 16 seções e anexos, registro de revisões, identificação da empresa, local das atividades, distribuição de colaboradores, qualificação de profissionais, introdução, objetivos, gerenciamento e definição de riscos, metodologia, critérios, matriz de risco, ambientes/cargos/inventário de riscos ocupacionais, comprovação profissional, cadastro individual de EPI, garantia de implementação, considerações finais, modelo de relatório de inspeção e cronograma de prioridades/adequação.

## Critério de homologação

A exportação do Portal TST será considerada compatível somente se o PDF gerado preservar, com dados preenchidos, a integridade das seções e tabelas principais, a paginação sem cortes, a legibilidade dos cabeçalhos/rodapés, a matriz de riscos, o plano de ação, a área de assinatura técnica e a coerência visual da capa. Também será verificado se o fluxo nativo do HTML continua disponível para exportação completa em PDF/Word, sem substituição indevida por um resumo reduzido.

## Fonte

Os documentos acima são arquivos locais enviados pelo usuário nesta sessão e constituem as referências visuais e estruturais da homologação prática.

## Evidência da validação prática — preenchimento inicial

Foi aberto o Gerador de PGR em produção no projeto fictício vinculado à empresa Atlas Metalúrgica Experimental. A tela exibiu o fluxo nativo completo, com 33 módulos laterais, progresso do preenchimento e botões Visualizar e Exportar Word.

Foram preenchidos e salvos dados de identificação, controle de revisão inicial, um GHE de Caldeiraria e Soldagem e um risco químico de fumos metálicos de soldagem. O risco foi calculado automaticamente como nível 12, classificação Moderado, com probabilidade 3 — Possível e severidade 4 — Alta. Também foram marcados controles de EPC, EPI, procedimento operacional, sinalização e treinamento. A etapa atual está na grade de EPIs e no botão Adicionar Risco; a exportação ainda não foi executada.

Critérios a verificar na próxima etapa: se a exportação do gerador nativo inclui as imagens da matriz, o mapa de risco, as tabelas completas do inventário/GHE, plano de ação e controle de revisão conforme os PDFs de referência, e se o PDF exportado difere do resumo simplificado do portal.

## Evidência da pré-visualização nativa do PDF

A pré-visualização nativa foi aberta com sucesso após o risco ser adicionado. O modal mostra a capa renderizada em PDF, com identificação visual de Segurança e Saúde no Trabalho, título PGR, nome da empresa Atlas Metalúrgica Experimental LTDA e CNPJ de homologação. O fluxo apresenta as ações Fechar e Baixar Word (.docx). A prévia possui uma área interna rolável, que será usada para verificar as páginas seguintes, tabelas, matriz, mapa de risco, plano de ação e assinatura.

## Evidência estrutural do documento pré-visualizado

A prévia está em um iframe same-origin com 8.966 px de conteúdo vertical e 5.9005 bytes de HTML. A extração do texto confirmou que o documento nativo não é um resumo: contém capa, identificação com validade, empregador, grau de risco, endereço, CNPJ, telefone, CNAE, coordenador e CREA; sumário; registro de revisões; identificação da empresa; qualificação profissional; introdução; objetivos, direitos e deveres; gerenciamento e definição de riscos; estratégia/metodologia; forma de registro; critérios de avaliação; matriz de risco e mapa de risco; inventário por cargo; comprovantes; cadastro e gestão de EPI; garantia de implementação; considerações finais; anexo de inspeção e cronograma de ação.

O texto da prévia também confirmou os dados fictícios preenchidos e a inclusão de observação de homologação. A comparação visual detalhada das seções de matriz, mapa, inventário e cronograma ainda depende da inspeção das páginas internas e da exportação física do arquivo.

## Inventário dos elementos do PDF pré-visualizado

A análise do DOM do PDF confirmou 47 títulos de seção/subseção, nove tabelas estruturadas e uma imagem incorporada de 700 × 350 px. Entre os elementos confirmados estão a matriz 5×5 de probabilidade × severidade, tabela de distribuição de riscos com total e IQCT, tabelas de identificação, critérios de probabilidade e severidade, inventário por cargo, mapa de risco e cronograma. A prévia atende estruturalmente ao conteúdo amplo observado nos dois PDFs de referência; ainda é necessário conferir a exportação física e a paginação em arquivo PDF baixado.

## Comparação visual das páginas críticas

A página 13 do PDF gerado apresenta uma matriz 5×5 colorida e legível, a distribuição dos riscos com IQCT de 75% e a seção de mapa de risco. Entretanto, o mapa aparece como uma área de grade vazia com instruções para carregar a planta e adicionar círculos; portanto, nesta homologação não há imagem de planta nem círculos de risco efetivamente impressos. Isso é uma diferença material em relação a um PGR final como o MIRAMAR, que deve conter o mapa configurado quando a planta e os riscos forem cadastrados.

A página 14 apresenta inventário detalhado por cargo com cabeçalho, setor, quantidade de funcionários, jornada, turnos, atividades, agravos, tabela de risco e controles EPC/EPI. O risco químico do soldador inicia na página seguinte, indicando quebra de página natural, mas o documento preserva legibilidade, tabelas e hierarquia visual. A estrutura é compatível com o modelo Bertoncini em organização, embora o PDF gerado seja mais curto e mais limpo por não conter todos os anexos e evidências de um documento final completo.

## Comparação visual da capa

A capa gerada é limpa, moderna e legível, mas não está na mesma formatação documental do PGR-MIRAMAR. O modelo MIRAMAR possui faixa superior com logotipos da empresa e da consultoria, título legal mais extenso, local e mês/ano, aviso de arquivamento por 20 anos, declaração de assinatura eletrônica, responsável técnico com registro e quadro inferior de versão/identificação/revisão. A capa gerada contém título, empresa, CNPJ e vigência, porém não reproduz ainda os logotipos, aviso de guarda, declaração legal de assinatura eletrônica nem o quadro formal de controle no rodapé da primeira página.

Conclusão parcial: a estrutura interna do gerador está próxima do padrão de conteúdo, mas a capa ainda não está equivalente aos exemplos para um documento legal pronto para impressão. A diferença é de apresentação e de campos legais, não apenas estética.
