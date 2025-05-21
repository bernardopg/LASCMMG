/* eslint-env browser */
import axios from 'axios';

// Cria uma instância do axios com configurações padrão
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

let currentCsrfToken = null;
let csrfTokenPromise = null;

// Function to ensure CSRF token is fetched and stored
// This will be called by the interceptor if the token is needed and not yet available.
const ensureCsrfTokenInternal = () => {
  if (currentCsrfToken) return Promise.resolve(currentCsrfToken);
  if (csrfTokenPromise) return csrfTokenPromise; // A fetch is already in progress

  console.log('Attempting to fetch CSRF token...');
  csrfTokenPromise = api
    .get('/api/csrf-token')
    .then((response) => {
      if (response.data && response.data.csrfToken) {
        currentCsrfToken = response.data.csrfToken;
        console.log('CSRF token fetched and stored by interceptor logic.');
        // csrfTokenPromise = null; // Clear the promise once resolved - actually, let's clear it outside
        return currentCsrfToken;
      }
      console.warn(
        'CSRF token not found in response from /api/csrf-token (interceptor fetch).'
      );
      // Do not throw error here, let the original request proceed without token if fetch fails
      // The backend will then reject it if CSRF is mandatory.
      return null;
    })
    .catch((err) => {
      console.error('Error fetching CSRF token in interceptor logic:', err);
      // Do not throw error here either.
      return null;
    })
    .finally(() => {
      csrfTokenPromise = null; // Always clear the promise after it settles
    });
  return csrfTokenPromise;
};

// Adiciona um interceptor de requisição para incluir o token CSRF
api.interceptors.request.use(
  async (config) => {
    // Make interceptor async
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (protectedMethods.includes(config.method.toUpperCase())) {
      if (!currentCsrfToken) {
        // If token is not available, try to fetch it.
        // This ensures that the first protected request triggers the fetch.
        await ensureCsrfTokenInternal();
      }

      if (currentCsrfToken) {
        config.headers['X-CSRF-Token'] = currentCsrfToken;
      } else {
        console.warn(
          'CSRF token still not available after attempting fetch. Request might fail.'
        );
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Adiciona um interceptor para tratar erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Trata erros comuns de API
    if (error.response) {
      // Erro do servidor com resposta (400-500)
      console.error('Erro na API:', error.response.data);

      // Se for erro de autenticação (401), redirecionar para login
      if (error.response.status === 401) {
        // Limpar local storage
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');

        // Redirecionar para login (se não estiver já na página de login)
        if (window.location.pathname !== '/login') {
          // Disparar um evento customizado para que o App possa lidar com a navegação
          const event = new CustomEvent('unauthorized');
          window.dispatchEvent(event);
          // window.location.href = '/login'; // Removido hard refresh
        }
      }
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta (problemas de rede)
      console.error('Erro de rede:', error.request);
    } else {
      // Erro na configuração da requisição
      console.error('Erro na requisição:', error.message);
    }

    return Promise.reject(error);
  }
);

// Função para definir o token de autenticação
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Função para verificar se o token está presente
export const initializeAuth = () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    setAuthToken(token);
  }
};

// Inicializar token se existir no localStorage
initializeAuth();

// Funções específicas da API

// Torneios
export const getTournaments = async (params = {}) => {
  // Accept params object
  const response = await api.get('/api/tournaments', { params }); // Pass params to API call
  return response.data;
};

export const getTournamentDetails = async (tournamentId) => {
  const response = await api.get(`/api/tournaments/${tournamentId}`); // Ajuste o endpoint
  return response.data;
};

export const getTournamentState = async (tournamentId) => {
  const response = await api.get(`/api/tournaments/${tournamentId}/state`);
  return response.data; // This should be the direct state object
};

// Jogadores
export const getPlayers = async (tournamentId) => {
  // Se tournamentId for fornecido, filtre por torneio, senão, todos os jogadores
  const url = tournamentId
    ? `/api/tournaments/${tournamentId}/players`
    : '/api/players';
  const response = await api.get(url); // Ajuste o endpoint
  return response.data;
};

export const getPlayerDetails = async (playerId) => {
  const response = await api.get(`/api/players/${playerId}`);
  return response.data; // Expects { success: true, player: {...} }
};

