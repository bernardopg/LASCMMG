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
- [ ] 🚧 **Implementação Avançada de Conectores de Chaveamento (Bracket)**
  - Melhorar a renderização visual das linhas de conexão.
- [ ] 🆕 **Refinar Feedback Visual e Animações**
  - Adicionar transições suaves e feedback interativo mais claro.
- [ ] 🔄 **Revisão Completa de Acessibilidade (A11y)**
  - Testes com leitores de tela, navegação por teclado em todos os componentes interativos.
  - Garantir conformidade com WCAG AA.
- [ ] 🆕 **Otimização de Performance do Frontend**
  - Análise de bundle com `vite-bundle-visualizer` ou `rollup-plugin-visualizer`.
  - Code splitting granular (React.lazy, Suspense) para componentes pesados ou rotas menos acessadas.
  - Virtualização de listas longas (jogadores, placares) se gargalos de performance forem identificados.
- [ ] 💡 **Progressive Web App (PWA) Enhancements**
  - Configurar e otimizar Service Worker com `vite-plugin-pwa`.
  - Melhorar funcionalidade offline básica e caching de assets.

### 🛡️ Seção de Segurança (Admin Frontend)

- [x] ✅ **Visão Geral de Segurança (React)**
- [x] ✅ **Configuração de Honeypots (React)**
- [x] ✅ **Gerenciamento de IPs Bloqueados (React)**
- [ ] 🚧 **Implementar Gráficos Detalhados em "Análise de Ameaças"**
  - Definir quais dados são relevantes e como visualizá-los.
  - Requer possíveis novos endpoints de API para dados agregados de ameaças.
- [ ] 🆕 **Melhorar feedback ao usuário sobre ações de segurança** (ex: IP bloqueado com sucesso).

### 🛠️ Funcionalidades Administrativas (Frontend)

- [x] ✅ **CRUD de Jogadores (React)**
- [x] ✅ **Edição/Exclusão de Placares (React)**
- [x] ✅ **Gerenciamento da Lixeira (React)**
- [ ] 🚧 **CRUD Completo de Torneios (React)**
  - Desenvolver formulários robustos para criação e edição detalhada de torneios.
  - Interface para gerenciamento de estado do torneio (iniciar, pausar, finalizar).
- [ ] 🆕 **Gerenciamento de Agendamento de Partidas (React)**
  - Interface visual para definir/alterar datas e horários de partidas.
- [ ] 🆕 **Funcionalidade de Importação/Exportação de Jogadores (React)**
  - Interface para upload de arquivos (CSV/JSON) e feedback do processo.
- [ ] 🆕 **Interface para Gerenciamento de Usuários Admin** (se múltiplos admins forem suportados).

---

## ⚙️ Backend (Node.js/Express & SQLite)

### 🏗️ Arquitetura e Core

- [x] ✅ **Migração para SQLite e `better-sqlite3`**
- [x] ✅ **Revisão e Refatoração Inicial de Modelos (Player, Score, Tournament, Match)**
  - Correção de bugs (ex: `module.exports` duplicados, imports ausentes).
  - Melhoria na segurança de queries (prevenção de SQL Injection em `ORDER BY`).
  - Lógica de soft delete e importação/sincronização de dados mais robusta.
- [x] ✅ **Revisão e Organização de Rotas**
  - Renomeação de arquivos de rota para maior clareza.
  - Verificação de endpoints.
- [x] ✅ **Limpeza de Arquivos e Diretórios Obsoletos**
  - Remoção de `server-sqlite.js` e `backend/lib/data/`.
- [x] ✅ **Revisão de Middlewares Essenciais (CSRF, Auth, Honeypot)**
  - Garantia de funcionamento e integração com frontend (ex: CSRF token handling).
- [ ] 🚧 **Otimização Abrangente de Consultas SQL e Índices**
  - Revisar todas as queries complexas para performance.
  - Validar e adicionar índices conforme necessário (alguns já existem).
- [x] ✅ **Implementar Modo WAL para SQLite** (Habilitado em `database.js`).
- [ ] 🆕 **Automação de Backup e Otimização de DB**
  - Script para `VACUUM` periódico.
  - Melhorar script de backup (ex: rotação, armazenamento externo).
- [ ] 🔄 **Revisar e Modernizar Endpoints da API**
  - Garantir consistência RESTful, clareza e padronização nas respostas.
  - Adicionar paginação e filtros onde faltar.
