# Lista de Tarefas e Melhorias - LASCMMG

Este documento rastreia as tarefas pendentes, melhorias planejadas e ideias para o futuro do Sistema de Gerenciamento de Torneios LASCMMG.

**Legenda de Status:**

- **[NOVO]** - Tarefa ainda não iniciada.
- **[EM ANDAMENTO]** - Tarefa iniciada, progresso parcial.
- **[CONCLUÍDO]** - Tarefa finalizada.
- **[REVISAR]** - Tarefa precisa ser reavaliada ou redefinida.

## Prioridade Alta / Curto Prazo

### Backend e Estrutura

1. **[CONCLUÍDO]** **Migração para SQLite e `better-sqlite3`**: Persistência de dados de torneios, jogadores, placares, partidas e estado do chaveamento migrada de arquivos JSON para SQLite, utilizando `better-sqlite3`.
2. **[CONCLUÍDO]** **Configuração de ESLint e Prettier**: Unificada e regras mais estritas para qualidade de código.
3. **[CONCLUÍDO]** **Configuração de Testes com Vitest**: Framework de testes Vitest configurado com JSDOM. Testes unitários existentes para `securityUtils.js` passam.
4. **[CONCLUÍDO]** **Revisão e Refatoração de Modelos**: Modelos (`adminModel`, `tournamentModel`, `playerModel`, `scoreModel`, `matchModel`) revisados, esquema de DB atualizado, e uso de transações síncronas melhorado.
5. **[CONCLUÍDO]** **Revisão e Melhoria de Rotas Principais**: Rotas de autenticação, torneios, estatísticas e sistema revisadas. Segurança de endpoints reforçada. Lógica de geração de chaveamento usa dados reais. Código obsoleto removido.
6. **[CONCLUÍDO]** **Melhoria do Honeypot**: Logs de honeypot agora são persistidos e o endpoint de estatísticas usa dados reais. Campos de honeypot injetados nas páginas HTML servidas.
7. **[A FAZER]** **Refatorar Lógica de Chaveamento**: Mover a lógica complexa de geração e avanço de chaveamentos de `routes/tournaments-sqlite.js` para módulos de serviço dedicados (ex: `lib/services/bracketService.js`). (Alta Prioridade, Média Complexidade)
8. **[A FAZER]** **Otimização de Consultas SQL e Índices**: Continuar a revisão de todas as consultas nos modelos para otimizar performance e garantir índices apropriados para todas as tabelas e colunas frequentemente consultadas. (Alta Prioridade, Média Complexidade)
9. **[A FAZER]** **Backup Automatizado e Otimização de DB**: Criar script para `VACUUM` e avaliar modo WAL para SQLite. Automatizar backups. (Alta Prioridade, Média Complexidade)
10. **[A FAZER]** **Logs Aprimorados do Servidor**: Melhorar o sistema de logs do servidor (além do `morgan` e `auditLogger`) para facilitar diagnóstico e auditoria. (Média Prioridade, Média Complexidade)

### Interface e Experiência do Usuário (Frontend)

1. **[EM ANDAMENTO]** **Tema Completo da LASCMMG**: Finalizar a padronização visual em todas as páginas e componentes. (Alta Prioridade, Baixa Complexidade restante)
2. **[A FAZER]** **Revisão Completa do Frontend**: Analisar e refatorar o código JavaScript do frontend (`js/`) para melhor modularização, eficiência, e manutenibilidade. (Alta Prioridade, Alta Complexidade)
3. **[A FAZER]** **Visualização Responsiva de Chaveamentos**: Melhorar a usabilidade em dispositivos móveis. (Alta Prioridade, Média Complexidade)
4. **[EM ANDAMENTO]** **Indicadores de Progresso**: Adicionar/melhorar feedback visual durante operações. (Média Prioridade, Baixa Complexidade)
5. **[A FAZER]** **Melhorias nas Notificações**: Implementar um sistema de notificações mais robusto. (Média Prioridade, Média Complexidade)
6. **[EM ANDAMENTO]** **Filtros e Pesquisa Avançada**: Melhorar filtros existentes e adicionar novas opções. (Média Prioridade, Média Complexidade)