// Placares
export const getScores = async (tournamentId) => {
  const response = await api.get(`/api/tournaments/${tournamentId}/scores`); // Ajuste o endpoint
  return response.data;
};

export const saveScore = async (scoreData) => {
  const response = await api.post('/api/scores', scoreData); // Ajuste o endpoint
  return response.data;
};

// Autenticação (exemplo, pode já existir no AuthContext)
export const loginUser = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/me'); // Corrigido endpoint
  return response.data;
};

// Estatísticas
export const getTournamentStats = async (tournamentId) => {
  const response = await api.get(`/api/tournaments/${tournamentId}/stats`); // Ajuste o endpoint
  return response.data;
};

export const getPlayerStats = async (tournamentId, playerName) => {
  // playerName might need to be URL encoded if it can contain special characters
  const encodedPlayerName = encodeURIComponent(playerName);
  const response = await api.get(
    `/api/tournaments/${tournamentId}/players/${encodedPlayerName}/stats`
  ); // Ajuste o endpoint
  return response.data;
};

// Admin - Jogadores
export const getAdminPlayers = async ({
  page = 1,
  limit = 10,
  sortBy = 'name',
  order = 'asc',
  filters = {},
} = {}) => {
  const response = await api.get('/api/admin/players', {
    params: { page, limit, sortBy, order, ...filters },
  });
  return response.data; // Espera-se { players: [], totalPages: X, currentPage: Y }
};

export const createPlayerAdmin = async (playerData) => {
  const response = await api.post('/api/admin/players', playerData);
  return response.data;
};

export const updatePlayerAdmin = async (playerId, playerData) => {
  const response = await api.put(`/api/admin/players/${playerId}`, playerData);
  return response.data;
};

export const deletePlayerAdmin = async (playerId, permanent = false) => {
  // Soft delete by default
  const response = await api.delete(`/api/admin/players/${playerId}`, {
    params: { permanent },
  });
  return response.data;
};

// Admin - Placares (similar structure)
export const getAdminScores = async ({
  page = 1,
  limit = 10,
  sortBy = 'timestamp',
  order = 'desc',
  filters = {},
} = {}) => {
  const response = await api.get('/api/admin/scores', {
    params: { page, limit, sortBy, order, ...filters },
  });
  return response.data;
};

export const updateScoreAdmin = async (scoreId, scoreData) => {
  const response = await api.put(`/api/admin/scores/${scoreId}`, scoreData);
  return response.data;
};

export const deleteScoreAdmin = async (scoreId, permanent = false) => {
  const response = await api.delete(`/api/admin/scores/${scoreId}`, {
    params: { permanent },
  });
  return response.data;
};

// Admin - Lixeira
export const getTrashItems = async ({
  page = 1,
  limit = 10,
  type = null,
} = {}) => {
  const response = await api.get('/api/admin/trash', {
    params: { page, limit, type },
  });
  return response.data;
};

export const restoreTrashItem = async (itemId, itemType) => {
  const response = await api.post(`/api/admin/trash/restore`, {
    itemId,
    itemType,
  });
  return response.data;
};

export const permanentlyDeleteDBItem = async (itemId, itemType) => {
  // Updated to use path parameters as per backend route change
  const response = await api.delete(
    `/api/admin/trash/item/${itemType}/${itemId}`
  );
  return response.data;
};

/**
 * Admin - Torneios
 */
export const createTournamentAdmin = async (tournamentData) => {
  // Adicionada função que estava faltando
  const response = await api.post('/api/tournaments/create', tournamentData); // Endpoint de criação de torneio
  return response.data;
};

