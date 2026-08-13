# Integração do gerador de certificados NR

## Escopo

O HTML recebido foi auditado antes da integração ao TST Brasil Hub. A implementação preserva o fluxo de emissão frente e verso em PDF, mas substitui a tela isolada por um módulo contextualizado ao workspace ativo e alinhado à identidade TST Brasil Hub.

| Elemento do HTML original | Tratamento no módulo integrado |
|---|---|
| Seleção de NR-10, NR-15, NR-20, NR-33 e NR-35 | Catálogo tipado em `client/src/lib/certificateCatalog.ts`, com cursos, cargas e conteúdo programático por norma. |
| Curso dependente da norma | Lista de cursos recalculada quando a NR é alterada; NR-33 também expõe a função no espaço confinado. |
| Nome, CPF, empresa, local, instrutor e registro | Campos obrigatórios e opcionais na interface premium, com validação antes da geração. |
| Validade e data de conclusão | Validade padrão por norma e data final calculada para 12, 24, 36 meses ou indeterminada. |
| Logo local | Prévia imediata e incorporação no PDF; o arquivo não é persistido como dado do participante. |
| Marca d’água | Texto, ativação e opacidade configuráveis nas duas páginas do PDF. |
| URL de validação | QR Code real gerado somente quando uma URL é informada. O HTML original simulava o QR Code com um quadrado. |
| Frente e verso | PDF A4 horizontal com moldura, certificado, assinaturas, conteúdo programático e conteúdo prático. |
| Limpar formulário | Ação explícita de reset, removendo também a prévia do logo. |
| Registro no portal | Opção para salvar o certificado emitido no acervo real do workspace, usando a procedure existente de documentos. |

## Regras de segurança e produto

A emissão exige nome, CPF e instrutor/responsável técnico. O e-mail e a identidade do usuário continuam sob controle do OAuth do portal. O gerador não cria registros fictícios e não grava bytes de logo no banco. Quando o usuário escolhe salvar no acervo, o registro é vinculado ao workspace ativo e passa a aparecer na central de certificados com sua validade.

## Validação realizada

A checagem TypeScript, a suíte de testes e o build de produção foram executados após a integração. Foram adicionados contratos para o catálogo, PDF frente/verso, marca d’água, QR Code, logo e vínculo com o workspace. A prévia visual foi capturada em desktop com o gerador aberto, mostrando o formulário responsivo, a prévia dinâmica do certificado e o acervo legal abaixo da ferramenta.


## Atualização de 13/08/2026 — assinatura, modelos e QR Code

A validação visual no workspace Autônomo `240001` confirmou que o gerador apresenta a opção de **NR-05** com quatro cursos por grau de risco e respectivas cargas horárias de 8h, 12h, 16h e 20h. O campo de conteúdo programático permanece pré-preenchido com os tópicos da norma, permite edição e exibe os controles **Modelos de conteúdo**, **Salvar modelo** e aplicação de modelo salvo.

A mesma tela apresenta o bloco **Assinatura digital do instrutor**, com upload de imagem, prévia, remoção e a opção **Aplicar na frente**. A prévia interativa permite alternar entre **Frente** e **Verso · conteúdo**. Ao selecionar o verso, os tópicos programáticos da NR-05 são exibidos e o QR Code de validação aparece quando a URL configurada está presente. A emissão agora valida a URL antes de gerar o PDF, garantindo que o verso tenha QR Code de autenticidade.

A suíte automatizada permaneceu com **128 testes aprovados** e o build de produção foi concluído com sucesso. A captura visual foi realizada pela pré-visualização do projeto em `/app/certificados?generator=1&workspace=240001`.
