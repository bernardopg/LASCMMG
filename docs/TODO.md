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

### 🛠️ Funcionalidades Administrativas (Frontend)
- [ ] 🆕 **Gerenciamento de Agendamento de Partidas (React)**
  - Interface visual para definir/alterar datas e horários de partidas.
- [ ] 🆕 **Funcionalidade de Importação/Exportação de Jogadores (React)**
  - Interface para upload de arquivos (CSV/JSON) e feedback do processo.
- [ ] 🆕 **Interface para Gerenciamento de Usuários Admin** (se múltiplos admins forem suportados).
- [ ] 💡 **Implementar completamente a funcionalidade "Lembrar-me" na página de Login.**
- [ ] 🔄 **Revisar e corrigir todos os warnings restantes do ESLint no frontend (ex: no-unused-vars, exhaustive-deps, no-console).**
- [ ] 💡 **Implementar busca server-side na página de listagem de torneios para melhor performance com grandes datasets.**
- [ ] 🆕 **Aprimorar Perfil do Jogador:**
  - [ ] Adicionar campo para foto do perfil (upload e exibição).
  - [ ] Adicionar campo para localização/cidade do jogador.
  - [ ] Exibir estatísticas mais detalhadas e histórico de participação em torneios na página do jogador.

---

## ⚙️ Backend (Node.js/Express & SQLite)

### 🏗️ Arquitetura e Core

- [ ] 🔄 **Revisar e implementar completamente o cache com Redis para todos os endpoints GET relevantes.**
- [ ] 💡 **Considerar refatoração da lógica de atualização de state_json dos torneios para um service dedicado para evitar duplicação e complexidade nas rotas.**
- [ ] 🆕 **Implementar lógica de avanço automático no chaveamento (bracket) após registro de placares.**
  - Utilizar e expandir `bracketUtils.js` para atualizar o `state_json` com os jogadores avançando para as próximas rodadas.
  - Integrar essa lógica nas rotas de submissão de placar (`POST /api/scores`, `PATCH /api/tournaments/:tournamentId/matches/:matchId/winner`).

---

## 🧪 Testes

- [ ] 🔄 **Finalizar a implementação de testes de integração para cobrir todos os fluxos críticos da API.**
  - Ex: Criação de torneio -> adição de jogadores -> registro de placares -> visualização de chaveamento.
  - Testar interações entre frontend e backend.
- [ ] 💡 **Testes End-to-End (E2E) com Cypress ou Playwright**

---

## 📚 Documentação

- [ ] 🔄 **Expandir API_REFERENCE.md com exemplos detalhados de request/response para todos os endpoints.**

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
