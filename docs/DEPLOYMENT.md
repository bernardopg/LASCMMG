# Guia Abrangente de Implantação - LASCMMG (Versão React com Vite)

[⬅ Voltar ao README Principal](../README.md)

## Índice

- [Pré-requisitos](#📋-pré-requisitos-essenciais)
- [Configuração do Projeto](#⚙️-configuração-do-projeto)
  - [Backend](#configurar-backend)
  - [Frontend (React com Vite)](#configurar-frontend-react-com-vite)
- [Build para Produção](#🏗️-build-para-produção)
  - [Frontend (React com Vite)](#build-do-frontend-react-com-vite)
  - [Backend](#build-do-backend-opcional)
- [Estratégias de Implantação](#🚀-estratégias-de-implantação)
  - [Servindo Frontend e Backend Separadamente](#servindo-frontend-e-backend-separadamente-recomendado)
  - [Servindo Frontend pelo Backend Express](#servindo-frontend-pelo-backend-express)
- [Implantação com Docker](#🐳-implantação-com-docker)
  - [Dockerfile Multi-Estágio (Recomendado)](#dockerfile-multi-estágio-recomendado)
  - [Docker Compose](#docker-compose)
- [Implantação com Nginx e PM2/Systemd](#🌐-implantação-com-nginx-e-pm2systemd-tradicional)
- [Variáveis de Ambiente em Produção](#🔒-variáveis-de-ambiente-em-produção)
- [Atualização do Sistema](#🔄-atualização-do-sistema)
- [Backup e Recuperação de Dados](#💾-backup-e-recuperação-de-dados)
- [Monitoramento](#📊-monitoramento-essencial)

---

## 🚀 Prepare Seu Ambiente para Rodar o Sistema LASCMMG com Frontend React e Vite

Este guia detalha o processo de implantação do Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG), agora com seu frontend modernizado em **React com Vite e Tailwind CSS**. O backend continua robusto com Node.js, Express, e SQLite (`better-sqlite3`).

## 📋 Pré-requisitos Essenciais

- **Node.js:** Versão 18.x ou superior (recomendado para Vite e backend).
- **npm ou yarn:** Gerenciador de pacotes do Node.js.
- **Git:** Para clonar o repositório.
- **Ferramentas de Compilação C/C++:** Para `better-sqlite3` (veja [TROUBLESHOOTING.md](TROUBLESHOOTING.md)).
- **Servidor Redis:** Necessário para funcionalidade completa em produção (CSRF, rate limiting, etc.). Opcional para desenvolvimento básico se os fallbacks em memória forem aceitáveis.
- **Opcional para Produção:** Docker, Docker Compose, Nginx (ou similar), PM2 ou Systemd.

## ⚙️ Configuração do Projeto

1. **Clonar o Repositório:**

   ```bash
   git clone https://github.com/bernardopg/LASCMMG.git lascmmg
   cd lascmmg
   ```

### Configurar Backend

2. **Variáveis de Ambiente do Backend:**

   - Na raiz do projeto (`/lascmmg`), copie `.env.example` para `.env`:

     ```bash
     cp .env.example .env
     ```

   - Edite `.env` e defina **obrigatoriamente** `COOKIE_SECRET` e `JWT_SECRET` com valores longos, aleatórios e seguros. Ajuste `PORT` (ex: `3001` para API) e `NODE_ENV=production`.

     ```ini
     # /lascmmg/.env
     NODE_ENV=production
     PORT=3001
     COOKIE_SECRET=SEU_COOKIE_SECRET_MUITO_SEGURO_E_LONGO
     JWT_SECRET=SEU_JWT_SECRET_SUPER_SEGURO_E_COMPLEXO
     REDIS_URL=redis://localhost:6379 # URL do seu servidor Redis
     CORS_ORIGIN=https://seu-dominio-frontend.com # URL do seu frontend em produção
     # ... outras variáveis como RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, DATA_DIR ...
     ```

3. **Instalar Dependências do Backend (e do projeto geral):**

   - Na raiz do projeto (`/lascmmg`):

     ```bash
     npm install
     ```

### Configurar Frontend (React com Vite)

4. **Variáveis de Ambiente do Frontend:**

   - Navegue até `frontend-react/`.
   - Crie um arquivo `.env.production` (ou `.env.production.local` para sobrescrever localmente sem commitar). As variáveis de ambiente para Vite devem começar com `VITE_`.

     ```ini
     # /lascmmg/frontend-react/.env.production
     VITE_API_URL=https://seu-dominio-api.com/api # URL completa da sua API backend
     VITE_APP_VERSION=$npm_package_version
     # Adicione outras variáveis que o frontend precise em produção
     ```

     **Nota:** Se o backend e o frontend forem servidos sob o mesmo domínio e a API estiver em um subcaminho (ex: `/api`), `VITE_API_URL` pode ser um caminho relativo como `/api`. Se forem domínios diferentes, use a URL completa do backend.

5. **Instalar Dependências do Frontend:**

   - Ainda em `frontend-react/`:

     ```bash
     npm install
     ```

   - Volte para a raiz do projeto:

     ```bash
     cd ..
     ```

6. **Inicialização do Banco de Dados e Administrador:**

   - O banco de dados SQLite (`data/database.sqlite` por padrão) é criado/migrado automaticamente ao iniciar o backend.
   - Crie o primeiro usuário administrador (execute na raiz do projeto):

     ```bash
     node scripts/initialize_admin.js --username admin --password suaSenhaSuperForte
     ```

   - **⚠️ IMPORTANTE (Segurança):** Após a primeira inicialização bem-sucedida do backend e a confirmação de que o administrador pode fazer login, o arquivo `admin_credentials.json` (se você o criou manualmente para o script `initialize_admin.js` ou se o script o gerou) **DEVE ser removido ou movido para um local seguro fora do diretório da aplicação acessível pela web.** A presença contínua deste arquivo no servidor de produção é um risco de segurança, pois ele contém o hash da senha do administrador. O sistema é projetado para migrar essas credenciais para o banco de dados na primeira oportunidade.

## 🏗️ Build para Produção

### Build do Frontend (React com Vite)

1. Navegue até o diretório do frontend:

   ```bash
   cd frontend-react
   ```

2. Execute o script de build:

   ```bash
   npm run build
   ```

   Isso criará uma pasta `dist/` dentro de `frontend-react/` com os arquivos estáticos otimizados da sua aplicação React. Estes são os arquivos que você irá implantar.

### Build do Backend (Opcional)

O backend Node.js/Express não requer um passo de "build" como o frontend React, a menos que você esteja usando TypeScript ou um transpilador para o backend, o que não é o caso atualmente.

## 🚀 Estratégias de Implantação

### Servindo Frontend e Backend Separadamente (Recomendado)

- **Backend API:** Implante o backend Node.js (diretório raiz `/lascmmg`) em um servidor de aplicação (ex: usando PM2/Systemd, Docker). Ele escutará na porta definida em `.env` (ex: 3001) e responderá em um subdomínio (ex: `api.seudominio.com`) ou caminho (ex: `seudominio.com/api`).
- **Frontend React (Vite build):** Implante os arquivos estáticos da pasta `frontend-react/dist/` em um servidor web (Nginx, Apache) ou um serviço de hospedagem estática (Netlify, Vercel, AWS S3+CloudFront, GitHub Pages).
  - Configure o servidor web para servir `index.html` para todas as rotas não encontradas (para suportar o roteamento do lado do cliente do React Router).
  - Configure `VITE_API_URL` no build do frontend para apontar para a URL da sua API backend.
  - Configure `CORS_ORIGIN` no backend para permitir requisições do domínio do seu frontend.

### Servindo Frontend pelo Backend Express

O backend Express pode ser configurado para servir os arquivos estáticos do frontend React.

1. Após construir o frontend (`cd frontend-react && npm run build`), copie o conteúdo de `frontend-react/dist/` para uma pasta que o backend possa servir, por exemplo, `backend/public_frontend/` (para evitar conflito com `public/` do backend, se houver).
2. No `backend/server.js`, adicione middlewares para servir esses arquivos estáticos e para lidar com o roteamento do React:

   ```javascript
   // Em backend/server.js (exemplo)
   // ...
   // Servir arquivos estáticos do React build
   app.use(express.static(path.join(__dirname, 'public_frontend')));

   // Lidar com todas as outras rotas NÃO API e servir index.html para o React Router
   app.get(/^(?!\/api).*$/, (req, res) => {
     // Regex para não capturar rotas /api
     res.sendFile(path.join(__dirname, 'public_frontend', 'index.html'));
   });
   // ...
   ```

   Neste caso, `VITE_API_URL` no frontend pode ser `/api`.

## 🐳 Implantação com Docker

### Dockerfile Multi-Estágio (Recomendado)

Crie um `Dockerfile` na raiz do projeto (`/lascmmg`):

```dockerfile
# Estágio 1: Build do Frontend React com Vite
FROM node:18-alpine AS frontend-builder
WORKDIR /usr/src/app/frontend-react
COPY frontend-react/package*.json ./
RUN npm ci
COPY frontend-react/ ./
# Defina VITE_API_URL aqui se necessário para o build, ou use .env.production
# ARG VITE_API_URL=/api
# ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Estágio 2: Aplicação Backend Node.js
FROM node:18-alpine
WORKDIR /usr/src/app

# Instalar dependências de compilação para better-sqlite3 e depois removê-las
RUN apk add --no-cache --virtual .build-deps python3 make g++

# Copiar package.json e package-lock.json da raiz
COPY package*.json ./
RUN npm ci --only=production
RUN apk del .build-deps

# Copiar código do backend e outros arquivos necessários
COPY .env .
COPY backend ./backend
COPY scripts ./scripts
# O diretório 'data' será montado como volume, mas crie-o para permissões
RUN mkdir -p data backups && chown -R node:node data backups

# Copiar o build do frontend do estágio anterior para uma pasta servível pelo backend
COPY --from=frontend-builder /usr/src/app/frontend-react/dist ./backend/public_frontend

USER node
EXPOSE ${PORT:-3001} # Usa a porta do .env ou 3001 como padrão

CMD [ "node", "backend/server.js" ]
```

### Docker Compose

Crie um `docker-compose.yml` na raiz:

```yaml
version: '3.8'
services:
  app:
    build: .
    restart: unless-stopped
    env_file:
      - .env # Carrega variáveis do .env da raiz para o backend
    volumes:
      - ./data:/usr/src/app/data
      - ./backups:/usr/src/app/backups
    ports:
      - '${PORT:-3001}:${PORT:-3001}' # Mapeia a porta do backend
```

Execute: `docker-compose build && docker-compose up -d`

## 🌐 Implantação com Nginx e PM2/Systemd (Tradicional)

Esta abordagem é comum para VPS ou servidores dedicados.

1. **Preparar Servidor:**

   - Instale Node.js, npm/yarn, Git, ferramentas de compilação.
   - Clone o projeto: `git clone https://github.com/bernardopg/LASCMMG.git /var/www/lascmmg`
   - `cd /var/www/lascmmg`
   - **Backend:** `npm install`. Configure `.env`.
   - **Frontend:** `cd frontend-react && npm install && npm run build && cd ..`.
   - Crie `data/` e `backups/` com permissões corretas para o usuário que rodará o Node.js.
   - Execute `node scripts/initialize_admin.js`.

2. **Configurar PM2 ou Systemd para o Backend:**

   - Siga as instruções em `docs/OLD_DEPLOYMENT.md` (ou adapte-as) para PM2 ou Systemd, garantindo que o `WorkingDirectory` e `ExecStart` apontem para `/var/www/lascmmg` e `backend/server.js` respectivamente. O backend rodará na porta definida no `.env` (ex: 3001).

3. **Configurar Nginx:**

   - Sirva os arquivos estáticos de `frontend-react/dist/`.
   - Configure um proxy reverso para `/api` (ou outro prefixo) para o backend Node.js.
     Exemplo de configuração Nginx (`/etc/nginx/sites-available/lascmmg.conf`):

   ```nginx
   server {
       listen 80;
       server_name seu-dominio.com www.seu-dominio.com;
       # Para Let's Encrypt ou redirecionamento para HTTPS
       location / {
           return 301 https://$host$request_uri;
       }
   }

   server {
       listen 443 ssl http2;
       server_name seu-dominio.com www.seu-dominio.com;

       # SSL - configure com seus certificados (ex: Let's Encrypt)
       # ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
       # ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
       # include /etc/letsencrypt/options-ssl-nginx.conf;
       # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

       root /var/www/lascmmg/frontend-react/dist; # Caminho para os arquivos estáticos do React/Vite
       index index.html index.htm;

       location / {
           try_files $uri $uri/ /index.html; # Essencial para React Router
       }

       location /api { # Proxy para o backend
           proxy_pass http://localhost:3001; # Porta do seu backend
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }

       # Outras configurações (logs, gzip, cache de assets estáticos, etc.)
       # Exemplo: Cache para assets
       location ~* \.(?:ico|css|js|gif|jpe?g|png|svg|woff2?)$ {
           expires 1y;
           add_header Cache-Control "public";
           access_log off;
       }
   }
   ```

   Lembre-se de habilitar o site (`ln -s ...`) e recarregar/reiniciar o Nginx.

## 🔒 Variáveis de Ambiente em Produção

- **Backend (`.env`):**
  - `NODE_ENV=production`: Otimiza Express, desabilita logs detalhados de erro.
  - `PORT`: Porta para o backend (ex: `3001`).
  - `JWT_SECRET`, `COOKIE_SECRET`: Devem ser strings longas, aleatórias e únicas. **NÃO USE OS VALORES DE EXEMPLO.**
  - `REDIS_URL`: URL de conexão para o seu servidor Redis (ex: `redis://localhost:6379` ou `redis://user:password@host:port`).
  - `CORS_ORIGIN`: URL exata do seu frontend (ex: `https://app.lascmmg.com`).
  - `DATA_DIR`: Diretório para o banco de dados (ex: `./data` ou `/var/lib/lascmmg/data`).
- **Frontend (Build time - `.env.production` em `frontend-react/`):**
  - `VITE_API_URL`: URL completa da sua API backend (ex: `https://app.lascmmg.com/api` ou `/api` se servido no mesmo domínio).
  - `VITE_APP_VERSION`: Pode ser injetado no build para exibir a versão.

## 🔄 Atualização do Sistema

1. **Backup:** `node scripts/backup-database.js`.
2. **Parar Aplicação:** (PM2, Systemd, Docker).
3. **Atualizar Código:** `git pull` na raiz do projeto.
4. **Instalar/Atualizar Dependências:**
   - Raiz do projeto: `npm install` (se `package.json` mudou).
   - `frontend-react/`: `npm install` (se `frontend-react/package.json` mudou).
5. **Build Frontend:** `cd frontend-react && npm run build && cd ..`.
6. **Migrações DB:** O backend tenta aplicar migrações ao iniciar (`applyDatabaseMigrations` em `server.js`).
7. **Reiniciar Aplicação.**
8. **Monitorar Logs.**

## 💾 Backup e Recuperação de Dados

- **Backup:** Use `node scripts/manage-database.js backup`. Automatize com cron. Armazene backups em local seguro e, preferencialmente, externo.
- **Recuperação:** Pare a aplicação, substitua o arquivo `database.sqlite` no diretório `data/` pelo backup desejado, reinicie a aplicação.
- **Otimização:** Use `node scripts/manage-database.js vacuum` periodicamente para otimizar o arquivo do banco de dados.

## 📊 Monitoramento Essencial

- Logs da aplicação (PM2/Systemd/Docker, ou logging centralizado).
- Ferramentas de monitoramento de servidor (uso de CPU, memória, disco, rede).
- Sentry (se `SENTRY_DSN` configurado no backend) para rastreamento de erros.
- Endpoint de health check (ex: `/api/system/health`).
- Google Analytics ou similar para tráfego do frontend.

---

[⬆ Voltar ao topo](#guia-abrangente-de-implantação---lascmmg-versão-react-com-vite) | [Voltar ao README Principal](README.md)