// Placeholder for a more comprehensive update.
// Ideally, backend would have a PUT /api/admin/tournaments/:id or similar.
// For now, this might make multiple PATCH calls or just update a few key fields.
export const updateTournamentAdmin = async (tournamentId, tournamentData) => {
  // Example: just updating name and description for now via existing PATCH routes
  // A real implementation would iterate through tournamentData and call relevant PATCH endpoints
  // or use a dedicated PUT endpoint.
  if (tournamentData.name !== undefined) {
    await api.patch(`/api/tournaments/${tournamentId}/name`, { name: tournamentData.name });
  }
  if (tournamentData.description !== undefined) {
    await api.patch(`/api/tournaments/${tournamentId}/description`, { description: tournamentData.description });
  }
  if (tournamentData.date !== undefined) {
     // Assuming backend PATCH for date exists or is part of a general update
     // For now, this is a conceptual update.
    await api.patch(`/api/tournaments/${tournamentId}/date`, { date: tournamentData.date });
  }
  // ... other fields like status, entry_fee, prize_pool, rules, bracket_type, num_players_expected
  // This is simplified. A robust solution needs careful handling of all fields.
  // For status:
  if (tournamentData.status !== undefined) {
    await api.patch(`/api/tournaments/${tournamentId}/status`, { status: tournamentData.status });
  }

  // After all updates, fetch the updated tournament details to return
  const response = await api.get(`/api/tournaments/${tournamentId}`);
  return response.data;
};

export const updateMatchScoreAdmin = async (tournamentId, matchId, scoreData) => {
  // scoreData should be { player1Score, player2Score, winnerId }
  const response = await api.patch(`/api/tournaments/${tournamentId}/matches/${matchId}/winner`, scoreData);
  return response.data;
};

export const generateTournamentBracket = async (tournamentId) => {
  const response = await api.post(`/api/tournaments/${tournamentId}/generate-bracket`);
  return response.data;
};

export const deleteTournamentAdmin = async (tournamentId, permanent = true) => {
  // Added permanent flag, defaulting to true for admin delete
  // For permanent deletion, the backend route was changed to /api/admin/trash/item/:itemType/:itemId
  if (permanent) {
    const response = await api.delete(`/api/admin/trash/item/tournament/${tournamentId}`);
    return response.data;
  } else {
    // For soft delete, typically PATCH status to 'Cancelado'
    // This is handled in TournamentContext or could be a separate admin soft-delete function
    // OR, if the backend supports soft delete via DELETE with a query param on the tournament itself:
    // For now, assuming soft delete is handled by changing status or a specific soft-delete endpoint.
    // The current deleteTournamentAdmin in admin.js handles soft delete if permanent=false is passed to /api/admin/tournaments/:id
    // However, the admin.js route for DELETE /api/admin/tournaments/:id is not defined.
    // Let's assume soft delete is done by updating status for now, or this needs a backend adjustment.
    // The deleteTournamentAdmin in this api.js file was calling /api/admin/trash/item for permanent,
    // and /api/tournaments/:id/status for soft. This seems inconsistent with a dedicated admin delete.
    // For now, I will keep the logic as it was, but this area needs review for consistency.
    // The backend /api/admin/tournaments/:id (DELETE) is not defined.
    // The backend /api/admin/trash/item (DELETE) is for permanent deletion from trash.
    // The backend /api/tournaments/:id/status (PATCH) is for status update.

    // Correct approach for soft-delete via status update:
    const response = await api.patch(
      `/api/tournaments/${tournamentId}/status`,
      { status: 'Cancelado' } // Or 'Arquivado' or a specific soft-deleted status
    );
    return response.data;
  }
};

// Admin - Segurança
export const getSecurityOverviewStats = async () => {
  const response = await api.get('/api/system/security/overview-stats'); // Endpoint based on old handler, might need adjustment
  return response.data;
};

export const getHoneypotConfig = async () => {
  const response = await api.get('/api/system/security/honeypot-config');
  return response.data;
};

export const updateHoneypotConfig = async (configData) => {
  const response = await api.post(
    '/api/system/security/honeypot-config',
    configData
  );
  return response.data;
};

export const getBlockedIps = async ({ page = 1, limit = 10 } = {}) => {
  const response = await api.get('/api/system/security/blocked-ips', {
    params: { page, limit },
  });
  return response.data;
};

export const blockIpManually = async (ipData) => {
  const response = await api.post('/api/system/security/blocked-ips', ipData);
  return response.data;
};

export const unblockIp = async (ipAddress) => {
  const response = await api.delete(
    `/api/system/security/blocked-ips/${encodeURIComponent(ipAddress)}`
  );
  return response.data;
};

// Potentially more for threat analytics if it has its own data endpoints

// Admin - User Management
export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/api/admin/users', { params });
  return response.data; // Expects { users: [], ...pagination }
};

export const createAdminUser = async (userData) => {
  const response = await api.post('/api/admin/users', userData);
  return response.data;
};

export default api;
