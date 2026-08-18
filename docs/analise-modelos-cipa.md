# Análise dos modelos recebidos e proposta para o módulo CIPA

> **Aviso regulatório.** Sou uma IA, não um advogado. Esta análise orienta a estrutura operacional do portal e não substitui a validação por profissional habilitado antes do uso formal dos documentos ou da condução de uma eleição.

## Leitura dos arquivos enviados

O pacote contém **10 arquivos**, com duas cédulas de voto equivalentes. Eles representam de forma consistente o ciclo eleitoral e a posse da Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA. A estrutura encontrada está alinhada ao fluxo previsto na NR-05: constituição da comissão eleitoral, comunicação ao sindicato, edital, inscrições, votação, apuração e posse. A norma também exige manter a documentação da CIPA no estabelecimento por pelo menos cinco anos.[1]

| Documento de referência | Uso identificado no processo | Geração proposta no portal |
| --- | --- | --- |
| Ata de constituição da comissão eleitoral | Formaliza integrantes e responsabilidades da comissão eleitoral | Documento preenchido automaticamente após a designação dos integrantes, com o logotipo da empresa |
| Comunicação ao sindicato | Registra o início do processo eleitoral e a confirmação de envio | Modelo de comunicado, status de envio, comprovante anexado e identidade da empresa |
| Edital de convocação | Abre a eleição, define prazos, data, horário e local | Documento e cronograma vinculados à eleição, identificados pela marca da empresa |
| Ficha de inscrição em Excel | Registra a candidatura e entrega comprovante | Formulário digital com número de protocolo e comprovante em PDF personalizado |
| Cédula de voto | Suporta voto secreto em processo físico | PDF imprimível com candidatos ativos e logotipo discreto no cabeçalho; apenas uma versão será mantida no catálogo |
| Ata de eleição e apuração | Consolida participantes, votos, titulares, suplentes e não eleitos | Documento gerado a partir dos resultados conferidos e da identidade da empresa |
| Ata de instalação e posse | Formaliza membros, direção, mandato e calendário | Documento gerado após a composição final e confirmação da posse, com marca da empresa |

Os arquivos `CEDULA_VOTO_CIPA_.docx` e `ITEM_10_CEDULA_VOTO_CIPA_.docx` são duplicados em conteúdo; o módulo deve trabalhar com uma única cédula parametrizável. Também será necessário remover nomes, cidade, endereço e exemplos específicos dos modelos para que cada documento use exclusivamente dados da empresa e do estabelecimento selecionados.

## Regra confirmada por contexto

O módulo terá dois comportamentos claros, ambos preservando o histórico documental e das gestões anteriores.

| Contexto do portal | Regra de negócio | Navegação proposta |
| --- | --- | --- |
| **TST CLT** | Há uma única CIPA da organização vinculada ao ambiente CLT. Eleições sucessivas criam novas **gestões** da mesma comissão, sem abrir CIPAs paralelas. | Acesso direto a **Minha CIPA**, com a gestão vigente e o histórico de mandatos anteriores. |
| **TST Prestador** | O técnico poderá administrar várias CIPAs, cada uma vinculada à empresa cliente selecionada. Cada empresa terá documentos, membros, cronograma e logo totalmente separados. | Tela **CIPAs da carteira** com filtro por empresa; ao abrir uma empresa, o técnico visualiza apenas a CIPA dela. |

Essa regra evita a mistura de dados entre clientes do prestador e mantém a experiência do CLT simples, centrada em uma única comissão. A CIPA continua sendo organizada por estabelecimento conforme a NR-05; se uma empresa cliente possuir mais de um estabelecimento, a estrutura poderá associar a gestão ao estabelecimento correspondente sem alterar a separação principal por empresa.[1]

## Estrutura funcional recomendada

