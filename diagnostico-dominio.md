# Diagnóstico de Indisponibilidade do Domínio tstbrasilhub.com.br

O domínio **`tstbrasilhub.com.br`** atualmente retorna um erro de resolução (`Could not resolve host`) porque ainda não possui os registros DNS configurados no painel do **Registro.br** para apontar para a infraestrutura do Render. O ecossistema está compilado e ativo na URL padrão do Render (`https://tst-brasil-hub.onrender.com`), mas a ponte com o seu domínio personalizado requer a inserção dos parâmetros gerados pelo Render.

---

## 1. Configuração Obrigatória no Registro.br

Para que o site abra ao digitar `tstbrasilhub.com.br` no navegador, acesse o painel do [Registro.br](https://registro.br), selecione o seu domínio, vá em **DNS > Alterar Servidores DNS** (ou mantenha os servidores padrão do Registro.br e configure a **Zona de DNS** / **Entradas de Domínio**) e adicione exatamente os dois registros fornecidos pelo Render:

| Tipo | Nome / Hostname | Valor de Destino (Target) |
| :--- | :--- | :--- |
| **CNAME** (ou A) | `www` | `tst-brasil-hub.onrender.com` |
| **A** (ou CNAME) | `@` (raiz) | `216.24.57.1` (IP oficial do Render para o domínio raiz) |

---

## 2. Próximos Passos recomendados

Assim que os registros DNS forem salvos no Registro.br, a propagação global da rede leva entre alguns minutos e poucas horas. O Render verificará automaticamente a propriedade do domínio, emitirá o certificado SSL/TLS de forma gratuita e o seu portal estará totalmente acessível em `https://tstbrasilhub.com.br`.

---

## 3. Evidência de configuração realizada

Em 17/08/2026, o painel do Registro.br confirmou **“Zona DNS atualizada com sucesso!”**. A consulta direta ao servidor autoritativo `d.sec.dns.br` confirmou os seguintes registros:

| Nome consultado | Tipo | Resultado confirmado |
| :--- | :--- | :--- |
| `tstbrasilhub.com.br` | A | `216.24.57.1` |
| `www.tstbrasilhub.com.br` | CNAME | `tst-brasil-hub.onrender.com` |

O Render reconhece os dois domínios personalizados, mas ainda exibe **Waiting for DNS** e **Waiting for Verification**. O resolvedor público consultado ainda mantinha uma resposta negativa em cache, com TTL inferior a 15 minutos, embora a autoridade já apresentasse o novo número de série da zona. A URL provisória do Render responde com HTTP 200. O acesso HTTPS pelo domínio próprio deve ser confirmado depois que o Render concluir a verificação e emitir o certificado.
