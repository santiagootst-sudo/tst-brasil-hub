# Notas de pesquisa — NR-06 e entrega de EPI

## Fontes oficiais consultadas

1. Página oficial da NR-06 no Ministério do Trabalho e Emprego: https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-6-nr-6
2. PDF oficial acessível da NR-06: https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-06-atualizada-2022-1.pdf

## Achados confirmados

- A página oficial do MTE informa atualização em 01/09/2025 e aponta a Portaria MTE nº 57, de 16/01/2025, como última modificação da NR-06.
- A NR-06 regulamenta o uso de EPI e se relaciona aos artigos 166 e 167 da CLT.
- O histórico oficial registra que o fornecimento de EPI ao trabalhador deve ser documentado; livro, ficha ou sistema eletrônico são meios admitidos.
- A busca na própria fonte oficial retorna o item 6.5.2.1: a seleção do EPI deve ser registrada, podendo integrar ou ser referenciada no PGR.
- A fonte oficial histórica confirma obrigações organizacionais relacionadas à substituição de EPI danificado ou extraviado, à higienização e manutenção periódica, e à necessidade de CA para uso/comercialização do equipamento abrangido.

## Necessidade de confirmação antes de implementação

A cópia oficial mais recente indicada pela página do MTE apresentou endereço indisponível no navegador. Os itens operacionais serão conferidos também contra a cópia oficial acessível e, quando pertinente, contra a Portaria MTE nº 57/2025 publicada no DOU.

## Requisitos operacionais extraídos da NR-06

### Organização — item 6.5.1

- Adquirir EPI aprovado pelo órgão competente; orientar e treinar o empregado; fornecer gratuitamente EPI adequado ao risco, em perfeito estado de conservação e funcionamento; registrar o fornecimento; exigir o uso; cuidar da higienização e manutenção periódica quando aplicáveis; substituir imediatamente se danificado ou extraviado; e comunicar irregularidades observadas.
- Um sistema eletrônico de registro precisa permitir extração de relatórios (6.5.1.1).
- Para EPI descartável e creme de proteção, quando o registro individual for inviável, a organização deve manter disponibilidade em quantidade suficiente e reposição imediata. Se a embalagem original não for mantida no ponto de fornecimento, devem constar produto, fabricante/importador, lote, validade e CA (6.5.1.2 e 6.5.1.2.1).
- Procedimentos específicos de higienização, manutenção e substituição podem ser definidos, desde que empregados envolvidos sejam informados (6.5.1.3).

### Seleção — itens 6.5.2 a 6.5.4

- A seleção considera atividade, perigos e riscos avaliados, Anexo I, eficácia necessária, exigências legais, adequação e conforto do empregado, e compatibilidade entre EPIs usados simultaneamente.
- A seleção deve ser registrada e pode integrar ou ser referenciada no PGR. Em organizações dispensadas do PGR, o registro deve indicar atividades e respectivos EPIs.
- O SESMT, quando houver, participa da seleção; devem ser ouvidos usuários e a CIPA ou nomeado.
- A seleção deve ser revista quando aplicável nas situações da NR-01 e considerar adaptações/óculos de sobrepor quando necessárias.

### Treinamento e informação — itens 6.7.1 e 6.7.2

- Na entrega, a organização deve prestar informações conforme manual do fabricante/importador sobre descrição e componentes, risco protegido, limitações, uso e ajuste, manutenção/substituição e limpeza/higienização/guarda/conservação.
- Treinamento específico é obrigatório quando as características do EPI o exigirem, considerando atividade e exigências normativas.

### CA, identificação e validade — itens 6.8 e 6.9

- O fornecedor deve comercializar EPI com CA e manual em português; o manual orienta uso, limpeza, higienização, manutenção e restrições.
- O CA é válido conforme avaliação de conformidade. A comercialização exige CA válido. Após aquisição, o fornecimento deve respeitar armazenamento e prazo de validade informados pelo fabricante/importador.
- O EPI deve ser marcado com fabricante/importador, lote de fabricação e número do CA.
- A Portaria MTE nº 57, publicada no DOU em 17/01/2025, mudou o item 6.9.4: é vedada a cessão de uso de CA emitido a um fabricante/importador para outro. A redação vigente não preserva a exceção de matriz e filial que aparece na cópia de 2022.

