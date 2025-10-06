# Sitemap do Sistema LASCMMG

## Visão Geral da Arquitetura

Este documento apresenta o mapa completo do sistema LASCMMG (Liga Acadêmica de Sports Combat MMA e Grappling), incluindo todas as páginas, componentes, rotas da API e funcionalidades implementadas.

## Estrutura Frontend (React)

### Páginas Públicas

- **🔐 Login** - Página de autenticação de usuários
- **📝 Registro** - Cadastro de novos usuários
- **❌ 404** - Página de erro para rotas não encontradas

### Páginas do Usuário (Autenticadas)

- **🏠 Dashboard Principal** - Visão geral e estatísticas do usuário
- **🏆 Lista de Torneios** - Visualização de todos os torneios disponíveis
- **📋 Detalhes do Torneio** - Informações completas de um torneio específico
- **🏟️ Chaves/Bracket** - Visualização e gerenciamento de chaves
- **📊 Placares** - Sistema de pontuação e resultados
- **📈 Estatísticas** - Métricas e análises de performance
- **👤 Perfil do Usuário** - Configurações pessoais do usuário
- **👥 Lista de Jogadores** - Catálogo de todos os jogadores
- **🎯 Perfil do Jogador** - Detalhes específicos de um jogador
- **➕ Adicionar Placar** - Interface para inserir resultados de partidas

### Páginas Administrativas (Role: Admin)

- **📊 Dashboard Admin** - Centro de controle administrativo
- **⚙️ Gerenciar Torneios** - Administração completa de torneios
- **➕ Criar Torneio** - Formulário para criação de novos torneios
- **✏️ Editar Torneio** - Modificação de torneios existentes
- **👥 Gerenciar Jogadores** - Administração de jogadores
- **➕ Criar Jogador** - Cadastro de novos jogadores
- **✏️ Editar Jogador** - Modificação de dados de jogadores
- **👤 Gerenciar Usuários** - Controle de usuários do sistema
- **🔒 Segurança** - Configurações de segurança
- **📋 Relatórios** - Geração e visualização de relatórios
- **📜 Log de Atividades** - Auditoria de ações do sistema
- **📅 Programação** - Agendamento de eventos
- **⚽ Programar Partidas** - Organização de confrontos
- **🗑️ Lixeira** - Gerenciamento de dados excluídos
- **⚙️ Configurações** - Configurações gerais do sistema

## Estrutura Backend (Node.js/Express)

### Rotas da API

#### `/api/auth`

- Autenticação e autorização
- Login/logout
- Gerenciamento de sessões JWT
- Recuperação de senha

#### `/api/tournaments`

- CRUD completo de torneios
- Inscrições de jogadores
- Geração de chaves
- Controle de fases

#### `/api/players`

- Gerenciamento de jogadores
- Perfis e estatísticas
- Histórico de participações
- Rankings

#### `/api/scores`

- Sistema de pontuação
- Registro de resultados
- Validação de placares
- Histórico de partidas

#### `/api/users`

- Gerenciamento de usuários
- Perfis e configurações
- Controle de permissões
- Atividade do usuário

#### `/api/admin`

- Funções administrativas
- Controle de sistema
- Gerenciamento avançado
- Operações em lote

#### `/api/admin/backup`

- Sistema de backup
- Restauração de dados
- Gerenciamento de versões
- Exportação de dados

#### `/api/system`

- Configurações de segurança
- Monitoramento do sistema
- Health checks
- Logs de segurança

#### `/api/admin/performance`

- Monitoramento de performance
- Análise de queries
- Otimização de banco
- Métricas de sistema

### Modelos de Dados

#### User Model

