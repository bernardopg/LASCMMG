# 🗺️ Sitemap Visual - Sistema LASCMMG

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          🎯 LASCMMG - SITEMAP VISUAL                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────────────────────┐   │
│  │ 🌐 PÚBLICO  │  │             🔐 AUTENTICAÇÃO                     │   │
│  │             │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │   │
│  │ • Login     │  │  │  JWT     │  │ CSRF    │  │ Rate    │           │   │
│  │ • Registro  │  │  │ Session  │  │ Protect  │  │ Limit   │           │   │
│  │ • 404       │  │  │ Cookies  │  │ XSS     │  │ Audit   │           │   │
│  └─────────────┘  │  └─────────┘  └─────────┘  └─────────┘           │   │
│                   └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    🏠 FRONTEND (React)                              │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  📱 Páginas do Usuário:                                             │  │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────┐           │  │
│  │  │   🏠 Home   │ 🏆 Torneios │ 📋 Detalhes │ 🏟️ Chaves  │           │  │
│  │  ├─────────────┼─────────────┼─────────────┼─────────────┤           │  │
│  │  │ 📊 Placares │ 📈 Estatíst │ 👤 Perfil   │ 👥 Jogadores│           │  │
│  │  └─────────────┴─────────────┴─────────────┴─────────────┘           │  │
│  │                                                                     │  │
│  │  ⚙️ Páginas Administrativas:                                        │  │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────┐           │  │
│  │  │📊 Dashboard │👥 Usuários  │🏆 Torneios  │🔒 Segurança │           │  │
│  │  ├─────────────┼─────────────┼─────────────┼─────────────┤           │  │
│  │  │📋 Relatórios│📜 Activity  │📅 Schedule  │🗑️ Lixeira  │           │  │
│  │  └─────────────┴─────────────┴─────────────┴─────────────┘           │  │
│  │                                                                     │  │
│  │  🧩 Componentes:                                                    │  │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────┐           │  │
│  │  │ 🎨 Layouts  │ 🧱 UI       │ 🔐 Auth     │ 🏆 Features │           │  │
│  │  ├─────────────┼─────────────┼─────────────┼─────────────┤           │  │
│  │  │ ⚙️ Admin    │ 🏟️ Bracket  │ 🛣️ Router   │ 📊 Charts   │           │  │
│  │  └─────────────┴─────────────┴─────────────┴─────────────┘           │  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    🔧 BACKEND (Node.js/Express)                     │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  🚀 Rotas da API:                                                   │  │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────┐           │  │
│  │  │🔐 /auth     │🏆 /tournaments│👥 /players  │📊 /scores   │           │  │
│  │  ├─────────────┼─────────────┼─────────────┼─────────────┤           │  │
│  │  │👤 /users    │⚙️ /admin     │💾 /backup   │🔒 /security │           │  │
│  │  └─────────────┴─────────────┴─────────────┴─────────────┘           │  │
│  │                                                                     │  │
│  │  💾 Modelos de Dados:                                               │  │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────┐           │  │
│  │  │👤 User      │🎯 Player     │🏆 Tournament│⚽ Match     │           │  │
│  │  ├─────────────┼─────────────┼─────────────┼─────────────┤           │  │
│  │  │📊 Score     │⚙️ Admin      │📋 Config    │📈 Stats     │           │  │
│  │  └─────────────┴─────────────┴─────────────┴─────────────┘           │  │
│  │                                                                     │  │
│  │  🔧 Serviços:                                                       │  │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────┐           │  │
│  │  │💚 Health    │🔔 Notifications│📈 Analytics │🔍 Search    │           │  │
│  │  ├─────────────┼─────────────┼─────────────┼─────────────┤           │  │
│  │  │📧 Email     │💾 Backup     │📊 Metrics   │🔄 Cache     │           │  │
│  │  └─────────────┴─────────────┴─────────────┴─────────────┘           │  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    🌐 CONEXÕES EXTERNAS                             │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  📚 Documentação:     🔗 WebSocket:      📡 APIs Externas:           │  │
│  │  ┌─────────────┐      ┌─────────────┐   ┌─────────────┐              │  │
│  │  │ Swagger UI  │      │ Socket.IO   │   │ GitHub API  │              │  │
│  │  ├─────────────┤      ├─────────────┤   ├─────────────┤              │  │
│  │  │ OpenAPI     │      │ Real-time   │   │ Social     │              │  │
│  │  └─────────────┘      └─────────────┘   └─────────────┘              │  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    🗄️ BANCO DE DADOS                               │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  💾 SQLite:              ⚡ Redis:              📋 Estrutura:          │  │
│  │  ┌─────────────┐         ┌─────────────┐      ┌─────────────┐         │  │
│  │  │ Tabelas     │         │ Cache       │      │ Relaciona-  │         │  │
│  │  ├─────────────┤         ├─────────────┤      ├─────────────┤         │  │
│  │  │ Índices     │         │ Sessões     │      │ mentos      │         │  │
│  │  ├─────────────┤         ├─────────────┤      ├─────────────┤         │  │
│  │  │ Triggers    │         │ Pub/Sub     │      │ Constraints │         │  │
│  │  └─────────────┘         └─────────────┘      └─────────────┘         │  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    🔒 CAMADA DE SEGURANÇA                           │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  🛡️ Proteções:         🔐 Autenticação:     📊 Monitoramento:        │  │
│  │  ┌─────────────┐       ┌─────────────┐      ┌─────────────┐           │  │
│  │  │ Helmet      │       │ JWT         │      │ Auditoria   │           │  │
│  │  ├─────────────┤       ├─────────────┤      ├─────────────┤           │  │
│  │  │ CORS        │       │ OAuth       │      │ Logs        │           │  │
│  │  ├─────────────┤       ├─────────────┤      ├─────────────┤           │  │
│  │  │ Rate Limit  │       │ 2FA         │      │ Alertas     │           │  │
│  │  └─────────────┘       └─────────────┘      └─────────────┘           │  │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🎨 Legenda Visual