### Testes

1. **[A FAZER]** **Ampliar Cobertura de Testes Unitários**: Escrever testes para todos os modelos, rotas e principais lógicas de serviço. (Alta Prioridade, Média Complexidade)
2. **[A FAZER]** **Testes de Integração**: Implementar testes de integração para fluxos críticos (ex: criação de torneio, registro de placar, avanço de chaveamento). (Média Prioridade, Média Complexidade)

## Médio Prazo

### Backend e Funcionalidades

1. **[EM ANDAMENTO]** **API RESTful Documentada**: Gerar documentação da API (ex: Swagger/OpenAPI). (Média Prioridade, Média Complexidade)
2. **[A FAZER]** **Cache Inteligente**: Implementar cache para dados frequentemente acessados (ex: Redis). (Média Prioridade, Média Complexidade)
3. **[A FAZER]** **Otimização de Assets**: Compressão, minificação de JS/CSS. (Média Prioridade, Média Complexidade)
4. **[A FAZER]** **Persistência para Blacklist de Tokens**: Mover a blacklist de tokens JWT e contadores de brute-force para um armazenamento persistente (ex: Redis) para suportar múltiplos workers/instâncias. (Média Prioridade, Média Complexidade)

### Interface e Experiência do Usuário

1. **[EM ANDAMENTO]** **Visualizações de Estatísticas**: Melhorar gráficos e visualizações. (Média Prioridade, Média Complexidade)
2. **[A FAZER]** **Melhorias de Impressão**: Otimizar impressão de chaveamentos. (Média Prioridade, Média Complexidade)

### Novos Recursos

1. **[A FAZER]** **Sistema de Inscrição Online**: Permitir que jogadores se inscrevam em torneios. (Alta Prioridade, Média Complexidade)
2. **[A FAZER]** **Sistema de Rankings**: Implementar rankings baseados em resultados. (Média Prioridade, Média Complexidade)
3. **[A FAZER]** **Histórico de Confrontos (H2H)**: Mostrar histórico entre jogadores. (Média Prioridade, Média Complexidade)

## Aprimoramentos de Segurança (Contínuo)

1. **[A FAZER]** **Duplo Fator de Autenticação (2FA)**: Para administradores. (Média Prioridade, Média Complexidade)
2. **[A FAZER]** **Auditoria de Segurança Completa**: Revisão de segurança periódica. (Média Prioridade, Média Complexidade)
3. **[EM ANDAMENTO]** **Proteção Contra Ataques Comuns**: Continuar monitorando e aprimorando defesas.
4. **[EM ANDAMENTO]** **Sessões Seguras**: Revisar e garantir melhores práticas para JWT e cookies.

## Otimizações Técnicas e DevOps

1. **[A FAZER]** **CI/CD Pipeline**: Implementar integração e entrega contínua. (Média Prioridade, Média Complexidade)
2. **[REVISAR]** **Migração para TypeScript**: Avaliar os benefícios e custos de uma migração gradual. (Baixa Prioridade, Alta Complexidade)

## Considerações Futuras / Baixa Prioridade Atual

- **[NOVO]** Tutorial Interativo para novos usuários.
- **[NOVO]** Histórico de Atividades de Administradores.
- **[NOVO]** Notificações por Email/SMS.
- **[NOVO]** Compartilhamento em Redes Sociais.
- **[NOVO]** Geração de Certificados.
- **[NOVO]** Modo Espectador para eventos.
- **[NOVO]** Gestão de Locais, Recursos, Voluntários/Staff.
- **[NOVO]** Templates de Torneios.
- **[NOVO]** PWA (Progressive Web App) e otimizações mobile-specific.

---
Esta lista será revisada e atualizada regularmente.