O módulo reutilizará os cadastros já existentes de funcionários, setores, funções, empresas e logotipos. No CLT, a tela inicial abrirá diretamente a CIPA vigente; no Prestador, ela começará pela empresa cliente selecionada. A configuração deve registrar estabelecimento, CNAE, grau de risco, quantidade de empregados e período do mandato, pois a comissão é constituída por estabelecimento e seu dimensionamento depende desses dados.[1]

| Área do módulo | Informações e ações essenciais | Resultado esperado |
| --- | --- | --- |
| **Visão geral** | Gestão, status, estabelecimento, grau de risco, vigência, membros e pendências | Painel de conformidade operacional da CIPA |
| **Dimensionamento** | Quantidade de empregados, grau de risco, regra aplicável e titulares/suplentes necessários | Quadro de composição recomendado para conferência técnica |
| **Processo eleitoral** | Comissão eleitoral, cronograma, edital, sindicato, inscrições, candidatos, votação, apuração e posse | Linha do tempo auditável do ciclo eleitoral |
| **Documentos** | Modelos parametrizados, versão, data de emissão, responsáveis, anexos, logotipo da empresa e exportação PDF | Dossiê documental da gestão CIPA com identidade visual da empresa |
| **Composição e mandato** | Representantes designados e eleitos, presidência, vice-presidência, secretaria e substitutos | Quadro de membros vigente com histórico |
| **Reuniões e plano de trabalho** | Calendário, convocação, presença, ata, deliberações, responsáveis e prazos | Gestão contínua da CIPA após a posse |
| **Treinamento e SIPAT** | Controle de capacitação, certificados, programa da SIPAT e evidências | Registro operacional das atribuições anuais |

## Fluxo eleitoral que o portal deve orientar

A primeira versão deve funcionar como um **assistente de processo**, e não apenas como uma pasta de arquivos. Ela deve bloquear ou alertar etapas fora de ordem e preservar uma trilha de auditoria por alteração, emissão e aprovação. A NR-05 estabelece, entre outros pontos, convocação das eleições com antecedência mínima de 60 dias do término do mandato, período de inscrição de pelo menos 15 dias corridos e eleição com antecedência mínima de 30 dias quando houver mandato em curso.[1]

| Etapa | Funcionalidade no portal | Controle relevante |
| --- | --- | --- |
| 1. Configurar gestão | Criar gestão, estabelecimento, datas e regra de composição | Validar o cronograma e registrar a fonte dos dados |
| 2. Formar comissão eleitoral | Selecionar integrantes entre os funcionários e gerar a ata | Permitir comissão formada pela organização quando não houver CIPA vigente |
| 3. Comunicar sindicato | Gerar comunicado, registrar canal, data e comprovante de entrega | Alertar sobre ausência de confirmação de entrega |
| 4. Publicar edital | Gerar edital e marcar meio de divulgação físico ou eletrônico | Não liberar inscrições antes da publicação |
| 5. Receber inscrições | Capturar candidato, matrícula, setor, função, data e protocolo | Garantir registro individual, comprovante e lista de candidatos |
| 6. Preparar votação | Gerar cédula física com lista fechada de candidatos | Preservar sigilo; a primeira entrega não deve armazenar voto individual digital |
| 7. Apurar e homologar | Registrar total de votantes, votos por candidato, ocorrências e desempate | Ordenar eleitos e não eleitos por votos; registrar critério de tempo de serviço em empate |
| 8. Compor e dar posse | Adicionar designados do empregador, eleitos, presidente, vice, secretário e substituto | Gerar ata de posse e datas de mandato |
| 9. Operar a gestão | Criar calendário mensal, atas, encaminhamentos e plano de trabalho | Alertar ausências, vacâncias, treinamento e vencimentos |

Para uma futura votação eletrônica, o portal deve passar por validação técnica e jurídica específica: a NR-05 exige um processo que assegure segurança do sistema, confidencialidade e precisão do registro de votos.[1] Por isso, o MVP recomendado gera cédulas e registra a **apuração consolidada**, sem guardar a escolha individual de cada eleitor.

