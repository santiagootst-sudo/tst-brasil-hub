# Catálogo de Referências Visuais — Portal TST

## Inventário inicial

O pacote enviado contém 27 telas de referência, abrangendo dashboard, PGR, inventário/GHE, biblioteca, academia, suporte, marketplace, perfil, alertas, equipe, inspeções, riscos, certificados, incidentes, saúde ocupacional e perfil de colaborador. A análise será usada como referência de linguagem visual e organização de informação; nenhum dado ilustrativo será incorporado ao portal.

## Padrões confirmados na visão geral e no dashboard Prestador

| Elemento | Padrão observado | Direção para o portal |
|---|---|---|
| Estrutura | Conteúdo em canvas claro, barra superior baixa e barra lateral escura | Preservar a barra lateral atual e reduzir a sensação de páginas soltas dentro do conteúdo. |
| Hierarquia | Título curto, subtítulo operacional e uma fileira de indicadores no início | Usar título contextual e KPIs reais, com blocos de informação mais densos e objetivos. |
| Cartões | Superfície branca, borda muito discreta, raio moderado, ícone colorido e status em chip | Criar cards reutilizáveis com ação primária visível e estados derivados da base. |
| Listagens | Grade de entidades com ações diretas e linha do tempo abaixo | Priorizar clientes, projetos e atividades reais no Prestador; não simular empresas ou números. |
| Cores | Fundo cinza muito claro, teal profundo para a estrutura e acentos verde, âmbar e vermelho para estado | Centralizar os tokens de superfície, texto, bordas, ações e estados no sistema de layout. |

## Padrões adicionais por módulo

| Referência | Padrões relevantes para aproximação visual |
|---|---|
| Dashboard Empresa | Saudação breve, quatro cards de KPI com ícones amplos e cor semântica, dois painéis de análise com o mesmo cabeçalho, listas de vencimentos e treinamentos com linhas progressivas. Os gráficos devem continuar derivados de registros reais e só aparecem quando houver base suficiente. |
| Editor PGR | Topbar contextual e compacta, coluna de etapas com progresso, área central focada no documento e uma coluna lateral de ações. A referência reforça a necessidade de reduzir elementos decorativos e organizar ferramentas do PGR em zonas claras; o conteúdo normativo e a exportação profissional existentes devem ser preservados. |
| Biblioteca | Busca dominante, filtros compactos em sequência, cartões de categoria e tabelas densas de conteúdo. Painéis secundários para favoritos e itens recentes ocupam a lateral direita sem desviar do acervo principal. |
| Inspeções | Cabeçalho de módulo com CTA principal, KPIs semânticos em uma fileira, histórico em lista cronológica e quadro de plano de ação por status. A adaptação deve manter as ações e inspeções persistidas, sem transformar cards existentes em dados de demonstração. |

## Comparação com a implementação atual

A barra lateral atual já contém os grupos e os atalhos necessários e será mantida como solicitado. A divergência principal está no canvas interno: ele usa cabeçalhos de 80 px, halos decorativos e uma combinação variável de cards por página, enquanto as referências trabalham com superfícies neutras, informação mais densa, cabeçalho de módulo compacto e um pequeno repertório repetível de KPI, tabela, lista e painel lateral.

A primeira camada da reformulação será, portanto, estrutural: conteúdo sobre fundo neutro, header reduzido, bordas discretas, espaçamento de 24 px, títulos operacionais e componentes compartilhados de cabeçalho, indicador, superfície e filtros. Após essa base, os módulos de maior uso serão alinhados por grupos: dashboards, operação/inspeções, documentos/certificados, treinamentos e biblioteca/conteúdo.

## Primeira onda aplicada na prévia

O canvas comum foi tornado neutro e mais compacto, sem remover a barra lateral. Biblioteca, Inspeções, Controle de EPIs, Treinamentos e Certificados agora iniciam com o mesmo cabeçalho operacional, ícone contextual, título, descrição e ações. A validação visual em desktop confirmou que os módulos compartilham superfícies brancas, bordas discretas, KPIs compactos e ações alinhadas à direita, aproximando-os do padrão das telas recebidas sem modificar os registros reais do ambiente.

A validação em 375 px confirmou que os cabeçalhos se reorganizam em coluna, as ações continuam alcançáveis e os indicadores passam para leitura vertical sem corte lateral. Biblioteca, Inspeções, CIPA e Treinamentos mantiveram a hierarquia de título, descrição, filtros e estados vazios no telefone.

## Segunda etapa aplicada na prévia

PGR Pro, Estrutura e equipe e Gestão de acessos passaram a consumir o mesmo cabeçalho de módulo e a mesma malha de superfícies. A transição removeu banners escuros decorativos sem alterar o gerador PGR, os formulários de estrutura ou as permissões administrativas. O Suporte já seguia uma superfície operacional clara e foi mantido sem uma alteração estrutural desnecessária. A revisão final confirmou o padrão em desktop e 375 px, preservando a navegação lateral solicitada.
