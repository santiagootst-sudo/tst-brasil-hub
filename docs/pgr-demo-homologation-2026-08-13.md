# Homologação do Gerador de PGR — Dados fictícios

**Data:** 13/08/2026  
**Finalidade:** validar a entrada pelo Portal TST, criação de empresa e projeto, persistência do formulário, cadastro de GHE e risco e exportação do relatório em PDF.

> Todos os dados abaixo são fictícios e foram criados exclusivamente para homologação visual e funcional. Não representam uma empresa, trabalhador, endereço, telefone, e-mail ou registro profissional real.

## Cenário utilizado

| Campo | Valor de teste |
|---|---|
| Empresa | Vértice Logística Experimental LTDA |
| CNPJ | 12.345.678/0001-90 (fictício) |
| Endereço | Avenida das Rotas Simuladas, 1200 — Curitiba, PR |
| Telefone | (41) 4000-2026 |
| E-mail | homologacao@vertice-experimental.invalid |
| Atividade | Armazenagem e transporte de produtos não perigosos |
| Grau de risco | 3 — Médio |
| Número de funcionários | 42 |
| Coordenadora do PGR | Marina de Teste |
| Registro profissional | CREA-PR 000000/D (fictício) |
| Projeto | PGR de Demonstração - Avaliação Logística 2026 |

## Registros incluídos

Foi cadastrado o GHE **Armazenagem e Expedição — Operador de logística**, CBO 4141-05, com 12 trabalhadores, jornada semanal de 44 horas e turno diurno. A descrição contempla recebimento, conferência, movimentação e armazenagem de volumes em porta-paletes.

Também foi registrado um risco da categoria **Acidente**, relacionado a atropelamento ou colisão com empilhadeira durante circulação e manobra interna. O cenário foi configurado como exposição habitual, probabilidade 3, severidade 4, nível calculado 12 e classificação moderada, com controles de engenharia, EPI, procedimento operacional, sinalização, treinamento e manutenção preventiva.

## Resultado observado

O fluxo autenticado foi concluído sem login interno duplicado: ambiente Prestador, empresa fictícia, projeto PGR, abertura do aplicativo integrado, autosave e reabertura do projeto. O dashboard do PGR exibiu **1 GHE** e **1 risco** após o cadastro, confirmando a persistência dos registros.

O relatório exportado foi salvo pelo navegador como:

`pgr-de-demonstracao-avaliacao-logistica-2026-relatorio-pgr.pdf`

O PDF exportado possui uma página de resumo com o projeto, empresa, identificador e indicação de acesso integrado ao conteúdo técnico completo no Gerador de PGR. A visualização interna do aplicativo também foi aberta e exibiu a capa do PGR com a empresa fictícia e os dados preenchidos.

## Observação para evolução

Para uma entrega documental completa, o próximo aprimoramento recomendado é fazer o botão **Exportar PDF** gerar o relatório técnico integral com todas as seções cadastradas — empresa, GHE, inventário de riscos, matriz, medidas de controle, plano de ação e anexos — em vez de exportar apenas o resumo de acesso integrado.