## Identidade visual de cada empresa

O portal já possui campos de logotipo por empresa. A emissão de cada documento CIPA deve buscar o `logoUrl` da empresa ativa e aplicá-lo no cabeçalho, ao lado da razão social e do CNPJ. Caso a empresa ainda não tenha logo, a tela de geração deve orientar o usuário a enviá-lo ou permitir seguir sem marca, sem impedir a emissão do documento.

Cada PDF emitido armazenará também um **retrato da identidade utilizada** — URL do logo, nome da empresa e data de geração — no respectivo registro documental. Assim, uma alteração futura do logo não modifica o arquivo já emitido nem compromete a rastreabilidade do dossiê. O TST Brasil Hub poderá aparecer de forma secundária no rodapé como tecnologia de geração, sem substituir a identidade da empresa cliente.

## Dados que devem ficar persistentes

Além dos campos existentes de empresa, logotipo, funcionário, setor e função, a implementação deverá criar registros para gestão CIPA, comissão eleitoral, candidatos, atos/documentos, apuração, membros, reuniões, presenças, deliberações e treinamentos. No Prestador, cada registro ficará obrigatoriamente vinculado à empresa cliente. No CLT, a gestão ficará vinculada à empresa principal do ambiente e a regra de unicidade impedirá CIPAs paralelas. Todos os registros manterão o isolamento por `workspace` já usado pelos demais módulos do portal.

| Entidade | Campos centrais |
| --- | --- |
| Gestão CIPA | Contexto, empresa, estabelecimento, vigência, grau de risco, quantidade de empregados, status, regra de composição e vínculo com a comissão histórica |
| Comissão eleitoral | Gestão, integrantes, função na comissão, data de constituição e documento gerado |
| Candidato | Funcionário, matrícula, setor, função, inscrição, protocolo, status e tempo de serviço para desempate |
| Apuração | Data, horários, total de empregados, participantes, ocorrências, votos agregados, critérios e resultado |
| Membro CIPA | Gestão, funcionário, representação, condição, cargo, data de início e fim, status e motivo de vacância |
| Documento CIPA | Tipo, versão, dados de emissão, responsável, URL de arquivo, hash de integridade, URL do logo usado e histórico |
| Reunião e ação | Gestão, data, participantes, ata, deliberações, responsáveis, prazo e evidências |

## Entrega recomendada em duas etapas

A melhor primeira entrega é o **CIPA Eleitoral & Documental**. Ela contempla a configuração da gestão, dimensionamento assistido para conferência, comissão eleitoral, cronograma, inscrições, candidatos, geração dos documentos recebidos, apuração manual consolidada, composição, posse e dossiê PDF. Isso transforma seus modelos em documentos preenchidos por dados reais, evita redigitação e torna o ciclo rastreável.

Na segunda entrega, o módulo passa a apoiar a rotina após a posse: calendário de reuniões, atas, presenças, plano de trabalho, ações preventivas, SIPAT, treinamentos, vacâncias e integração com os riscos, inspeções e PGR já existentes no portal. A NR-05 prevê reuniões ordinárias mensais — com exceção possível para ME e EPP de graus de risco 1 e 2 — e requer atas assinadas e disponibilizadas aos integrantes.[1]

## Decisões já confirmadas para a implementação

O ambiente CLT terá uma única CIPA, com histórico de mandatos, e não uma lista de comissões concorrentes. O ambiente Prestador permitirá diversas CIPAs, isoladas pela empresa cliente. Todos os documentos emitidos levarão automaticamente o logotipo da empresa ativa; o sistema reaproveitará o carregamento de logo já disponível no cadastro empresarial. A primeira versão continuará com apuração manual consolidada e cédula imprimível, preservando o sigilo do voto; uma votação eletrônica só deverá entrar em escopo após requisitos próprios de segurança e auditoria.[1]

## Referências

[1] [Ministério do Trabalho e Emprego — NR-05: Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/NR05atualizada2023.pdf)
