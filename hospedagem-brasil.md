# Guia de Hospedagem no Brasil para o TST Brasil Hub

O **TST Brasil Hub** é um sistema full-stack baseado em **React (Vite), Node.js (Express + tRPC), banco de dados MySQL, Stripe e S3**. Para hospedar uma aplicação desse porte em solo brasileiro (evitando variação cambial e garantindo baixa latência), as opções tradicionais de hospedagem compartilhada (que rodam apenas PHP/WordPress) não funcionam. O projeto exige um **VPS Linux (Servidor Virtual Privado)** ou uma nuvem flexível onde seja possível instalar Node.js, configurar o banco de dados e apontar o domínio `.com.br` diretamente no Registro.br.

Abaixo estão as 5 melhores opções de hospedagem com infraestrutura no Brasil e excelente custo-benefício.

---

## 1. Locaweb (Servidor VPS Linux)
A **Locaweb** é uma das marcas mais tradicionais do mercado brasileiro, oferecendo servidores VPS com data center no Brasil e faturamento direto em Reais (sem IOF ou variação cambial) [8].

- **Custo Aproximado:** Planos VPS Linux a partir de aprox. **R$ 29,90/mês** (para o plano de entrada com 1 GB de RAM e SSD) [8], com opções maiores (2 GB ou 4 GB) por valores proporcionais.
- **Vantagens:** Servidores físicos no Brasil (menor latência para usuários nacionais), cobrança em Reais com boleto/PIX, painel em português e suporte técnico local.
- **Limitações:** O plano básico de 1 GB de RAM exige atenção ao consumo de memória ao rodar o Node.js e o MySQL no mesmo host; idealmente recomenda-se o plano de 2 GB (aprox. R$ 45,90/mês).

## 2. HostGator Brasil (Servidor VPS Cloud)
A **HostGator Brasil** possui infraestrutura nacional robusta e oferece servidores VPS em nuvem com alta escalabilidade e painel intuitivo [6].

- **Custo Aproximado:** Planos VPS Cloud promocionais a partir de aprox. **R$ 25,00 a R$ 40,00/mês** no ciclo inicial.
- **Vantagens:** Data center no Brasil, excelente estabilidade de rede, discos SSD velozes e suporte em português 24/7.
- **Limitações:** Requer gerenciamento via SSH/Linux (ou instalação de um painel de controle como o Coolify ou CyberPanel para facilitar os deploys).

## 3. UOL Host (Cloud Computing / VPS)
O **UOL Host** disponibiliza soluções de computação em nuvem e servidores flexíveis faturados em Reais, sem surpresas com a variação do dólar [11].

- **Custo Aproximado:** Servidores em nuvem a partir de aprox. **R$ 40,00 a R$ 60,00/mês** para instâncias capazes de rodar aplicações Node.js e banco de dados simultaneamente.
- **Vantagens:** Marca nacional consolidada, painel simplificado para criação de instâncias e faturamento nacional desvinculado de câmbio [11].
- **Limitações:** Menos focado em desenvolvedores avançados de PaaS se comparado a ferramentas modernas de CI/CD.

## 4. DigitalOcean / Linode (Akamai) com Data Center em São Paulo
Embora sejam empresas internacionais, tanto a **DigitalOcean** quanto a **Linode** possuem data centers oficiais instalados em **São Paulo (SP)**, entregando latência equivalente à de provedores nacionais com a flexibilidade de uma nuvem global.

- **Custo Aproximado:** Droplets básicos a partir de **US$ 6,00/mês** (aprox. R$ 32,00 a R$ 35,00 mensais).
- **Vantagens:** Criação de servidores em segundos, excelente documentação, snapshots e backups automatizados.
- **Limitações:** Faturamento em dólar no cartão de crédito internacional (sujeito a IOF e variação cambial).

## 5. AWS / Oracle Cloud (Região de São Paulo) com Instância Gratuita
A **Oracle Cloud (OCI)** oferece permanentemente instâncias ARM (Ampere) com até 4 vCPUs e **24 GB de RAM gratuitamente** na região de São Paulo, enquanto a **AWS** oferece o Free Tier por 12 meses.

- **Custo Aproximado:** **R$ 0,00/mês** (Always Free na Oracle Cloud).
- **Vantagens:** Capacidade de hardware gratuita incomparável (24 GB de RAM no tier gratuito da Oracle), ideal para rodar o backend, frontend e MySQL com folga.
- **Limitações:** A criação de contas na Oracle Cloud costuma passar por validações rigorosas de cartão de crédito e o estoque de instâncias gratuitas em São Paulo às vezes esgota temporariamente.

---

## Tabela Comparativa de Hospedagem no Brasil

| Provedor | Moeda / Faturamento | Menor Preço Estimado | Servidores no Brasil? | Suporte a Node.js + MySQL? |
| :--- | :--- | :--- | :--- | :--- |
| **Locaweb VPS** | Real (Boleto/PIX) | ~R$ 29,90 / mês [8] | Sim (São Paulo) | Sim (Acesso SSH root total) |
| **HostGator BR** | Real (Boleto/PIX) | ~R$ 25,00 / mês [6] | Sim (São Paulo) | Sim (Acesso SSH root total) |
| **UOL Host Cloud** | Real (Boleto/PIX) | ~R$ 45,00 / mês | Sim (Brasil) | Sim (Acesso SSH root total) |
| **DigitalOcean (SP)** | Dólar (Cartão) | ~US$ 6,00 / mês | Sim (São Paulo) | Sim (Excelente performance) |
| **Oracle Cloud (SP)** | Grátis / Cartão | R$ 0,00 (Always Free) | Sim (São Paulo) | Sim (Poderoso, 24 GB RAM free) |

## Recomendação Prática para Publicar o TST Brasil Hub
1. **Se você quer faturamento nacional simples (Boleto/PIX) e suporte em português:** Contrate um **VPS Linux de 2 GB de RAM na Locaweb ou HostGator Brasil** (cerca de R$ 30 a R$ 45/mês) [6] [8].
2. **Se você busca gratuidade e hardware robusto:** Tente criar uma conta na **Oracle Cloud (Região São Paulo)** e utilize o tier gratuito para hospedar o portal sem mensalidade.
3. **Dica de Ouro para Gerenciamento:** Para não sofrer com comandos complexos no terminal Linux, instale gratuitamente o **Coolify** (coolify.io) no VPS escolhido. Ele transforma qualquer servidor em uma "Railway particular", permitindo conectar seu GitHub e gerenciar deploys e banco de dados via navegador com facilidade.

---
Autor: **Manus AI**
