import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:3000/api';

// Mock data
const mockUsers = [
  { id: 1, username: 'admin@lascmmg.com', role: 'admin', created_at: '2025-01-01T00:00:00Z' },
  { id: 2, username: 'user@test.com', role: 'user', created_at: '2025-01-01T00:00:00Z' },
];

const mockPlayers = [
  {
    id: 1,
    name: 'João Silva',
    nickname: 'JoãoGamer',
    email: 'joao@test.com',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Maria Santos',
    nickname: 'MariaPro',
    email: 'maria@test.com',
    created_at: '2025-01-01T00:00:00Z',
  },
];

const mockTournaments = [
  {
    id: 1,
    name: 'Torneio Teste',
    description: 'Torneio para testes',
    status: 'Ativo',
    entry_fee: 50.0,
    prize_pool: 500.0,
    created_at: '2025-01-01T00:00:00Z',
  },
];

const mockScores = [
  {
    id: 1,
    player1_name: 'João Silva',
    player2_name: 'Maria Santos',
    player1_score: 2,
    player2_score: 1,
    winner_name: 'João Silva',
    round: 'Quartas de Final',
    completed_at: '2025-01-01T12:00:00Z',
  },
];

const mockTrashItems = [
  {
    id: 1,
    type: 'player',
    name: 'Jogador Deletado',
    deleted_at: '2025-01-01T10:00:00Z',
  },
];

let csrfToken = 'mock-csrf-token';

