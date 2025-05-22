# Guia de Resolução de Problemas - LASCMMG (Versão React com Vite)

[⬅ Voltar ao README Principal](../README.md)

## Índice

- [Antes de Começar](#1-antes-de-começar-informações-essenciais)
- [Problemas de Instalação e Dependências](#2-problemas-de-instalação-e-dependências)
  - [Backend](#backend)
  - [Frontend (React com Vite)](#frontend-react-com-vite)
- [Problemas de Configuração (`.env` e Frontend Envs)](#3-problemas-de-configuração-env-e-frontend-envs)
- [Problemas do Banco de Dados (SQLite)](#4-problemas-do-banco-de-dados-sqlite)
- [Problemas de Inicialização (Backend e Frontend Dev Server)](#5-problemas-de-inicialização)
- [Problemas de Acesso e Autenticação](#6-problemas-de-acesso-e-autenticação)
- [Problemas de Interface e Frontend React](#7-problemas-de-interface-e-frontend-react)
- [Problemas de Build do Frontend (Vite)](#8-problemas-de-build-do-frontend-react-com-vite)
- [Problemas de Performance](#9-problemas-de-performance)
- [Problemas de Implantação](#10-problemas-de-implantação)
- [Coletando Informações para Suporte](#11-coletando-informações-para-suporte)

---

## 🔍 Solucionando Questões Comuns: Um Guia Prático (Versão React com Vite)

Este guia foi atualizado para ajudar a diagnosticar e resolver problemas com o Sistema LASCMMG, agora com seu frontend em **React, Vite e Tailwind CSS**.

## 1. Antes de Começar: Informações Essenciais

- **Versão do Node.js e npm/yarn:** `node -v`, `npm -v` ou `yarn -v`. (Node.js v18+ recomendado).
- **Sistema Operacional.**
- **Ambiente:** Desenvolvimento ou produção?
- **Logs:**
  - **Backend:** Console do servidor Node.js, logs do PM2/Systemd/Docker.
  - **Frontend (Vite Dev Server):** Console do navegador (F12), terminal do `npm run dev` (em `frontend-react/`).
- **Passos para Reproduzir o problema.**

## 2. Problemas de Instalação e Dependências

### Backend (`/lascmmg`)

- **Erro: `Cannot find module '...'` ou `require(...)` falha (Backend):**
  - Solução: Na raiz do projeto (`/lascmmg`), execute `npm install` (ou `yarn install`). Se persistir, remova `node_modules` e `package-lock.json` (ou `yarn.lock`), depois reinstale.
- **Erro durante `npm install` (especialmente `better-sqlite3`):**
  - Solução: Instale ferramentas de compilação C/C++ (veja [README.md](README.md) ou `DEPLOYMENT.md`). Limpe `node_modules` e `package-lock.json`, tente `npm install` novamente.

### Frontend (React com Vite) (`/lascmmg/frontend-react`)

- **Erro: `Cannot find module '...'` ou `import` falha (Frontend):**
  - Solução: Navegue até `frontend-react/` e execute `npm install` (ou `yarn install`). Se persistir, remova `frontend-react/node_modules` e `frontend-react/package-lock.json` (ou `yarn.lock`), depois reinstale.
- **Problemas com Vite ou plugins do Vite:**
  - Solução: Verifique a compatibilidade da versão do Node.js. Tente atualizar os pacotes do Vite e seus plugins. Limpe o cache do Vite (`npx vite clear-cache` ou remova `node_modules/.vite`) e o cache do npm/yarn (`npm cache clean --force`).
- **Erro: `npm ERR! Missing script: "lint"` (Frontend):**
  - Solução: Certifique-se de que os scripts `lint` e `lint:fix` estão definidos no `frontend-react/package.json`. Eles foram adicionados recentemente. Se ausentes, adicione:
    ```json
    "scripts": {
      // ... outros scripts
      "lint": "eslint . --ext js,jsx,ts,tsx --report-unused-disable-directives --max-warnings 0",
      "lint:fix": "eslint . --ext js,jsx,ts,tsx --report-unused-disable-directives --max-warnings 0 --fix"
    }
    ```

## 3. Problemas de Configuração (`.env` e Frontend Envs)

### Backend (`/lascmmg/.env`)

- **Variáveis de ambiente não carregam:**
  - Solução: Verifique se o arquivo é `.env` na raiz do projeto. Copie de `.env.example`. Formato `CHAVE=VALOR`. Reinicie o servidor backend após mudanças. `require('dotenv').config()` deve estar no início de `backend/server.js`.

### Frontend (`/lascmmg/frontend-react/.env.development`, `.env.production`, etc.)

- **`VITE_API_URL` (ou outras `VITE_` vars) não funciona ou aponta para o lugar errado:**
  - Solução: Verifique se o arquivo `.env.*` correto está em `frontend-react/`. As variáveis devem começar com `VITE_`. Reinicie o servidor de desenvolvimento do Vite (`npm run dev` em `frontend-react/`) após mudanças. Para builds de produção, o arquivo `.env.production` é usado, ou variáveis de ambiente são injetadas no processo de build/deploy.
- **Erro de CORS no navegador (Frontend não acessa API):**
  - Solução (Desenvolvimento): `CORS_ORIGIN=*` no `.env` do backend geralmente permite. Verifique se o frontend está rodando na porta esperada (Vite padrão: 5173).
  - Solução (Produção): `CORS_ORIGIN` no `.env` do backend DEVE ser a URL exata do frontend (ex: `https://app.seudominio.com`). `VITE_API_URL` no frontend deve corresponder ao que o backend espera ou ao proxy.
- **Problemas com Redis (Backend):**
  - **Erro: "Cliente Redis não disponível" ou falhas em CSRF, rate limiting, login/logout (incluindo refresh tokens e blacklist), honeypot, rastreamento de tentativas de login falhas, ou timeout de sessão por inatividade.**
    - Solução: Verifique se o servidor Redis está rodando e acessível na URL configurada em `REDIS_URL` no arquivo `.env` do backend. Verifique os logs do Redis para erros de conexão. Muitas funcionalidades críticas de segurança e sessão dependem do Redis.

## 4. Problemas do Banco de Dados (SQLite)

- **Erro de conexão ou tabelas ausentes:**
  - Solução: Verifique se o diretório definido em `DATA_DIR` (padrão `data/` na raiz) existe e tem permissões de escrita para o usuário do backend. O DB (`database.sqlite` dentro de `DATA_DIR`) e tabelas são criados/migrados na primeira inicialização do backend. Se corrompido, faça backup, remova o arquivo `.sqlite`, e reinicie o backend.
- **Dados não aparecem na interface:**
  - Solução: Verifique logs do backend e console/network do navegador. Inspecione o arquivo `.sqlite` com uma ferramenta como "DB Browser for SQLite".

## 5. Problemas de Inicialização

### Backend Server (`npm run dev` ou `npm start` na raiz)

- **Servidor não inicia ou fecha:**
  - Solução: Verifique logs. Conflito de porta (padrão 3001)? Altere `PORT` no `.env`. Erros de sintaxe? Variáveis de ambiente essenciais (`JWT_SECRET`, `COOKIE_SECRET`) ausentes?

### Frontend React Dev Server (Vite) (`npm run dev` em `frontend-react/`)

- **Servidor de desenvolvimento não inicia:**
  - Solução: Verifique logs no terminal. Conflito de porta (Vite padrão: 5173)? Vite geralmente pergunta se quer usar outra. Problemas com dependências em `frontend-react/node_modules`?
  - Pode ser necessário aumentar o limite de watchers do sistema em Linux: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`.

## 6. Problemas de Acesso e Autenticação

- **Não consigo fazer login no painel (`/login`):**
  - Solução:
    - Verifique suas credenciais (email e senha).
    - O administrador inicial foi criado com `node scripts/initialize_admin.js`?
    - Verifique os logs do backend para mensagens de erro específicas.
    - Limpe cookies e localStorage do seu navegador para o site.
    - Confirme que `JWT_SECRET`, `COOKIE_SECRET`, e `CSRF_SECRET` estão corretamente configurados no arquivo `.env` do backend.
    - **Conta Bloqueada:** Se você vir uma mensagem sobre "Muitas tentativas de login falhas" (status 429), sua conta ou IP pode estar temporariamente bloqueado. Aguarde o tempo indicado (geralmente 15 minutos) e tente novamente.
- **Logout não funciona / sessão persiste:**
  - Solução: Verifique os logs do backend (rota `/api/auth/logout`). O Redis está funcionando corretamente (usado para invalidar tokens de acesso e refresh tokens)? Limpe cache/cookies do navegador.

## 7. Problemas de Interface e Frontend React

- **Páginas em branco, componentes quebrados, estilos ausentes:**
  - Solução: Hard refresh (Ctrl+F5 / Cmd+Shift+R). Console do navegador para erros JS. Aba Network para assets não carregados (404). Verifique se o build do Tailwind CSS está funcionando e se `frontend-react/src/index.css` está sendo importado corretamente em `main.jsx`.
- **Funcionalidades não respondem (botões, formulários):**
  - Solução: Console do navegador para erros JS. Aba Network para status de chamadas API. Logs do backend se a API for atingida.
- **Problemas de Roteamento (React Router):**
  - Solução: Verifique a configuração de `Routes` em `App.jsx` ou no seu arquivo de roteamento. Para deploys com Nginx/Express, certifique-se de que o servidor está configurado para servir `index.html` para todas as rotas da SPA (ex: `try_files $uri $uri/ /index.html;` no Nginx).

## 8. Problemas de Build do Frontend (React com Vite)

- **`npm run build` em `frontend-react/` falha:**
  - Solução: Verifique os logs de erro no terminal. Problemas de memória? (Pode precisar de `NODE_OPTIONS=--max-old-space-size=4096`). Erros de ESLint configurados para quebrar o build? Conflitos de dependência? Configurações inválidas no `vite.config.js`?

## 9. Problemas de Performance

- **Sistema lento (Frontend ou Backend):**
  - Solução (Frontend): Use React DevTools Profiler. Analise o bundle com `vite-bundle-visualizer`. Otimize componentes (`React.memo`, `useMemo`, `useCallback`). Virtualize listas longas.
  - Solução (Backend): Monitoramento de recursos do servidor. Logs para queries lentas. Otimize DB (índices, WAL, VACUUM).
  - Consulte `SCALING.md` para mais detalhes.

## 10. Problemas de Implantação

(Consulte `DEPLOYMENT.md` para guias detalhados de Docker, Nginx, etc.)

- **Dockerfile/Docker Compose falha:**
  - Solução: Logs do Docker. Caminhos corretos no Dockerfile? Variáveis de ambiente passadas? Permissões de volume? Dependências de compilação na imagem base?
- **Nginx não serve o app React ou não faz proxy para API:**
  - Solução: Configuração do Nginx (`root` para `frontend-react/dist`, `try_files` para SPA, `proxy_pass` para API). App backend rodando? Logs do Nginx. Firewall?
- **PM2/Systemd não mantém o backend rodando:**
  - Solução: Logs do gerenciador. Caminhos corretos? Permissões? Arquivo `.env` carregado?

## 11. Coletando Informações para Suporte

Se precisar de ajuda:

- Descrição clara do problema e passos para reproduzir.
- Informações da Seção 1.
- Logs relevantes (servidor, navegador, build).
- Mensagens de erro completas (exemplo abaixo).
- Conteúdo do `.env` do backend e `.env.*` do frontend (OMITIR SEGREDOS!).
- Detalhes da configuração de deploy, se aplicável.

### Exemplo de log de erro real (backend)

```
[2025-05-19T15:00:00.000Z] ERROR: AuthMiddleware - Falha na verificação do token JWT: { error: 'jwt expired', requestId: 'abc123', ip: '::1' }
```

### Exemplo de erro no frontend (console)

```
POST http://localhost:3001/api/auth/login 401 (Unauthorized)
Falha na autenticação. Verifique suas credenciais.
```

---

## FAQ - Dúvidas Frequentes

**1. O sistema funciona em Windows, Linux e Mac?**
Sim, desde que Node.js 18+ e dependências estejam instaladas.

**2. Preciso de Redis em desenvolvimento?**
Não é obrigatório, mas funcionalidades como CSRF, rate limit e honeypot ficam limitadas sem Redis.

**3. Como faço rollback de uma atualização?**
Restaure o backup do banco de dados (`data/database.sqlite`) e faça `git checkout` para o commit anterior.

**4. Como reportar um bug?**
Abra uma issue no GitHub com logs, passos para reproduzir e ambiente.

**5. O que fazer se o build do frontend falhar?**
Veja a seção 8 deste documento e confira dependências, Node.js e logs.

---

[⬆ Voltar ao topo](#guia-de-resolução-de-problemas---lascmmg-versão-react-com-vite) | [Voltar ao README Principal](README.md)
