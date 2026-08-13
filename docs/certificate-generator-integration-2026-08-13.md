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