export const handlers = [
  // CSRF Token
  http.get(`${API_BASE_URL}/csrf-token`, () => {
    return HttpResponse.json({ csrfToken });
  }),

  // Authentication
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();
    if (body.username === 'admin@lascmmg.com' && body.password === 'admin123') {
      return HttpResponse.json({
        success: true,
        token: 'mock-jwt-token',
        admin: mockUsers[0],
        expiresIn: 3600,
      });
    }
    return HttpResponse.json({ success: false, message: 'Credenciais inválidas' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/users/login`, async ({ request }) => {
    const body = await request.json();
    if (body.username === 'user@test.com' && body.password === 'user123') {
      return HttpResponse.json({
        success: true,
        token: 'mock-user-jwt-token',
        user: mockUsers[1],
        expiresIn: 3600,
      });
    }
    return HttpResponse.json({ success: false, message: 'Credenciais inválidas' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/logout`, () => {
    return HttpResponse.json({ success: true, message: 'Logout realizado com sucesso' });
  }),

  // Players
  http.get(`${API_BASE_URL}/admin/players`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';

    let filteredPlayers = mockPlayers;
    if (search) {
      filteredPlayers = mockPlayers.filter(
        (player) =>
          player.name.toLowerCase().includes(search.toLowerCase()) ||
          player.nickname.toLowerCase().includes(search.toLowerCase())
      );
    }

    return HttpResponse.json({
      success: true,
      players: filteredPlayers,
      currentPage: page,
      totalPages: Math.ceil(filteredPlayers.length / limit),
      total: filteredPlayers.length,
    });
  }),

  http.post(`${API_BASE_URL}/admin/players`, async ({ request }) => {
    const body = await request.json();
    const newPlayer = {
      id: mockPlayers.length + 1,
      ...body,
      created_at: new Date().toISOString(),
    };
    mockPlayers.push(newPlayer);
    return HttpResponse.json({ success: true, player: newPlayer });
  }),

  http.put(`${API_BASE_URL}/admin/players/:id`, async ({ params, request }) => {
    const body = await request.json();
    const playerId = parseInt(params.id);
    const playerIndex = mockPlayers.findIndex((p) => p.id === playerId);

    if (playerIndex === -1) {
      return HttpResponse.json(
        { success: false, message: 'Jogador não encontrado' },
        { status: 404 }
      );
    }

    mockPlayers[playerIndex] = { ...mockPlayers[playerIndex], ...body };
    return HttpResponse.json({ success: true, player: mockPlayers[playerIndex] });
  }),

  http.delete(`${API_BASE_URL}/admin/players/:id`, ({ params }) => {
    const playerId = parseInt(params.id);
    const playerIndex = mockPlayers.findIndex((p) => p.id === playerId);

    if (playerIndex === -1) {
      return HttpResponse.json(
        { success: false, message: 'Jogador não encontrado' },
        { status: 404 }
      );
    }

    const deletedPlayer = mockPlayers.splice(playerIndex, 1)[0];
    mockTrashItems.push({
      ...deletedPlayer,
      type: 'player',
      deleted_at: new Date().toISOString(),
    });

    return HttpResponse.json({ success: true, message: 'Jogador movido para lixeira' });
  }),

  // Scores
  http.get(`${API_BASE_URL}/admin/scores`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      success: true,
      scores: mockScores,
      currentPage: page,
      totalPages: Math.ceil(mockScores.length / limit),
      total: mockScores.length,
    });
  }),

  http.post(`${API_BASE_URL}/admin/scores`, async ({ request }) => {
    const body = await request.json();
    const newScore = {
      id: mockScores.length + 1,
      ...body,
      completed_at: new Date().toISOString(),
    };
    mockScores.push(newScore);
    return HttpResponse.json({ success: true, score: newScore });
  }),

  http.put(`${API_BASE_URL}/admin/scores/:id`, async ({ params, request }) => {
    const body = await request.json();
    const scoreId = parseInt(params.id);
    const scoreIndex = mockScores.findIndex((s) => s.id === scoreId);

    if (scoreIndex === -1) {
      return HttpResponse.json(
        { success: false, message: 'Placar não encontrado' },
        { status: 404 }
      );
    }

    mockScores[scoreIndex] = { ...mockScores[scoreIndex], ...body };
    return HttpResponse.json({ success: true, score: mockScores[scoreIndex] });
  }),

  http.delete(`${API_BASE_URL}/admin/scores/:id`, ({ params }) => {
    const scoreId = parseInt(params.id);
    const scoreIndex = mockScores.findIndex((s) => s.id === scoreId);

    if (scoreIndex === -1) {
      return HttpResponse.json(
        { success: false, message: 'Placar não encontrado' },
        { status: 404 }
      );
    }

    const deletedScore = mockScores.splice(scoreIndex, 1)[0];
    mockTrashItems.push({
      ...deletedScore,
      type: 'score',
      deleted_at: new Date().toISOString(),
    });

    return HttpResponse.json({ success: true, message: 'Placar movido para lixeira' });
  }),

  // Tournaments
  http.get(`${API_BASE_URL}/tournaments`, () => {
    return HttpResponse.json({
      success: true,
      tournaments: mockTournaments,
    });
  }),

  http.get(`${API_BASE_URL}/tournaments/:id`, ({ params }) => {
    const tournamentId = parseInt(params.id);
    const tournament = mockTournaments.find((t) => t.id === tournamentId);

    if (!tournament) {
      return HttpResponse.json(
        { success: false, message: 'Torneio não encontrado' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, tournament });
  }),

  http.post(`${API_BASE_URL}/tournaments/create`, async ({ request }) => {
    const body = await request.json();
    const newTournament = {
      id: mockTournaments.length + 1,
      ...body,
      created_at: new Date().toISOString(),
    };
    mockTournaments.push(newTournament);
    return HttpResponse.json({ success: true, tournament: newTournament });
  }),

  // Trash Management
  http.get(`${API_BASE_URL}/admin/trash`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const itemType = url.searchParams.get('itemType');

    let filteredItems = mockTrashItems;
    if (itemType) {
      filteredItems = mockTrashItems.filter((item) => item.type === itemType);
    }

    return HttpResponse.json({
      success: true,
      trashItems: filteredItems,
      currentPage: page,
      totalPages: Math.ceil(filteredItems.length / limit),
      total: filteredItems.length,
    });
  }),

  http.post(`${API_BASE_URL}/admin/trash/:type/:id/restore`, ({ params }) => {
    const { type, id } = params;
    const itemId = parseInt(id);
    const itemIndex = mockTrashItems.findIndex((item) => item.id === itemId && item.type === type);

    if (itemIndex === -1) {
      return HttpResponse.json(
        { success: false, message: 'Item não encontrado na lixeira' },
        { status: 404 }
      );
    }

    const restoredItem = mockTrashItems.splice(itemIndex, 1)[0];

    // Restore to original array based on type
    switch (type) {
      case 'player':
        mockPlayers.push({ ...restoredItem, deleted_at: undefined });
        break;
      case 'score':
        mockScores.push({ ...restoredItem, deleted_at: undefined });
        break;
      case 'tournament':
        mockTournaments.push({ ...restoredItem, deleted_at: undefined });
        break;
    }

    return HttpResponse.json({ success: true, message: 'Item restaurado com sucesso' });
  }),

  http.delete(`${API_BASE_URL}/admin/trash/:type/:id`, ({ params }) => {
    const { type, id } = params;
    const itemId = parseInt(id);
    const itemIndex = mockTrashItems.findIndex((item) => item.id === itemId && item.type === type);

    if (itemIndex === -1) {
      return HttpResponse.json(
        { success: false, message: 'Item não encontrado na lixeira' },
        { status: 404 }
      );
    }

    mockTrashItems.splice(itemIndex, 1);
    return HttpResponse.json({ success: true, message: 'Item excluído permanentemente' });
  }),

  // Statistics
  http.get(`${API_BASE_URL}/admin/stats`, () => {
    return HttpResponse.json({
      success: true,
      stats: {
        totalPlayers: mockPlayers.length,
        totalTournaments: mockTournaments.length,
        totalScores: mockScores.length,
        trashItems: mockTrashItems.length,
      },
    });
  }),

  // Health Check
  http.get('/ping', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),

  // Error handlers for testing error scenarios
  http.get(`${API_BASE_URL}/test/server-error`, () => {
    return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
  }),

  http.get(`${API_BASE_URL}/test/unauthorized`, () => {
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }),

  http.get(`${API_BASE_URL}/test/forbidden`, () => {
    return HttpResponse.json({ message: 'CSRF token invalid' }, { status: 403 });
  }),
];
