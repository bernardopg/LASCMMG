# 📝 Lista de Tarefas e Melhorias - LASCMMG (Versão React)

[⬅ Voltar ao README](README.md)

---

## 📋 Painel de Tarefas

> **Legenda de Status:**
>
> - [ ] 🆕 **Novo**
> - [ ] 🚧 **Em Andamento**
> - [x] ✅ **Concluído**
> - [ ] 🔄 **Revisar**

---

## 🚀 Frontend React (Migração e Novas Features)

### ✨ Interface e Experiência do Usuário (UX/UI)
- [x] ✅ **Migração Completa da Interface para React com Tailwind CSS**
  - Componentização de todas as seções públicas e administrativas.
  - Uso de React Router para navegação.
  - Context API para gerenciamento de estado global (Auth, Messages, Tournaments).
- [x] ✅ **Design Moderno e Responsivo Implementado**
  - Layout adaptável para desktop, tablets e mobile.
  - Sidebar inteligente (colapsável/deslizante) com persistência de estado.
- [x] ✅ **Tema Claro/Escuro com Persistência**
  - Alternador de tema no cabeçalho.
  - Preferência salva no localStorage.
- [x] ✅ **Favicon Dinâmico Implementado**
- [x] ✅ **Estilos de Impressão Otimizados**
  - Para chaveamentos e tabelas.
- [ ] 🚧 **Implementação Avançada de Conectores de Chaveamento (Bracket)**
  - Desenhar linhas de conexão dinâmicas e precisas entre as partidas.
- [ ] 🆕 **Melhorar Feedback Visual e Animações**
  - Refinar transições e interações para maior fluidez.
- [ ] 🆕 **Revisão Completa de Acessibilidade (A11y)**
  - Testes com leitores de tela, navegação por teclado em todos os componentes.
  - Garantir conformidade com WCAG.
- [ ] 🆕 **Otimização de Performance do Frontend**
  - Análise de bundle (Webpack Bundle Analyzer / source-map-explorer).
  - Code splitting granular (React.lazy, Suspense) onde aplicável.
  - Virtualização de listas longas (jogadores, placares) se necessário.
- [ ] 🆕 **Progressive Web App (PWA) Enhancements**
  - Configurar e otimizar Service Worker com Workbox (já incluído em `react-scripts`).
  - Manifest.json completo, ícones, funcionalidade offline básica.

### 🛡️ Seção de Segurança (Admin Frontend)
- [x] ✅ **Visão Geral de Segurança (React)**
- [x] ✅ **Configuração de Honeypots (React)**
- [x] ✅ **Gerenciamento de IPs Bloqueados (React)**
- [ ] 🚧 **Implementar Gráficos Detalhados em "Análise de Ameaças"**
  - Requer definição de dados e possíveis novos endpoints de API.
  - Gráfico de distribuição de padrões de ataque.
  - Gráfico de atividade ao longo do tempo.
  - Mapa de calor geográfico (se viável).

### 🛠️ Funcionalidades Administrativas (Frontend)
- [x] ✅ **CRUD de Jogadores (React)**
- [x] ✅ **Edição/Exclusão de Placares (React)**
- [x] ✅ **Gerenciamento da Lixeira (React)**
- [ ] 🆕 **CRUD Completo de Torneios (React)**
  - Formulários para criação e edição detalhada de torneios.
- [ ] 🆕 **Gerenciamento de Agendamento de Partidas (React)**
- [ ] 🆕 **Funcionalidade de Importação/Exportação de Jogadores (React)**

---

## ⚙️ Backend (Node.js/Express & SQLite)

### 🏗️ Arquitetura e Core
- [x] ✅ **Migração para SQLite e `better-sqlite3`**
- [x] ✅ **Revisão e Refatoração Inicial de Modelos e Rotas**
- [ ] 🚧 **Otimização Abrangente de Consultas SQL e Índices**
  - Revisar todas as queries para performance.
  - Garantir índices adequados em todas as tabelas.
- [ ] 🆕 **Implementar Modo WAL para SQLite**
  - Para melhor concorrência.