### Cores por Categoria

- 🟣 **PÚBLICO** - Páginas acessíveis sem autenticação
- 🔵 **USUÁRIO** - Funcionalidades para usuários autenticados
- 🟠 **ADMIN** - Recursos exclusivos para administradores
- 🟢 **BACKEND** - Componentes do servidor
- 🟡 **EXTERNO** - Integrações e APIs externas

### Símbolos por Tipo

- 📄 **Página** - Interface do usuário
- 🔧 **Componente** - Bloco reutilizável de código
- 🚀 **API** - Endpoint de serviço
- 💾 **Modelo** - Estrutura de dados
- 🔗 **Conexão** - Integração externa
- 🛡️ **Segurança** - Camada de proteção

## 📊 Fluxo de Dados

```
Usuário 👤
    ↓
🌐 Interface (React)
    ↓
🔗 Requisição HTTP
    ↓
🛡️ Middleware (Auth/CSRF/Rate Limit)
    ↓
⚙️ Roteador (Express)
    ↓
🔧 Controller/Service
    ↓
💾 Banco de Dados (SQLite + Redis)
    ↓
📤 Resposta JSON
    ↓
🎨 Renderização da Interface
    ↓
👤 Usuário (Dados Atualizados)
```

## 🔗 Conexões Principais

### Frontend ↔ Backend

```
React Components → API Routes → Controllers → Models → Database
     ↑                    ↓           ↓         ↓        ↓
  Context/Hooks ← Response JSON ← Services ← Business ← Cache
```

### Autenticação

```
Login Form → /api/auth/login → JWT Token → Cookie/Session → Protected Routes
```

### Tempo Real

```
User Action → WebSocket → Notification Service → Redis Pub/Sub → All Clients
```

### Administração

```
Admin Panel → /api/admin/* → Validation → Database → Audit Log → Response
```

## 📱 Responsividade

```
📱 Mobile (320px+)    📱 Tablet (768px+)    💻 Desktop (1024px+)
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ ☰ Menu      │      │ ┌───┐       │      │ ┌───┬───────┐ │
│             │      │ │☰ │ Pages  │      │ │☰ │ Pages │ │
│ Pages       │      │ └───┴───────┤      │ └───┴───────┤ │
│             │      │             │      │             │ │
│ Collapsed   │      │ Sidebar     │      │ Sidebar     │ │
└─────────────┘      └─────────────┘      └─────────────┘
```

## 🚀 Performance

### Cache Strategy

```
Browser Cache → CDN (futuro) → Redis Cache → Database
    ↓              ↓              ↓           ↓
Static Assets → API Response → Session Data → Persistent Data
```

### Loading States

```
Skeleton → Loading → Content → Interactive → Real-time Updates
```

Este sitemap visual oferece uma representação clara e organizada de toda a arquitetura do sistema LASCMMG, facilitando a compreensão da estrutura e das conexões entre os diferentes componentes.
