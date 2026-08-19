# Revisão de design — Dashboard Prestador de Serviço

## Evidência observável da prévia

A rota autenticada `/app` apresentou primeiro a tela de escolha de perfil, com cartões distintos para **Prestador de Serviço** e **Empresa**. O ambiente Prestador já está configurado como **Meu ambiente Autônomo**. A entrada reforça a separação de contextos, mas acrescenta uma etapa antes de chegar ao dashboard quando não há preferência de perfil lembrada.

## Direção de avaliação

O dashboard de Prestador deve preservar a separação entre ambientes e priorizar dados de carteira, retornos, visitas, entregas PGR e documentos. As recomendações enviadas são compatíveis com essa direção ao sugerirem uma área útil mais ampla, hierarquia melhor para indicadores, uma barra lateral menos densa e uma topbar com menos camadas concorrentes.

## Comparação com a implementação atual

| Tema | Estado atual no código | Decisão recomendada |
|---|---|---|
| Área útil | O Resumo comum usa `max-w-7xl`; os cards e o hero ficam concentrados em uma coluna central. | Adotar área máxima de 1.600 px com grid de 12 colunas, preservando margens laterais responsivas. |
| Navegação de contexto | O painel possui tabs temáticas, controle de período e personalização dentro de uma barra sticky; o hero também oferece **Alternar contexto**. | Manter tabs e período, mas transformar a faixa em cabeçalho compacto. Deixar a troca de perfil apenas no menu contextual da conta, removendo a duplicidade do hero. |
| Cabeçalho hero | O hero mostra uma descrição longa e cinco KPIs em cartões translúcidos. | Trocar por uma faixa operacional compacta: título, uma mensagem calculada dos dados reais e duas ações de maior impacto. Não usar hero decorativo. |
| KPIs | Já são calculados de carteira, retornos, visitas, PGRs e documentos; porém ficam sem prioridade visual uniforme. | Usar quatro KPIs principais no topo e um quinto como alerta contextual. Mostrar variação apenas quando existir histórico suficiente; para ausência de dados, usar microcopy orientativa, não tendência artificial. |
| Prioridades | A página já calcula prioridades reais, mas mistura cartões amplos, rotina fixa e widgets personalizáveis. | Criar uma coluna de **Prioridades de hoje** com no máximo três ações ordenadas por prazo e impacto, e uma coluna de agenda/entregas próximas. |
| Painel lateral | Não existe área contextual no desktop largo. | Criar um painel recolhível somente em telas grandes, preenchido por retornos de clientes, visitas e entregas PGR realmente cadastradas. Quando não houver registros, exibir estado vazio. |
| Linguagem visual | Há muitos raios grandes, sombras e gradientes herdados de composições anteriores. | Aplicar os tokens do UI Kit, mas respeitando a direção atual do produto: borda de 1 px, sombra mínima, sem gradientes e sem cartão hero decorativo. |
| Estados semânticos | Há sucesso, atenção e alerta em pontos distintos, mas a apresentação não é inteiramente uniforme. | Padronizar `Em dia`, `Atenção`, `Crítico`, `Planejado` e `Sem prazo` sempre com rótulo e ícone, além da cor. |

## Proposta de composição para o Prestador

1. **Cabeçalho compacto:** breadcrumb curto, nome da carteira e controles de período na mesma linha. Abaixo, tabs pequenas para Resumo, Agenda, Entregas e Documentos, em vez de uma barra elevada de duas camadas.
2. **Faixa de comando:** título “Visão da carteira” com texto calculado, como “Há 2 retornos e 1 entrega PGR para tratar”, apenas quando esses registros existirem. As duas ações são abrir a agenda e abrir as entregas PGR.
3. **Linha de indicadores:** Clientes ativos, Retornos em 30 dias, Visitas agendadas e Entregas PGR. Documentos a tratar entra como alerta visual prioritário ou como quinto indicador quando for diferente de zero.
4. **Área principal em 8 colunas:** lista de prioridades reais e uma agenda/linha do tempo de retornos, visitas e entregas. O conteúdo usa datas reais e organiza urgência por prazo.
5. **Painel contextual em 4 colunas, recolhível:** resumo da empresa/cliente em foco, próximos retornos e atalhos recentes. Ele não aparece em telas menores, onde migra para o fim da página.
6. **Bloco secundário:** progresso de documentos e entregas por cliente, com estado positivo “Em dia” quando não houver pendência. Não serão criados números, tendências ou atividades fictícias.

## Escopo recomendado para a primeira implementação

A primeira entrega deve redesenhar somente a rota do **dashboard Prestador** e seus componentes diretos. A sidebar global pode receber apenas ajustes de contraste, agrupamento e item ativo; sua reestruturação completa deve ficar em uma segunda etapa, pois afeta todos os módulos do portal. Essa separação reduz risco de regressão de navegação e torna possível validar a nova hierarquia antes de expandi-la para o ambiente Empresa.

## Validação da prévia após implementação

| Cenário | Resultado |
|---|---|
| Desktop, ambiente Prestador acessível | A composição exibiu cabeçalho compacto, filtros de período, tabs horizontais, faixa de comando, quatro KPIs de carteira, status documental, prioridades e a linha do tempo de visitas, retornos e PGR. |
| Dados reais disponíveis | Foram exibidos um cliente ativo e duas entregas PGR; retornos e visitas sem cadastro receberam estados vazios orientativos, sem conteúdo inventado. |
| Telefone, 375 px | A hierarquia foi empilhada sem corte de conteúdo; as tabs permanecem navegáveis horizontalmente e as ações da faixa de comando passam para a coluna. |

## Referência de navegação recebida posteriormente

A imagem panorâmica enviada confirma o padrão desejado para as abas: fundo branco contínuo, divisor inferior discreto, ícone e rótulo em uma única linha, item ativo em verde-petróleo com sublinhado de 3 px e alertas exibidos como pontos vermelhos separados do texto. Esse padrão deve permanecer idêntico ao alternar entre Resumo, CIPA, EPIs, Inspeções e Documentos; somente o conteúdo abaixo da barra pode mudar.

## Observação de validação manual

Ao abrir diretamente a rota de um workspace de prévia, a sessão do navegador não possuía permissão para aquele ambiente e exibiu o estado de acesso restrito. A validação automática da estrutura foi mantida por typecheck e teste de apresentação; a validação visual completa será realizada pelo servidor de prévia usando o ambiente de desenvolvimento acessível.

Na prévia de desenvolvimento, o Resumo confirmou a barra horizontal unificada com o sublinhado ativo em verde-petróleo e alertas em ponto vermelho, tanto em desktop quanto em 375 px. As abas CIPA, EPIs, Inspeções e Documentos agora consomem o mesmo shell reutilizável, assegurado por teste de apresentação e pela mesma estrutura de cabeçalho, filtro de período e navegação.
