/**
 * API Service Module - LASCMMG Application
 *
 * This module provides a centralized interface for all API interactions in the application.
 * It handles authentication, CSRF protection, error handling, and provides methods for
 * all API endpoints.
 *
 * @module api
 * @version 2.2.0
 * @lastUpdated 2025-05-21
 */

/* eslint-env browser */
import axios from 'axios';

/**
 * Constants
 */
const API_TIMEOUT = 20000; // 20 seconds
const AUTH_STORAGE_KEY = 'authToken';
const USER_STORAGE_KEY = 'authUser';
const CSRF_ERROR_RETRY_MAX = 3;
const NETWORK_RETRY_MAX = 2;
const NETWORK_RETRY_DELAY = 1000; // 1 second

/**
 * Request cancellation support
 */
const pendingRequests = new Map();

/**
 * Base axios instance with default configuration
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: API_TIMEOUT,
  withCredentials: true, // Enable cookies for CSRF protection
});

/**
 * CSRF Token Management
 */
let currentCsrfToken = null;
let csrfTokenPromise = null;
let csrfErrorRetryCount = 0;
let csrfTokenExpirationTime = null;
const CSRF_TOKEN_LIFETIME = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches a new CSRF token from the server
 * @returns {Promise<string|null>} The CSRF token or null if the fetch fails
 */
const ensureCsrfTokenInternal = async () => {
  // Check if we have a valid token that hasn't expired
  const now = Date.now();
  if (currentCsrfToken && csrfTokenExpirationTime && now < csrfTokenExpirationTime) {
    return currentCsrfToken;
  }

  // Return existing promise if one is in flight
  if (csrfTokenPromise) return csrfTokenPromise;

  console.info('Fetching new CSRF token...');

  // Generate a unique request ID for this CSRF fetch
  const requestId = `csrf-${Date.now()}`;

  const source = axios.CancelToken.source();
  pendingRequests.set(requestId, source);

  csrfTokenPromise = api.get('/api/csrf-token', {
    cancelToken: source.token
  })
    .then((response) => {
      if (response.data && response.data.csrfToken) {
        currentCsrfToken = response.data.csrfToken;
        csrfErrorRetryCount = 0; // Reset retry counter on success
        csrfTokenExpirationTime = Date.now() + CSRF_TOKEN_LIFETIME;
        console.info('CSRF token fetched successfully');
        return currentCsrfToken;
      }

      console.warn('CSRF token not found in response');
      return null;
    })
    .catch((err) => {
      if (axios.isCancel(err)) {
        console.info('CSRF token request was cancelled');
      } else {
        console.error('Error fetching CSRF token:', err);
      }
      return null;
    })
    .finally(() => {
      csrfTokenPromise = null;
      pendingRequests.delete(requestId);
    });

  return csrfTokenPromise;
};

/**
 * Forces refresh of the CSRF token, clearing the current one
 */
export const refreshCsrfToken = () => {
  currentCsrfToken = null;
  csrfTokenExpirationTime = null;
  return ensureCsrfTokenInternal();
};

/**
 * Cancels all pending requests
 * @param {string|null} [reason=null] - Optional cancellation reason
 */
export const cancelAllRequests = (reason = null) => {
  for (const [id, source] of pendingRequests.entries()) {
    source.cancel(reason || 'Operation canceled by user');
    pendingRequests.delete(id);
  }
  console.info('All pending requests cancelled:', reason || 'No reason provided');
};

/**
 * Delay helper for retry mechanisms
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Request Interceptor - Adds request ID, cancellation, and security headers
 */
