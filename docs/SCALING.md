# Estratégia de Escalabilidade - LASCMMG (Versão React com Vite)

[⬅ Voltar ao README Principal](../README.md)

## Índice

- [Visão Geral](#1-visão-geral-e-considerações-com-react-e-vite)
- [Métricas de Monitoramento](#2-métricas-chave-de-monitoramento)
- [Estratégias de Escalabilidade do Frontend (React com Vite)](#3-estratégias-de-escalabilidade-do-frontend-react-com-vite)
- [Estratégias de Escalabilidade do Backend (Node.js/Express)](#4-estratégias-de-escalabilidade-do-backend-nodejsexpress)
- [Otimização de Banco de Dados (SQLite e Futuro)](#5-otimização-de-banco-de-dados-sqlite-e-futuro)
- [Otimização de Código](#6-otimização-de-código)
- [Arquitetura e Evolução](#7-arquitetura-atual-e-evolução)
- [Cache](#8-cache)
- [Monitoramento e Alertas](#9-monitoramento-e-alertas)
- [Roadmap de Escalabilidade](#10-roadmap-de-escalabilidade)

---

## 📈 Preparando o Sistema para Crescer: Otimização e Arquitetura para Alta Performance com React e Vite

Este documento detalha a estratégia de escalabilidade do Sistema LASCMMG, agora com seu frontend reconstruído em **React com Vite e Tailwind CSS**. O objetivo é garantir que o sistema possa crescer de forma sustentável, mantendo alta performance, confiabilidade e disponibilidade.

## 1. Visão Geral e Considerações (com React e Vite)

A arquitetura agora consiste em:

- **Frontend React (Vite):** Uma Single Page Application (SPA) construída com Vite. Após o build (`npm run build` em `frontend-react/`), gera arquivos estáticos otimizados (HTML, CSS, JS) na pasta `dist/`.
- **Backend Node.js/Express:** Serve a API RESTful e interage com o banco de dados SQLite.

Esta separação oferece flexibilidade na escalabilidade de cada camada.

- **Padrão de Uso:** Picos de tráfego durante torneios.
- **Crescimento:** Antecipamos aumento de usuários e dados.
- **Evolução Planejada:** O backend com SQLite é o principal ponto a ser considerado para escalabilidade de escrita em cenários de altíssima carga.

## 2. Métricas Chave de Monitoramento

Monitorar continuamente é vital:

| Métrica                      | Descrição                                                              | Limiar para Ação          | Ferramentas (Exemplos)                                   |
| :--------------------------- | :--------------------------------------------------------------------- | :------------------------ | :------------------------------------------------------- |
| **Uso de CPU (Backend)**     | % de CPU do servidor da API.                                           | >70% por 15 min           | Prometheus, CloudWatch, Monitoramento SO                 |
| **Uso de Memória (Backend)** | % de RAM do servidor da API.                                           | >80% por 10 min           | Prometheus, CloudWatch, Monitoramento SO                 |
| **Tempo de Resposta API**    | Latência média das requisições da API.                                 | >500ms (95th percentile)  | Sentry APM, New Relic, Prometheus                        |
| **Taxa de Erro API**         | % de respostas da API com erro (HTTP 5xx).                             | >1% em 5 min              | Sentry, Logs da Aplicação                                |
| **I/O de Disco (DB)**        | Atividade de leitura/escrita no disco do SQLite.                       | Alto e constante          | Monitoramento SO                                         |
| **Tamanho do DB**            | Crescimento do arquivo `database.sqlite`.                              | > Limite de armazenamento | Monitoramento SO, Script                                 |
| **Performance Frontend**     | Métricas Web Vitals (LCP, FID, CLS), tamanho do bundle.                | Regressões significativas | Lighthouse, PageSpeed Insights, `vite-bundle-visualizer` |
| **Conexões DB (Futuro)**     | (Relevante após migração para DB cliente-servidor) Número de conexões. | >80% do pool              | Ferramentas específicas do DB                            |

## 3. Estratégias de Escalabilidade do Frontend (React com Vite)

O frontend React, sendo uma SPA de arquivos estáticos após o build com Vite, é inerentemente escalável:

- **CDN (Content Delivery Network):** Servir os arquivos de `frontend-react/dist/` através de uma CDN (Cloudflare, AWS CloudFront, Akamai) é a principal estratégia. Isso distribui os assets globalmente, reduzindo a latência e a carga no servidor de origem.
- **Cache de Navegador:** Vite configura o build para otimizar o cache de navegador (hashing de nomes de arquivo para cache busting).
- **Code Splitting:** Vite implementa code splitting por rota e permite splitting dinâmico com `React.lazy` e `Suspense`, garantindo que os usuários baixem apenas o código necessário para a visualização atual.
- **Otimização de Assets:**
  - Minificação de JS, CSS, HTML (automática pelo `npm run build` do Vite).
  - Compressão de imagens (usar ferramentas como ImageOptim ou bibliotecas, e otimizações no build do Vite se configuradas).
  - Uso de formatos modernos de imagem (WebP) com fallbacks.
- **Service Workers (PWA):** Vite pode ser configurado com plugins (ex: `vite-plugin-pwa`) para gerar um Service Worker, melhorando a performance offline e o cache de assets.

## 4. Estratégias de Escalabilidade do Backend (Node.js/Express)

### Escalabilidade Vertical (Scale Up)

- **Descrição:** Aumentar recursos (CPU, RAM) do servidor da API.
- **Quando:** Fase inicial/média, picos temporários.
- **Limites:** Custo e limites físicos do servidor único; concorrência de escrita do SQLite.

### Escalabilidade Horizontal (Scale Out) - Requer migração do DB

- **Descrição:** Distribuir a API entre múltiplas instâncias Node.js, atrás de um balanceador de carga.
- **Pré-requisito Crítico:** Migrar de SQLite para um banco de dados cliente-servidor (PostgreSQL, MySQL, etc.) que suporte múltiplas conexões concorrentes.
- **Quando:** Limites da escala vertical atingidos, necessidade de alta disponibilidade.
- **Componentes:**
  - Balanceador de Carga (Nginx, HAProxy, ELB).
  - Múltiplas instâncias da API Node.js (gerenciadas por PM2, Systemd, ou contêineres Docker/Kubernetes).
  - Banco de dados centralizado (PostgreSQL, MySQL).
  - Cache distribuído (Redis) para:
    - Blacklist de tokens JWT (logout).
    - Armazenamento e validação de tokens CSRF.
    - Contadores de rate limiting (se configurado para usar store Redis).
    - Rastreamento de tentativas de login falhas e estado de lockout de contas.
    - Rastreamento de atividade de sessão para timeout por inatividade.
    - Armazenamento e validação de refresh tokens.
    - Rastreamento de atividade suspeita do Honeypot.

## 5. Otimização de Banco de Dados (SQLite e Futuro)

### SQLite (Configuração Atual)

- **Índices:** Manter índices otimizados para consultas frequentes (já implementado em `schema.js`).
- **Otimização de Queries:** Analisar e refatorar queries lentas (processo contínuo).
- **Modo WAL (`PRAGMA journal_mode=WAL;`):** Melhora a concorrência de leitura/escrita (já habilitado em `database.js`).
- **`VACUUM`:** Executar periodicamente usando `node scripts/manage-database.js vacuum` para otimizar o arquivo do banco.
- **Limitar Transações Longas:** Manter transações curtas para reduzir bloqueios.

### Banco de Dados Cliente-Servidor (Futuro - para Escala Horizontal)

- **Escolha:** PostgreSQL ou MySQL são opções populares e robustas.
- **Pooling de Conexões:** Essencial para gerenciar conexões eficientemente.
- **Replicação:** Configurar réplicas de leitura para distribuir carga de leitura.
- **Sharding:** Para volumes de dados massivos (consideração de longo prazo).

## 6. Otimização de Código

### Backend (Node.js/Express)

- **Operações Assíncronas:** Usar `async/await` e garantir que operações de I/O não bloqueiem o loop de eventos.
- **Paginação:** Implementada para APIs que retornam listas grandes.
- **Rate Limiting:** Já implementado; ajustar limites conforme necessário.
- **Logging Eficiente:** Usar Pino com níveis de log apropriados; evitar logging excessivo em produção.

### Frontend (React com Vite)

- **Memoização:** `React.memo` para componentes, `useMemo` para cálculos caros, `useCallback` para funções passadas como props.
- **Virtualização de Listas:** Para listas/tabelas muito longas (ex: `react-window`, `react-virtualized`, `tanstack-virtual`).
- **Estado Colocado Corretamente:** Evitar elevação desnecessária de estado.
- **Bundle Analysis:** Usar `rollup-plugin-visualizer` (configurado em `vite.config.js`) para identificar e otimizar partes grandes do bundle.
- **Lazy Loading de Componentes/Rotas:** Utilizar `React.lazy` e `Suspense` (já implementado para algumas rotas).

## 7. Arquitetura Atual e Evolução

### Arquitetura Atual (Frontend React/Vite + Backend Node.js/SQLite)

```mermaid
graph TD
    A[Cliente Web (React SPA via Vite)] -->|Requisições HTTP/S| LB[Load Balancer / Web Server (Nginx)];
    LB -->|Sirva Estáticos de 'dist/'| FE[Assets React Estáticos];
    LB -->|Proxy /api| API[Backend Node.js/Express API];
    API --> DB[(Banco de Dados SQLite)];
```

_Em desenvolvimento, o servidor de desenvolvimento do Vite (`npm run dev` em `frontend-react/`) e o servidor Node.js rodam separadamente._

### Arquitetura Futura (Escala Horizontal)

```mermaid
graph TD
    A[Cliente Web (React SPA)] -->|Requisições HTTP/S| CDN[CDN para Assets Estáticos];
    A -->|Requisições API| APILB(API Load Balancer);
    APILB --> API1[Node.js API Instância 1];
    APILB --> API2[Node.js API Instância 2];
    APILB --> APIn[Node.js API Instância N];
    API1 --> DBMaster[(DB Master PostgreSQL/MySQL)];
    API2 --> DBMaster;
    APIn --> DBMaster;
    API1 --> DBReplica[(DB Réplica Leitura)];
    API2 --> DBReplica;
    APIn --> DBReplica;
    API1 --> Cache[(Cache Distribuído Redis)];
    API2 --> Cache;
    APIn --> Cache;
```

## 8. Cache

- **Frontend:**
  - **Cache de Navegador:** Para assets estáticos (controlado por hashing de nome de arquivo no build do Vite).
  - **Service Worker (via `vite-plugin-pwa`):** Para PWA, cache offline de assets e dados da API.
  - **Estado Local (Context/Zustand/Redux):** Cache de dados da API no cliente para evitar requisições repetidas.
- **Backend:**
  - **Cache em Memória (simples):** Para dados raramente alterados (ex: configurações).
  - **Cache Distribuído (Redis):** Amplamente utilizado para:
    - Tokens CSRF.
    - Contadores de rate limiting (se configurado com store Redis).
    - Blacklist de tokens JWT (logout).
    - Rastreamento de atividade do honeypot e contadores de atividade suspeita.
    - Contadores de tentativas de login falhas e estado de lockout.
    - Rastreamento de atividade de sessão para timeout por inatividade.
    - Armazenamento e validação de refresh tokens.
    - *Pode ser expandido para cache de dados frequentemente acessados e resultados de queries.*
- **CDN:** Para assets estáticos do frontend.
- **Nginx (Proxy Reverso):** Pode cachear respostas da API (com cuidado para dados dinâmicos).

## 9. Monitoramento e Alertas

- **Métricas:** Conforme Seção 2.
- **Logging Centralizado:** ELK Stack (Elasticsearch, Logstash, Kibana), Grafana Loki, Datadog, etc.
- **Alertas:** Prometheus Alertmanager, Sentry, Grafana Alerts, UptimeRobot.

## 10. Roadmap de Escalabilidade

### Fase 1: Otimização da Configuração Atual

- **[CONCLUÍDO]** Migração do frontend para React com Vite.
- **[EM ANDAMENTO]** Otimizar queries SQL e índices do SQLite.
- **[CONCLUÍDO]** Implementar modo WAL para SQLite.
- **[CONCLUÍDO]** Configurar `rollup-plugin-visualizer` para análise de bundle do frontend React/Vite.
- **[CONCLUÍDO]** Configurar Service Worker básico com `vite-plugin-pwa` (configuração inicial em `vite.config.js` está presente).
- **[CONCLUÍDO]** Script `manage-database.js` com comando `vacuum` para SQLite. Agendamento via cron é responsabilidade do admin do servidor.

### Fase 2: Preparação para Escala Maior (Médio Prazo)

- Planejar migração de SQLite para PostgreSQL/MySQL.
- **[CONCLUÍDO]** Utilização robusta de Redis para estado compartilhado essencial à segurança e sessão (CSRF, rate limit distribuído - se configurado, JWT blacklist, refresh tokens, rastreamento de honeypot, contadores de login falho, tracking de inatividade). *Próximo passo: Expandir para cache de dados da aplicação.*
- Containerizar backend e frontend (Dockerfile multi-estágio).
- Configurar CI/CD robusto (GitHub Actions, GitLab CI).

### Fase 3: Escala Horizontal e Resiliência (Longo Prazo)

- Implementar balanceamento de carga para API.
- Implantar múltiplas instâncias da API (ex: Kubernetes, Docker Swarm).
- Configurar réplicas de leitura para o banco de dados.
- Utilizar CDN para todos os assets estáticos do frontend.
- Implementar health checks avançados e auto-healing para instâncias da API.

---

[⬆ Voltar ao topo](#estratégia-de-escalabilidade---lascmmg-versão-react-com-vite) | [Voltar ao README Principal](README.md)
