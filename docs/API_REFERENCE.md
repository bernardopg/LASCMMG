# Referência Completa da API LASCMMG (Atualizado: 22 Maio 2025)

[⬅ Voltar ao README Principal](../README.md)

> **Esta documentação reflete fielmente o backend real, cobre todos os endpoints REST, requisitos de autenticação, CSRF, exemplos de request/response, status HTTP e observações de segurança.**

---

## Convenções Gerais

- **URL Base:** `/api`
- **Autenticação:** JWT via `Authorization: Bearer <token>`
- **Proteção CSRF:** Métodos mutáveis (POST, PUT, PATCH, DELETE) requerem header `X-CSRF-Token` (token fornecido via endpoint `/api/csrf-token`). Login e registro não requerem CSRF.
- **Formato de Resposta:**
  - Sucesso: `{ success: true, ...dados }`
  - Erro: `{ success: false, message: "...", details?: [...] }` (detalhes omitidos em produção)
- **Status HTTP:** 200, 201, 204, 400, 401, 403, 404, 409, 429, 500, 503
- **Content-Type:** Sempre `application/json` (exceto upload de arquivos)
- **Validação:** As requisições são validadas usando Joi. Campos desconhecidos são removidos.
- **Rate Limiting:** Aplicado a endpoints sensíveis, especialmente login.
- **Failed Login Lockout:** Contas são bloqueadas após múltiplas tentativas de login falhas.

---

## Sumário de Endpoints

