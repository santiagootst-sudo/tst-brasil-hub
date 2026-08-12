# Validação visual do Painel Administrativo

A rota `/admin` foi capturada em viewport desktop de 1280×900 e em viewport móvel de 390×844. O layout apresenta o hero em teal escuro, cartões de métricas com estados reais, busca, seleção de períodos, ações de renovação/desligamento e bloco de auditoria. Em móvel, o cabeçalho compacto, o empilhamento das métricas, os controles de busca e as ações por usuário permanecem legíveis e utilizáveis.

A captura foi realizada com os dados existentes no ambiente, sem criação de usuários ou registros fictícios. A base atual contém duas contas, uma conta comum e a conta administrativa do proprietário; os estados exibidos refletem os valores retornados pelo banco.

O painel usa a marca persistente do Portal TST no shell autenticado e mantém a distinção visual entre ação primária teal, estado ativo mint e ação destrutiva coral. A revisão visual independente sugeriu reforçar futuramente o símbolo da marca no shell e humanizar estados de dados incompletos, mas não identificou quebra de layout na implementação atual.
