/* eslint-env browser */
import axios from 'axios';

// Cria uma instância do axios com configurações padrão
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Função para ler cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// Adiciona um interceptor de requisição para incluir o token CSRF
api.interceptors.request.use(
  (config) => {
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (protectedMethods.includes(config.method.toUpperCase())) {
      const csrfToken = getCookie('csrfToken'); // Nome do cookie definido no backend
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      } else {
        console.warn(
          'CSRF token não encontrado no cookie. A requisição pode falhar.'
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
          window.location.href = '/login';
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
export const getTournaments = async () => {
  const response = await api.get('/api/tournaments'); // Ajuste o endpoint conforme necessário
  return response.data;
};

export const getTournamentDetails = async (tournamentId) => {
  const response = await api.get(`/api/tournaments/${tournamentId}`); // Ajuste o endpoint
  return response.data;
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
  const response = await api.post('/api/auth/login', credentials); // Ajuste o endpoint
  return response.data; // Espera-se que retorne { token, user }
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me'); // Ajuste o endpoint
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
  // Renamed to avoid conflict
  const response = await api.delete(`/api/admin/trash/item`, {
    data: { itemId, itemType },
  }); // Ensure backend handles DELETE with body or use params
  return response.data;
};

/**
 * Admin - Torneios
 */
export const deleteTournamentAdmin = async (tournamentId) => {
  const response = await api.delete(`/api/admin/tournaments/${tournamentId}`);
  return response.data;
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

export default api;
