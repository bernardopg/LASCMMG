# RELATÓRIO DE AUDITORIA TÉCNICA - PROJETO LASCMMG
**Sistema de Gerenciamento de Torneios da LASCMMG**

**Data da Auditoria:** 23 de maio de 2025
**Versão do Sistema:** 1.1.0 (Backend) / 0.2.0 (Frontend)
**Auditor:** Engenheiro Fullstack Sênior
**Escopo:** Análise completa do código-fonte, arquitetura e práticas de desenvolvimento

---

## 1. RESUMO EXECUTIVO

### 1.1 Objetivo do Projeto
O LASCMMG é um sistema web completo para gerenciamento de torneios de sinuca/bilhar, desenvolvido com arquitetura moderna e foco em segurança, performance e usabilidade. O sistema atende desde a criação de torneios até o acompanhamento de chaveamentos e estatísticas.

### 1.2 Estado Atual do Desenvolvimento
**Status Geral:** ✅ **Em desenvolvimento avançado** (aproximadamente 85% concluído)

**Pontos Fortes Identificados:**
- ✅ Arquitetura bem definida e modular
- ✅ Excelente implementação de segurança (JWT, CSRF, XSS, Rate Limiting)
- ✅ Sistema de logging estruturado com Pino
- ✅ Validação robusta com Joi
- ✅ Soft delete implementado consistentemente
- ✅ Frontend moderno com React 18 e Vite
- ✅ Documentação abrangente e bem estruturada
- ✅ Testes automatizados configurados
- ✅ Sistema de notificações em tempo real com Socket.IO

**Pontos Fracos Críticos:**
- ❌ Inconsistências na implementação de algumas rotas administrativas
- ❌ Falta de cobertura de testes abrangente
- ❌ Alguns componentes React com lógica duplicada
- ❌ Ausência de monitoramento e métricas de performance
- ❌ Sistema de cache não totalmente implementado

### 1.3 Avaliação Técnica Geral
**Nota Técnica:** 8.2/10

---

## 2. VISÃO GERAL DA ARQUITETURA

### 2.1 Arquitetura Geral
**Tipo:** Aplicação Web Monolítica com SPA Frontend
**Padrão:** Client-Server com API RESTful

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React/Vite)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │  Components │ │   Context   │ │     Services    │   │
│  │   (UI/UX)   │ │   (State)   │ │   (API Calls)   │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                         HTTPS/WSS
                            │
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │   Routes    │ │ Middleware  │ │     Models      │   │
│  │  (API/REST) │ │ (Security)  │ │  (Business)     │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │  Services   │ │   Utils     │ │     Logger      │   │
│  │ (Business)  │ │(Validation) │ │    (Pino)       │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
           ┌─────────────┐  ┌─────────────┐
           │   SQLite    │  │    Redis    │
           │ (Database)  │  │   (Cache)   │
           └─────────────┘  └─────────────┘
