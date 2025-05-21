# Referência Completa da API LASCMMG (Atualizado: 21 Maio 2025)

[⬅ Voltar ao README Principal](../README.md)

> **Esta documentação reflete fielmente o backend real, cobre todos os endpoints REST, requisitos de autenticação, CSRF, exemplos de request/response, status HTTP e observações de segurança.**

---

## Convenções Gerais

- **URL Base:** `/api`
- **Autenticação:** JWT via `Authorization: Bearer <token>`
- **Proteção CSRF:** Métodos mutáveis (POST, PUT, PATCH, DELETE) requerem header `X-CSRF-Token` (token fornecido via endpoint `/api/csrf-token`).
- **Formato de Resposta:**
  - Sucesso: `{ success: true, ...dados }`
  - Erro: `{ success: false, message: "...", details?: [...] }`
- **Status HTTP:** 200, 201, 204, 400, 401, 403, 404, 409, 429, 500, 503
- **Content-Type:** Sempre `application/json` (exceto upload de arquivos)

---

## Sumário de Endpoints

- [Autenticação & Usuário](#autenticação--usuário)
- [CSRF Token](#csrf-token)
- [Torneios](#torneios)
- [Jogadores](#jogadores)
- [Placares](#placares)
- [Administração & Lixeira](#administração--lixeira)
- [Estatísticas & Sistema](#estatísticas--sistema)
- [Segurança & Honeypot](#segurança--honeypot)
- [Health Check](#health-check)

---

## Autenticação & Usuário

### `POST /api/auth/login`

Autentica usuário admin.
**Body:** `{ "username": "admin", "password": "senha", "rememberMe": true }`
**Respostas:**

- 200: `{ success: true, token, admin: { username, role } }`
- 401: `{ success: false, message: "Credenciais inválidas." }`
- 429: Rate limit (10 tentativas a cada 15 minutos)

### `POST /api/change-password`

Troca senha do admin autenticado.
**Auth:** JWT
**Body:** `{ "username": "admin", "currentPassword": "...", "newPassword": "..." }`
**Respostas:**

- 200: `{ success: true, message: "Senha alterada com sucesso" }`
- 400/403: Erro de validação/autorização

### `GET /api/me`

Retorna dados do usuário autenticado.
**Auth:** JWT
**Respostas:**

- 200: `{ success: true, user: { id, username, name, role } }`
- 401: Não autenticado

### `POST /api/logout`

Revoga o token JWT do usuário autenticado.
**Auth:** JWT
**Respostas:**

- 200: `{ success: true, message: "Logout realizado com sucesso." }`

---

## CSRF Token

### `GET /api/csrf-token`

Obtém um token CSRF para usar em requisições futuras que modificam dados.
**Respostas:**

- 200: `{ csrfToken: "..." }`

Este token deve ser incluído como header `X-CSRF-Token` em todas as requisições mutáveis (POST, PUT, PATCH, DELETE).

---

## Torneios

### `GET /api/tournaments`

Lista torneios públicos.
**Query:** `page`, `limit`, `orderBy`, `order`
**Respostas:**

- 200: `{ success: true, tournaments: [{ id, name, date, status, entry_fee, prize_pool, rules, created_at, updated_at }], totalPages, currentPage, totalTournaments }`
- 500: Erro interno

### `POST /api/tournaments/create`

Cria torneio (admin).
**Auth:** JWT + CSRF
**Body:** `{ name, date, entry_fee, prize_pool, rules, status }`
**Upload:** `playersFile` (opcional, multipart/form-data)
**Respostas:**

- 201: `{ success: true, tournamentId, tournament: { id, name, date, ... } }`
- 400: Dados inválidos
- 401/403: Não autenticado/autorizado
- 500: Erro interno

### `GET /api/tournaments/:tournamentId`

Detalhes de um torneio.
**Respostas:**

- 200: `{ success: true, tournament }`
- 404

### `GET /api/tournaments/:tournamentId/state`

Estado (chaveamento) do torneio.

- 200: `{ ...state }`

### `POST /api/tournaments/:tournamentId/state`

Atualiza estado do torneio (admin).
**Auth:** JWT + CSRF
**Body:** `{ state }`

### `GET /api/tournaments/:tournamentId/players`

Lista jogadores do torneio.
**Query:** `page`, `limit`

### `POST /api/tournaments/:tournamentId/players`

Adiciona jogador ao torneio (admin).
**Auth:** JWT + CSRF
**Body:** `{ PlayerName, Nickname, ... }`

### `POST /api/tournaments/:tournamentId/players/import`

Importa jogadores via arquivo JSON (admin).
**Auth:** JWT + CSRF
**Upload:** `jsonFile` (multipart/form-data)

### `POST /api/tournaments/:tournamentId/players/update`

Substitui lista de jogadores (admin).
**Auth:** JWT + CSRF
**Body:** `{ players: [...] }`

### `GET /api/tournaments/:tournamentId/scores`

Lista placares do torneio.
**Query:** `page`, `limit`

### `POST /api/tournaments/:tournamentId/scores/update`

Adiciona/atualiza placares em lote (admin).
**Auth:** JWT + CSRF
**Body:** `{ scores: [...] }`

### `POST /api/tournaments/:tournamentId/generate-bracket`

Gera chaveamento (admin).
**Auth:** JWT + CSRF

### `POST /api/tournaments/:tournamentId/reset`

Reseta estado do torneio (admin).
**Auth:** JWT + CSRF

### `PATCH /api/tournaments/:tournamentId/[property]`

Atualiza propriedade específica (admin).
**Auth:** JWT + CSRF
**Body:** `{ name | description | entry_fee | prize_pool | rules | status }`

### `PATCH /api/tournaments/:tournamentId/matches/:matchId/schedule`

Atualiza agendamento de partida (admin).
**Auth:** JWT + CSRF

### `PATCH /api/tournaments/:tournamentId/matches/:matchId/winner`

Atualiza vencedor/placar de partida (admin).
**Auth:** JWT + CSRF

### `GET /api/tournaments/:tournamentId/stats`

Estatísticas do torneio (admin).
**Auth:** JWT

### `GET /api/tournaments/:tournamentId/players/:playerName/stats`

Estatísticas de jogador no torneio (admin).
**Auth:** JWT

---

## Jogadores

### `GET /api/players`

Lista jogadores globais.
**Query:** `page`, `limit`, `sortBy`, `order`
**Respostas:**
- 200: `{ success: true, players: [{ id, name, nickname, gender, skill_level, email }], totalPages, currentPage, totalPlayers }`
- 500: Erro interno

### `GET /api/players/:playerId`

Detalhes de jogador global.
**Respostas:**
- 200: `{ success: true, player: { id, name, nickname, gender, skill_level, email, tournaments: [...] } }`
- 404: Jogador não encontrado

---

## Placares

### `POST /api/scores`

Cria placar para partida (autenticado).
**Auth:** JWT + CSRF
**Body:** `{ tournamentId, matchId, player1Score, player2Score, winnerId, stateMatchKey }`

---

## Administração & Lixeira

### `GET /api/admin/players`

Lista jogadores para administração.
**Auth:** JWT
**Query:** `page`, `limit`, `sortBy` (ex: `name`, `created_at`), `order` (`asc`, `desc`), `filters[columnName]=value` (ex: `filters[name]=John&filters[status]=active`)
**Respostas:**

- 200: `{ success: true, players: [{ id, name, nickname, gender, skill_level, email, tournaments, games_played, wins, losses, is_deleted, deleted_at }], totalPages, currentPage, totalPlayers }`
- 401/403: Não autenticado/autorizado

### `POST /api/admin/players`

Cria um novo jogador (admin).
**Auth:** JWT + CSRF
**Body:** `{ name, nickname, email, gender, skill_level, tournament_id }`
**Respostas:**
- 201: `{ success: true, player: { id, name, ... } }`
- 400: Dados inválidos ou email duplicado
- 401/403: Não autenticado/autorizado

### `PUT /api/admin/players/:playerId`

Atualiza um jogador (admin).
**Auth:** JWT + CSRF
**Body:** `{ name, nickname, ... }`

### `DELETE /api/admin/players/:playerId`

Exclui um jogador (admin, soft delete por padrão).
**Auth:** JWT + CSRF
**Query:** `permanent=true` (para exclusão permanente)

### `GET /api/admin/scores`

Lista placares para administração.
**Auth:** JWT
**Query:** `page`, `limit`, `sortBy` (ex: `timestamp`, `round`), `order` (`asc`, `desc`), `filters[columnName]=value`
**Respostas:**

- 200: `{ success: true, scores: [...], totalPages, currentPage, totalScores }`

### `PUT /api/admin/scores/:scoreId`

Atualiza um placar (admin).
**Auth:** JWT + CSRF
**Body:** `{ player1Score, player2Score, winnerId, ... }`

### `DELETE /api/admin/scores/:scoreId`

Exclui um placar (admin, soft delete por padrão).
**Auth:** JWT + CSRF
**Query:** `permanent=true` (para exclusão permanente)

### `GET /api/admin/trash`

Itens na lixeira (admin).
**Auth:** JWT
**Query:** `page`, `limit`, `type` (`player`, `score`, `tournament`)

### `POST /api/admin/trash/restore`

Restaura item da lixeira (admin).
**Auth:** JWT
**Body:** `{ itemId, itemType }`

### `DELETE /api/admin/trash/item/:itemType/:itemId`

Exclui item permanentemente (admin).
**Auth:** JWT + CSRF (Note: CSRF is typically for state-changing requests, ensure backend enforces if needed for DELETE)
**Path Params:** `itemType` (`player`, `score`, `tournament`), `itemId`
**Respostas:**

- 200: `{ success: true, message: "Item (...) excluído permanentemente." }`
- 404: Item não encontrado

---

## Estatísticas & Sistema

### `GET /api/system/stats`

Estatísticas gerais do sistema (admin).
**Auth:** JWT
**Respostas:**
- 200: `{ success: true, timestamp, stats: { tournaments: { total, active, completed, scheduled }, entities: { players, matches, scores }, system: { uptime, nodeVersion, platform, memory, cpu, hostname }, storage: { databaseSize } } }`
- 401/403: Não autenticado/autorizado
- 500: Erro interno

### `GET /api/system/health`

Health check do sistema.

---

## Segurança & Honeypot

### `GET /api/system/security/overview-stats`

Estatísticas de segurança/honeypot (admin).
**Auth:** JWT
**Respostas:**
- 200: `{ success: true, overviewStats: { totalHoneypotEvents, uniqueHoneypotIps, honeypotEventTypes, honeypotTopIps, honeypotLastEventTimestamp } }`
- 401/403: Não autenticado/autorizado

### `GET /api/system/security/honeypot-config`

Configuração do honeypot (admin).
**Auth:** JWT
**Respostas:**
- 200: `{ success: true, settings: { detectionThreshold, blockDurationHours, ipWhitelist, activityWindowMinutes } }`
- 401/403: Não autenticado/autorizado

### `POST /api/system/security/honeypot-config`

Atualiza configuração do honeypot (admin).
**Auth:** JWT + CSRF
**Body:** `{ detectionThreshold, blockDurationHours, ipWhitelist, activityWindowMinutes }`
**Respostas:**
- 200: `{ success: true, settings: { detectionThreshold, blockDurationHours, ipWhitelist, activityWindowMinutes } }`
- 400: Parâmetros inválidos
- 401/403: Não autenticado/autorizado

### `GET /api/system/security/blocked-ips`

Lista IPs bloqueados (admin).
**Auth:** JWT
**Query:** `page`, `limit`
**Respostas:**
- 200: `{ success: true, ips: [{ ip, expiresAt, reason, blockedAt, manual }], total, currentPage, totalPages }`
- 401/403: Não autenticado/autorizado

### `POST /api/system/security/blocked-ips`

Bloqueia IP manualmente (admin).
**Auth:** JWT + CSRF
**Body:** `{ ip, durationHours, reason }`
**Respostas:**
- 200: `{ success: true, message: "IP bloqueado com sucesso" }`
- 400: IP inválido ou na whitelist
- 401/403: Não autenticado/autorizado

### `DELETE /api/system/security/blocked-ips/:ipAddress`

Desbloqueia IP (admin).
**Auth:** JWT + CSRF
**Respostas:**
- 200: `{ success: true, message: "IP desbloqueado com sucesso" }`
- 404: IP não encontrado na lista de bloqueados
- 401/403: Não autenticado/autorizado

---

## Health Check

### `GET /api/system/health`

Retorna status do sistema, banco, disco, memória, versão.
**Respostas:**
- 200: `{ status: "ok", timestamp, uptime, checks: { database, disk, memory }, version }`
- 503: `{ status: "degraded", timestamp, uptime, checks: { database, disk, memory }, version }` (serviço funcional mas com degradação)
- 500: `{ status: "error", message, error }`

---

## Observações de Segurança

- Todos os endpoints mutáveis exigem CSRF token e JWT.
- Rate limiting ativo em endpoints sensíveis (especialmente login com 10 tentativas a cada 15 minutos).
- Todas as respostas de erro são padronizadas.
- Senhas nunca são retornadas.
- Logs de segurança e auditoria são mantidos.
- Sistema de honeypot ativo para detectar e bloquear tentativas de acesso malicioso.
- Whitelist de IPs configurável para evitar bloqueios de IPs confiáveis.
- Suporte para configuração de expiração de sessão por inatividade.
- Mecanismo de bloqueio automático após múltiplas tentativas suspeitas.

---

**Consulte os exemplos de request/response e detalhes de cada endpoint acima. Para detalhes de schemas, veja o código-fonte ou os arquivos de validação Joi.**

---

## Schemas de Dados

### Player (Jogador)
```json
{
  "id": "integer",
  "name": "string",
  "nickname": "string",
  "gender": "string (opcional)",
  "skill_level": "string (opcional)",
  "email": "string (opcional, único)",
  "tournament_id": "integer",
  "games_played": "integer",
  "wins": "integer",
  "losses": "integer",
  "is_deleted": "boolean (0/1)",
  "deleted_at": "string ISO8601 (opcional)"
}
```

### Tournament (Torneio)
```json
{
  "id": "integer",
  "name": "string",
  "date": "string ISO8601",
  "status": "string (scheduled|active|completed)",
  "entry_fee": "number (opcional)",
  "prize_pool": "string (opcional)",
  "rules": "string (opcional)",
  "created_at": "string ISO8601",
  "updated_at": "string ISO8601",
  "deleted_at": "string ISO8601 (opcional)",
  "is_deleted": "boolean (0/1)"
}
```

### Score (Placar)
```json
{
  "id": "integer",
  "player1_id": "integer",
  "player2_id": "integer",
  "player1_score": "integer",
  "player2_score": "integer",
  "winner_id": "integer",
  "match_id": "string",
  "round": "string",
  "completed_at": "string ISO8601",
  "is_deleted": "boolean (0/1)",
  "deleted_at": "string ISO8601 (opcional)"
}
```

---

**Atualizado em:** 21 de maio de 2025.
**Versão da API:** 2.1.0
