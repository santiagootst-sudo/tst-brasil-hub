# Validação local — Módulo de Treinamentos

Em 19 de agosto de 2026, a prévia autenticada do Portal TST Brasil foi aberta na rota `/app/treinamentos` usando o ambiente **Meu ambiente Autônomo**.

| Verificação | Resultado observado |
|---|---|
| Carregamento da página | A tela carregou sem erro visual ou estado de carregamento persistente. |
| Cabeçalho operacional | Exibiu a gestão de capacitação, o ambiente ativo e o botão **Planejar treinamento**. |
| Estado vazio | Mostrou corretamente que não há treinamentos planejados, sem criar registros demonstrativos. |
| Controles de contexto | Os ambientes disponíveis e a ação de planejamento ficaram visíveis para o perfil com permissão de gestão. |
| Formulário ampliado | A abertura exibiu os campos de nome, instrutor, local, agenda, participantes previstos e participantes opcionais. |
| Agenda múltipla | A ação **Data** adicionou uma segunda linha de data sem gravar qualquer registro no ambiente. |

Os testes automatizados cobrem os contratos de agenda e participantes e a construção da ata em PDF, inclusive com quebra de página para lista extensa. A interação de cadastro na prévia não criou dados de homologação, preservando os registros reais do ambiente.
