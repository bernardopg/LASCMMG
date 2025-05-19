# Guia de Resolução de Problemas - LASCMMG (Versão React)

[⬅ Voltar ao README](README.md)

## Índice

- [Antes de Começar](#1-antes-de-começar-informações-essenciais)
- [Problemas de Instalação e Dependências](#2-problemas-de-instalação-e-dependências)
  - [Backend](#backend)
  - [Frontend (React)](#frontend-react)
- [Problemas de Configuração (`.env` e Frontend Envs)](#3-problemas-de-configuração-env-e-frontend-envs)
- [Problemas do Banco de Dados (SQLite)](#4-problemas-do-banco-de-dados-sqlite)
- [Problemas de Inicialização (Backend e Frontend Dev Server)](#5-problemas-de-inicialização)
- [Problemas de Acesso e Autenticação](#6-problemas-de-acesso-e-autenticação)
- [Problemas de Interface e Frontend React](#7-problemas-de-interface-e-frontend-react)
- [Problemas de Build do Frontend](#8-problemas-de-build-do-frontend-react)
- [Problemas de Performance](#9-problemas-de-performance)
- [Problemas de Implantação](#10-problemas-de-implantação)
- [Coletando Informações para Suporte](#11-coletando-informações-para-suporte)

---

## 🔍 Solucionando Questões Comuns: Um Guia Prático (Versão React)

Este guia foi atualizado para ajudar a diagnosticar e resolver problemas com o Sistema LASCMMG, agora com seu frontend em **React e Tailwind CSS**.

## 1. Antes de Começar: Informações Essenciais

* **Versão do Node.js e npm:** `node -v`, `npm -v`.
* **Sistema Operacional.**
* **Ambiente:** Desenvolvimento ou produção?
* **Logs:**
    * **Backend:** Console do servidor Node.js, logs do PM2/Systemd/Docker.
    * **Frontend:** Console do navegador (F12), terminal do `npm start` (em `frontend-react/`).
* **Passos para Reproduzir.**

## 2. Problemas de Instalação e Dependências

### Backend (`/lascmmg`)

* **Erro: `Cannot find module '...'` ou `require(...)` falha (Backend):**
    * Solução: Na raiz do projeto (`/lascmmg`), execute `npm install`. Se persistir, remova `node_modules` e `package-lock.json`, depois `npm install`.
* **Erro durante `npm install` (especialmente `better-sqlite3`):**
    * Solução: Instale ferramentas de compilação C/C++ (veja [README.md](README.md) ou `DEPLOYMENT.md`). Limpe `node_modules` e `package-lock.json`, tente `npm install` novamente.

### Frontend (React) (`/lascmmg/frontend-react`)

* **Erro: `Cannot find module '...'` ou `import` falha (Frontend):**
    * Solução: Navegue até `frontend-react/` e execute `npm install`. Se persistir, remova `frontend-react/node_modules` e `frontend-react/package-lock.json`, depois `npm install`.
* **Problemas com `react-scripts`:**
    * Solução: Verifique a compatibilidade da versão do Node.js. Tente atualizar `react-scripts` ou limpar o cache do npm (`npm cache clean --force`).

## 3. Problemas de Configuração (`.env` e Frontend Envs)

### Backend (`/lascmmg/.env`)

* **Variáveis de ambiente não carregam:**
    * Solução: Verifique se o arquivo é `.env` na raiz. Copie de `.env.example`. Formato `CHAVE=VALOR`. Reinicie o servidor backend após mudanças. `require('dotenv').config()` deve estar no início de `backend/server.js`.

### Frontend (`/lascmmg/frontend-react/.env.development`, `.env.production`, etc.)

* **`REACT_APP_API_URL` não funciona ou aponta para o lugar errado:**
    * Solução: Verifique se o arquivo `.env.*` correto está em `frontend-react/`. As variáveis devem começar com `REACT_APP_`. Reinicie o servidor de desenvolvimento do React (`npm start` em `frontend-react/`) após mudanças. Para builds de produção, o arquivo `.env.production` é usado, ou variáveis de ambiente são injetadas no processo de build/deploy.
* **Erro de CORS no navegador (Frontend não acessa API):**
    * Solução (Desenvolvimento): `CORS_ORIGIN=*` no `.env` do backend geralmente permite.
    * Solução (Produção): `CORS_ORIGIN` no `.env` do backend DEVE ser a URL exata do frontend (ex: `https://app.seudominio.com`). `REACT_APP_API_URL` no frontend deve corresponder ao que o backend espera ou ao proxy.

## 4. Problemas do Banco de Dados (SQLite)

* **Erro de conexão ou tabelas ausentes:**
    * Solução: Verifique se `data/` existe na raiz e tem permissões de escrita para o usuário do backend. O DB (`data/database.sqlite`) e tabelas são criados na primeira inicialização do backend. Se corrompido, faça backup, remova `data/database.sqlite`, e reinicie o backend.
* **Dados não aparecem na interface:**
    * Solução: Verifique logs do backend e console/network do navegador. Inspecione `data/database.sqlite` com "DB Browser for SQLite".

## 5. Problemas de Inicialização

### Backend Server (`npm run dev:backend` ou `npm start` na raiz)

* **Servidor não inicia ou fecha:**
    * Solução: Verifique logs. Conflito de porta (padrão 3001)? Altere `PORT` no `.env`. Erros de sintaxe? Variáveis de ambiente essenciais (`JWT_SECRET`, `COOKIE_SECRET`) ausentes?

### Frontend React Dev Server (`npm start` em `frontend-react/`)

* **Servidor de desenvolvimento não inicia:**
    * Solução: Verifique logs no terminal. Conflito de porta (padrão 3000)? `react-scripts` geralmente pergunta se quer usar outra. Problemas com dependências em `frontend-react/node_modules`?
    * Pode ser necessário aumentar o limite de watchers do sistema em Linux: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`.

## 6. Problemas de Acesso e Autenticação

* **Não consigo fazer login no painel (`/login`):**
    * Solução: Verifique credenciais. Admin inicializado com `node scripts/initialize_admin.js`? Logs do backend? Limpe cookies/localStorage do navegador. `JWT_SECRET`, `COOKIE_SECRET` corretos no `.env` do backend?
* **Logout não funciona / sessão persiste:**
    * Solução: Logs do backend (rota `/api/auth/logout`). Cookies sendo removidos? Limpe cache/cookies.

## 7. Problemas de Interface e Frontend React

* **Páginas em branco, componentes quebrados, estilos ausentes:**
    * Solução: Hard refresh (Ctrl+F5 / Cmd+Shift+R). Console do navegador para erros JS. Aba Network para assets não carregados (404). Verifique se o build do Tailwind CSS (`frontend-react/src/index.css` sendo processado) está funcionando.
* **Funcionalidades não respondem (botões, formulários):**
    * Solução: Console do navegador para erros JS. Aba Network para status de chamadas API. Logs do backend se a API for atingida.
* **Problemas de Roteamento (React Router):**
    * Solução: Verifique a configuração de `Routes` em `App.jsx`. Para deploys com Nginx/Express, certifique-se de que o servidor está configurado para servir `index.html` para todas as rotas da SPA (ex: `try_files $uri /index.html;` no Nginx).

## 8. Problemas de Build do Frontend (React)

* **`npm run build` em `frontend-react/` falha:**
    * Solução: Verifique os logs de erro. Problemas de memória? (Pode precisar de `NODE_OPTIONS=--max-old-space-size=4096`). Erros de ESLint configurados para quebrar o build? Conflitos de dependência?

## 9. Problemas de Performance

* **Sistema lento (Frontend ou Backend):**
    * Solução (Frontend): Use React DevTools Profiler. Analise o bundle. Otimize componentes (`React.memo`, `useMemo`, `useCallback`). Virtualize listas longas.
    * Solução (Backend): Monitoramento de recursos do servidor. Logs para queries lentas. Otimize DB (índices, WAL, VACUUM).
    * Consulte `SCALING.md` para mais detalhes.

## 10. Problemas de Implantação

(Consulte `DEPLOYMENT.md` para guias detalhados de Docker, Nginx, etc.)

* **Dockerfile/Docker Compose falha:**
    * Solução: Logs do Docker. Caminhos corretos no Dockerfile? Variáveis de ambiente passadas? Permissões de volume? Dependências de compilação na imagem base?
* **Nginx não serve o app React ou não faz proxy para API:**
    * Solução: Configuração do Nginx (`root` para `frontend-react/build`, `try_files` para SPA, `proxy_pass` para API). App backend rodando? Logs do Nginx. Firewall?
* **PM2/Systemd não mantém o backend rodando:**
    * Solução: Logs do gerenciador. Caminhos corretos? Permissões? Arquivo `.env` carregado?

## 11. Coletando Informações para Suporte

Se precisar de ajuda:

* Descrição clara do problema e passos para reproduzir.
* Informações da Seção 1.
* Logs relevantes (servidor, navegador, build).
* Mensagens de erro completas.
* Conteúdo do `.env` do backend e `.env.*` do frontend (OMITIR SEGREDOS!).
* Detalhes da configuração de deploy, se aplicável.

---

[⬆ Voltar ao topo](#guia-de-resolução-de-problemas---lascmmg-versão-react) | [Voltar ao README](README.md)
