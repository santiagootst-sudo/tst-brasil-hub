# Portal TST - Gestão SST Pro | Brainstorm de Design

## Contexto Atual
O portal **GestaoPGR** atual é funcional mas segue um padrão corporativo tradicional com:
- Sidebar escura com menu em árvore
- Dashboard com cards de métricas básicas
- Foco em gestão de empresas e documentos
- Layout centrado em informações, pouco em ação

**Novo Público:** Técnico de Segurança do Trabalho (TST) que precisa de:
- Acesso rápido a treinamentos e certificações
- Biblioteca de normas e procedimentos
- Dashboard com alertas de segurança críticos
- Fluxo de trabalho intuitivo para auditorias e inspeções

---

## Três Abordagens de Design

### 1. **Minimalista Corporativo Elevado**
**Intro:** Um portal clean e profissional que prioriza clareza e eficiência, com tipografia sofisticada e espaçamento generoso. Ideal para ambientes corporativos que valorizam produtividade.

**Probabilidade:** 0.08

---

### 2. **Dashboard Intuitivo com Foco em Dados**
**Intro:** Interface moderna com visualizações de dados em primeiro plano, cards interativos e navegação por abas. Enfatiza métricas, alertas e ações rápidas para o TST.

**Probabilidade:** 0.06

---

### 3. **Experiência Imersiva com Micro-Interações**
**Intro:** Um portal que combina design sofisticado com animações fluidas, gradientes sutis e transições elegantes. Cria sensação de aplicação premium, não apenas ferramenta corporativa.

**Probabilidade:** 0.07

---

## Abordagem Selecionada: **Experiência Imersiva com Micro-Interações**

### Design Movement
**Neomorphism + Modern Dashboard Design** — Um híbrido entre a suavidade do neomorphism (sombras sutis, profundidade) e a clareza do dashboard moderno (cards, gráficos, alertas). Inspirado em aplicações como Figma, Slack e plataformas SaaS premium.

### Core Principles
1. **Profundidade sem Ruído** — Usar sombras e gradientes sutis para criar hierarquia visual sem sobrecarregar a interface
2. **Ação Rápida em Primeiro Plano** — Botões e CTAs destacados, fluxos de um clique para tarefas críticas (iniciar treinamento, acessar certificado)
3. **Dados Humanizados** — Gráficos e métricas apresentadas de forma visual e compreensível, não apenas números
4. **Micro-Interações Deliciosas** — Transições suaves, hover effects elegantes, feedback imediato em cada ação

### Color Philosophy
- **Primária:** Azul-teal profundo (`oklch(0.55 0.15 190)`) — confiança, segurança, profissionalismo
- **Secundária:** Verde-menta suave (`oklch(0.75 0.1 160)`) — saúde, bem-estar, segurança do trabalho
- **Acentos:** Laranja-coral (`oklch(0.65 0.2 30)`) — alertas críticos, urgência, ação
- **Neutros:** Tons de cinza quente (`oklch(0.95 0.01 80)` a `oklch(0.15 0.01 80)`) — legibilidade e calma
- **Fundo:** Branco puro com toque de azul muito claro (`oklch(0.98 0.002 200)`) — limpo mas com personalidade

### Layout Paradigm
- **Sidebar Colapsável Inteligente** — Sidebar esquerda com ícones + labels, colapsável para ganhar espaço
- **Grid Assimétrico** — Dashboard principal com cards em tamanhos variados (2-3 colunas em desktop, responsivo em mobile)
- **Navegação Contextual** — Abas e filtros flutuantes para mudar contexto sem sair da página
- **Seções Modulares** — Cada módulo (Treinamentos, Biblioteca, Certificados) é independente mas conectado

### Signature Elements
1. **Card com Gradiente Sutil** — Cada card tem um gradiente de fundo muito suave (quase imperceptível) + sombra soft
2. **Ícones Animados** — Ícones que ganham cor/escala ao hover, criando feedback imediato
3. **Dividers Orgânicos** — Linhas de separação com gradiente sutil, não retas e duras
4. **Badges com Pulse** — Badges de status (ativo, pendente, crítico) com animação de pulso suave

### Interaction Philosophy
- **Hover = Elevação** — Cards sobem com sombra maior ao passar mouse
- **Click = Feedback Tátil** — Botões fazem scale(0.97) com transição de 120ms
- **Loading = Animação Elegante** — Spinners com gradiente animado, não simples rotação
- **Transição de Página** — Fade suave (200ms) entre rotas, não instantâneo

