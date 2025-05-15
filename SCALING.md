# Estratégia de Escalabilidade - LASCMMG

Este documento descreve as estratégias para escalar o Sistema de Gerenciamento de Torneios de Sinuca (LASCMMG) à medida que a base de usuários e a carga de trabalho aumentam.

## Índice

1. [Introdução](#introdução)
2. [Métricas e Indicadores](#métricas-e-indicadores)
3. [Escalabilidade Vertical](#escalabilidade-vertical)
4. [Escalabilidade Horizontal](#escalabilidade-horizontal)
5. [Otimização de Banco de Dados](#otimização-de-banco-de-dados)
6. [Otimização de Código](#otimização-de-código)
7. [Arquitetura em Camadas](#arquitetura-em-camadas)
8. [Balanceamento de Carga](#balanceamento-de-carga)
9. [Cache](#cache)
10. [Monitoramento e Alertas](#monitoramento-e-alertas)
11. [Roadmap de Escalabilidade](#roadmap-de-escalabilidade)

## Introdução

A estratégia de escalabilidade do LASCMMG é projetada para permitir que o sistema cresça de forma eficiente, atendendo desde pequenos torneios locais até competições de grande porte, mantendo a performance e a confiabilidade.

### Considerações Iniciais

- **Padrão de Uso:** O sistema normalmente experimenta picos de tráfego durante competições ativas, com períodos mais tranquilos entre os eventos.
- **Crescimento Estimado:** Prevê-se um crescimento anual de 30-50% no número de usuários e 20-40% no número de torneios.
- **Limitações Atuais:** O sistema usa SQLite (via `better-sqlite3`) como banco de dados principal. Embora eficiente para muitas cargas de trabalho, o SQLite tem limitações inerentes de concorrência de escrita em cenários de altíssima escala, o que motiva o planejamento para bancos de dados cliente-servidor em fases futuras de crescimento.

## Métricas e Indicadores

As seguintes métricas são monitoradas para determinar quando e como escalar:

| Métrica           | Descrição                                   | Limiar para Escalar             | Ferramenta de Monitoramento (Exemplos)        |
| ----------------- | ------------------------------------------- | ------------------------------- | --------------------------------------------- |
| CPU               | Uso médio de CPU                            | >70% por 15 minutos             | Prometheus/Grafana, CloudWatch                |
| Memória           | Uso de memória RAM                          | >80% por 10 minutos             | Prometheus/Grafana, CloudWatch                |
| Tempo de Resposta | Latência média de requisições               | >500ms para 95% das requisições | Sentry APM, New Relic                         |
| Taxa de Erro      | Percentual de respostas com erro            | >1% em janela de 5 minutos      | Sentry                                        |
| Conexões DB       | (Relevante para DBs cliente-servidor)       | >80% do pool configurado        | Ferramentas específicas do DB                 |
| Armazenamento     | Uso de disco (para o arquivo SQLite e logs) | >85%                            | Prometheus Node Exporter, Monitoramento do SO |

## Escalabilidade Vertical

### Estratégia de Escalabilidade Vertical

Aumentar os recursos (CPU, memória, armazenamento) da máquina que hospeda a aplicação e o banco de dados SQLite.

### Quando Aplicar Escalabilidade Vertical

- Fase inicial e média do projeto.
- Picos temporários de tráfego.
- Quando a simplicidade operacional é prioritária.

### Processo de Escala

1. **Avaliação:** Identificar o recurso limitante.
2. **Planejamento:** Determinar o aumento necessário.
3. **Implementação:** Escalar a instância (nuvem) ou hardware (on-premise).
4. **Validação:** Verificar se as métricas normalizaram.

### Limites

- Custo pode aumentar significativamente com hardware de ponta.
- Eventualmente, um único servidor atinge um limite prático.

## Escalabilidade Horizontal

### Estratégia de Escalabilidade Horizontal

Distribuir a carga entre múltiplas instâncias da aplicação. **Esta estratégia, para o LASCMMG, exigiria a migração do SQLite para um banco de dados cliente-servidor (como PostgreSQL) que suporte múltiplas conexões concorrentes de forma eficiente.**

### Quando Aplicar Escalabilidade Horizontal

- Após alcançar os limites práticos ou de custo da escalabilidade vertical.
- Para cenários de alta disponibilidade e resiliência.

### Preparação Necessária (Plano Futuro)

1. **Migração de Banco de Dados:** Planejar e executar a migração de SQLite para um sistema de banco de dados como PostgreSQL ou MySQL.
   - Um script como `node scripts/migrate-to-postgresql.js` precisaria ser desenvolvido para esta finalidade.
2. **Gestão de Sessões:** Se sessões de usuário forem armazenadas no servidor da aplicação (atualmente usa JWT, o que é stateless), mas se mudar para sessões, implementar um armazenamento de sessão compartilhado (ex: Redis).
3. **Armazenamento de Arquivos (Uploads):** Para arquivos enviados por usuários (ex: JSON de importação), considerar uma solução de armazenamento centralizada ou externa (ex: S3, Azure Blob) se múltiplas instâncias da aplicação precisarem acessá-los.

### Processo de Escala Horizontal (Plano Futuro)

1. Configurar um balanceador de carga (Nginx, HAProxy, Load Balancer de nuvem).
2. Implantar a aplicação em contêineres (Docker) para facilitar a replicação.
3. Considerar um sistema de orquestração (Kubernetes, Docker Swarm) para gerenciar os contêineres.
4. Implementar autoscaling baseado em métricas.

### Considerações

- Garantir que a aplicação seja o mais stateless possível (o uso de JWT já ajuda).
- Lidar com consistência de dados se houver caches ou dados replicados.

## Otimização de Banco de Dados

### SQLite (Estratégias Atuais e de Curto Prazo)

- **Índices:** Garantir que todas as colunas frequentemente usadas em cláusulas `WHERE`, `JOIN`, e `ORDER BY` estejam indexadas.
  - A criação de tabelas em `lib/database.js` já inclui alguns índices (ex: chaves primárias, UNIQUE constraints).
  - **Futuro:** Considerar índices adicionais conforme o uso, como em colunas de data para filtragem de intervalo (ex: `CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON matches(scheduled_at);`).
- **Otimização de Queries:** Analisar e otimizar queries lentas nos modelos.
- **Vacuum:** Executar `VACUUM` periodicamente para reconstruir o banco de dados e reduzir a fragmentação (pode ser parte de um script de manutenção futuro, como um `scripts/optimize-database.js`).
- **Modo WAL (Write-Ahead Logging):** Avaliar e implementar o modo WAL para melhor concorrência: `PRAGMA journal_mode=WAL;`.

### PostgreSQL/MySQL (Estratégias de Médio/Longo Prazo, após migração)

- Configuração de replicação para leitura.
- Particionamento de tabelas grandes.
- Otimização de configuração do servidor de banco de dados.

## Otimização de Código

### Frontend

- Implementar lazy loading para rotas ou componentes pesados.
- Otimizar e minificar bundles JavaScript e CSS (se aplicável, dependendo do setup de build).
- Utilizar CDN para assets estáticos.
- Implementar caching de respostas de API no cliente quando apropriado (ex: usando Service Workers).

### Backend

- Otimizar consultas ao banco de dados (já mencionado).
- Usar queries parametrizadas (já em uso, bom para segurança e performance).
- Implementar rate limiting (já implementado em `server.js`).
- Considerar paginação para todas as listagens de API que podem retornar muitos dados.

## Arquitetura em Camadas

### Atual (Monolítica com SQLite)

```text
[Cliente (HTML, CSS, JS)] → [Servidor Express (API Routes)] → [Camada de Modelos (lib/models)] → [SQLite (lib/db.js via better-sqlite3)]
```

Esta arquitetura é adequada para o estado atual do projeto.

### Futura (Considerações para Escala)

```text
[Cliente] → [Load Balancer] → [Servidores de API (Node.js/Express)] → [Camada de Serviço] → [Banco de Dados (PostgreSQL/MySQL) + Cache (Redis)]
                                     ↓
                             [Servidores Worker (para tarefas em background)]
```

A separação em serviços (API, workers, notificações) seria uma evolução para cenários de maior escala.

## Balanceamento de Carga (Relevante após migração para DB cliente-servidor e múltiplas instâncias de app)

- **Nginx ou HAProxy:** Como balanceadores de carga de software.
- **Load Balancers de Nuvem (AWS ELB, Azure Load Balancer, etc.):** Se hospedado em nuvem.

## Cache (Estratégias Futuras)

1. **Cache de Navegador:** Configurar headers HTTP (`Cache-Control`, `ETag`, `Last-Modified`) para assets estáticos (parcialmente feito em `server.js`).
2. **Cache de Aplicação (Backend):**
   - Implementar uma solução como Redis para cachear resultados de queries de banco de dados frequentes ou dados computacionalmente caros.
3. **CDN (Content Delivery Network):**
   - Servir assets estáticos (CSS, JS, imagens) através de uma CDN para reduzir latência para usuários globais.

## Monitoramento e Alertas

### Métricas a Monitorar

- **Sistema:** CPU, memória, disco, rede.
- **Aplicação:** Tempo de resposta da API, taxa de erros (HTTP 5xx, 4xx), throughput (requisições/segundo).
- **Banco de Dados (SQLite):** Tamanho do arquivo. Para PostgreSQL/MySQL, monitorar conexões, queries lentas, bloqueios.
- **Negócio:** Número de usuários ativos, torneios criados, partidas registradas.

### Sistema de Alertas (Exemplos)

- **Urgente:** Aplicação indisponível, taxa de erro crítica, tempo de resposta muito alto.
- **Importante:** Uso elevado de CPU/memória/disco, aumento significativo de erros.
- **Informativo:** Tendências de crescimento, picos de uso.

## Roadmap de Escalabilidade

### Fase 1: Otimização da Configuração Atual (SQLite)

- **[CONCLUÍDO]** Migração de dados de JSON para SQLite.
- **[CONCLUÍDO]** Otimizar consultas SQL e garantir índices adequados (revisão de modelos e esquema realizada).
- **[EM ANDAMENTO]** Implementar monitoramento básico de saúde da aplicação e logs (health check existe, logs de honeypot melhorados).
- **[CONCLUÍDO]** Implementar cache de assets estáticos mais robusto e headers de cache HTTP.
- **[CONCLUÍDO]** Avaliar e implementar o modo WAL para SQLite.
- **[CONCLUÍDO]** Criar script de manutenção para `VACUUM` (ex: `scripts/optimize-database.js`).

### Fase 2: Preparação para Escala Maior (Plano Futuro)

- Avaliar e planejar a migração de SQLite para PostgreSQL/MySQL.
- Introduzir Redis para cache de dados e, potencialmente, gerenciamento de sessão.
- Containerizar a aplicação com Docker.
- Implementar um pipeline de CI/CD básico.

### Fase 3: Escala Horizontal (Plano Futuro Avançado)

- Implementar balanceamento de carga.
- Considerar separar componentes em serviços menores se a complexidade justificar.
- Implementar autoscaling se hospedado em ambiente de nuvem que suporte.
- Utilizar CDN para assets.

---

Este documento deve ser revisado periodicamente, especialmente se houver mudanças significativas no padrão de uso da aplicação ou nos objetivos de crescimento.
