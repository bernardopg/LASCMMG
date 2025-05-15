# Lista de Tarefas e Melhorias - LASCMMG

## 🚧 O Que Vem Por Aí: Nosso Roadmap de Desenvolvimento

Este documento rastreia as tarefas pendentes, melhorias planejadas e ideias para o futuro do Sistema de Gerenciamento de Torneios LASCMMG. Ele serve como um guia para o desenvolvimento contínuo e para manter a equipe focada nos próximos passos.

**Legenda de Status:**

- **[NOVO]** - Tarefa identificada, mas ainda não iniciada.
- **[EM ANDAMENTO]** - Tarefa iniciada, com progresso parcial.
- **[CONCLUÍDO]** - Tarefa finalizada e verificada.
- **[REVISAR]** - Tarefa que precisa ser reavaliada, redefinida ou que teve seu escopo alterado.

## Prioridade Alta / Curto Prazo

Tarefas essenciais para a estabilidade, segurança e funcionalidades principais.

### Backend e Estrutura

1. **[CONCLUÍDO] Migração para SQLite e `better-sqlite3`**: Persistência de dados de torneios, jogadores, placares, partidas e estado do chaveamento migrada de arquivos JSON para SQLite, utilizando `better-sqlite3`. Base de dados relacional estabelecida.
2. **[CONCLUÍDO] Configuração de ESLint e Prettier**: Ferramentas de linting e formatação configuradas e unificadas para garantir a qualidade e consistência do código.
3. **[CONCLUÍDO] Configuração de Testes com Vitest**: Framework de testes Vitest configurado com JSDOM para testes unitários de frontend. Testes unitários existentes para `securityUtils.js` foram validados.
4. **[CONCLUÍDO] Revisão e Refatoração Inicial de Modelos**: Modelos (`adminModel`, `tournamentModel`, `playerModel`, `scoreModel`, `matchModel`) revisados para usar o banco de dados SQLite. Esquema de DB inicial atualizado e uso de transações síncronas melhorado.
5. **[CONCLUÍDO] Revisão e Melhoria de Rotas Principais**: Rotas de autenticação, torneios, estatísticas e sistema revisadas para interagir com o SQLite. Segurança de endpoints reforçada. Lógica de geração de chaveamento adaptada para usar dados do DB. Código obsoleto removido.
6. **[CONCLUÍDO] Melhoria do Honeypot**: Mecanismo de honeypot aprimorado. Logs de atividade do honeypot agora são persistidos. Endpoint de estatísticas de segurança utiliza dados reais. Campos de honeypot injetados nas páginas HTML servidas.
7. **[EM ANDAMENTO] Refatorar Lógica de Chaveamento**: Mover a lógica complexa de geração, avanço e gerenciamento de chaveamentos de `routes/tournaments-sqlite.js` para módulos de serviço dedicados (ex: `lib/services/bracketService.js`) para melhorar a organização e testabilidade. (Alta Prioridade, Média Complexidade)
8. **[A FAZER] Otimização Abrangente de Consultas SQL e Índices**: Realizar uma revisão completa de todas as consultas SQL nos modelos para otimizar performance. Garantir a criação de índices apropriados para todas as tabelas e colunas frequentemente consultadas em `WHERE`, `JOIN` e `ORDER BY`. (Alta Prioridade, Média Complexidade)
9. **[A FAZER] Automação de Backup e Otimização de DB**: Criar/aprimorar script para executar `VACUUM` no banco de dados SQLite periodicamente. Avaliar e implementar o modo WAL (Write-Ahead Logging) para melhorar a concorrência. Automatizar a execução do script de backup (`scripts/backup-database.js`) via cron job ou similar. (Alta Prioridade, Média Complexidade)
10. **[A FAZER] Logs Estruturados e Aprimorados do Servidor**: Melhorar o sistema de logs do servidor (além do `morgan` substituído por Pino e `auditLogger`) para incluir mais contexto estruturado, facilitando a análise, diagnóstico de problemas e auditoria em ambientes de produção. (Média Prioridade, Média Complexidade)

### Interface e Experiência do Usuário (Frontend)

1. **[EM ANDAMENTO] Tema Completo da LASCMMG**: Finalizar a padronização visual em todas as páginas e componentes do sistema, aplicando o tema definido pela LASCMMG. (Alta Prioridade, Baixa Complexidade restante)
2. **[A FAZER] Revisão e Refatoração do Frontend JavaScript**: Analisar e refatorar o código JavaScript do frontend (`js/`) para melhorar a modularização, eficiência, manutenibilidade e clareza, seguindo os padrões de codificação definidos. (Alta Prioridade, Alta Complexidade)
3. **[A FAZER] Visualização Responsiva Otimizada de Chaveamentos**: Melhorar a usabilidade e a apresentação visual dos chaveamentos em dispositivos móveis e telas menores. (Alta Prioridade, Média Complexidade)
4. **[EM ANDAMENTO] Indicadores de Progresso e Feedback Visual**: Adicionar/melhorar feedback visual para o usuário durante operações assíncronas (carregamento, salvamento, etc.) para indicar que o sistema está trabalhando. (Média Prioridade, Baixa Complexidade)
5. **[A FAZER] Sistema de Notificações Robusto**: Implementar um sistema de notificações (toasts, banners) mais consistente e informativo para feedback de sucesso, erro e informações. (Média Prioridade, Média Complexidade)
6. **[EM ANDAMENTO] Filtros e Pesquisa Avançada nas Listagens**: Melhorar os filtros existentes (ex: histórico de placares, lista de jogadores) e adicionar novas opções de pesquisa para facilitar a localização de informações. (Média Prioridade, Média Complexidade)

