# Referência da API LASCMMG

[⬅ Voltar ao README Principal](README.md)

Este documento fornece uma referência para os endpoints da API do sistema LASCMMG.

## Convenções

- **URL Base:** A URL base para todos os endpoints da API é `/api`.
- **Autenticação:** Endpoints que requerem autenticação esperam um Token JWT no header `Authorization: Bearer <token>`.
- **Proteção CSRF:** Métodos que modificam o estado (POST, PUT, PATCH, DELETE) requerem um token CSRF no header `X-CSRF-Token`. Este token é geralmente fornecido em um cookie `csrfToken` após o login ou em uma chamada GET anterior.
- **Formato de Resposta:**
  - Sucesso: `Content-Type: application/json`, corpo com `{ success: true, ...dados }`
  - Erro: `Content-Type: application/json`, corpo com `{ success: false, message: "Descrição do erro", details?: [...] }` (para erros de validação).
- **Códigos de Status HTTP Comuns:**
  - `200 OK`: Requisição bem-sucedida.
  - `201 Created`: Recurso criado com sucesso.
  - `204 No Content`: Requisição bem-sucedida, sem corpo de resposta (ex: DELETE).
  - `400 Bad Request`: Erro de validação ou requisição malformada.
  - `401 Unauthorized`: Autenticação necessária ou falhou.
  - `403 Forbidden`: Acesso negado (permissões insuficientes).
  - `404 Not Found`: Recurso não encontrado.
  - `409 Conflict`: Conflito com o estado atual do recurso (ex: item duplicado).
  - `500 Internal Server Error`: Erro inesperado no servidor.

---

## Torneios (`/api/tournaments`)

### `GET /api/tournaments`

Lista todos os torneios públicos. Suporta paginação e ordenação.

- **Método:** `GET`
- **Autenticação:** Nenhuma (Público)
- **Parâmetros de Query:**
  - `page` (opcional, número): Número da página (padrão: 1).
  - `limit` (opcional, número): Número de itens por página (padrão: 10).
  - `orderBy` (opcional, string): Campo para ordenação (padrão: `date`). Campos permitidos: `id`, `name`, `date`, `status`, `created_at`, `updated_at`.
  - `order` (opcional, string): Direção da ordenação (`ASC` ou `DESC`, padrão: `DESC`).
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "tournaments": [
      {
        "id": "timestamp-nome-do-torneio",
        "name": "Nome do Torneio Exemplo",
        "date": "2025-12-31T00:00:00.000Z",
        "status": "Pendente",
        "description": "Descrição do torneio.",
        "num_players_expected": 32,
        "bracket_type": "single-elimination",
        "entry_fee": 10.50,
        "prize_pool": "Troféus e medalhas",
        "rules": "Regras oficiais da liga.",
        "created_at": "2025-05-19T02:00:00.000Z",
        "updated_at": "2025-05-19T02:00:00.000Z",
        "is_deleted": 0,
        "deleted_at": null
        // state_json é omitido nesta listagem
      }
      // ... mais torneios
    ],
    "totalPages": 5,
    "currentPage": 1,
    "totalTournaments": 50
  }
  ```
- **Resposta de Erro (500 Internal Server Error):**
  ```json
  {
    "success": false,
    "message": "Erro ao carregar lista de torneios."
  }
  ```

### `POST /api/tournaments/create`

Cria um novo torneio.

- **Método:** `POST`
- **Autenticação:** Requerida (Admin)
- **Proteção CSRF:** Requerida
- **Corpo da Requisição (JSON):**
  ```json
  {
    "name": "Novo Torneio de Primavera",
    "date": "2025-09-15", // Formato YYYY-MM-DD
    "description": "Torneio anual de primavera.",
    "numPlayersExpected": 64, // Opcional, padrão 32
    "bracket_type": "double-elimination", // Opcional, padrão 'single-elimination'
    "entry_fee": 20.00, // Opcional
    "prize_pool": "R$ 1000 + Troféu", // Opcional
    "rules": "Regras da LASCMMG." // Opcional
    // playersFile: (opcional, arquivo JSON via multipart/form-data, não parte deste corpo JSON)
  }
  ```
  - **Validação (Joi):** `createTournamentSchema`
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "message": "Torneio criado com sucesso!",
    "tournamentId": "timestamp-novo-torneio-de-primavera",
    "tournament": {
      "id": "timestamp-novo-torneio-de-primavera",
      "name": "Novo Torneio de Primavera",
      "date": "2025-09-15T00:00:00.000Z",
      "status": "Pendente",
      // ...outros campos, incluindo state_json inicial
    }
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request`: Erro de validação (detalhes no corpo da resposta).
  - `401 Unauthorized`: Não autenticado.
  - `403 Forbidden`: Não é admin ou token CSRF inválido.
  - `500 Internal Server Error`: Erro ao criar no banco de dados.

---
*(Mais endpoints serão documentados aqui)*
