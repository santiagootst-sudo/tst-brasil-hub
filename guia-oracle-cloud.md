# Guia Definitivo: Configurando a Oracle Cloud (Always Free) para o TST Brasil Hub

A **Oracle Cloud Infrastructure (OCI)** oferece o programa **Always Free**, que disponibiliza recursos gratuitos permanentes na nuvem. Para hospedar o **TST Brasil Hub** (aplicação full-stack com Node.js, banco MySQL e domínio próprio), o recurso mais valioso é a família de instâncias **Ampere A1 Compute (ARM)**, que permite configurar até **4 vCPUs e 24 GB de RAM de forma totalmente gratuita** na região escolhida (como **São Paulo / Brazil East**).

Abaixo está o passo a passo completo e detalhado para criar a conta, provisionar o servidor, abrir as portas de rede, instalar o ambiente e publicar a aplicação.

---

## Passo 1: Criação da Conta Oracle Cloud (Always Free)

1. Acesse o site oficial da [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Clique em **Start for free** e preencha seus dados cadastrais, e-mail e país.
3. **Validação de Cartão de Crédito:** A Oracle exige um cartão de crédito internacional apenas para verificar sua identidade (será feita uma cobrança temporária de verificação de pequeno valor que é estornada automaticamente). Nenhuma cobrança recorrente será realizada sem o seu consentimento explícito de upgrade para o plano pago (Pay As You Go).
4. Escolha sua **Home Region (Região Principal)**. **Atenção:** Escolha obrigatoriamente **Brazil East (São Paulo)** para garantir a menor latência possível para o seu público no Brasil.

---

## Passo 2: Criação da Instância Virtual (Servidor ARM)

Após fazer login no OCI Console:

1. No menu superior esquerdo (hambúrguer), vá em **Compute (Computação)** > **Instances (Instâncias)**.
2. Clique em **Create instance (Criar instância)**.
3. **Configurações Básicas:**
   - **Name:** Digite `tst-brasil-hub-server`.
   - **Placement:** Confirme que a AD (Availability Domain) está na região de São Paulo.
4. **Image and Shape (Imagem e Formato):**
   - **Image:** Clique em *Change Image* e selecione **Canonical Ubuntu** (versão 22.04 ou 24.04 LTS).
   - **Shape:** Clique em *Change Shape*, selecione **Ampere** (A1), e ajuste o slider para **4 OCPUs e 24 GB de RAM** (o limite máximo gratuito).
5. **Networking (Rede):**
   - Deixe marcado *Create new virtual cloud network* (Criar nova rede virtual na nuvem) e *Create new public subnet* (Criar nova sub-rede pública).
   - **Assign a public IP address:** Marque *Assign a public IPv4 address* (para que o servidor receba um IP fixo público acessível na internet).
6. **Add SSH Keys (Chaves SSH):**
   - Selecione *Save private key* e *Save public key* para baixar o par de chaves `.key` / `.pub` gerado pela Oracle. **Guarde esse arquivo em um local seguro**, pois ele será necessário para acessar o servidor via SSH.
7. Clique em **Create (Criar)** e aguarde alguns segundos até que o estado mude para *Running* (Em execução). Anote o **IP público** atribuído à instância.

---

## Passo 3: Liberação de Portas na Rede (Firewall da Nuvem)

Por padrão, a Oracle Cloud bloqueia o tráfego de entrada nas portas da aplicação. É preciso liberar as portas `80` (HTTP), `443` (HTTPS) e `3000` (ou a porta onde a aplicação rodará):

1. Na página da sua instância, clique no link da sua **Virtual Cloud Network (VCN)**.
2. Clique na **Public Subnet** associada.
3. Clique na **Default Security List** (Lista de Segurança Padrão).
4. Clique em **Add Ingress Rules (Adicionar Regra de Entrada)**:
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** `TCP`
   - **Source Port Range:** (Deixar em branco / All)
   - **Destination Port Range:** `80, 443, 3000` (ou adicione regras separadas para cada porta).
5. Clique em **Add Ingress Rules**.

---

## Passo 4: Conexão Inicial via SSH

No seu computador local (ou através do terminal do VS Code / Git Bash):

1. Ajuste a permissão da chave privada baixada:
   ```bash
   chmod 400 /caminho/para/sua-chave.key
   ```
2. Conecte-se ao servidor usando o usuário padrão `ubuntu` e o IP público da instância:
   ```bash
   ssh -i /caminho/para/sua-chave.key ubuntu@<IP_PUBLICO_DO_SERVIDOR>
   ```

---

## Passo 5: Instalação do Ambiente de Execução e do Coolify

Para evitar a complexidade de configurar o Node.js, Nginx e MySQL manualmente no terminal, a recomendação mais prática é instalar o **Coolify** (uma ferramenta open-source que transforma seu VPS em uma plataforma de deploy automática via GitHub, idêntica ao Railway).

1. Com o terminal SSH conectado no Ubuntu, execute o script oficial de instalação automática do Coolify:
   ```bash
   wget -q https://cdn.coolify.io/coolify.sh && bash coolify.sh
   ```
2. O script instalará o Docker, Docker Compose e os containers necessários de forma autônoma.
3. Ao finalizar, o terminal exibirá um link de acesso (ex: `http://<IP_PUBLICO>:8000`).
4. Abra esse link no seu navegador, crie sua conta de administrador no Coolify e você terá uma interface visual completa para gerenciar seus projetos.

---

## Passo 6: Conexão do Domínio `tstbrasilhub.com.br` no Registro.br

1. Acesse o painel do [Registro.br](https://registro.br/).
2. Abra a gestão do domínio `tstbrasilhub.com.br` e acesse **Configurar Zona DNS**.
3. Adicione os registros apontando para o IP público da sua instância Oracle Cloud:
   - **Tipo A:** Nome `@` (vazio) → Aponta para o **IP público** da Oracle Cloud.
   - **Tipo CNAME:** Nome `www` → Aponta para `tstbrasilhub.com.br`.
4. Salve as alterações. A propagação do DNS costuma levar de alguns minutos a poucas horas.

---

## Passo 7: Hospedagem e Deploy do TST Brasil Hub

1. No Coolify, clique em **New Resource** > **Project** > **Application**.
2. Conecte sua conta do GitHub onde o repositório do TST Brasil Hub está armazenado.
3. Configure as **Environment Variables (Variáveis de Ambiente)** com as chaves injetadas no projeto (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `JWT_SECRET`, etc.).
4. Clique em **Deploy**. O Coolify vai construir a imagem Docker da aplicação, subir o banco de dados MySQL associado, configurar o proxy reverso e emitir o **certificado SSL (HTTPS)** automaticamente para o seu domínio `tstbrasilhub.com.br`.

---

## Referências

- [1] Oracle Cloud Infrastructure. *Always Free Resources*. Disponível em: <https://www.oracle.com/cloud/free/>.
- [2] Coolify Documentation. *Installation Guide*. Disponível em: <https://coolify.io/docs/knowledge-base/server/installation>.
- [3] Registro.br. *Configuração de Zonas DNS*. Disponível em: <https://registro.br/>.

Autor: **Manus AI**
