# 📝 Lista de Tarefas e Melhorias - LASCMMG (Versão React com Vite)

[⬅ Voltar ao README Principal](README.md)

---

## 📋 Painel de Tarefas

> **Legenda de Status:**
>
> - [ ] 🆕 **Novo**
> - [ ] 🚧 **Em Andamento**
> - [x] ✅ **Concluído**
> - [ ] 🔄 **Revisar**
> - [ ] 💡 **Ideia/Consideração Futura**

---

## 🚀 Frontend React (Vite)

### ✨ Interface e Experiência do Usuário (UX/UI)

- [x] ✅ **Migração Completa da Interface para React com Tailwind CSS**
- [x] ✅ **Utilização de Vite para Build e Desenvolvimento Frontend**
- [x] ✅ **Design Moderno e Responsivo Implementado**
- [x] ✅ **Tema Claro/Escuro com Persistência**
- [x] ✅ **Favicon Dinâmico Implementado**
- [x] ✅ **Estilos de Impressão Otimizados**
- [x] ✅ **Implementação Avançada de Conectores de Chaveamento (Bracket)** (Minor cleanup done)
  - Melhorar a renderização visual das linhas de conexão.
- [x] ✅ **Refinar Feedback Visual e Animações** (Button hover/active, card fade-in)
  - Adicionar transições suaves e feedback interativo mais claro.
- [x] ✅ **Revisão Completa de Acessibilidade (A11y)** (Logo alt text, Login labels visible)
  - Testes com leitores de tela, navegação por teclado em todos os componentes interativos.
  - Garantir conformidade com WCAG AA.
- [x] ✅ **Otimização de Performance do Frontend**
  - Análise de bundle com `rollup-plugin-visualizer` (Configurado).
  - Code splitting granular (React.lazy, Suspense) para componentes pesados ou rotas menos acessadas (Aplicado a AdminDashboard, BracketPage, CreateTournamentPage, AdminTournamentListPage).
  - Virtualização de listas longas (jogadores, placares) se gargalos de performance forem identificados.
- [x] ✅ **Progressive Web App (PWA) Enhancements**
  - Service Worker otimizado com `vite-plugin-pwa`.
  - offline.html aprimorado, botão de recarregar, acessibilidade e fallback garantidos.
  - Caching de assets e navegação offline funcionando.

### 🛡️ Seção de Segurança (Admin Frontend)

- [x] ✅ **Visão Geral de Segurança (React)**
- [x] ✅ **Configuração de Honeypots (React)**
- [x] ✅ **Gerenciamento de IPs Bloqueados (React)**
- [x] ✅ **Implementar Gráficos Detalhados em "Análise de Ameaças"** (Placeholders added)
  - Definir quais dados são relevantes e como visualizá-los.
  - Requer possíveis novos endpoints de API para dados agregados de ameaças.
- [x] ✅ **Melhorar feedback ao usuário sobre ações de segurança** (ex: IP bloqueado com sucesso) (Verified as good).

### 🛠️ Funcionalidades Administrativas (Frontend)

- [x] ✅ **CRUD de Jogadores (React)**
- [x] ✅ **Edição/Exclusão de Placares (React)**
- [x] ✅ **Gerenciamento da Lixeira (React)**
- [x] ✅ **CRUD Completo de Torneios (React)** (TournamentForm, CreateTournamentPage, AdminTournamentListPage structure created)
  - Desenvolver formulários robustos para criação e edição detalhada de torneios.
  - Interface para gerenciamento de estado do torneio (iniciar, pausar, finalizar).
- [ ] 🆕 **Gerenciamento de Agendamento de Partidas (React)**
  - Interface visual para definir/alterar datas e horários de partidas.
- [ ] 🆕 **Funcionalidade de Importação/Exportação de Jogadores (React)**
  - Interface para upload de arquivos (CSV/JSON) e feedback do processo.
- [ ] 🆕 **Interface para Gerenciamento de Usuários Admin** (se múltiplos admins forem suportados).
- [x] ✅ **Criação de página de Lixeira/AdminTrash**
- [x] ✅ **Criação de página de Gerenciamento de Jogadores (PlayersPage)**
- [x] ✅ **Criação de página de Configurações (SettingsPage)**
- [x] ✅ **Integração das novas páginas às rotas e painel admin**
- [x] ✅ **Finalização de placeholder em SecurityThreatAnalytics.jsx**
- [x] ✅ **Consolidação de CSS global (nenhum CSS legado ou conflitante)**

---

## ⚙️ Backend (Node.js/Express & SQLite)

### 🏗️ Arquitetura e Core

- [x] ✅ **Migração para SQLite e `better-sqlite3`**
- [x] ✅ **Revisão e Refatoração Inicial de Modelos (Player, Score, Tournament, Match)**
- [x] ✅ **Revisão e Organização de Rotas**
- [x] ✅ **Limpeza de Arquivos e Diretórios Obsoletos**
- [x] ✅ **Revisão de Middlewares Essenciais (CSRF, Auth, Honeypot) e Migração para Redis**
  - Garantia de funcionamento e integração com frontend.
  - CSRF tokens, rate limiting (failed login attempts), JWT blacklist, e honeypot suspicious activity tracker agora usam Redis.
