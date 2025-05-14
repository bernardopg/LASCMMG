# Guia de Implantação - LASCMMG

Este documento fornece instruções detalhadas para implantar o Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG) em diferentes ambientes. O sistema utiliza Node.js, Express e SQLite.

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

- Node.js (v14.x ou superior recomendado)
- npm (v6.x ou superior)
- Git
- SQLite (a biblioteca `sqlite3` é incluída como dependência npm)
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

### Configuração Inicial

```bash
# Copie o arquivo de configuração de exemplo
cp .env.example .env

# Edite o arquivo .env e defina as variáveis, especialmente COOKIE_SECRET e JWT_SECRET
nano .env

# O banco de dados SQLite (data/lascmmg.sqlite) e suas tabelas serão criados
# automaticamente na primeira vez que o servidor for iniciado,
# ou ao executar scripts que inicializam o DB (como setup-admin-sqlite.js).

# Configure o administrador inicial (siga os prompts)
node scripts/setup-admin-sqlite.js --verbose
```

### Execução em Modo de Desenvolvimento

```bash
# Servidor com nodemon (reinício automático ao salvar arquivos)
npm run dev
```

O servidor principal é `server.js`, que já está configurado para usar SQLite.

## Configuração do Ambiente

### Variáveis de Ambiente (`.env`)

Copie `.env.example` para `.env` e configure:

| Variável | Descrição | Valor Padrão (Exemplo) | Obrigatório |
|----------|-----------|--------------|-------------|
| `PORT` | Porta do servidor | `3000` | Não |
| `NODE_ENV` | Ambiente (development, production) | `development` | Não |
| `JWT_SECRET` | Segredo para tokens JWT | `your-very-strong-jwt-secret` | **Sim (Produção)** |
| `JWT_EXPIRATION` | Expiração dos tokens JWT | `24h` | Não |
| `COOKIE_SECRET` | Segredo para cookies de sessão | `your-very-strong-cookie-secret` | **Sim (Produção)** |
| `DB_PATH` | Caminho para o arquivo SQLite | `./data/lascmmg.sqlite` | Não |
| `CORS_ORIGIN` | Origens permitidas pelo CORS em produção | `https://seu-dominio.com` | Sim (Produção) |
| `RATE_LIMIT_WINDOW_MS` | Janela de tempo para rate limiting (ms) | `900000` (15 min) | Não |
| `RATE_LIMIT_MAX` | Máximo de requisições por janela/IP | `100` | Não |
| `LOG_LEVEL` | Nível de log | `info` | Não |
| `SENTRY_DSN` | DSN para Sentry (opcional) | — | Não |

**Nota:** Para produção, `JWT_SECRET` e `COOKIE_SECRET` devem ser strings longas, aleatórias e seguras.

### Configuração do Administrador

Use o script `scripts/setup-admin-sqlite.js` para criar ou atualizar o usuário administrador no banco de dados SQLite.
Para gerar/verificar hashes de senha manualmente, use `scripts/generate_admin_hash.js`.

## Implantação com Docker (Exemplo Genérico)

Se optar por Docker:

1. **`Dockerfile` (Exemplo):**

    ```dockerfile
    FROM node:18-alpine
    WORKDIR /usr/src/app
    COPY package*.json ./
    RUN npm ci --only=production
    COPY . .
    # Garanta que o diretório de dados seja acessível e persistido por um volume
    RUN mkdir -p data && chown -R node:node data
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
          # Defina JWT_SECRET, COOKIE_SECRET, etc. aqui ou via arquivo .env no compose
          # Ex: JWT_SECRET: ${JWT_SECRET_FROM_HOST_ENV}
        volumes:
          - ./data:/usr/src/app/data  # Persiste o banco de dados SQLite
          - ./backups:/usr/src/app/backups # Persiste backups
        ports:
          - "3000:3000"
    ```

    Lembre-se de criar um arquivo `.env` no mesmo nível do `docker-compose.yml` ou passar as variáveis de ambiente diretamente.

## Implantação em Produção com Nginx (Exemplo Genérico)

Para um servidor dedicado/VPS:

1. **Preparar o Servidor:**
    - Instale Node.js, npm, Git.
    - Clone o projeto: `git clone <URL_DO_SEU_REPOSITORIO_GIT> /var/www/lascmmg`
    - Acesse `/var/www/lascmmg` e execute `npm ci --production`.
    - Configure o arquivo `.env` com as variáveis de produção.
    - Garanta que o diretório `data/` e `backups/` tenham permissões de escrita para o usuário que rodará a aplicação Node.js.

2. **Configurar Nginx como Proxy Reverso:**
    (Exemplo similar ao fornecido anteriormente, mas apontando para `server.js` se ele for o único ponto de entrada).

3. **Configurar Systemd (ou PM2) para Gerenciar o Processo Node.js:**
    - Crie um arquivo de serviço (ex: `/etc/systemd/system/lascmmg.service`) para `server.js`.

        ```ini
        [Unit]
        Description=LASCMMG Tournament Management System
        After=network.target

        [Service]
        Type=simple
        User=your_deploy_user # Usuário não-root que rodará a aplicação
        WorkingDirectory=/var/www/lascmmg
        ExecStart=/usr/bin/node server.js # Ou caminho completo para seu Node
        Restart=on-failure
        EnvironmentFile=/var/www/lascmmg/.env # Carrega variáveis do .env
        StandardOutput=journal
        StandardError=journal

        [Install]
        WantedBy=multi-user.target
        ```

    - Execute `sudo systemctl daemon-reload`, `sudo systemctl enable lascmmg`, `sudo systemctl start lascmmg`.

## Atualização do Sistema

1. **Faça Backup:** Sempre faça backup do banco de dados (`data/lascmmg.sqlite`) antes de atualizar.

    ```bash
    node scripts/backup-database.js
    ```

2. **Pare o Serviço:**

    ```bash
    sudo systemctl stop lascmmg # Ou docker-compose down
    ```

3. **Atualize o Código:**

    ```bash
    cd /var/www/lascmmg
    git pull
    ```

4. **Instale Dependências (se `package.json` mudou):**

    ```bash
    npm ci --production
    ```

5. **Execute Migrações de Banco de Dados (Automático):**
    O sistema tentará executar migrações de esquema automaticamente ao iniciar (`lib/db-init.js` -> `runMigrations`).
6. **Reinicie o Serviço:**

    ```bash
    sudo systemctl start lascmmg # Ou docker-compose up -d
    ```

## Monitoramento

- **Logs:** Verifique os logs do systemd (`journalctl -u lascmmg -f`) ou Docker (`docker-compose logs -f app`).
- **Sentry:** Configure `SENTRY_DSN` no `.env` para monitoramento de erros em produção.
- **Health Check:** Endpoint `/api/health` (verifique se existe ou crie um simples em `server.js`).

## Backup e Recuperação

- **Backup:** Use `node scripts/backup-database.js` ou configure um cron job. Os backups são salvos em `backups/`.
- **Recuperação:** Pare o serviço, substitua `data/lascmmg.sqlite` pelo arquivo de backup desejado e reinicie o serviço.

## Rollback em Caso de Falha

1. Pare o serviço.
2. Reverta o código para um commit anterior estável: `git reset --hard <commit_hash>`.
3. Restaure o backup do banco de dados correspondente àquela versão.
4. Reinstale as dependências: `npm ci --production`.
5. Reinicie o serviço.
6. Monitore os logs.

---
Este guia de implantação é um documento vivo e deve ser atualizado conforme o sistema evolui.
