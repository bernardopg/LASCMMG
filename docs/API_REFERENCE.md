# Referência Completa da API LASCMMG

[⬅ Voltar ao README Principal](README.md)

> **Esta documentação reflete fielmente o backend real, cobre todos os endpoints REST, requisitos de autenticação, CSRF, exemplos de request/response, status HTTP e observações de segurança.**

---

## Convenções Gerais

- **URL Base:** `/api`
- **Autenticação:** JWT via `Authorization: Bearer <token>`
- **Proteção CSRF:** Métodos mutáveis (POST, PUT, PATCH, DELETE) requerem header `X-CSRF-Token` (token fornecido via cookie após login ou endpoint dedicado).
- **Formato de Resposta:**
  - Sucesso: `{ success: true, ...dados }`
  - Erro: `{ success: false, message: "...", details?: [...] }`
- **Status HTTP:** 200, 201, 204, 400, 401, 403, 404, 409, 500
- **Content-Type:** Sempre `application/json` (exceto upload de arquivos)

---

## Sumário de Endpoints

- [Autenticação & Usuário](#autenticação--usuário)
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
**Body:** `{ "username": "admin", "password": "senha" }`
**Respostas:**
- 200: `{ success: true, token, admin: { username, role } }`
- 401: `{ success: false, message: "Credenciais inválidas." }`
- 429: Rate limit

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

## Torneios

### `GET /api/tournaments`
Lista torneios públicos.
**Query:** `page`, `limit`, `orderBy`, `order`
**Respostas:**
- 200: `{ success: true, tournaments: [...], totalPages, currentPage, totalTournaments }`

### `POST /api/tournaments/create`
Cria torneio (admin).
**Auth:** JWT + CSRF
**Body:** `{ name, date, ... }`
**Upload:** `playersFile` (opcional, multipart/form-data)
**Respostas:**
- 201: `{ success: true, tournamentId, tournament }`
- 400/401/403/500

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

### `GET /api/players/:playerId`
Detalhes de jogador global.

---

## Placares

### `POST /api/scores`
Cria placar para partida (autenticado).
**Auth:** JWT + CSRF
**Body:** `{ tournamentId, matchId, player1Score, player2Score, winnerId, stateMatchKey }`

---

## Administração & Lixeira

### `GET /api/admin/players`
CRUD de jogadores (admin).
**Auth:** JWT
**GET/POST/PUT/DELETE**
- `/api/admin/players`
- `/api/admin/players/:playerId`

### `GET /api/admin/scores`
CRUD de placares (admin).
**Auth:** JWT
**GET/PUT/DELETE**
- `/api/admin/scores`
- `/api/admin/scores/:scoreId`

### `GET /api/admin/trash`
Itens na lixeira (admin).
**Auth:** JWT
**Query:** `type` (`player`, `score`, `tournament`)

### `POST /api/admin/trash/restore`
Restaura item da lixeira (admin).
**Auth:** JWT
**Body:** `{ itemId, itemType }`

### `DELETE /api/admin/trash/item`
Exclui item permanentemente (admin).
**Auth:** JWT
**Body:** `{ itemId, itemType }`

---

## Estatísticas & Sistema

### `GET /api/system/stats`
Estatísticas gerais do sistema (admin).
**Auth:** JWT

### `GET /api/system/health`
Health check do sistema.

---

## Segurança & Honeypot

### `GET /api/system/security/overview-stats`
Estatísticas de segurança/honeypot (admin).
**Auth:** JWT

### `GET /api/system/security/honeypot-config`
Configuração do honeypot (admin).
**Auth:** JWT

### `POST /api/system/security/honeypot-config`
Atualiza configuração do honeypot (admin).
**Auth:** JWT + CSRF

### `GET /api/system/security/blocked-ips`
Lista IPs bloqueados (admin).
**Auth:** JWT

### `POST /api/system/security/blocked-ips`
Bloqueia IP manualmente (admin).
**Auth:** JWT + CSRF

### `DELETE /api/system/security/blocked-ips/:ipAddress`
Desbloqueia IP (admin).
**Auth:** JWT + CSRF

---

## Health Check

### `GET /api/system/health`
Retorna status do sistema, banco, disco, memória, versão.

---

## Observações de Segurança

- Todos os endpoints mutáveis exigem CSRF token e JWT.
- Rate limiting ativo em endpoints sensíveis.
- Todas as respostas de erro são padronizadas.
- Senhas nunca são retornadas.
- Logs de segurança e auditoria são mantidos.

---

**Consulte os exemplos de request/response e detalhes de cada endpoint acima. Para detalhes de schemas, veja o código-fonte ou os arquivos de validação Joi.**
