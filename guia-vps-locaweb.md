# Guia Prático: Configurando o VPS Linux da Locaweb para o TST Brasil Hub

Este guia apresenta a sequência exata de comandos SSH para preparar um servidor **Ubuntu LTS** na Locaweb, instalar o **Node.js LTS**, o gerenciador de processos **PM2**, o servidor web **Nginx** (com SSL) e realizar o deploy do **TST Brasil Hub**.

---

## Passo 1: Atualização do Sistema e Criação de Usuário de Deploy

Conecte-se ao seu VPS via SSH como `root`:
```bash
ssh root@<IP_DO_SEU_VPS>
```

Atualize os pacotes do sistema operacional:
```bash
apt update && apt upgrade -y
```

Crie um usuário dedicado para a aplicação (ex: `tst`) para evitar rodar serviços diretamente como root:
```bash
adduser tst
usermod -aG sudo tst
```

---

## Passo 2: Instalação do Node.js (LTS) e PNPM

Instale o Node.js na versão LTS oficial (Node 20.x ou superior) utilizando o repositório oficial da NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
```

Verifique se a instalação foi bem-sucedida:
```bash
node -v
npm -v
```

Instale o gerenciador de pacotes **pnpm** globalmente:
```bash
npm install -g pnpm
```

---

## Passo 3: Instalação e Configuração do PM2 (Gerenciador de Processos)

Instale o **PM2** globalmente para manter a aplicação rodando em segundo plano e reiniciá-la automaticamente caso o servidor reinicie:
```bash
npm install -g pm2
```

Configure o PM2 para iniciar com o sistema operacional:
```bash
pm2 startup
```
*(O comando exibirá uma linha de comando com `sudo` que deve ser copiada e colada no terminal para concluir o vínculo de inicialização).*

---

## Passo 4: Instalação e Configuração do Nginx (Proxy Reverso)

Instale o **Nginx** para receber as requisições HTTP/HTTPS na porta 80/443 e encaminhá-las para a aplicação Node.js (porta 3000):
```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

Crie um arquivo de configuração para o domínio `tstbrasilhub.com.br`:
```bash
nano /etc/nginx/sites-available/tst-brasil-hub
```

Cole o seguinte conteúdo no arquivo (substitua pelo seu domínio):
```nginx
server {
    listen 80;
    server_name tstbrasilhub.com.br www.tstbrasilhub.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative o site e remova o padrão:
```bash
ln -s /etc/nginx/sites-available/tst-brasil-hub /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## Passo 5: Instalação do Certificado SSL (HTTPS com Certbot)

Instale o Certbot para emitir o certificado gratuito Let's Encrypt para o seu domínio:
```bash
apt install -y certbot python3-certbot-nginx
```

Gete configure o SSL automaticamente:
```bash
certbot --nginx -d tstbrasilhub.com.br -d www.tstbrasilhub.com.br
```
*(Informe seu e-mail e aceite os termos. O Certbot configurará a renovação automática).*

---

## Passo 6: Deploy e Execução da Aplicação

Mude para o usuário `tst` e acesse a pasta da aplicação (ex: `/var/www/portal-tst-layout`):
```bash
su - tst
mkdir -p /var/www/portal-tst-layout
cd /var/www/portal-tst-layout
```

Envie os arquivos do projeto para esta pasta (via Git clone ou SFTP).

Crie o arquivo de variáveis de ambiente de produção (`.env`) com as chaves reais (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `JWT_SECRET`, etc.):
```bash
nano .env
```

Instale as dependências e faça o build de produção:
```bash
pnpm install
pnpm run build
```

Inicie o servidor Node.js utilizando o PM2:
```bash
pm2 start dist/server/_core/index.js --name "tst-brasil-hub"
```

Salve o estado atual do PM2:
```bash
pm2 save
```

---

## Referências

- [1] NodeSource. *Node.js Binary Distributions*. Disponível em: <https://github.com/nodesource/distributions>.
- [2] PM2 Documentation. *Process Management for Node.js*. Disponível em: <https://pm2.keymetrics.io/>.
- [3] Certbot. *Let's Encrypt Client*. Disponível em: <https://certbot.eff.org/>.

Autor: **Manus AI**