## Implicações preliminares para o TST BRASIL HUB

1. Separar no sistema a **seleção de EPI por risco/atividade/função** da **entrega individual ao empregado**.
2. Tratar CA, fabricante/importador, lote, validade do equipamento e instruções como dados verificáveis no catálogo/lote, não como simples texto livre.
3. Registrar, em cada entrega, empregado, EPI, quantidade, data/hora, responsável, vínculo com risco/atividade, condição de conservação, ciência do empregado e conteúdo de orientação.
4. Prever fluxo específico de reposição por dano, extravio, validade, higienização/manutenção e devolução; preservar o histórico sem sobrescrever a entrega original.
5. Fornecer relatórios extraíveis por empregado, EPI/CA/lote, período, setor, risco e pendências; reservar evidências de treinamento e de seleção/PGR.
6. Diferenciar EPI descartável e creme de proteção em modalidade de ponto de distribuição quando o registro individual for inviável, com controle de estoque e informação obrigatória no local.

## Evidência por OTP — e-mail transacional

- A conta Resend do projeto está acessível, mas a área de domínios não possui domínio configurado nem remetente próprio pronto para produção.
- A página oficial de preços do Resend informa plano gratuito de US$ 0/mês, até 3.000 e-mails transacionais por mês e limite de 100 e-mails por dia: https://resend.com/pricing
- A API oficial de envio aceita remetente, destinatário, assunto e HTML/texto; também oferece `Idempotency-Key`, relevante para evitar duplicidade de OTP: https://resend.com/docs/api-reference/emails/send-email
- Próxima dependência externa: adicionar e validar o domínio de envio da empresa, publicando os registros DNS que o Resend apresentar. Só depois o sistema poderá enviar OTP de um endereço próprio, como `epi@tstbrasilhub.com.br`.

## Estado da validação do remetente

O domínio `tstbrasilhub.com.br` foi cadastrado no Resend e permanece pendente de validação DNS. O provedor solicitou um registro TXT de DKIM em `resend._domainkey`, um registro MX de retorno em `send`, um registro TXT SPF em `send` e um registro DMARC opcional em `_dmarc`. A publicação desses registros precisa ocorrer no painel DNS que administra o domínio; enquanto essa etapa não for concluída, o OTP não poderá sair de um endereço institucional validado.

## Administração DNS

O domínio `tstbrasilhub.com.br` está publicado e utiliza os servidores DNS do próprio Registro.br. A zona pode ser alterada pela ação **Configurar zona DNS** no painel do domínio; portanto, os registros DKIM, SPF, MX e DMARC pendentes do Resend serão publicados diretamente nesse painel, sem depender de outro provedor.

## Preservação da zona DNS existente

Antes da autenticação do Resend, a zona DNS de `tstbrasilhub.com.br` possui somente os registros operacionais do portal: `A tstbrasilhub.com.br → 216.24.57.1` e `CNAME www.tstbrasilhub.com.br → tst-brasil-hub.onrender.com`. As entradas do Resend serão adicionadas sem alterar ou remover esses dois registros.

## Publicação de autenticação de e-mail

Em 20 de agosto de 2026, a zona DNS do Registro.br foi atualizada com sucesso para o domínio `tstbrasilhub.com.br`. Foram adicionados, sem alterar os registros A e CNAME existentes, o DKIM em `resend._domainkey`, o SPF em `send` e o MX em `send` com prioridade 10 apontando para o retorno do Resend. A etapa seguinte é aguardar a propagação e confirmar o status no painel do Resend antes de habilitar o envio de OTP.

## Status de validação pós-publicação

Após a publicação, o painel do Resend confirmou que os três registros esperados estão configurados com os mesmos nomes e valores publicados. O status ainda aparece como `Not Started`, o que indica que o provedor ainda não concluiu a consulta de propagação DNS. A próxima verificação deve ser feita pelo comando **Verify DNS Records** no próprio Resend; não houve alteração nos registros de aplicação do portal.

## Segredo de produção

A credencial criada no Resend possui somente a permissão **Sending access**. A configuração de produção fica no Render, em `tst-brasil-hub → Environment → Environment Variables`; nela será incluído `RESEND_API_KEY` como segredo, acompanhado do remetente e da URL pública do aplicativo. O valor da chave não é armazenado em arquivos do repositório nem em documentação.
