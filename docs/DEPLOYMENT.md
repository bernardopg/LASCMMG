# Guia Abrangente de Implantação - LASCMMG

## 🆕 Atualizações Recentes

- Todos os imports de módulos JavaScript no frontend e backend foram revisados e corrigidos para usar caminhos relativos corretos, eliminando erros de importação.
- Estrutura de pastas padronizada e modularizada para facilitar manutenção e escalabilidade.
- Scripts, handlers e documentação revisados para refletir a estrutura real do projeto e facilitar onboarding de novos desenvolvedores.
- Recomendações de deploy e manutenção revisadas para refletir as melhores práticas atuais.

[⬅ Voltar ao README](README.md)

## Índice

- [Pré-requisitos](#📋-pré-requisitos-essenciais)
- [Instalação em Desenvolvimento](#💻-instalação-em-ambiente-de-desenvolvimento)
- [Configuração Inicial](#configuração-inicial-essencial)
- [Banco de Dados e Administrador](#inicialização-do-banco-de-dados-e-administrador)
- [Execução](#execução-em-modo-de-desenvolvimento)
- [Dicas de Produção](#opcional-para-produção)

---

## 🚀 Prepare Seu Ambiente para Rodar o Sistema de Gerenciamento de Torneios de Sinuca

Este guia detalha o processo de implantação do Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG), desde a configuração inicial até estratégias avançadas para ambientes de produção. O sistema é construído com Node.js, Express e utiliza SQLite (via `better-sqlite3`) como banco de dados principal, oferecendo flexibilidade para diferentes cenários de hospedagem.

## 📋 Pré-requisitos Essenciais

Antes de iniciar a implantação, certifique-se de que seu ambiente possui o software necessário:

* **Node.js:** Versão 16.x ou superior é fortemente recomendada para compatibilidade e performance.
* **npm:** O gerenciador de pacotes do Node.js, geralmente incluído na instalação do Node.js.
* **Git:** Essencial para clonar o repositório do projeto.
* **Ferramentas de Compilação:** A biblioteca `better-sqlite3` é um módulo nativo e pode exigir ferramentas de compilação (como Python, Make, C/C++ compiler) durante a instalação das dependências via `npm install`. Consulte a documentação da `better-sqlite3` para requisitos específicos do seu sistema operacional.
* **Opcional para Produção:** Docker, Docker Compose, Nginx (ou outro proxy reverso), um gerenciador de processos como PM2 ou Systemd.

### Recursos de Hardware Recomendados

Os requisitos de hardware podem variar dependendo da escala de uso.

**Ambiente de Desenvolvimento:**

* CPU: 2 cores
* RAM: 4GB
* Armazenamento: 2GB (suficiente para o código e um banco de dados pequeno)

**Ambiente de Produção (Pequeno/Médio Porte):**

* CPU: 2-4 cores
* RAM: 4-8GB
* Armazenamento: 10-20GB (considerando o crescimento do banco de dados e o armazenamento de backups)

## 💻 Instalação em Ambiente de Desenvolvimento

Ideal para testar e desenvolver novas funcionalidades.

### Clone do Repositório

Obtenha o código-fonte do projeto:

```bash
git clone <URL_DO_SEU_REPOSITORIO_GIT> lascmmg
cd lascmmg
```

### Instalação de Dependências

Instale todas as bibliotecas e módulos necessários:

```bash
npm install
```

*(Se encontrar erros relacionados à compilação, consulte a seção de pré-requisitos sobre ferramentas de compilação e o guia de resolução de problemas `TROUBLESHOOTING.md`.)*

### Configuração Inicial Essencial

Configure as variáveis de ambiente do projeto:

```bash
# Copie o arquivo de configuração de exemplo
cp .env.example .env
```

**Edite o arquivo `.env`** e defina as variáveis conforme suas necessidades. **Em ambiente de desenvolvimento, `NODE_ENV=development` é o padrão.**

**Variáveis Cruciais para Segurança (Especialmente em Produção):**

* `COOKIE_SECRET`: Uma string longa, aleatória e única para assinar cookies de sessão. **Essencial para a segurança das sessões.**
* `JWT_SECRET`: Uma string longa, aleatória e única para assinar tokens JWT. **Essencial para a segurança da API.**

**Exemplo de `.env` (Desenvolvimento):**

```ini
PORT=3000
NODE_ENV=development
COOKIE_SECRET=sua_chave_secreta_longa_e_aleatoria_para_cookies
JWT_SECRET=sua_chave_secreta_longa_e_aleatoria_para_jwt
CORS_ORIGIN=* # Permite requisições de qualquer origem em desenvolvimento
# Outras variáveis podem ser mantidas com os valores padrão ou ajustadas
```

### Inicialização do Banco de Dados e Administrador

O banco de dados SQLite (`data/database.sqlite`) e suas tabelas são criados e/ou migrados automaticamente na primeira vez que o servidor é iniciado (via `backend/server.js` que chama `backend/lib/db/database.js` e `backend/lib/db/db-init.js`).

Para criar o primeiro usuário administrador, utilize o script dedicado:

```bash
# Execute o script e siga os prompts para definir usuário e senha
node scripts/initialize_admin.js
# Alternativamente, passe usuário e senha como argumentos (use aspas se houver espaços)
# node scripts/initialize_admin.js --username "seu_usuario_admin" --password "sua_senha_forte_aqui"
```

**Nota:** Este script depende da existência de um arquivo `admin_credentials.json` na raiz do projeto contendo o nome de usuário e um hash bcrypt **pré-gerado** da senha. Certifique-se de que este arquivo está configurado corretamente antes de executar o script. Consulte o código-fonte de `scripts/initialize_admin.js` para detalhes.

### Execução em Modo de Desenvolvimento

Inicie o servidor com reinício automático ao detectar mudanças no código:

```bash
npm run dev
```

O servidor principal é `server.js`. Ele estará rodando na porta configurada (padrão 3000).

## ⚙️ Configuração do Ambiente (`.env`)

O arquivo `.env` é crucial para configurar o comportamento do sistema. Copie `.env.example` para `.env` e ajuste as variáveis:

| Variável               | Descrição                                                                                                | Valor Padrão (Exemplo)           | Obrigatório (Produção) |
| :--------------------- | :------------------------------------------------------------------------------------------------------- | :------------------------------- | :--------------------- |
| `PORT`                 | Porta em que o servidor Express irá escutar.                                                             | `3000`                           | Não                    |
| `NODE_ENV`             | Define o ambiente de execução (`development` ou `production`). Afeta logs, segurança e comportamento.      | `development`                    | Não                    |
| `JWT_SECRET`           | Segredo criptográfico para assinar e verificar tokens JWT. **Mantenha seguro e confidencial.**           | `your-very-strong-jwt-secret`    | **Sim**                |
| `JWT_EXPIRATION`       | Tempo de validade dos tokens JWT (ex: `1h`, `7d`, `30m`).                                                | `1h`                             | Não                    |
| `JWT_ISSUER`           | Identificador do emissor do token JWT (geralmente o domínio da sua aplicação).                           | `yourdomain.com`                 | Sim                    |
| `JWT_AUDIENCE`         | Identificador da audiência do token JWT (geralmente o domínio da sua aplicação).                         | `yourdomain.com`                 | Sim                    |
| `COOKIE_SECRET`        | Segredo criptográfico para assinar cookies de sessão. **Mantenha seguro e confidencial.**                | `your-very-strong-cookie-secret` | **Sim**                |
| `CORS_ORIGIN`          | Define as origens permitidas para requisições CORS em ambiente de produção (ex: `https://seu-dominio.com`). | `https://seu-dominio.com`        | Sim                    |
| `RATE_LIMIT_WINDOW_MS` | Janela de tempo em milissegundos para o rate limiting da API.                                            | `900000` (15 min)                | Não                    |
| `RATE_LIMIT_MAX`       | Número máximo de requisições permitidas por IP dentro da janela de rate limiting.                        | `100`                            | Não                    |
| `LOG_LEVEL`            | Nível mínimo de log a ser exibido (configurado no logger Pino).                                          | `info`                           | Não                    |
| `SENTRY_DSN`           | Data Source Name (DSN) para integração com Sentry (monitoramento de erros). Opcional.                    | —                                | Não                    |

**Nota Importante sobre o Banco de Dados:** O caminho do arquivo do banco de dados SQLite (`data/data.db`) é configurado internamente e é relativo à raiz do projeto. Certifique-se de que o diretório `data/` existe e que o usuário que executa a aplicação tem permissões de escrita nele.

## 🐳 Implantação com Docker (Exemplo Genérico)

O uso de contêineres Docker simplifica a implantação e garante consistência entre ambientes.

1. **`Dockerfile` (Exemplo):**

    ```dockerfile
    # Use uma imagem Node.js oficial
    FROM node:18-alpine

    # Defina o diretório de trabalho dentro do contêiner
    WORKDIR /usr/src/app

    # Instalar dependências de compilação para better-sqlite3 e depois removê-las
    # Pode variar dependendo da imagem base Alpine. Consulte a documentação da better-sqlite3.
    RUN apk add --no-cache --virtual .build-deps python3 make g++

    # Copie os arquivos de definição de pacotes e instale as dependências de produção
    COPY package*.json ./
    RUN npm ci --only=production

    # Remover dependências de compilação após a instalação
    RUN apk del .build-deps

    # Copie o restante do código da aplicação
    COPY . .

    # Garanta que os diretórios de dados e backups existam e sejam acessíveis pelo usuário da aplicação
    RUN mkdir -p data backups && chown -R node:node data backups

    # Mude para um usuário não-root para maior segurança
    USER node

    # Exponha a porta que a aplicação escuta
    EXPOSE 3000

    # Comando para iniciar a aplicação
    CMD [ "node", "server.js" ]
    ```

2. **`docker-compose.yml` (Exemplo):**

    ```yaml
    version: '3.8'
    services:
      app:
        build: . # Constrói a imagem a partir do Dockerfile no diretório atual
        restart: unless-stopped # Reinicia o contêiner a menos que ele seja parado explicitamente
        environment:
          NODE_ENV: production
          PORT: 3000
          # Defina suas variáveis de ambiente de produção aqui ou use um arquivo .env externo
          # Ex: JWT_SECRET: ${JWT_SECRET_FROM_HOST_ENV}
          # Ex: COOKIE_SECRET: ${COOKIE_SECRET_FROM_HOST_ENV}
          # Ex: CORS_ORIGIN: https://seu-dominio.com
        volumes:
          - ./data:/usr/src/app/data # Persiste o arquivo do banco de dados SQLite no host
          - ./backups:/usr/src/app/backups # Persiste os backups no host
          # Se usar um arquivo .env externo para o docker-compose:
          # env_file:
          #   - .env
        ports:
          - '3000:3000' # Mapeia a porta 3000 do contêiner para a porta 3000 do host
        # Opcional: Adicionar healthcheck
        # healthcheck:
        #   test: ["CMD", "curl", "-f", "http://localhost:3000/ping"] # Ajuste o endpoint se necessário
        #   interval: 1m30s
        #   timeout: 10s
        #   retries: 3
    ```

Para construir e executar com Docker Compose:

```bash
docker-compose build
docker-compose up -d
```

## 🌐 Implantação em Produção com Nginx (Exemplo Genérico)

Para implantar em um servidor dedicado ou VPS, você pode usar Nginx como proxy reverso para servir a aplicação Node.js.

1. **Preparar o Servidor:**
    * Instale Node.js, npm, Git.
    * Instale as ferramentas de compilação se necessário (ex: `sudo apt-get install -y python3 make g++ build-essential` em Debian/Ubuntu).
    * Clone o projeto para um diretório apropriado (ex: `/var/www/lascmmg`): `git clone <URL_DO_SEU_REPOSITORIO_GIT> /var/www/lascmmg`
    * Acesse o diretório do projeto: `cd /var/www/lascmmg`
    * Instale as dependências de produção: `npm ci --production`
    * Configure o arquivo `.env` com as variáveis de ambiente de **produção**.
    * Crie os diretórios `data/` e `backups/` na raiz do projeto (`/var/www/lascmmg/data`, `/var/www/lascmmg/backups`) e garanta que o usuário que executará a aplicação Node.js tenha permissões de escrita neles.
    * Execute o script de inicialização do administrador se ainda não o fez.

2. **Configurar Nginx como Proxy Reverso:**
    Crie um arquivo de configuração para seu site (ex: `/etc/nginx/sites-available/lascmmg`):

    ```nginx
    server {
        listen 80;
        server_name seu-dominio.com www.seu-dominio.com; # Substitua pelo seu domínio

        # Redirecionar HTTP para HTTPS (recomendado)
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name seu-dominio.com www.seu-dominio.com; # Substitua pelo seu domínio

        # Configurações SSL (substitua pelos caminhos dos seus certificados)
        ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Configurações de proxy para a aplicação Node.js
        location / {
            proxy_pass http://localhost:3000; # Substitua pela porta que seu Node.js está rodando
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme; # Essencial para o redirecionamento HTTPS no Node.js
        }

        # Opcional: Servir assets estáticos diretamente pelo Nginx para melhor performance
        # location ~* \.(css|js|gif|jpe?g|png|svg|woff2?|eot|ttf|otf)$ {
        #     root /var/www/lascmmg; # Diretório raiz do seu projeto
        #     expires 1y; # Cache de 1 ano para assets estáticos
        #     add_header Cache-Control "public";
        #     # Desabilitar logs de acesso para assets (opcional)
        #     access_log off;
        # }

        # Opcional: Configurar rate limiting no Nginx (alternativa ao rate limiting do Express)
        # limit_req_zone $binary_remote_addr zone=mylimit:10m rate=5r/s;
        # location /api/ {
        #     limit_req zone=mylimit burst=10;
        #     proxy_pass http://localhost:3000;
        #     # ... outras configurações de proxy ...
        # }
    }
    ```

    Crie um link simbólico para habilitar a configuração: `sudo ln -s /etc/nginx/sites-available/lascmmg /etc/nginx/sites-enabled/`
    Teste a configuração: `sudo nginx -t`
    Recarregue o Nginx: `sudo systemctl reload nginx`

3. **Configurar um Gerenciador de Processos (Systemd ou PM2):**
    Para garantir que a aplicação Node.js rode continuamente e reinicie em caso de falha, use um gerenciador de processos.

    **Exemplo com Systemd:**
    Crie um arquivo de serviço (ex: `/etc/systemd/system/lascmmg.service`):

    ```ini
    [Unit]
    Description=LASCMMG Tournament Management System
    After=network.target

    [Service]
    Type=simple
    User=your_deploy_user # Crie um usuário dedicado para rodar a aplicação (não use root)
    WorkingDirectory=/var/www/lascmmg # Diretório raiz do projeto
    ExecStart=/usr/bin/node server.js # Caminho completo para o executável do Node.js e o arquivo server.js
    Restart=on-failure # Reinicia a aplicação se ela falhar
    EnvironmentFile=/var/www/lascmmg/.env # Carrega as variáveis de ambiente do seu arquivo .env
    StandardOutput=journal # Envia logs padrão para o journald
    StandardError=journal # Envia erros padrão para o journald

    [Install]
    WantedBy=multi-user.target
    ```

    Recarregue o daemon do Systemd: `sudo systemctl daemon-reload`
    Habilite o serviço para iniciar no boot: `sudo systemctl enable lascmmg`
    Inicie o serviço: `sudo systemctl start lascmmg`
    Verifique o status e logs: `sudo systemctl status lascmmg`, `sudo journalctl -u lascmmg -f`

    **Exemplo com PM2:**
    Instale PM2 globalmente: `npm install -g pm2`
    No diretório do projeto, inicie a aplicação: `pm2 start server.js --name lascmmg --env production`
    Configure PM2 para iniciar no boot: `pm2 startup systemd` (siga as instruções fornecidas)
    Salve a lista de processos: `pm2 save`
    Gerencie com PM2: `pm2 status`, `pm2 logs lascmmg`, `pm2 restart lascmmg`, `pm2 stop lascmmg`

## 🔄 Atualização do Sistema

Para atualizar o sistema para uma nova versão:

1. **Faça Backup:** Execute o script de backup: `node scripts/backup-database.js`
2. **Pare o Serviço:** Pare o processo da aplicação (ex: `sudo systemctl stop lascmmg` ou `pm2 stop lascmmg` ou `docker-compose down`).
3. **Atualize o Código:** No diretório do projeto, puxe as últimas mudanças do Git: `git pull`
4. **Instale Novas Dependências:** Se o `package.json` foi alterado, instale as dependências atualizadas: `npm ci --production`
5. **Migrações de Banco de Dados:** O sistema executa migrações de esquema automaticamente ao iniciar (via `applyDatabaseMigrations` em `server.js`).
6. **Reinicie o Serviço:** Inicie o processo da aplicação novamente (ex: `sudo systemctl start lascmmg` ou `pm2 start lascmmg` ou `docker-compose up -d`).
7. **Monitore:** Verifique os logs para garantir que a aplicação iniciou sem erros.

## 📊 Monitoramento Essencial

Monitorar a aplicação em produção é vital para garantir sua saúde e performance.

* **Logs:** Utilize `journalctl -u lascmmg -f` (Systemd) ou `pm2 logs lascmmg` (PM2) ou `docker-compose logs -f app` (Docker) para acompanhar os logs da aplicação.
* **Sentry:** Configure a variável `SENTRY_DSN` no seu arquivo `.env` para integrar com Sentry e monitorar erros em tempo real.
* **Health Check:** O endpoint `/ping` (`/api/system/health` também existe e é protegido) pode ser usado para verificar se o servidor está respondendo e se a conexão com o banco de dados está ativa.

## 💾 Backup e Recuperação de Dados

A persistência dos dados é crucial. O sistema utiliza um arquivo SQLite (`data/data.db`).

* **Backup:** Utilize o script `node scripts/backup-database.js`. **É altamente recomendado automatizar a execução deste script** (ex: via cron job) para garantir backups regulares. Os backups são armazenados no diretório `backups/`.
* **Recuperação:** Em caso de perda de dados ou corrupção do arquivo `data/data.db`:
    1. Pare o serviço da aplicação.
    2. Localize o backup mais recente e válido no diretório `backups/`.
    3. Substitua o arquivo `data/data.db` pelo arquivo de banco de dados contido no backup (você precisará extrair o `.tar.gz`).
    4. Reinicie o serviço da aplicação.

## ⏪ Rollback em Caso de Falha na Atualização

Se uma atualização causar problemas, você pode reverter para uma versão estável anterior:

1. Pare o serviço da aplicação.
2. Reverta o código para um commit estável conhecido: `git reset --hard <commit_hash_estavel>`.
3. Restaure o backup do banco de dados que corresponde à versão do código para a qual você está revertendo.
4. Reinstale as dependências caso o `package.json` da versão anterior seja diferente: `npm ci --production`.
5. Reinicie o serviço da aplicação.
6. Monitore cuidadosamente para confirmar que o sistema está operando normalmente.

---

[⬆ Voltar ao topo](#guia-abrangente-de-implantação---lascmmg) | [Voltar ao README](README.md)