- [ ] 🆕 **Automação de Backup e Otimização de DB**
  - Script para `VACUUM` e agendamento de backups.
- [ ] 🆕 **Logs Estruturados e Aprimorados do Servidor**
  - Utilizar Pino de forma mais eficaz, adicionar mais contexto aos logs.
- [ ] 🔄 **Revisar e Modernizar Endpoints da API**
  - Garantir consistência RESTful, clareza nas respostas.
  - Documentar API (Swagger/OpenAPI).
- [ ] 🆕 **Estratégia de Cache para API (Redis/Memcached)**
  - Para endpoints frequentemente acessados e com dados menos voláteis.

### 🛡️ Segurança Backend
- [x] ✅ **Melhoria do Honeypot com Logs e Estatísticas**
- [ ] 🆕 **Revisão de Segurança de Sessão e JWT**
  - Considerar refresh tokens, mecanismos de revogação mais robustos para JWT.
- [ ] 🆕 **Persistência Centralizada para Blacklist/Rate Limiting (Redis)**
  - Para ambientes com múltiplas instâncias.
- [ ] 🆕 **Auditoria de Segurança Periódica do Código Backend**

---

## 🧪 Testes

- [x] ✅ **Configuração de Testes com Vitest (Backend)**
- [x] ✅ **Configuração de Testes com Jest/RTL (Frontend via CRA)**
- [ ] 🚧 **Ampliar Cobertura de Testes Unitários (Backend e Frontend)**
  - Foco em lógica de negócios, utils, componentes complexos.
- [ ] 🆕 **Testes de Integração para Fluxos Críticos**
  - Ex: Criação de torneio -> adição de jogadores -> registro de placares -> visualização de chaveamento.
- [ ] 🆕 **Testes End-to-End (E2E) com Cypress ou Playwright (Opcional)**

---

## 📚 Documentação

- [x] ✅ **Atualizar README.md Principal**
- [x] ✅ **Atualizar Padrões de Codificação (CODING_STANDARDS.md)**
- [x/🚧] **Atualizar Guia de Deploy (DEPLOYMENT.md)** (Atualizado, mas pode precisar de refinamentos pós-backend)
- [x/🚧] **Atualizar Manual do Usuário (MANUAL_USUARIO.md)** (Atualizado, mas pode precisar de refinamentos)
- [x/🚧] **Atualizar Estratégia de Escalabilidade (SCALING.md)** (Atualizado, mas pode precisar de refinamentos)
- [x] ✅ **Atualizar Lista de Tarefas (TODO.md)** (Este arquivo)
- [ ] 🆕 **Criar Documentação da API (Swagger/OpenAPI)**

---

## 🧹 Limpeza e Organização

- [x] ✅ **Remoção de Código Obsoleto do Frontend Antigo (HTML, CSS, JS)**
- [x] ✅ **Revisão e Padronização de Imports Relativos**
- [ ] 🔄 **Revisar e Mover Assets de `frontend/assets` para `frontend-react/public/assets` e remover `frontend/assets`** (Parcialmente feito, confirmar se todos os assets foram movidos)
- [ ] 🆕 **Remover diretório `frontend/` completamente após mover todos os assets.**

---

## 💡 Considerações Futuras / Baixa Prioridade Atual

- [ ] 🆕 **Sistema de Inscrição Online para Jogadores**
- [ ] 🆕 **Sistema de Rankings e Histórico de Confrontos (H2H)**
- [ ] 🆕 **Duplo Fator de Autenticação (2FA) para Admin**
- [ ] 🆕 **Tutorial Interativo (Onboarding) para novos usuários/admins**
- [ ] 🆕 **Notificações (Email/Push) para eventos importantes**
- [ ] 🆕 **Internacionalização (i18n)**

---

> _Esta lista é um documento vivo e será revisada e atualizada regularmente._

[⬆ Voltar ao topo](#-lista-de-tarefas-e-melhorias---lascmmg-versão-react) | [Voltar ao README](README.md)
