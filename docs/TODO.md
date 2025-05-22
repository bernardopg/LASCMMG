# TODO List - Projeto LASCMMG

[⬅ Voltar ao README Principal](../README.md)

## Melhorias de Segurança e Autenticação
- [x] Implementar refresh token automático no AuthContext (Frontend)
- [x] Implementado timeout por inatividade para sessões (via Redis em `authMiddleware.js`)
- [x] Implementada validação de força de senha com Joi (`passwordSchema`) para registro e alteração de senha.
- [x] Integrado rastreamento de tentativas de login falhas e lockout de conta.
- [x] Aprimorado gerenciamento de refresh tokens no `adminModel.js` com Redis Sets.
- [ ] Implementar sistema de recuperação de senha
- [ ] Adicionar autenticação em dois fatores para administradores

## Correções em Componentes de Contexto
- [ ] Completar implementação do MessageContext com tratamento para múltiplas mensagens
- [ ] Implementar limites de tamanho para o cache no TournamentContext
- [ ] Adicionar tratamento de erros mais detalhado no ThemeContext
- [ ] Refatorar sistema de autorização para suportar permissões granulares

## Melhorias de UI/UX
- [ ] Otimizar interface para dispositivos móveis
- [ ] Melhorar feedback visual para operações de longa duração
- [ ] Implementar animações de transição entre páginas
- [ ] Adicionar modo de alto contraste para acessibilidade
- [ ] Criar templates responsivos para impressão de chaves de torneio

## Funcionalidades de Torneio
- [ ] Implementar sistema de notificações em tempo real para atualizações de torneio
- [ ] Adicionar suporte para formatos diferentes de torneio (eliminação dupla, grupos, etc.)
- [ ] Criar sistema de estatísticas avançadas para jogadores
- [ ] Implementar visualização de histórico de partidas
- [ ] Adicionar funcionalidade de exportação de resultados em PDF/Excel

## Performance
- [ ] Implementar virtualização para listas longas de jogadores ou partidas
- [ ] Adicionar mecanismo de cache no frontend para dados estáticos
- [ ] Otimizar carregamento inicial da aplicação
- [ ] Implementar lazy loading para componentes grandes
- [ ] Adicionar prefetch para rotas comuns

## Testes
- [ ] Aumentar cobertura de testes unitários para componentes
- [ ] Implementar testes e2e para fluxos principais
- [ ] Adicionar testes de acessibilidade
- [ ] Criar testes de carga para simular múltiplos usuários
- [ ] Implementar testes de regressão visual

## DevOps
- [ ] Configurar CI/CD completo para deploy automático
- [ ] Implementar monitoramento de erros em produção
- [ ] Adicionar análise de performance em tempo real
- [ ] Configurar backups automáticos do banco de dados
- [ ] Implementar sistema de versionamento semântico

## Documentação
- [x] Atualizada `API_REFERENCE.md` para refletir mudanças no backend.
- [x] Atualizado `MANUAL_USUARIO.md` para refletir mudanças de autenticação e usuário.
- [ ] Criar guia detalhado para desenvolvedores
- [ ] Documentar todos os componentes reutilizáveis
- [ ] Criar documentação para operações de manutenção

## Novos Recursos
- [ ] Implementar sistema de registro e login via redes sociais
- [ ] Adicionar modo público para visualização de torneios sem login
- [ ] Criar área de dashboard personalizada para jogadores
- [ ] Implementar sistema de conquistas/badges para jogadores
- [ ] Adicionar sistema de classificação e ranking

## Refatoração
- [x] Eliminado código duplicado (ex: `scoreModel.restoreScore`, funções de senha em `userModel.js`).
- [x] Padronizada nomenclatura (ex: `updatePasswordById` em `userModel.js`, validação Joi em `routes/users.js`).
- [x] Refatorada função `authenticateAdmin` em `adminModel.js` para melhor clareza.
- [ ] Atualizar bibliotecas desatualizadas
- [ ] Melhorar estrutura de pastas para facilitar manutenção
- [ ] Refatorar outras funções grandes em componentes/módulos menores (revisão contínua)

## TODO do Backend
Estas são tarefas pendentes identificadas no código do backend que precisam ser implementadas:

### Base de Dados
- [x] Adicionada constraint `UNIQUE (tournament_id, name)` à tabela `players`. `email TEXT UNIQUE` já existe para unicidade global de email.
  - Arquivo: `/backend/lib/db/database.js`
- [ ] Considerar índice `UNIQUE (name) WHERE tournament_id IS NULL` se nomes de jogadores globais (não associados a torneios) precisarem ser únicos independentemente do email.

### Modelos
- [ ] Implementar log de auditoria para exclusão em massa, caso seja uma ação comum de administrador
  - Arquivo: `/backend/lib/models/playerModel.js`

### Rotas
- [ ] Implementar estratégia de cache (ex: Redis) para as rotas de jogadores
  - Arquivo: `/backend/routes/player.js`
- [ ] Implementar estratégia de cache (ex: Redis) para as rotas de torneios
  - Arquivo: `/backend/routes/tournaments.js`

### Testes
- [ ] Autenticar como administrador uma vez para obter um token para rotas protegidas nos testes de integração
  - Arquivo: `/backend/tests/integration/tournament_flow.test.js`