```

### 2.2 Comunicação Frontend-Backend
- **Protocolo:** HTTP/HTTPS REST API
- **Formato de Dados:** JSON
- **Autenticação:** JWT (JSON Web Tokens)
- **Tempo Real:** WebSocket via Socket.IO
- **Segurança:** CSRF tokens, XSS protection, Rate limiting

### 2.3 Componentes Principais
1. **Frontend SPA:** React 18 + Vite + Tailwind CSS
2. **Backend API:** Node.js + Express.js
3. **Banco de Dados:** SQLite3 (better-sqlite3)
4. **Cache/Sessão:** Redis
5. **Logs:** Pino (JSON estruturado)
6. **Testes:** Vitest + Cypress

---

## 3. ANÁLISE DO FRONTEND

### 3.1 Tecnologias Utilizadas
- **React:** 18.2.0 (hooks, context, componentes funcionais)
- **Build Tool:** Vite 6.3.5 (ultra-rápido, HMR)
- **Estilização:** Tailwind CSS 3.4.1 + PostCSS
- **Roteamento:** React Router DOM v6 (lazy loading)
- **Gerenciamento de Estado:** Context API (AuthContext, TournamentContext, etc.)
- **Formulários:** Formik + Yup (validação)
- **HTTP Client:** Axios
- **Ícones:** Lucide React + React Icons
- **Animações:** Framer Motion
- **Charts:** Chart.js + react-chartjs-2
- **Real-time:** Socket.IO Client

### 3.2 Estrutura de Pastas
**Avaliação:** ✅ **Excelente organização**

```
frontend-react/src/
├── components/          # Componentes reutilizáveis
│   ├── admin/          # Componentes específicos admin
│   ├── bracket/        # Componentes de chaveamento
│   ├── common/         # Componentes compartilhados
│   └── layout/         # Componentes de layout
├── context/            # Context API providers
├── hooks/              # Custom hooks
├── pages/              # Páginas da aplicação
│   ├── admin/          # Páginas administrativas
│   └── admin/security/ # Subpáginas de segurança
├── router/             # Configuração de rotas
├── services/           # Serviços de API
└── styles/             # Estilos adicionais
```

### 3.3 Componentização
**Avaliação:** ✅ **Boa qualidade geral**

**Pontos Fortes:**
- Separação clara entre components/pages
- Componentes bem granulares (MatchCard, PlayerDisplay, etc.)
- Uso consistente de hooks funcionais
- Props bem definidas e tipadas (via PropTypes implícito)

**Áreas de Melhoria:**
- Alguns componentes grandes demais (ex: AdminPlayersTable)
- Duplicação de lógica entre componentes similares
- Falta de componentes genéricos reutilizáveis (Tabela, Modal, Forms)

### 3.4 Gerenciamento de Estado
**Avaliação:** ✅ **Implementação sólida**

**Context Providers Identificados:**
1. **AuthContext:** Autenticação e autorização
2. **TournamentContext:** Estado global de torneios
3. **MessageContext:** Mensagens/notificações
4. **ThemeContext:** Tema claro/escuro
5. **NotificationContext:** Notificações em tempo real

**Pontos Fortes:**
- Estado bem segmentado por responsabilidade
- Uso correto de useReducer para estados complexos
- Persistência de estado em localStorage quando necessário

### 3.5 Roteamento
**Avaliação:** ✅ **Excelente implementação**

**Características:**
- React Router v6 com lazy loading
- Proteção de rotas administrativas
- Fallback para páginas 404
- Code splitting automático
- Router otimizado (AppRouterOptimized.jsx)

### 3.6 Consumo de APIs
**Avaliação:** ✅ **Bem estruturado**

**Implementação:**
- Service layer bem definido (services/api.js)
- Interceptors para autenticação automática
- Tratamento de erros centralizado
- Axios configurado com defaults apropriados

### 3.7 Testes (Frontend)
**Avaliação:** ⚠️ **Implementação parcial**

**Configuração:**
- Vitest configurado para testes unitários
- Cypress configurado para E2E
- JSDOM para ambiente de testes

**Limitações:**
- Poucos testes implementados
- Falta cobertura de componentes críticos
- Testes E2E básicos apenas

### 3.8 Performance
**Avaliação:** ✅ **Boa performance geral**

**Otimizações Implementadas:**
- Lazy loading de rotas
- Code splitting automático via Vite
- Componentes memoizados (React.memo)
- Virtual scrolling onde necessário

**Áreas de Melhoria:**
- Bundle analysis não implementado
- Falta de lighthouse CI/CD
- Otimização de imagens não configurada

### 3.9 UX/UI (Análise do Código)
**Avaliação:** ✅ **Interface moderna e responsiva**

**Pontos Fortes:**
- Design system consistente com Tailwind
- Responsividade bem implementada
- Dark mode funcional
- Feedback visual adequado (loading, errors, success)
- Componentes acessíveis (aria-labels, etc.)

**Áreas de Melhoria:**
- Falta de skeleton loading
- Animações poderiam ser mais fluidas
- Alguns componentes não totalmente acessíveis

### 3.10 Código Duplicado/Redundante
**Avaliação:** ⚠️ **Duplicação moderada**

**Principais Issues:**
- Lógica de formulários repetida em várias páginas
- Validação duplicada entre frontend/backend
- Componentes de tabela similares mas não reutilizáveis
- Handlers de API similares em múltiplos componentes

---

## 4. ANÁLISE DO BACKEND

### 4.1 Tecnologias Utilizadas
- **Runtime:** Node.js (>=18.x)
- **Framework:** Express.js 4.21.2
- **Banco de Dados:** SQLite3 (better-sqlite3 11.10.0)
- **Cache:** Redis 5.1.0
- **Autenticação:** JWT (jsonwebtoken 9.0.2)
- **Validação:** Joi 17.13.3
- **Logging:** Pino 9.7.0 + pino-http
- **Segurança:** Helmet, XSS-clean, CORS, Rate limiting
- **Upload:** Multer 2.0.0
- **WebSocket:** Socket.IO 4.8.1
- **Criptografia:** bcrypt 6.0.0
- **Testing:** Vitest + Supertest

### 4.2 Estrutura de Pastas
**Avaliação:** ✅ **Excelente organização**

```
backend/
├── lib/
│   ├── audit/          # Logs de auditoria
│   ├── config/         # Configurações
│   ├── db/             # Database layer
│   ├── logger/         # Sistema de logging
│   ├── middleware/     # Middlewares customizados
│   ├── models/         # Modelos de dados
│   ├── services/       # Serviços de negócio
│   └── utils/          # Utilitários e validações
├── routes/             # Definição de rotas da API
├── tests/              # Testes unitários e integração
└── server.js           # Ponto de entrada
```

### 4.3 Modelagem de Dados
**Avaliação:** ✅ **Schema bem projetado**

**Tabelas Principais:**
1. **users** - Usuários do sistema
2. **tournaments** - Torneios
3. **players** - Jogadores (global e por torneio)
4. **matches** - Partidas
5. **scores** - Pontuações
6. **tournament_state** - Estado dos chaveamentos
7. **trash** - Lixeira (soft delete)

**Pontos Fortes:**
- Relacionamentos bem definidos
- Constraints adequadas (UNIQUE, FK)
- Soft delete implementado consistentemente
- Índices otimizados para queries frequentes
- Schema versionado com migrações

**Observações:**
- Constraint UNIQUE (tournament_id, name) na tabela players
- Sistema de soft delete bem implementado
- Auditoria de mudanças através de logs

### 4.4 APIs
**Avaliação:** ✅ **Design RESTful consistente**

**Endpoints Principais:**
- `/api/auth/*` - Autenticação e autorização
- `/api/tournaments/*` - Gestão de torneios
- `/api/players/*` - Gestão de jogadores
- `/api/scores/*` - Gestão de pontuações
- `/api/admin/*` - Funcionalidades administrativas
- `/api/users/*` - Gestão de usuários
- `/api/system/*` - Funcionalidades do sistema/segurança

**Características:**
- Versionamento de API preparado
- Responses padronizados (success/error)
- Validação robusta com Joi
- Rate limiting implementado
- Documentação inline consistente

### 4.5 Lógica de Negócios
**Avaliação:** ✅ **Bem estruturada**

**Modelos Implementados:**
- **tournamentModel:** CRUD completo, estatísticas, soft delete
- **playerModel:** Global players, gestão por torneio
- **scoreModel:** Pontuações, rankings, histórico
- **matchModel:** Chaveamentos, bracket generation
- **userModel:** Gestão de usuários, autenticação
- **adminModel:** Funcionalidades administrativas

**Pontos Fortes:**
- Separação clara de responsabilidades
- Transações implementadas adequadamente
- Logging estruturado em todas as operações
- Validação de regras de negócio

### 4.6 Autenticação e Autorização
**Avaliação:** ✅ **Implementação robusta**

**Características de Segurança:**
- JWT com refresh tokens
- Bcrypt para hash de senhas
- Roles (admin/user) implementados
- Session management com Redis
- Rate limiting em endpoints críticos
- CSRF protection
- XSS protection
- Headers de segurança (Helmet)

**Middleware de Segurança:**
- `authMiddleware.js` - Verificação JWT
- `roleMiddleware.js` - Controle de acesso por role
- `csrfMiddleware.js` - Proteção CSRF
- `honeypot.js` - Detecção de bots
- `errorHandler.js` - Tratamento seguro de erros

### 4.7 Testes (Backend)
**Avaliação:** ⚠️ **Implementação básica**

**Testes Implementados:**
- Testes unitários: `bracketUtils.test.js`
- Testes de integração: `tournament_flow.test.js`
- Configuração Vitest adequada

**Limitações:**
- Cobertura de testes insuficiente
- Falta de testes para todos os models
- Ausência de testes de segurança específicos
- Mocking não configurado adequadamente

### 4.8 Performance
**Avaliação:** ✅ **Boa performance base**

**Otimizações Implementadas:**
- Better-sqlite3 (síncrono, mais rápido)
- Índices de banco otimizados
- Connection pooling com Redis
- WAL mode habilitado no SQLite
- Gzip compression

**Áreas de Melhoria:**
- Query optimization não auditada
- Falta de profiling de performance
- Cache strategies não totalmente implementadas
- Monitoring de performance ausente

### 4.9 Código Duplicado/Redundante
**Avaliação:** ✅ **Duplicação mínima**

**Pontos Positivos:**
- Helpers bem reutilizados
- Middleware compartilhado adequadamente
- Validação centralizada com Joi
- Utility functions bem organizadas

**Algumas Melhorias:**
- Queries similares poderiam ser mais abstraídas
- Response patterns poderiam ser mais padronizados

### 4.10 Comentários e Documentação
**Avaliação:** ✅ **Documentação excelente**

**Pontos Fortes:**
- JSDoc bem implementado
- Comentários inline explicativos
- README abrangente
- Documentação de API detalhada
- Guias de deployment e contribuição

### 4.11 Gerenciamento de Dependências
**Avaliação:** ✅ **Bem gerenciado**

**Características:**
- package.json bem estruturado
- Dependencies vs devDependencies separadas adequadamente
- Versões fixadas para estabilidade
- Scripts NPM bem organizados
- Security audit através de dependabot

---

## 5. ANÁLISE GERAL E BOAS PRÁTICAS

### 5.1 Coerência entre Frontend e Backend
**Avaliação:** ✅ **Excelente integração**

**Pontos Fortes:**
- Contratos de API bem definidos e respeitados
- Validação consistente em ambos os lados
- Error handling padronizado
- Estado sincronizado via WebSocket
- Tipos de dados consistentes

### 5.2 Padrões de Projeto
**Avaliação:** ✅ **Padrões bem implementados**

**Padrões Identificados:**
- **MVC:** Separação clara de Models, Views (React), Controllers (Routes)
- **Service Layer:** Lógica de negócio encapsulada
- **Repository Pattern:** Models como abstração de dados
- **Middleware Pattern:** Middlewares reutilizáveis
- **Observer Pattern:** Context API + WebSocket notifications
- **Factory Pattern:** Database connection factory

### 5.3 Qualidade do Código
**Avaliação:** ✅ **Alta qualidade geral**

**Pontos Fortes:**
- Código limpo e legível
- Nomes de variáveis e funções descritivos
- Estrutura modular bem definida
- Consistência de estilo (ESLint + Prettier)
- Async/await usado consistentemente
- Error handling robusto

**Áreas de Melhoria:**
- Alguns arquivos grandes demais
- Falta de type checking (TypeScript)
- Algumas funções complexas poderiam ser quebradas

### 5.4 Segurança
**Avaliação:** ✅ **Excelente implementação de segurança**

**Medidas Implementadas:**
- **Autenticação:** JWT + refresh tokens
- **Autorização:** Role-based access control
- **Input Validation:** Joi schemas rigorosos
- **SQL Injection:** Prepared statements (SQLite)
- **XSS:** xss-clean middleware
- **CSRF:** Tokens dedicados
- **Rate Limiting:** Múltiplas camadas
- **Headers Security:** Helmet configurado
- **Session Security:** Redis com TTL
- **Password Security:** bcrypt com salt rounds adequados
- **Honeypot:** Detecção de bots maliciosos
- **Audit Logging:** Logs estruturados de segurança

**Potenciais Vulnerabilidades:**
- Secrets management em desenvolvimento (avisos implementados)
- File upload validation poderia ser mais rígida
- Rate limiting poderia ser mais granular

### 5.5 Configuração e Variáveis de Ambiente
**Avaliação:** ✅ **Bem configurado**

**Características:**
- Configuração centralizada em config.js
- Validation de environment variables
- Fallbacks apropriados para desenvolvimento
- Secrets adequadamente separados
- Multi-environment support

### 5.6 Gerenciamento de Erros e Logs
**Avaliação:** ✅ **Implementação profissional**

**Sistema de Logging:**
- Pino para structured logging
- Níveis apropriados (debug, info, warn, error, fatal)
- Request tracking com IDs únicos
- Audit logging para ações administrativas
- Log rotation configurado

**Error Handling:**
- Global error handler implementado
- Errors categorizados apropriadamente
- Stack traces protegidas em produção
- User-friendly error messages

---

## 6. ROADMAP E PRÓXIMOS PASSOS (VISÃO DO SÊNIOR)

### 6.1 Prioridades de Curto Prazo (1-2 meses)

**1. Completar Funcionalidades Core**
- Finalizar todas as rotas administrativas pendentes
- Implementar sistema completo de chaveamentos
- Completar funcionalidades de importação/exportação
- Finalizar sistema de notificações em tempo real

**2. Testes e Qualidade**
- Aumentar cobertura de testes para 80%+
- Implementar testes E2E completos
- Configurar CI/CD pipeline
- Implementar code quality gates

**3. Performance e Monitoramento**
- Implementar APM (Application Performance Monitoring)
- Configurar métricas de performance
- Otimizar queries críticas
- Implementar health checks robustos

### 6.2 Prioridades de Médio Prazo (3-6 meses)

**1. Escalabilidade**
- Migração para PostgreSQL (se necessário)
- Implementar caching estratégico com Redis
- Otimizar bundle size do frontend
- Implementar lazy loading avançado

**2. Funcionalidades Avançadas**
- Sistema de backup automático
- Analytics e relatórios avançados
- API versioning completo
- Mobile app (React Native)

**3. DevOps e Infraestrutura**
- Containerização completa (Docker)
- Deploy automatizado
- Monitoring e alerting
- Disaster recovery plan

### 6.3 Prioridades de Longo Prazo (6-12 meses)

**1. Arquitetura**
- Avaliação de microserviços (se necessário)
- Implementar Event Sourcing para auditoria
- GraphQL como alternativa/complemento REST
- Serverless functions para tarefas específicas

**2. User Experience**
- PWA completo com offline support
- Real-time collaboration features
- Advanced analytics dashboard
- Multi-language support

---

## 7. TODO LIST DETALHADO

### 7.1 ALTA PRIORIDADE

#### Backend
- [ ] **Completar rotas administrativas pendentes em admin.js**
  - Implementar rotas faltantes de scores
  - Implementar rotas de gestão de lixeira
  - Implementar rotas de upload/import

- [ ] **Implementar testes unitários abrangentes**
  - Testes para todos os models (80%+ coverage)
  - Testes para middleware críticos
  - Testes de segurança específicos

- [ ] **Otimizar performance de queries**
  - Audit de queries lentas
  - Implementar query caching
  - Otimizar índices de banco

- [ ] **Implementar monitoramento**
  - Health checks detalhados
  - Métricas de performance
  - Error tracking (ex: Sentry)

#### Frontend
- [ ] **Implementar testes de componentes críticos**
  - Testes unitários para Context providers
  - Testes de integração para fluxos principais
  - Testes E2E para user journeys

- [ ] **Refatorar componentes duplicados**
  - Criar componente genérico de Tabela
  - Criar componente genérico de Modal
  - Criar componente genérico de Form

- [ ] **Implementar loading states consistentes**
  - Skeleton loading para tabelas
  - Loading spinners padronizados
  - Error boundaries mais robustos

### 7.2 MÉDIA PRIORIDADE

#### Backend
- [ ] **Implementar sistema de cache avançado**
  - Cache de queries frequentes
  - Cache de sessões de usuário
  - Cache de dados de torneios ativos

- [ ] **Melhorar sistema de auditoria**
  - Logs mais detalhados de mudanças
  - Retention policy para logs
  - Dashboard de auditoria

- [ ] **Implementar backup automático**
  - Backup diário do SQLite
  - Backup dos logs de auditoria
  - Testes de restore

- [ ] **Adicionar rate limiting granular**
  - Rate limits específicos por endpoint
  - Rate limits por usuário autenticado
  - Whitelist para IPs administrativos

#### Frontend
- [ ] **Implementar PWA completo**
  - Service worker funcional
  - Offline support básico
  - Push notifications

- [ ] **Otimizar performance**
  - Bundle analysis e otimização
  - Lazy loading de componentes pesados
  - Image optimization

- [ ] **Melhorar acessibilidade**
  - Audit completo com lighthouse
  - Navegação por teclado
  - Screen reader support

### 7.3 BAIXA PRIORIDADE

#### Geral
- [ ] **Migração para TypeScript**
  - Configuração inicial
  - Migração gradual dos arquivos críticos
  - Type definitions para APIs

- [ ] **Internacionalização (i18n)**
  - Configuração i18next
  - Tradução para inglês
  - Formatação de datas/números por locale

- [ ] **Analytics avançado**
  - Tracking de user behavior
  - Performance metrics
  - Business intelligence dashboard

#### Infraestrutura
- [ ] **Containerização completa**
  - Dockerfile otimizado
  - Docker compose para desenvolvimento
  - Kubernetes manifests

- [ ] **CI/CD pipeline**
  - GitHub Actions configurado
  - Deploy automático para staging
  - Deploy manual para produção

- [ ] **Monitoring e alerting**
  - Prometheus + Grafana
  - Alertas críticos via Slack/Email
  - SLA monitoring

### 7.4 DOCUMENTAÇÃO
- [ ] **Documentação técnica adicional**
  - Architecture Decision Records (ADRs)
  - Database schema documentation
  - API versioning guide

- [ ] **Documentação de usuário**
  - Manual administrativo completo
  - Tutoriais em vídeo
  - FAQ atualizado

---

## 8. SUGESTÕES DE MELHORIAS (REFATORAÇÃO E OTIMIZAÇÃO)

### 8.1 Arquitetura e Design

#### 8.1.1 Migração para TypeScript
**Prioridade:** Alta
**Impacto:** Alto
**Esforço:** Alto

```typescript
// Exemplo de como poderia ser:
interface Tournament {
  id: string;
  name: string;
  date: Date;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  players?: Player[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}
```

**Benefícios:**
- Type safety em todo o projeto
- Melhor IDE support e autocomplete
- Detecção precoce de bugs
- Documentação automática via tipos

#### 8.1.2 Implementar Repository Pattern Completo
**Prioridade:** Média
**Impacto:** Alto
**Esforço:** Médio

```javascript
// Exemplo de repositório genérico:
class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async findById(id, includeDeleted = false) {
    // Implementação genérica
  }

  async findAll(options = {}) {
    // Implementação genérica com filtros
  }

  async create(data) {
    // Implementação genérica
  }
}

class TournamentRepository extends BaseRepository {
  constructor() {
    super('tournaments');
  }

  async findByStatus(status) {
    // Método específico para torneios
  }
}
```

### 8.2 Performance

#### 8.2.1 Implementar Query Builder
**Prioridade:** Média
**Impacto:** Alto
**Esforço:** Alto

```javascript
// Substituir queries SQL diretas por query builder:
const query = new QueryBuilder('tournaments')
  .select(['id', 'name', 'status'])
  .where('is_deleted', '=', 0)
  .where('status', 'IN', ['Pendente', 'Em Andamento'])
  .orderBy('date', 'DESC')
  .limit(20)
  .offset(0);

const tournaments = await query.execute();
```

#### 8.2.2 Implementar Cache Layers Estratégicos
**Prioridade:** Alta
**Impacto:** Alto
**Esforço:** Médio

```javascript
// Sistema de cache multi-layer:
class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.redisCache = redisClient;
  }

  async get(key, fallbackFn, ttl = 300) {
    // 1. Check memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // 2. Check Redis cache
    const cached = await this.redisCache.get(key);
    if (cached)