api.interceptors.request.use(
  async (config) => {
    // Generate unique request ID
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    config.headers['X-Request-ID'] = requestId;

    // Setup cancellation token
    const source = axios.CancelToken.source();
    config.cancelToken = config.cancelToken || source.token;

    // Store cancellation source for later reference
    pendingRequests.set(requestId, source);

    // Add requestId to the config for later reference
    config._requestId = requestId;

    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    // Add CSRF token to mutating requests
    if (protectedMethods.includes(config.method.toUpperCase())) {
      if (!currentCsrfToken || (csrfTokenExpirationTime && Date.now() > csrfTokenExpirationTime)) {
        await ensureCsrfTokenInternal();
      }

      if (currentCsrfToken) {
        config.headers['X-CSRF-Token'] = currentCsrfToken;
      } else {
        console.warn('CSRF token unavailable. Request may fail if CSRF protection is required.');
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor - Handles common API errors with retry logic
 */
api.interceptors.response.use(
  (response) => {
    // Clean up the request from pendingRequests
    const requestId = response.config._requestId;
    if (requestId) {
      pendingRequests.delete(requestId);
    }
    return response;
  },
  async (error) => {
    // Clean up regardless of success/failure
    if (error.config && error.config._requestId) {
      pendingRequests.delete(error.config._requestId);
    }

    // Extract data for better error handling
    const { response, request, config } = error;

    // Skip interceptor for cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // CSRF error handling with auto retry
    if (response?.status === 403 &&
        response?.data?.message?.includes('CSRF') &&
        csrfErrorRetryCount < CSRF_ERROR_RETRY_MAX) {

      csrfErrorRetryCount++;
      console.warn(`CSRF token rejected. Refreshing token and retrying (${csrfErrorRetryCount}/${CSRF_ERROR_RETRY_MAX})`);

      // Force refresh the CSRF token
      currentCsrfToken = null;
      csrfTokenExpirationTime = null;
      await ensureCsrfTokenInternal();

      // Retry the original request
      if (currentCsrfToken && config) {
        config.headers['X-CSRF-Token'] = currentCsrfToken;
        return axios(config);
      }
    }

    // Network error handling with retries
    if (!response && error.message &&
        (error.message.includes('timeout') ||
         error.message.includes('Network Error')) &&
        config && config._retryCount < NETWORK_RETRY_MAX) {

      const retryCount = config._retryCount || 0;
      config._retryCount = retryCount + 1;

      console.warn(`Network error. Retrying request (${config._retryCount}/${NETWORK_RETRY_MAX})`);

      // Exponential backoff
      const delayTime = NETWORK_RETRY_DELAY * Math.pow(2, retryCount);
      await delay(delayTime);

      // Create a new request with the same config
      return axios(config);
    }

    // Authentication error handling
    if (response?.status === 401) {
      console.warn('Authentication error: User is not authenticated or token expired');

      // Clear auth data
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);

      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        // Dispatch event for app-level handling
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
    }
    // Server errors with response
    else if (response) {
      console.error('API error:', {
        status: response.status,
        url: request?.responseURL,
        data: response.data
      });
    }
    // Network errors
    else if (request) {
      console.error('Network error:', {
        url: request.responseURL || config?.url,
        method: config?.method,
        message: error.message
      });
    }
    // Request configuration errors
    else {
      console.error('Request configuration error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Authentication Management
 */

/**
 * Sets the authentication token for subsequent requests
 * @param {string|null} token - JWT token or null to clear
 */
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

/**
 * Initializes authentication from localStorage if available
 */
export const initializeAuth = () => {
  const token = localStorage.getItem(AUTH_STORAGE_KEY);
  if (token) {
    setAuthToken(token);
    return true;
  }
  return false;
};

// Initialize auth on module load
initializeAuth();

/**
 * API Request Methods
 * Organized by resource type
 */

/**
 * Authentication API Methods
 */
export const loginUser = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);

  // Store token if returned
  if (response.data.token) {
    setAuthToken(response.data.token);
  }

  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post('/api/logout');
  } catch (error) {
    // Continue with local logout even if server logout fails
    console.warn('Server logout failed, continuing with local logout');
  } finally {
    setAuthToken(null);
    // Cancel any pending requests to prevent state issues after logout
    cancelAllRequests('User logged out');
  }

  return { success: true, message: 'Logout realizado com sucesso.' };
};

export const changePassword = async (passwordData) => {
  const response = await api.post('/api/change-password', passwordData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/me');
  return response.data;
};

/**
 * Tournament API Methods
 */
export const getTournaments = async (params = {}) => {
  const response = await api.get('/api/tournaments', { params });
  return response.data;
};

export const getTournamentDetails = async (tournamentId) => {
  const response = await api.get(`/api/tournaments/${tournamentId}`);
  return response.data;
};

export const getTournamentState = async (tournamentId) => {
  const response = await api.get(`/api/tournaments/${tournamentId}/state`);
  return response.data;
};

export const createTournamentAdmin = async (tournamentData) => {
  const response = await api.post('/api/tournaments/create', tournamentData);
  return response.data;
};

export const updateTournamentAdmin = async (tournamentId, tournamentData) => {
  const updates = {};
  let hasUpdates = false;

  // Convert the data into a series of patch requests
  const updateableFields = [
    'name', 'description', 'date', 'status',
    'entry_fee', 'prize_pool', 'rules'
  ];

  // Build consolidated updates object
  updateableFields.forEach(field => {
    if (tournamentData[field] !== undefined) {
      updates[field] = tournamentData[field];
      hasUpdates = true;
    }
  });

  // If we have multiple fields to update, use a single PATCH
  if (hasUpdates) {
    await api.patch(`/api/tournaments/${tournamentId}`, updates);
  }

  // Return the updated tournament
  const response = await api.get(`/api/tournaments/${tournamentId}`);
  return response.data;
};

export const deleteTournamentAdmin = async (tournamentId, permanent = true) => {
  if (permanent) {
    const response = await api.delete(`/api/admin/trash/item/tournament/${tournamentId}`);
    return response.data;
  } else {
    const response = await api.patch(
      `/api/tournaments/${tournamentId}/status`,
      { status: 'Cancelado' }
    );
    return response.data;
  }
};

export const generateTournamentBracket = async (tournamentId) => {
  const response = await api.post(`/api/tournaments/${tournamentId}/generate-bracket`);
  return response.data;
};

export const updateMatchScoreAdmin = async (tournamentId, matchId, scoreData) => {
  const response = await api.patch(
    `/api/tournaments/${tournamentId}/matches/${matchId}/winner`,
    scoreData
  );
  return response.data;
};

/**
 * Player API Methods
 */
export const getPlayers = async (tournamentId) => {
  const url = tournamentId
    ? `/api/tournaments/${tournamentId}/players`
    : '/api/players';
  const response = await api.get(url);
  return response.data;
};

export const getPlayerDetails = async (playerId) => {
  const response = await api.get(`/api/players/${playerId}`);
  return response.data;
};

export const getAdminPlayers = async ({
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortDirection = 'asc',
  search = '',
  ...filters
} = {}) => {
  const response = await api.get('/api/admin/players', {
    params: { page, limit, sortBy, sortDirection, search, ...filters },
  });
  return response.data;
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
  const response = await api.delete(`/api/admin/players/${playerId}`, {
    params: { permanent },
  });
  return response.data;
};

export const bulkDeletePlayersAdmin = async (playerIds, permanent = false) => {
  const response = await api.post(`/api/admin/players/bulk-delete`, {
    playerIds,
    permanent
  });
  return response.data;
};

export const importPlayersAdmin = async (playersCsv) => {
  const formData = new FormData();
  formData.append('file', playersCsv);

  const response = await api.post('/api/admin/players/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const exportPlayersAdmin = async (format = 'csv', filters = {}) => {
  const response = await api.get('/api/admin/players/export', {
    params: { format, ...filters },
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `players_export_${new Date().toISOString().split('T')[0]}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();

  return { success: true, message: `Jogadores exportados em formato ${format.toUpperCase()}` };
};

export const assignPlayerToTournamentAPI = async (tournamentId, playerId) => {
  const response = await api.post(
    `/api/tournaments/${tournamentId}/assign_player`,
    { playerId }
  );
  return response.data;
};

/**
 * Score API Methods
 */
export const getScores = async (tournamentId) => {
  const response = await api.get(`/api/tournaments/${tournamentId}/scores`);
  return response.data;
};

export const saveScore = async (scoreData) => {
  const response = await api.post('/api/scores', scoreData);
  return response.data;
};

export const getAdminScores = async ({
  page = 1,
  limit = 10,
  sortBy = 'timestamp',
  sortDirection = 'desc',
  ...filters
} = {}) => {
  const response = await api.get('/api/admin/scores', {
    params: { page, limit, sortBy, sortDirection, ...filters },
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

/**
 * Stats API Methods
 */
export const getTournamentStats = async (tournamentId) => {
  const response = await api.get(`/api/tournaments/${tournamentId}/stats`);
  return response.data;
};

export const getPlayerStats = async (tournamentId, playerName) => {
  const encodedPlayerName = encodeURIComponent(playerName);
  const response = await api.get(
    `/api/tournaments/${tournamentId}/players/${encodedPlayerName}/stats`
  );
  return response.data;
};

/**
 * Admin - Trash Management
 */
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
  const response = await api.delete(
    `/api/admin/trash/item/${itemType}/${itemId}`
  );
  return response.data;
};

/**
 * Admin - Security Methods
 */
export const getSecurityOverviewStats = async () => {
  const response = await api.get('/api/system/security/overview-stats');
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

/**
 * Admin - User Management
 */
export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/api/admin/users', { params });
  return response.data;
};

export const createAdminUser = async (userData) => {
  const response = await api.post('/api/admin/users', userData);
  return response.data;
};

export const updateAdminUser = async (userId, userData) => {
  const response = await api.put(`/api/admin/users/${userId}`, userData);
  return response.data;
};

export const deleteAdminUser = async (userId) => {
  const response = await api.delete(`/api/admin/users/${userId}`);
  return response.data;
};

/**
 * Health Check/Status API
 */
export const checkApiStatus = async () => {
  try {
    const response = await api.get('/ping', { timeout: 5000 });
    return {
      status: 'online',
      details: response.data
    };
  } catch (error) {
    return {
      status: 'offline',
      error: error.message
    };
  }
};

export default api;
