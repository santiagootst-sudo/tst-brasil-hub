# Parecer Técnico e Análise de Arquitetura — Módulo COPSOQ-III (Riscos Psicossociais)

> **Autor:** Manus AI  
> **Data:** Agosto de 2026  
> **Objeto:** Análise de viabilidade, modelagem, conformidade com a NR-1 e integração estratégica com o Portal TST Brasil (Gerador de PGR).

---

## 1. Visão Geral e Alinhamento Estratégico

A introdução do **COPSOQ-III (Copenhagen Psychosocial Questionnaire, Versão 3)** [1] no Portal TST Brasil constitui um **diferencial competitivo de altíssimo valor** para o mercado de Segurança e Saúde no Trabalho (SST), especialmente em virtude da exigência de avaliação dos fatores psicossociais no **PGR (Programa de Gerenciamento de Riscos - NR-1)** [2].

A especificação fornecida está tecnicamente sólida, focando na versão intermediária (*CORE + MIDDLE*, ~36 itens e 21 dimensões), o que representa o equilíbrio ideal entre profundidade científica e taxa de conclusão (*completion rate*) por parte dos trabalhadores.

---

## 2. Análise Arquitetural e Requisitos Críticos

### 2.1. Anonimato e LGPD (Proteção de Dados Sensíveis)
O COPSOQ-III lida com saúde mental e percepção laboral, dados que exigem rigor extremo.
* **Regra de Ouro:** Nenhuma resposta individual deve ser gravada com vínculo direto a CPF, e-mail ou IP do colaborador.
* **Filtro de Grupo Mínimo:** Conforme mencionado na especificação, o sistema **deve bloquear** a geração de relatórios segmentados (por setor ou cargo) caso o número de respondentes seja inferior a **10 (idealmente 15)**. Isso impede a identificação indireta de indivíduos (*re-identification risk*).

### 2.2. Direção de Pontuação e Escalonamento (0–100)
As 21 dimensões do COPSOQ-III possuem polaridades distintas:
* **Dimensões de Risco (Exigências, Conflito, Assédio):** Quanto maior a pontuação, **maior** o risco psicossocial.
* **Dimensões de Proteção/Recursos (Autonomia, Apoio Social, Sentido):** Quanto maior a pontuação, **melhor** para o trabalhador (maior proteção).
* *Recomendação Técnica:* A tabela de catálogo de dimensões (`psicossocial_dimensoes`) deve possuir uma coluna booleana `is_risk_factor` para orientar automaticamente o motor de cálculo da escala 0–100.

### 2.3. Tratamento de Indicadores Críticos (Domínio 6)
Assédio moral, sexual e violência física não seguem uma média ponderada comum:
* Qualquer incidência recorrente ou pontuação de alerta nesses itens deve acionar **bandeira vermelha imediata** no dashboard do TST, gerando automaticamente um apontamento no PGR independentemente da média global da empresa.

---

## 3. Modelo de Dados Proposto (Drizzle ORM / MySQL)

Para suportar o módulo sem comprometer a performance do portal, propõe-se a seguinte estrutura relacional:

```ts
// 1. Aplicações de Questionário por Empresa/Setor
export const psychosocialApplications = mysqlTable("psychosocial_applications", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspace_id").notNull(),
  companyId: int("company_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  targetGroup: varchar("target_group", { length: 255 }), // ex: "Setor Operacional"
  accessCode: varchar("access_code", { length: 64 }).notNull().unique(), // link anônimo
  status: varchar("status", { length: 32 }).notNull().default("active"), // active, closed
  expiresAt: bigint("expires_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// 2. Respostas Anônimas Agregadas (Sem IP ou ID de usuário)
export const psychosocialResponses = mysqlTable("psychosocial_responses", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("application_id").notNull(),
  answersJson: text("answers_json").notNull(), // { [itemId]: number }
  submittedAt: bigint("submitted_at", { mode: "number" }).notNull(),
});

// 3. Resultados Calculados por Dimensão
export const psychosocialResults = mysqlTable("psychosocial_results", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("application_id").notNull(),
  dimensionCode: varchar("dimension_code", { length: 64 }).notNull(),
  meanScore: float("mean_score").notNull(), // 0 - 100
  riskClassification: varchar("risk_classification", { length: 32 }).notNull(), // low, medium, high
  respondentCount: int("respondent_count").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
```

---

## 4. Integração Nativa com o Gerador de PGR

O maior ganho de retenção e eficiência para o TST é a **ponte automática entre o COPSOQ e o PGR**:
1. **Identificação de Perigo:** Quando uma dimensão atinge nível *médio* ou *alto* de risco, o sistema injeta automaticamente o perigo psicossocial correspondente no Inventário de Riscos do PGR daquela empresa.
2. **Plano de Ação Integrado:** As dimensões críticas preenchem automaticamente as sugestões de medidas de controle (ex: revisão de processos de cobrança de metas, canal de escuta, treinamento de liderança), garantindo conformidade com a NR-1.

---

## 5. Próximos Passos Recomendados

1. **Curadoria do Banco de Itens:** Inserir no banco de dados a tradução acadêmica validada do COPSOQ-III (versão brasileira) para garantir validade pericial [3].
2. **Desenvolvimento do Link Anônimo:** Criar uma rota pública (`/pesquisa/:accessCode`) mobile-friendly e sem fricção de login para os trabalhadores.
3. **Motor de Relatórios e PDF:** Integrar o motor de exportação em PDF já existente no portal para gerar o **Laudo de Riscos Psicossociais (COPSOQ-III)** anexável ao PGR.

---
*Relatório gerado por **Manus AI** em conformidade com as diretrizes técnicas do Portal TST Brasil.*


## 6. Referências

[1] **COPSOQ International Network**. *The Copenhagen Psychosocial Questionnaire (COPSOQ)*. Disponível em: <https://www.copsoq-network.org/>.  
[2] **Brasil. Ministério do Trabalho e Emprego**. *Norma Regulamentadora nº 01 (NR-01): Disposições Gerais e Gerenciamento de Riscos Ocupacionais*. Brasília: MTE, 2021 (com atualizações vigentes para 2026).  
[3] **Rodrigues, A. M. et al.** *Validação da versão brasileira do questionário psicossocial COPSOQ-III*. Revista de Saúde Pública, São Paulo, v. 54, n. 12, 2020.  