### Animation
- **Entrada de Cards** — Fade + slide-up de 30px com delay em cascata (30ms entre cada)
- **Hover de Botão** — Scale 1.02 + sombra aumentada (150ms ease-out)
- **Transição de Abas** — Underline animado desliza para a aba ativa (200ms)
- **Alertas/Toasts** — Slide-in da direita com bounce suave (300ms)
- **Modais** — Fade do backdrop + scale-in do modal (250ms)
- **Respeitando `prefers-reduced-motion`** — Todas as animações desabilitadas se preferência do usuário

### Typography System
- **Display (Títulos Grandes)** — `Poppins Bold` 32-48px, espaçamento de linha 1.2
- **Heading (Títulos Seção)** — `Poppins SemiBold` 20-28px, espaçamento 1.3
- **Body (Texto Principal)** — `Inter Regular` 14-16px, espaçamento 1.6, line-height generoso
- **Small (Labels/Hints)** — `Inter Medium` 12-13px, espaçamento 1.4
- **Mono (Códigos/Valores)** — `JetBrains Mono` 12-14px para dados técnicos

### Brand Essence
**Posicionamento:** A plataforma de confiança para Técnicos de Segurança do Trabalho — simplificando compliance, capacitação e certificação em um só lugar.

**Personalidade:** Profissional, Acessível, Inovador

### Brand Voice
- **Headlines:** Diretos, acionáveis, sem jargão corporativo
  - ✅ "Comece seu treinamento em 30 segundos"
  - ✅ "Seus certificados estão prontos para download"
  - ❌ "Bem-vindo ao portal de gestão"

- **CTAs:** Verbos claros, urgência quando apropriado
  - ✅ "Acessar Biblioteca"
  - ✅ "Completar Certificação"
  - ❌ "Clique aqui"

- **Microcopy:** Amigável, orientado ao usuário
  - ✅ "Nenhum treinamento pendente — você está em dia!"
  - ✅ "Última atualização: há 2 horas"

### Wordmark & Logo
**Conceito:** Um símbolo geométrico que combina:
- Uma **escada/degrau** (progresso, segurança) 
- Um **escudo** (proteção, confiança)
- Linhas limpas, modernas, sem texto

**Estilo:** Gradiente azul-teal para verde-menta, 2-3 cores máximo

### Signature Brand Color
**Azul-Teal Profundo:** `oklch(0.55 0.15 190)` — cor primária que aparece em botões, links, ícones ativos e bordas de destaque

---

## Arquitetura do Portal

### Estrutura de Navegação
```
Dashboard (Home)
├── Indicadores Críticos (Cards com alertas)
├── Treinamentos em Progresso
├── Certificados Próximos de Vencer
└── Atalhos Rápidos

Treinamentos
├── Meus Treinamentos (em progresso, concluídos)
├── Catálogo (filtrar por categoria, nível)
├── Certificações (requisitos, progresso)
└── Histórico

Biblioteca
├── Normas Técnicas (NR, ISO, ABNT)
├── Procedimentos Internos
├── Guias e Manuais
├── Busca Avançada
└── Favoritos

Certificados
├── Meus Certificados (ativo, expirado)
├── Renovações Pendentes
├── Histórico Completo
└── Download/Compartilhamento

Perfil & Configurações
├── Dados Pessoais
├── Preferências de Notificação
├── Histórico de Atividades
└── Logout
```

### Componentes Principais
1. **Header** — Logo, busca global, notificações, perfil
2. **Sidebar** — Menu principal com ícones, colapsável
3. **Dashboard Cards** — Métricas, alertas, atalhos
4. **Tabelas de Dados** — Treinamentos, certificados, histórico
5. **Modais** — Iniciar treinamento, confirmar ações
6. **Toasts** — Notificações de sucesso/erro
7. **Badges** — Status (ativo, pendente, crítico, expirado)

---

## Próximos Passos
1. Gerar logo/ícone da marca
2. Criar componentes base (Card, Button, Badge com animações)
3. Implementar Dashboard com dados mock
4. Construir páginas de Treinamentos, Biblioteca, Certificados
5. Adicionar micro-interações e transições
6. Testar responsividade e acessibilidade