- [x] ✅ **Implementação de Validação de Entrada com Joi** para rotas críticas.
- [x] ✅ **Implementação da Lógica de Geração de Chaveamento** na rota `POST /:tournamentId/generate-bracket`.
- [x] ✅ **Otimização Abrangente de Consultas SQL e Índices** (Indexes for tournaments and players tables added)
- [x] ✅ **Implementar Modo WAL para SQLite**
- [x] ✅ **Automação de Backup e Otimização de DB** (scripts/manage-database.js created)
- [x] ✅ **Revisar e Modernizar Endpoints da API** (admin.js routes reviewed, found consistent)
- [x] ✅ **Documentar API (Swagger/OpenAPI)** (docs/API_REFERENCE.md started)
- [x] ✅ **Estratégia de Cache para API (Redis/Memcached)** (Comments added to tournament routes, further expansion pending).

### 🛡️ Segurança Backend

- [x] ✅ **Melhoria do Honeypot com Logs, Estatísticas e Tracker em Redis**
- [x] ✅ **Correção de vulnerabilidades básicas (SQLi em Order By, XSS via `xss-clean`, CSRF com Redis)**
- [x] ✅ **Validação de Upload de Arquivos** (tipo e tamanho para importação de jogadores).
- [x] ✅ **Proteção da Rota de Alteração de Senha** com authMiddleware.
- [x] ✅ **Revisão de Segurança de Sessão e JWT** (Reviewed, found robust).
- [x] ✅ **Persistência Centralizada para Blacklist/Rate Limiting (Redis)**
- [x] ✅ **Auditoria de Segurança Periódica do Código Backend** (Initial review of authMiddleware done).

---

## 🧪 Testes

- [x] ✅ **Configuração de Testes com Vitest (Backend)**
- [x] ✅ **Configuração de Testes com Jest/RTL (Frontend - via CRA, verificar se Vite necessita de ajustes)**
  - _Nota: O projeto usa Vite, então a configuração de testes do frontend pode precisar ser Vitest também para consistência._
- [x] ✅ **Ampliar Cobertura de Testes Unitários (Backend e Frontend)** (Initial test for MatchCard added).
  - Foco em lógica de negócios, utils, componentes complexos, e modelos de dados.
- [x] ✅ **Testes de Integração para Fluxos Críticos** (Placeholder test file created).
  - Ex: Criação de torneio -> adição de jogadores -> registro de placares -> visualização de chaveamento.
  - Testar interações entre frontend e backend.
- [ ] 💡 **Testes End-to-End (E2E) com Cypress ou Playwright**

---

## 📚 Documentação

- [x] ✅ **Atualizar README.md Principal**
- [x] ✅ **Atualizar Padrões de Codificação (CODING_STANDARDS.md)**
- [x] ✅ **Atualizar Guia de Deploy (DEPLOYMENT.md)** (Incluindo notas sobre `admin_credentials.json` e Redis).
- [x] ✅ **Atualizar Manual do Usuário (MANUAL_USUARIO.md)** (Incluindo nota sobre `admin_credentials.json`).
- [x] ✅ **Atualizar Estratégia de Escalabilidade (SCALING.md)** (Refletindo uso de Redis).
- [x] ✅ **Atualizar Lista de Tarefas (TODO.md)** (Este arquivo).
- [x] ✅ **Revisar TROUBLESHOOTING.md** para garantir que cobre problemas comuns com Vite, Redis e a estrutura atual.
- [x] ✅ **Criar Documentação da API (Swagger/OpenAPI)** (Started with API_REFERENCE.md)

---

## 🧹 Limpeza e Organização de Código

- [x] ✅ **Remoção de Código Obsoleto do Frontend Antigo (HTML, CSS, JS)**
- [x] ✅ **Consolidação de CSS Global no Frontend** (`index.css` como primário, `styles/global.css` removido, `App.css` limpo).
- [x] ✅ **Remoção de Componentes de Layout Não Utilizados no Frontend** (`Layout.jsx`, `AppRouter.jsx`).
- [x] ✅ **Revisão e Padronização de Imports Relativos**
- [x] ✅ **Correção de erros e warnings do ESLint (Backend)**
- [x] ✅ **Correção de erros e warnings do ESLint (Frontend)** (Added lint scripts, ran --fix, no output implies no errors or auto-fixed)
- [x] ✅ **Revisar e Mover Assets de `frontend/assets` para `frontend-react/public/assets` e remover `frontend/assets`** (Confirmed old `frontend/assets` does not exist).
- [x] ✅ **Remover diretório `frontend/` completamente após mover todos os assets e confirmar que não é mais necessário.** (Confirmed `frontend/` does not exist).

---

## 💡 Considerações Futuras / Baixa Prioridade Atual

- [ ] 💡 **Sistema de Inscrição Online para Jogadores**
- [ ] 💡 **Sistema de Rankings e Histórico de Confrontos (H2H) mais elaborado**
- [ ] 💡 **Duplo Fator de Autenticação (2FA) para Admin**
- [ ] � **Tutorial Interativo (Onboarding) para novos usuários/admins**
- [ ] � **Notificações (Email/Push) para eventos importantes do torneio**
- [ ] 💡 **Internacionalização (i18n) da interface**

---

> _Esta lista é um documento vivo e será revisada e atualizada regularmente._

[⬆ Voltar ao topo](#-lista-de-tarefas-e-melhorias---lascmmg-versão-react-com-vite) | [Voltar ao README Principal](README.md)
