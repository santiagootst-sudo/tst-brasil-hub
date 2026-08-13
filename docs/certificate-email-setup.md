# Envio de certificados por e-mail

O envio por e-mail está deliberadamente desativado no ambiente atual para não simular uma entrega nem exigir credenciais que ainda não foram configuradas. A emissão local continua funcionando: o PDF é baixado pelo navegador e, quando selecionado, é registrado no acervo do workspace.

## Requisitos futuros

Será necessário criar uma conta em um provedor de e-mail transacional, verificar um domínio ou remetente e fornecer ao ambiente duas variáveis pelo painel seguro de Secrets:

| Variável | Finalidade |
| --- | --- |
| `RESEND_API_KEY` | Autorizar o backend a enviar o e-mail transacional. |
| `CERTIFICATE_EMAIL_FROM` | Definir o remetente verificado, no formato `TST Brasil Hub <certificados@dominio.com>`. |

O fluxo futuro deverá validar o endereço do participante, anexar o mesmo PDF que foi gerado no navegador, registrar sucesso ou falha sem expor a chave de API e manter o download local como alternativa. Nenhuma chave deve ser colocada no código, em `.env` versionado ou no banco de dados.

## Como obter quando for oportuno

A conta do provedor pode ser criada pelo responsável pelo domínio do portal. Depois da verificação do domínio e da criação da chave, os valores devem ser inseridos em **Management UI → Settings → Secrets** ou fornecidos pelo cartão seguro de Secrets da sessão. Até essa etapa, o botão ou fluxo de e-mail não deve ser apresentado como disponível.