### Testes

1. **[A FAZER] Ampliar Cobertura de Testes Unitários**: Escrever testes unitários abrangentes para todos os modelos, rotas da API e principais lógicas de serviço no backend e frontend. (Alta Prioridade, Média Complexidade)
2. **[A FAZER] Testes de Integração para Fluxos Críticos**: Implementar testes de integração para validar os fluxos de trabalho mais importantes do sistema (ex: criação completa de um torneio, registro de placares e avanço no chaveamento, importação de jogadores). (Média Prioridade, Média Complexidade)

## Médio Prazo

Funcionalidades e melhorias que agregam valor significativo e preparam o sistema para o futuro.

### Backend e Funcionalidades

1. **[EM ANDAMENTO] Documentação da API RESTful**: Gerar e manter documentação atualizada da API (ex: utilizando Swagger/OpenAPI) para facilitar a integração e o entendimento dos endpoints disponíveis. (Média Prioridade, Média Complexidade)
2. **[A FAZER] Cache de Dados Estratégico**: Implementar uma solução de cache (ex: Redis) para armazenar resultados de queries de banco de dados frequentes ou dados computacionalmente caros, reduzindo a carga no DB e melhorando o tempo de resposta. (Média Prioridade, Média Complexidade)
3. **[A FAZER] Otimização de Assets para Produção**: Implementar processos automatizados de compressão e minificação de arquivos JS, CSS e imagens como parte do pipeline de build/deploy. (Média Prioridade, Média Complexidade)
4. **[A FAZER] Persistência Centralizada para Blacklist/Rate Limiting**: Mover a blacklist de tokens JWT e os contadores de rate limiting para um armazenamento persistente e centralizado (ex: Redis) para suportar múltiplos workers/instâncias da aplicação em um ambiente escalado horizontalmente. (Média Prioridade, Média Complexidade)

### Interface e Experiência do Usuário

1. **[EM ANDAMENTO] Visualizações de Estatísticas Aprimoradas**: Melhorar a apresentação das estatísticas com gráficos mais interativos e informativos. (Média Prioridade, Média Complexidade)
2. **[A FAZER] Melhorias na Impressão de Chaveamentos**: Otimizar a funcionalidade de impressão para gerar layouts de chaveamento mais adequados para impressão em papel. (Média Prioridade, Média Complexidade)

### Novos Recursos Chave

1. **[A FAZER] Sistema de Inscrição Online para Jogadores**: Desenvolver uma interface e lógica de backend para permitir que jogadores se inscrevam diretamente nos torneios através do sistema. (Alta Prioridade, Média Complexidade)
2. **[A FAZER] Sistema de Rankings e Histórico de Confrontos (H2H)**: Implementar funcionalidades para calcular e exibir rankings de jogadores baseados em resultados de torneios e mostrar o histórico de partidas entre jogadores específicos. (Média Prioridade, Média Complexidade)

## Aprimoramentos de Segurança (Contínuo)

A segurança é um processo contínuo.

1. **[A FAZER] Duplo Fator de Autenticação (2FA)**: Implementar 2FA para contas de administrador para adicionar uma camada extra de segurança ao acesso ao painel administrativo. (Média Prioridade, Média Complexidade)
2. **[A FAZER] Auditoria de Segurança Periódica**: Realizar revisões de segurança regulares no código e na configuração do sistema. (Média Prioridade, Média Complexidade)
3. **[EM ANDAMENTO] Monitoramento e Aprimoramento Contínuo das Defesas**: Continuar monitorando logs de segurança (honeypot, tentativas de login falhas) e aprimorar as defesas contra ataques comuns.
4. **[EM ANDAMENTO] Revisão de Sessões Seguras**: Garantir que as melhores práticas para gerenciamento de tokens JWT e cookies estejam sendo seguidas rigorosamente.

## Otimizações Técnicas e DevOps

1. **[A FAZER] CI/CD Pipeline Automatizado**: Implementar um pipeline de Integração Contínua e Entrega Contínua para automatizar o processo de build, teste e deploy do sistema. (Média Prioridade, Média Complexidade)
2. **[REVISAR] Avaliação de Migração para TypeScript**: Avaliar os benefícios (segurança de tipo, manutenibilidade) e os custos de uma migração gradual ou completa do código JavaScript para TypeScript. (Baixa Prioridade, Alta Complexidade)

## Considerações Futuras / Baixa Prioridade Atual

Ideias para o futuro que podem ser exploradas após a conclusão das tarefas de maior prioridade.

* **[NOVO]** Tutorial Interativo para novos usuários no painel administrativo.
* **[NOVO]** Histórico de Atividades detalhado dos administradores.
* **[NOVO]** Integração com sistemas de Notificação (Email/SMS) para alertas de partidas, etc.
* **[NOVO]** Funcionalidades de Compartilhamento em Redes Sociais para resultados de torneios.
* **[NOVO]** Geração de Certificados de Participação/Premiação.
* **[NOVO]** Modo Espectador com atualizações em tempo real para partidas em andamento.
* **[NOVO]** Gestão de Locais, Recursos (mesas), Voluntários/Staff.
* **[NOVO]** Templates de Torneios para agilizar a criação.
* **[NOVO]** Transformação em PWA (Progressive Web App) e otimizações mobile-specific mais profundas.

---

Esta lista é um documento vivo e será revisada e atualizada regularmente para refletir as prioridades e o progresso do projeto.