- [ ] 💡 **Documentar API (Swagger/OpenAPI)**
  - Para facilitar o desenvolvimento e a integração.
- [ ] 💡 **Estratégia de Cache para API (Redis/Memcached)**
  - Para endpoints frequentemente acessados e com dados menos voláteis, visando escalabilidade.

### 🛡️ Segurança Backend

- [x] ✅ **Melhoria do Honeypot com Logs e Estatísticas**
- [x] ✅ **Correção de vulnerabilidades básicas (SQLi em Order By, XSS via `xss-clean`, CSRF)**
- [ ] 🔄 **Revisão de Segurança de Sessão e JWT**
  - Avaliar ciclo de vida dos tokens, considerar refresh tokens se necessário.
  - Mecanismos de revogação de tokens (blacklist já implementada).
- [ ] 💡 **Persistência Centralizada para Blacklist/Rate Limiting (Redis)**
  - Para ambientes com múltiplas instâncias.
- [ ] 🆕 **Auditoria de Segurança Periódica do Código Backend**
  - Revisão de dependências, práticas de codificação segura.

---

## 🧪 Testes

- [x] ✅ **Configuração de Testes com Vitest (Backend)**
- [x] ✅ **Configuração de Testes com Jest/RTL (Frontend - via CRA, verificar se Vite necessita de ajustes)**
  - _Nota: O projeto usa Vite, então a configuração de testes do frontend pode precisar ser Vitest também para consistência._
- [ ] 🚧 **Ampliar Cobertura de Testes Unitários (Backend e Frontend)**
  - Foco em lógica de negócios, utils, componentes complexos, e modelos de dados.
- [ ] 🆕 **Testes de Integração para Fluxos Críticos**
  - Ex: Criação de torneio -> adição de jogadores -> registro de placares -> visualização de chaveamento.
  - Testar interações entre frontend e backend.
- [ ] 💡 **Testes End-to-End (E2E) com Cypress ou Playwright**

---

## 📚 Documentação

- [x] ✅ **Atualizar README.md Principal**
- [x] ✅ **Atualizar Padrões de Codificação (CODING_STANDARDS.md)**
- [x] ✅ **Atualizar Guia de Deploy (DEPLOYMENT.md)**
- [x] ✅ **Atualizar Manual do Usuário (MANUAL_USUARIO.md)**
- [x] ✅ **Atualizar Estratégia de Escalabilidade (SCALING.md)**
- [x] ✅ **Atualizar Lista de Tarefas (TODO.md)** (Este arquivo)
- [ ] 🔄 **Revisar TROUBLESHOOTING.md** para garantir que cobre problemas comuns com Vite e a estrutura atual.
- [ ] 💡 **Criar Documentação da API (Swagger/OpenAPI)**

---

## 🧹 Limpeza e Organização de Código

- [x] ✅ **Remoção de Código Obsoleto do Frontend Antigo (HTML, CSS, JS)**
- [x] ✅ **Revisão e Padronização de Imports Relativos**
- [x] ✅ **Correção de erros e warnings do ESLint (Backend)**
- [ ] 🚧 **Correção de erros e warnings do ESLint (Frontend)**
- [ ] 🔄 **Revisar e Mover Assets de `frontend/assets` para `frontend-react/public/assets` e remover `frontend/assets`** (Confirmar se todos os assets relevantes foram movidos e se `frontend/` pode ser removido).
- [ ] 🆕 **Remover diretório `frontend/` completamente após mover todos os assets e confirmar que não é mais necessário.**

---

## 💡 Considerações Futuras / Baixa Prioridade Atual

- [ ] 💡 **Sistema de Inscrição Online para Jogadores**
- [ ] 💡 **Sistema de Rankings e Histórico de Confrontos (H2H) mais elaborado**
- [ ] 💡 **Duplo Fator de Autenticação (2FA) para Admin**
- [ ] 💡 **Tutorial Interativo (Onboarding) para novos usuários/admins**
- [ ] 💡 **Notificações (Email/Push) para eventos importantes do torneio**
- [ ] 💡 **Internacionalização (i18n) da interface**

---

> _Esta lista é um documento vivo e será revisada e atualizada regularmente._

[⬆ Voltar ao topo](#-lista-de-tarefas-e-melhorias---lascmmg-versão-react-com-vite) | [Voltar ao README Principal](README.md)