- [Autenticação & Usuário (Admin & Regular)](#autenticação--usuário-admin--regular)
- [CSRF Token](#csrf-token)
- [Torneios](#torneios)
- [Jogadores](#jogadores)
- [Placares](#placares)
- [Administração & Lixeira](#administração--lixeira)
- [Estatísticas & Sistema](#estatísticas--sistema)
- [Segurança & Honeypot](#segurança--honeypot)
- [Health Check](#health-check)

---

## Autenticação & Usuário (Admin & Regular)

### `POST /api/auth/login` (Login de Administrador)

Autentica um usuário administrador. Username deve ser um email.
**Body:** `{ "username": "admin@example.com", "password": "securePassword1!", "rememberMe": true (opcional) }`
**Respostas:**
- 200: `{ success: true, token: "jwt_access_token", refreshToken: "jwt_refresh_token" (se rememberMe), expiresIn: 86400, admin: { id, username, role } }`
- 401: `{ success: false, message: "Credenciais inválidas." }`
- 429: Rate limit ou conta bloqueada por tentativas falhas.

### `POST /api/users/register` (Registro de Usuário Regular)

Registra um novo usuário regular. Username deve ser um email.
**Body:** `{ "username": "user@example.com", "password": "NewPassword123!" }`
**Respostas:**
- 201: `{ success: true, message: "User registered successfully.", userId, username }`
- 400: Dados inválidos (ex: senha não atende aos critérios de complexidade).
- 409: `{ success: false, message: "Username already taken" }`

### `POST /api/users/login` (Login de Usuário Regular)

Autentica um usuário regular. Username deve ser um email.
**Body:** `{ "username": "user@example.com", "password": "password123" }`
**Respostas:**
- 200: `{ success: true, message: "Login successful!", token: "jwt_access_token", user: { id, username, role } }`
- 401: `{ success: false, message: "Invalid credentials." }`
- 429: Rate limit ou conta bloqueada por tentativas falhas.

### `POST /api/auth/change-password` (Alterar Senha de Administrador)

Altera a senha do administrador autenticado. Username (email) no body deve corresponder ao usuário autenticado.
**Auth:** JWT (Admin) + CSRF
**Body:** `{ "username": "admin@example.com", "currentPassword": "oldPassword1!", "newPassword": "NewSecurePassword1!" }`
**Respostas:**
- 200: `{ success: true, message: "Senha alterada com sucesso" }`
- 400/401/403: Erro de validação, autenticação ou autorização.

### `PUT /api/users/password` (Alterar Senha de Usuário Regular)

Altera a senha do usuário regular autenticado.
**Auth:** JWT (Usuário Regular) + CSRF
**Body:** `{ "currentPassword": "oldPassword1!", "newPassword": "NewSecurePassword1!" }`
**Respostas:**
- 200: `{ success: true, message: "Senha alterada com sucesso." }`
- 400: Senha atual incorreta ou nova senha inválida.
- 401: Não autenticado.

### `GET /api/auth/me` (Dados do Usuário Autenticado)

Retorna dados do usuário (admin ou regular) autenticado.
**Auth:** JWT
**Respostas:**
- 200: `{ success: true, user: { id, username, role } }` (Pode incluir `name` se disponível no token)
- 401: Não autenticado.

### `POST /api/auth/logout` (Logout)

Revoga o token JWT do usuário autenticado (admin ou regular). Invalida o refresh token associado no backend (se aplicável).
**Auth:** JWT
**Respostas:**
- 200: `{ success: true, message: "Logout realizado com sucesso." }`

### `POST /api/auth/refresh-token` (Atualizar Token de Acesso)

Obtém um novo token de acesso (JWT) usando um refresh token válido.
**Body:** `{ "refreshToken": "valid_refresh_token_string" }`
**Respostas:**
- 200: `{ success: true, token: "new_jwt_access_token", refreshToken: "new_refresh_token", expiresIn: 86400, message: "Token atualizado com sucesso." }`
- 400: Refresh token não fornecido.
- 401: Refresh token inválido, expirado ou não associado a um usuário.

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
**Body:** `{ "name": "Nome do Torneio", "date": "YYYY-MM-DD", "description": "Descrição...", "numPlayersExpected": 32, "bracket_type": "single-elimination", "entry_fee": 10.00, "prize_pool": "R$ 1000", "rules": "Regras..." }`
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
**Body:** `{ "players": [{ "PlayerName": "Nome Jogador", "Nickname": "Nick" }, ...] }`

### `POST /api/tournaments/:tournamentId/assign_player` (Atribuir Jogador Global)

Atribui um jogador global existente a um torneio específico (admin).
**Auth:** JWT + CSRF
**Body:** `{ "playerId": 123 }`
**Respostas:**
- 200: `{ success: true, message: "Jogador atribuído com sucesso!", player: { ...dados do jogador atualizados... } }`
- 404: Jogador ou torneio não encontrado.
- 409: Conflito (ex: jogador já em outro torneio, ou já neste).

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
**Body:** `{ "score1": 0, "score2": 0, "winnerId": 123 (ID do jogador vencedor, opcional se placares diferem) }`
**Respostas:**
- 200: `{ success: true, message: "Placar atualizado e chaveamento avançado.", match: { ...dados da partida atualizada... }, nextMatch: { ...dados da próxima partida se houver... } }`
- 400: Dados inválidos.
- 404: Torneio ou partida não encontrada.

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
**Query:** `page`, `limit`, `sortBy` (ex: `name`, `created_at`), `order` (`asc`, `desc`), `filters[columnName]=value` (ex: `filters[name]=John&filters[status]=active`). Para buscar jogadores não atribuídos a nenhum torneio, use `filters[tournament_id]=null` (a string "null" ou o valor nulo dependendo da implementação do parsing no backend).
**Respostas:**

- 200: `{ success: true, players: [{ id, name, nickname, gender, skill_level, email, tournament_id, games_played, wins, losses, is_deleted, deleted_at }], totalPages, currentPage, totalPlayers }`
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

### `GET /api/admin/users` (Listar Usuários Administradores)

Lista todos os usuários com perfil de administrador.
**Auth:** JWT
**Respostas:**
- 200: `{ success: true, users: [{ id, username, role, last_login, created_at }] }`
- 401/403: Não autenticado/autorizado

### `POST /api/admin/users` (Criar Usuário Administrador)

Cria um novo usuário administrador.
**Auth:** JWT + CSRF
**Body:** `{ "username": "newadmin@example.com", "password": "SecurePassword1!", "role": "admin" (opcional, default 'admin') }`
**Respostas:**
- 201: `{ success: true, message: "Administrador criado com sucesso.", user: { id, username, role } }`
- 400: Dados inválidos.
- 409: Nome de usuário já existe.
- 401/403: Não autenticado/autorizado

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
  "name": "string (NOT NULL)",
  "nickname": "string (NULLABLE)",
  "gender": "string (NULLABLE, 'Masculino', 'Feminino', 'Outro')",
  "skill_level": "string (NULLABLE, 'Iniciante', 'Intermediário', 'Avançado', 'Profissional')",
  "email": "string (NULLABLE, UNIQUE globalmente)",
  "tournament_id": "string (NULLABLE, FK para tournaments.id)",
  "games_played": "integer (DEFAULT 0)",
  "wins": "integer (DEFAULT 0)",
  "losses": "integer (DEFAULT 0)",
  "score": "integer (DEFAULT 0)",
  "is_deleted": "integer (DEFAULT 0, booleano 0 ou 1)",
  "deleted_at": "string ISO8601 (NULLABLE)",
  "updated_at": "string ISO8601 (DEFAULT CURRENT_TIMESTAMP)"
  // UNIQUE (tournament_id, name) constraint
}
```

### Tournament (Torneio)
```json
{
  "id": "string (TEXT PRIMARY KEY)",
  "name": "string (NOT NULL)",
  "date": "string ISO8601 (NULLABLE)",
  "status": "string (DEFAULT 'Pendente', ex: 'Pendente', 'Em Andamento', 'Concluído', 'Cancelado')",
  "description": "string (NULLABLE)",
  "num_players_expected": "integer (NULLABLE)",
  "bracket_type": "string (NULLABLE, ex: 'single-elimination', 'double-elimination')",
  "entry_fee": "number (REAL, NULLABLE)",
  "prize_pool": "string (TEXT, NULLABLE)",
  "rules": "string (TEXT, NULLABLE)",
  "state_json": "string (TEXT, JSON contendo o estado do chaveamento, NULLABLE)",
  "is_deleted": "integer (DEFAULT 0, booleano 0 ou 1)",
  "created_at": "string ISO8601 (DEFAULT CURRENT_TIMESTAMP)",
  "updated_at": "string ISO8601 (DEFAULT CURRENT_TIMESTAMP)",
  "deleted_at": "string ISO8601 (NULLABLE)"
}
```

### Score (Placar)
```json
{
  "id": "integer (PRIMARY KEY AUTOINCREMENT)",
  "match_id": "integer (NOT NULL, FK para matches.id)",
  "round": "string (NULLABLE)",
  "player1_score": "integer (NULLABLE)",
  "player2_score": "integer (NULLABLE)",
  "winner_id": "integer (NULLABLE, FK para players.id)",
  "timestamp": "string (NULLABLE, obsoleto, preferir completed_at)",
  "completed_at": "string ISO8601 (DEFAULT CURRENT_TIMESTAMP)",
  "is_deleted": "integer (DEFAULT 0, booleano 0 ou 1)",
  "deleted_at": "string ISO8601 (NULLABLE)"
}
```

### User (Usuário - Admin ou Regular)
```json
{
  "id": "integer (PRIMARY KEY AUTOINCREMENT)",
  "username": "string (TEXT UNIQUE NOT NULL, formato email)",
  "hashedPassword": "string (TEXT NOT NULL)",
  "role": "string (TEXT DEFAULT 'user', ex: 'user', 'admin')",
  "last_login": "string ISO8601 (NULLABLE)",
  "created_at": "string ISO8601 (DEFAULT CURRENT_TIMESTAMP)",
  "updated_at": "string ISO8601 (DEFAULT CURRENT_TIMESTAMP, atualizado em mudança de senha)"
}
```

---

**Atualizado em:** 22 de maio de 2025.
**Versão da API:** 2.2.0