```javascript
{
  id: Number,
  username: String,
  email: String,
  password: String (hashed),
  role: String (user/admin),
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

#### Player Model

```javascript
{
  id: Number,
  name: String,
  nickname: String,
  weight: Number,
  category: String,
  team: String,
  birthDate: Date,
  profileImage: String,
  stats: Object,
  isActive: Boolean
}
```

#### Tournament Model

```javascript
{
  id: Number,
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  status: String (draft/active/finished/cancelled),
  type: String (elimination/round-robin),
  categories: Array,
  maxParticipants: Number,
  currentParticipants: Number,
  prize: String,
  rules: Object
}
```

#### Match Model

```javascript
{
  id: Number,
  tournamentId: Number,
  player1Id: Number,
  player2Id: Number,
  scheduledDate: Date,
  status: String (scheduled/ongoing/finished/cancelled),
  round: Number,
  bracket: String,
  winnerId: Number,
  duration: Number
}
```

#### Score Model

```javascript
{
  id: Number,
  matchId: Number,
  playerId: Number,
  scoreType: String,
  points: Number,
  round: Number,
  timestamp: Date,
  judgeId: Number,
  notes: String
}
```

#### Admin Model

```javascript
{
  id: Number,
  userId: Number,
  permissions: Array,
  lastLogin: Date,
  actions: Array,
  restrictions: Object
}
```

## Componentes Frontend

### Layouts

- **Header** - Cabeçalho responsivo com navegação
- **Sidebar** - Menu lateral colapsável
- **Footer** - Rodapé com informações

### UI Components

- **LoadingSpinner** - Indicadores de carregamento
- **ErrorBoundary** - Tratamento de erros
- **Modal** - Janelas modais
- **Toast** - Notificações
- **Button** - Botões padronizados
- **Input** - Campos de entrada
- **Card** - Containers de conteúdo
- **Table** - Tabelas de dados
- **Chart** - Gráficos e visualizações

### Contextos e Hooks

- **AuthContext** - Gerenciamento de autenticação
- **TournamentContext** - Estado global de torneios
- **MessageContext** - Sistema de mensagens
- **NotificationContext** - Notificações em tempo real
- **Custom Hooks** - Lógica reutilizável

## Funcionalidades por Categoria

### 🔥 Alta Prioridade (Essenciais)

- Sistema de autenticação completo
- CRUD de torneios e jogadores
- Sistema de placares
- Chaves e bracket
- Controle de acesso baseado em roles

### ⚡ Média Prioridade (Importantes)

- Interface responsiva
- Notificações em tempo real
- Estatísticas e gráficos
- Sistema administrativo
- Backup e restauração

### 🔧 Baixa Prioridade (Avançadas)

- Otimizações de performance
- Funcionalidades sociais
- Integrações externas
- Ferramentas avançadas de desenvolvimento

## Tecnologias Utilizadas

### Backend

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Banco de dados
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Socket.IO** - Comunicação em tempo real
- **Swagger** - Documentação da API

### Frontend

- **React 19** - Biblioteca UI
- **Vite** - Build tool
- **React Router** - Roteamento
- **Tailwind CSS** - Estilização
- **Chart.js** - Gráficos
- **Formik** - Formulários
- **Axios** - Requisições HTTP

### Segurança

- **Helmet** - Headers de segurança
- **CORS** - Controle de origem
- **Rate Limiting** - Controle de tráfego
- **CSRF Protection** - Proteção contra CSRF
- **XSS Clean** - Sanitização de entrada
- **Honeypot** - Anti-spam

## Fluxo de Dados

```
Usuário → Frontend (React) → API (Express) → Banco (SQLite/Redis) → Resposta
    ↓              ↓              ↓              ↓              ↓
Interface → Validação → Autenticação → Processamento → Persistência
```

## Endpoints Principais

### Autenticação

- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/logout` - Logout
- `GET /api/csrf-token` - Token CSRF

### Torneios

- `GET /api/tournaments` - Lista de torneios
- `POST /api/tournaments` - Criar torneio
- `GET /api/tournaments/:id` - Detalhes do torneio
- `PUT /api/tournaments/:id` - Atualizar torneio
- `DELETE /api/tournaments/:id` - Excluir torneio

### Jogadores

- `GET /api/players` - Lista de jogadores
- `POST /api/players` - Criar jogador
- `GET /api/players/:id` - Perfil do jogador
- `PUT /api/players/:id` - Atualizar jogador

### Placares

- `GET /api/scores` - Lista de placares
- `POST /api/scores` - Adicionar placar
- `GET /api/scores/match/:id` - Placares da partida
- `PUT /api/scores/:id` - Atualizar placar

## Configuração do Ambiente

### Variáveis de Ambiente (.env)

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de dados
DATABASE_URL=./data/lascmmg.db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# Cookies
COOKIE_SECRET=your-cookie-secret

# Rate Limiting
RATE_LIMIT_WINDOW=15min
RATE_LIMIT_MAX=100
```

## Desenvolvimento

### Scripts Disponíveis

```bash
# Backend
npm run dev:backend    # Desenvolvimento backend
npm run start         # Produção backend

# Frontend
npm run dev          # Desenvolvimento frontend
npm run build        # Build produção
npm run preview      # Preview produção

# Ambos
npm run dev          # Desenvolvimento completo

# Testes
npm run test         # Executar testes
npm run test:watch   # Testes em modo watch
npm run test:ui      # Interface gráfica de testes
```

## Deploy

### Produção

1. Configurar variáveis de ambiente
2. Build do frontend: `npm run build`
3. Iniciar servidor: `npm run start`
4. Configurar proxy reverso (nginx recomendável)

### Docker

- Utilizar docker-compose para orquestração
- Configurar volumes para persistência de dados
- Implementar health checks

## Monitoramento

### Health Checks

- `GET /ping` - Verificação rápida
- `GET /api/health` - Verificação completa
- Monitor de banco de dados
- Monitor de Redis
- Monitor de performance

### Logs

- Pino Logger para logs estruturados
- Auditoria de segurança
- Logs de erro detalhados
- Monitoramento de performance

Este sitemap serve como guia completo para desenvolvedores, mantenedores e usuários finais entenderem a estrutura e funcionalidades do sistema LASCMMG.
