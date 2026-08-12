# TST Brasil Hub — Diretrizes de Identidade Visual e Sistema de Cores

Este documento estabelece as diretrizes oficiais de identidade visual, arquitetura de cores e aplicação de temas claro e escuro para o **TST Brasil Hub**, o ecossistema profissional unificado de Segurança e Saúde do Trabalho (SST) no Brasil.

## 1. Posicionamento e Conceito da Marca

O **TST Brasil Hub** evolui o conceito anterior de portal individual para um centro integrado de soluções operacionais, consultoria, conformidade legal, capacitação e inteligência técnica para profissionais autônomos (Prestadores de Serviço) e equipes corporativas (Empresas CLT).

A nova identidade baseia-se em três pilares fundamentais:
- **Solidez Técnica:** Representada pela tipografia robusta e pelo azul profundo, transmitindo autoridade em normas regulamentadoras e conformidade legal.
- **Inovação e Dinamismo:** Evidenciada pelo ícone de avanço (play/escudo) com gradiente em transição de azul para verde e um ponto focal em âmbar.
- **Ecossistema Integrado (HUB):** O selo distintivo em destaque comunica que o profissional dispõe de todas as ferramentas unificadas em um único ambiente.

---

## 2. Sistema de Cores e Tokens de Tema

A paleta de cores oficial foi estruturada para garantir excelente contraste em telas de alta resolução, reduzir a fadiga visual durante jornadas prolongadas de auditoria e manter a acessibilidade (WCAG AA).

| Função do Token | Modo Claro (Light) | Modo Escuro (Dark) | Descrição de Uso |
|-----------------|--------------------|---------------------|------------------|
| **Fundo Principal (`bg-background`)** | `#f4f8f6` (Neblina Suave) | `#07191c` (Teal Profundo Noturno) | Superfície geral da aplicação |
| **Superfície de Cartão (`bg-card`)** | `#ffffff` (Branco Puro / Translúcido) | `#0e272b` (Teal Escuro Elevado) | Painéis, tabelas e cartões de indicadores |
| **Texto Principal (`text-foreground`)** | `#102b32` (Azul Petróleo Escuro) | `#f1f7f5` (Branco Neblina) | Títulos e textos de alta legibilidade |
| **Texto Secundário (`text-muted`)** | `#668087` (Cinza Técnico) | `#9ecfc5` (Teal Esmaecido) | Descrições e metadados |
| **Cor Primária (`primary`)** | `#0c7474` (Teal Profundo Corporativo) | `#14b8a6` (Teal Luminoso) | Botões de ação, links e estados ativos |
| **Cor de Sucesso / Segurança** | `#39a77e` (Verde Esmeralda SST) | `#34d399` (Verde Vibrante) | Indicadores de conformidade e conclusão |
| **Cor de Alerta / Urgência** | `#d67845` (Coral de Risco) | `#fb923c` (Laranja Alerta) | Vencimentos, estoque crítico e ações atrasadas |
| **Selo HUB (`hub-accent`)** | Gradiente Âmbar / Ouro (`#f59e0b` a `#fbbf24`) | Gradiente Ouro Luminoso | Destaque do selo HUB e chamadas principais |

---

## 3. Diretrizes de Aplicação do Logotipo

O logotipo oficial do **TST Brasil Hub** é composto por três elementos inseparáveis:
1. **Símbolo Principal:** O triângulo/escudo dinâmico com a letra "T" integrada em branco e um apontador em âmbar.
2. **Logotipo Tipográfico:** O acrônimo **TST** em azul corporativo estruturado, acompanhado da chancela **BRASIL** abaixo.
3. **Selo HUB:** O distintivo em formato de pílula com fundo âmbar/verde suave e a palavra **HUB** em tipografia técnica.

### Versões de Uso:
- **Versão Horizontal Completa:** Recomendada para o cabeçalho principal do site público, landing page, telas de autenticação e relatórios em PDF.
- **Versão Simplificada (Símbolo + Monograma):** Utilizada no favicon da aba do navegador, em menus recolhidos e em visualizações móveis compactas.
- **Modo Monocromático:** Utilizado em impressões térmicas, relatórios oficiais em preto e branco e documentos normativos.

---

## 4. Diretrizes para a Tela de Entrada e Escolha de Perfil

A tela de escolha de perfil (`/app`) funciona como o cockpit de entrada do **TST Brasil Hub**. Ela foi projetada para orientar o profissional na seleção entre o **Prestador de Serviço (Autônomo)** e a **Empresa (CLT)**, incorporando:
- **Ausência de barra lateral de módulos:** Foco absoluto na decisão do ambiente de trabalho.
- **Cartões com Efeito de Vidro (*Backdrop Blur*):** Superfícies translúcidas com elevação progressiva no *hover*.
- **Opção de Lembrar Escolha:** Armazenamento seguro no navegador com reabertura automática nas próximas sessões.
- **Botão de Troca Rápida:** Acesso direto na barra lateral e no perfil do usuário para alternar de contexto a qualquer momento.
