# Guia de Implantação - LASCMMG

Este documento fornece instruções detalhadas para implantar o Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG) em diferentes ambientes. O sistema utiliza Node.js, Express e SQLite (via `better-sqlite3`).

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação em Ambiente de Desenvolvimento](#instalação-em-ambiente-de-desenvolvimento)
3. [Configuração do Ambiente](#configuração-do-ambiente)
4. [Implantação com Docker](#implantação-com-docker) (Exemplo Genérico)
5. [Implantação em Produção com Nginx](#implantação-em-produção-com-nginx) (Exemplo Genérico)
6. [Atualização do Sistema](#atualização-do-sistema)
7. [Monitoramento](#monitoramento)
8. [Backup e Recuperação](#backup-e-recuperação)
9. [Rollback em Caso de Falha](#rollback-em-caso-de-falha)

## Pré-requisitos

### Software Necessário

- Node.js (v16.x ou superior recomendado)
- npm (geralmente incluído com Node.js)
- Git
- SQLite (a biblioteca `better-sqlite3` é incluída como dependência npm e pode requerer ferramentas de compilação como `python` e `make` durante a instalação do `npm install`)
- Opcional para produção: Docker, Docker Compose, Nginx

### Recursos de Hardware Recomendados

**Desenvolvimento:**

- CPU: 2 cores
- RAM: 4GB
- Armazenamento: 2GB

**Produção (Pequeno/Médio porte):**

- CPU: 2-4 cores
- RAM: 4-8GB
- Armazenamento: 10-20GB (dependendo do volume de dados e backups)

## Instalação em Ambiente de Desenvolvimento

### Clone do Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO_GIT> lascmmg
cd lascmmg
```

### Instalação de Dependências

```bash
npm install
```

(Pode ser necessário instalar `build-essential` ou `python`/`make`/`g++` se `better-sqlite3` precisar compilar binários nativos.)

### Configuração Inicial

```bash
# Copie o arquivo de configuração de exemplo
cp .env.example .env

# Edite o arquivo .env e defina as variáveis (veja a seção "Configuração do Ambiente")
# É crucial definir COOKIE_SECRET e JWT_SECRET para valores seguros.
nano .env

# O banco de dados SQLite (data/data.db) e suas tabelas serão criados
# e/ou migrados automaticamente na primeira vez que o servidor for iniciado
# (via server.js -> lib/database.js e lib/db-init.js).

# Configure o administrador inicial (siga os prompts ou use argumentos):
node scripts/initialize_admin.js --username seu_usuario_admin --password sua_senha_forte
```

### Execução em Modo de Desenvolvimento

```bash
# Servidor com nodemon (reinício automático ao salvar arquivos)
npm run dev
```

O servidor principal é `server.js`.

## Configuração do Ambiente

### Variáveis de Ambiente (`.env`)

Copie `.env.example` para `.env` e configure:

| Variável               | Descrição                                | Valor Padrão (Exemplo)           | Obrigatório        |
| ---------------------- | ---------------------------------------- | -------------------------------- | ------------------ |
| `PORT`                 | Porta do servidor                        | `3000`                           | Não                |
| `NODE_ENV`             | Ambiente (development, production)       | `development`                    | Não                |
| `JWT_SECRET`           | Segredo para tokens JWT                  | `your-very-strong-jwt-secret`    | **Sim (Produção)** |
| `JWT_EXPIRATION`       | Expiração dos tokens JWT                 | `1h`                             | Não                |
| `JWT_ISSUER`           | Emissor do token JWT                     | `yourdomain.com`                 | Sim (Produção)     |
| `JWT_AUDIENCE`         | Audiência do token JWT                   | `yourdomain.com`                 | Sim (Produção)     |
| `COOKIE_SECRET`        | Segredo para cookies de sessão           | `your-very-strong-cookie-secret` | **Sim (Produção)** |
| `CORS_ORIGIN`          | Origens permitidas pelo CORS em produção | `https://seu-dominio.com`        | Sim (Produção)     |
| `RATE_LIMIT_WINDOW_MS` | Janela de tempo para rate limiting (ms)  | `900000` (15 min)                | Não                |
| `RATE_LIMIT_MAX`       | Máximo de requisições por janela/IP      | `100`                            | Não                |
| `LOG_LEVEL`            | Nível de log (não implementado globalmente) | `info`                           | Não                |
| `SENTRY_DSN`           | DSN para Sentry (opcional)               | —                                | Não                |

**Nota:** O caminho do banco de dados é fixo em `data/data.db` (relativo à raiz do projeto).

## Implantação com Docker (Exemplo Genérico)

1. **`Dockerfile` (Exemplo):**

   ```dockerfile
   FROM node:18-alpine

   WORKDIR /usr/src/app

   # Instalar dependências de compilação para better-sqlite3 e depois removê-las
   # Pode variar dependendo da imagem base Alpine
   RUN apk add --no-cache --virtual .build-deps python3 make g++

   COPY package*.json ./
   RUN npm ci --only=production

   # Remover dependências de compilação
   RUN apk del .build-deps

   COPY . .

   # Garanta que o diretório de dados seja acessível e persistido por um volume
   RUN mkdir -p data backups && chown -R node:node data backups

   USER node
   EXPOSE 3000
   CMD [ "node", "server.js" ]
   ```

2. **`docker-compose.yml` (Exemplo):**

   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       restart: unless-stopped
       environment:
         NODE_ENV: production
         PORT: 3000
         # Defina JWT_SECRET, COOKIE_SECRET, JWT_ISSUER, JWT_AUDIENCE, CORS_ORIGIN aqui
         # ou via um arquivo .env referenciado pelo docker-compose.
         # Ex: JWT_SECRET: ${JWT_SECRET_FROM_HOST_ENV}
       volumes:
         - ./data:/usr/src/app/data      # Persiste o banco de dados SQLite
         - ./backups:/usr/src/app/backups # Persiste backups
       ports:
         - '3000:3000' # Mapeia a porta do container para a porta do host
   ```

## Implantação em Produção com Nginx (Exemplo Genérico)

Para um servidor dedicado/VPS:

1. **Preparar o Servidor:**
   - Instale Node.js, npm, Git.
   - Instale ferramentas de compilação se `better-sqlite3` precisar delas (`sudo apt-get install -y python3 make g++ build-essential` em Debian/Ubuntu).
   - Clone o projeto: `git clone <URL_DO_SEU_REPOSITORIO_GIT> /var/www/lascmmg`
   - Acesse `/var/www/lascmmg` e execute `npm ci --production`.
   - Configure o arquivo `.env` com as variáveis de produção.
   - Crie os diretórios `data/` e `backups/` e garanta permissões de escrita para o usuário da aplicação.

2. **Configurar Nginx como Proxy Reverso:**
   (Consulte a documentação do Nginx para um exemplo detalhado, incluindo SSL/TLS com Let's Encrypt).

3. **Configurar Systemd (ou PM2) para Gerenciar o Processo Node.js:**
   - Crie um arquivo de serviço (ex: `/etc/systemd/system/lascmmg.service`):

     ```ini
     [Unit]
     Description=LASCMMG Tournament Management System
     After=network.target

     [Service]
     Type=simple
     User=your_deploy_user # Usuário não-root
     WorkingDirectory=/var/www/lascmmg
     ExecStart=/usr/bin/node server.js # Caminho para o Node
     Restart=on-failure
     EnvironmentFile=/var/www/lascmmg/.env # Carrega variáveis do .env
     StandardOutput=journal
     StandardError=journal

     [Install]
     WantedBy=multi-user.target
     ```

   - Execute `sudo systemctl daemon-reload`, `sudo systemctl enable lascmmg`, `sudo systemctl start lascmmg`.

## Atualização do Sistema

1. **Faça Backup:** `node scripts/backup-database.js`
2. **Pare o Serviço:** `sudo systemctl stop lascmmg` (ou `docker-compose down`)
3. **Atualize o Código:** `cd /var/www/lascmmg && git pull`
4. **Instale Dependências:** `npm ci --production` (se `package.json` mudou)
5. **Migrações de Banco de Dados:** O sistema executa migrações automaticamente ao iniciar (via `applyDatabaseMigrations` em `server.js`).
6. **Reinicie o Serviço:** `sudo systemctl start lascmmg` (ou `docker-compose up -d`)

## Monitoramento

- **Logs:** `journalctl -u lascmmg -f` (Systemd) ou `docker-compose logs -f app` (Docker).
- **Sentry:** Configure `SENTRY_DSN` no `.env` para monitoramento de erros.
- **Health Check:** Endpoint `/api/system/health` (protegido por autenticação por padrão, ajuste se necessário para monitoramento externo).

## Backup e Recuperação

- **Backup:** `node scripts/backup-database.js`. Agende via cron. Backups em `backups/`.
- **Recuperação:** Pare o serviço, substitua `data/data.db` pelo backup, reinicie.

## Rollback em Caso de Falha

1. Pare o serviço.
2. Reverta o código: `git reset --hard <commit_hash_estavel>`.
3. Restaure o backup do banco de dados correspondente.
4. Reinstale dependências: `npm ci --production`.
5. Reinicie o serviço e monitore.

---
Este guia é um documento vivo e deve ser atualizado conforme o sistema evolui.
