# Arquitetura de evidência de recebimento de EPI

## Objetivo

O portal passará a transformar cada entrega de EPI em uma **evidência verificável**, sem substituir a seleção técnica do equipamento nem a orientação prevista na NR-06. O desenho foi escolhido para combinar baixo custo, segregação multiempresa, proteção de dados e capacidade de resposta a fiscalização.

## Cadeia de evidência por entrega

| Camada | Registro persistido | Finalidade de auditoria |
|---|---|---|
| Ficha congelada | Conteúdo da entrega, trabalhador, CA, lote, condição, orientações, treinamento e responsável | Demonstra o que foi entregue e informado no instante da emissão. |
| Integridade | Hash SHA-256 da ficha e versão documental | Detecta alteração posterior do conteúdo comprovado. |
| Confirmação | Token público aleatório, OTP armazenado apenas como hash, prazo e limite de tentativas | Vincula a ciência ao canal de e-mail informado, sem gravar o código em texto. |
| Aceite | Data/hora UTC, hash do IP, agente do navegador e confirmação expressa | Registra o ato de confirmação e reduz exposição de dados pessoais. |
| Auditoria | Eventos somente de inclusão, encadeados por hash | Expõe a sequência de emissão, envio, visualização, falhas, validação e aceite. |
| Verificação | QR Code com endereço público de verificação e identificador opaco | Permite confirmar autenticidade do documento sem expor a ficha completa. |

## Isolamento multiempresa

Todas as tabelas de evidência conterão `workspaceId`, `companyId`, `deliveryId` e `employeeId`. As consultas operacionais serão sempre filtradas por workspace e empresa autorizados. A central de suporte da plataforma usará somente uma visão administrativa global, com registro do usuário de suporte que consultou a evidência. As empresas não poderão visualizar entregas, e-mails, códigos ou eventos de outras empresas.

## Dados mínimos propostos

A base adicionará e-mail opcional ao cadastro de empregado e duas estruturas vinculadas à entrega.

| Estrutura | Conteúdo principal |
|---|---|
| `epi_delivery_evidence` | Destinatário, estado do convite, hash e fotografia da ficha, token opaco, hash do OTP, vencimento, tentativas, resposta do provedor e data de confirmação. |
| `epi_delivery_audit_events` | Evento, ator, data/hora, metadados sem o OTP, hash anterior e hash do evento para formar a cadeia de auditoria. |

## Fluxo operacional

1. O responsável registra a entrega conforme NR-06; o portal cria a ficha congelada e um evento de auditoria.
2. O responsável informa ou confirma o e-mail corporativo/pessoal fornecido pelo empregado, e o portal envia um link individual com OTP de uso temporário.
3. O trabalhador abre o link, visualiza a ficha, informa o código e confirma expressamente o recebimento e as orientações.
4. O portal atualiza a ficha com a confirmação e gera eventos auditáveis. O QR Code do comprovante informa o estado de verificação e o hash resumido.
5. Em fiscalização, a empresa exporta o dossiê da entrega e a linha do tempo; o suporte autorizado consulta a mesma evidência pela central administrativa, sempre com trilha de acesso.

## Privacidade e limites

O código OTP nunca será salvo ou exportado em texto. O QR Code público mostrará apenas dados mínimos de verificação; a ficha completa permanecerá acessível à empresa autorizada e ao trabalhador usando seu token e código. O IP será reduzido a hash para evitar retenção desnecessária de dado identificável. Não serão usados biometria, localização, imagem ou assinatura qualificada nesta etapa.
