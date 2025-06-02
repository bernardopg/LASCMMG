/**
 * API Service Module - LASCMMG Application
 *
 * This module provides a centralized interface for all API interactions in the application.
 * It handles authentication, CSRF protection, error handling, and provides methods for
 * all API endpoints.
 *
 * @module api
 * @version 2.3.0
 * @lastUpdated 2025-05-23
 */

/* eslint-env browser */
import axios from 'axios';
import {
  ensureCsrfTokenInternal,
  getCurrentCsrfToken,
  clearCsrfToken as clearCsrfState, // Renamed to avoid conflict if any
  getCsrfErrorRetryCount,
  incrementCsrfErrorRetryCount,
  resetCsrfErrorRetryCount,
  isCsrfRetryLimitExceeded,
  CSRF_ERROR_RETRY_MAX, // Import for logging
} from './csrfService';
import {
  API_TIMEOUT,
  AUTH_STORAGE_KEY,
  USER_STORAGE_KEY,
  NETWORK_RETRY_MAX,
  NETWORK_RETRY_DELAY,
} from '../config/apiConfig';

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
 * Forces refresh of the CSRF token, clearing the current one
 */
export const refreshCsrfToken = () => {
  clearCsrfState();
  return ensureCsrfTokenInternal(); // ensureCsrfTokenInternal is now imported
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
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const localCurrentCsrfToken = getCurrentCsrfToken(); // Get token from service

    // Add CSRF token to mutating requests
    if (protectedMethods.includes(config.method.toUpperCase())) {
      // ensureCsrfTokenInternal will handle checking expiration and fetching if needed
      const tokenToUse = await ensureCsrfTokenInternal(api); // Pass the api instance

      if (tokenToUse) {
        config.headers['X-CSRF-Token'] = tokenToUse;
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
    if (
      response?.status === 403 &&
      response?.data?.message?.includes('CSRF') &&
      !isCsrfRetryLimitExceeded() // Use helper from csrfService
    ) {
      incrementCsrfErrorRetryCount(); // Use helper from csrfService
      console.warn(
        `CSRF token rejected. Refreshing token and retrying (${getCsrfErrorRetryCount()}/${CSRF_ERROR_RETRY_MAX})` // CSRF_ERROR_RETRY_MAX needs to be defined or imported if used here
      );

      // Force refresh the CSRF token
      clearCsrfState(); // Use helper from csrfService
      const newCsrfToken = await ensureCsrfTokenInternal(api); // Pass the api instance to fetch new token

      // Retry the original request
      if (newCsrfToken && config) {
        config.headers['X-CSRF-Token'] = newCsrfToken;
        return axios(config);
      }
    }

    // Network error handling with retries
    if (
      !response &&
      error.message &&
      (error.message.includes('timeout') || error.message.includes('Network Error')) &&
      config &&
      config._retryCount < NETWORK_RETRY_MAX
    ) {
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
        data: response.data,
      });
    }
    // Network errors
    else if (request) {
      console.error('Network error:', {
        url: request.responseURL || config?.url,
        method: config?.method,
        message: error.message,
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

let _handleLoginSuccess = null;

export const setAuthSuccessHandler = (handler) => {
  _handleLoginSuccess = handler;
};

/**
 * API Request Methods
 * Organized by resource type
 */

/**
 * Authentication API Methods
 */
export const loginUser = async (credentials) => {
  // This is for Admin login
  const response = await api.post('/api/auth/login', credentials); // Assuming this is admin login
  const responseData = response.data;

  if (responseData.success && responseData.token && responseData.admin) {
    setAuthToken(responseData.token); // Stores in localStorage and sets axios header
    if (_handleLoginSuccess) {
      _handleLoginSuccess(
        responseData.admin, // user object
        responseData.token,
        responseData.refreshToken,
        responseData.expiresIn,
        credentials.rememberMe || false
      );
    }
  }
  return responseData;
};

export const registerRegularUser = async (userData) => {
  // Corresponds to POST /api/users/register
  // Expects { username (email), password }
  const response = await api.post('/api/users/register', userData);
  return response.data; // e.g., { success: true, message: "...", userId, username }
};

export const loginRegularUser = async (credentials) => {
  // Corresponds to POST /api/users/login
  // Expects { username (email), password }
  const response = await api.post('/api/users/login', credentials);
  const responseData = response.data;

  if (responseData.success && responseData.token && responseData.user) {
    setAuthToken(responseData.token); // Stores in localStorage and sets axios header
    // USER_STORAGE_KEY is also set by setAuthToken if needed, or handle here
    if (_handleLoginSuccess) {
      _handleLoginSuccess(
        responseData.user,
        responseData.token,
        null, // Regular users might not have refresh tokens from this endpoint
        responseData.expiresIn, // Assuming backend sends expiresIn for regular users too
        false // Regular user login typically doesn't have "rememberMe" for refresh tokens
      );
    }
  }
  return responseData;
};

export const changeRegularUserPassword = async (passwordData) => {
  // Corresponds to PUT /api/users/password
  // Expects { currentPassword, newPassword }
  // Auth token must be set for this request
  const response = await api.put('/api/users/password', passwordData);
  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post('/api/logout');
  } catch {
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
  // Backend has specific PATCH routes for individual fields.
  // This function will iterate and call them as needed.
  // Note: This makes multiple API calls if multiple fields are changed.
  // A backend endpoint for partial updates of multiple fields would be more efficient.

  const editableFields = {
    name: `/api/tournaments/${tournamentId}/name`,
    description: `/api/tournaments/${tournamentId}/description`,
    date: `/api/tournaments/${tournamentId}/date`, // Assuming backend has this, if not, it needs to be added or handled
    status: `/api/tournaments/${tournamentId}/status`,
    entry_fee: `/api/tournaments/${tournamentId}/entry_fee`,
    prize_pool: `/api/tournaments/${tournamentId}/prize_pool`,
    rules: `/api/tournaments/${tournamentId}/rules`,
    // num_players_expected and bracket_type might not have dedicated PATCH routes
    // and might be part of a general PUT /api/admin/tournaments/:tournamentId if that exists
    // or require a different handling strategy.
    // For now, only handling fields with known specific PATCH routes.
  };

  let success = true;
  let errors = [];

  for (const field in tournamentData) {
    if (Object.hasOwnProperty.call(tournamentData, field) && editableFields[field]) {
      if (tournamentData[field] !== undefined) {
        // Ensure value is actually provided
        try {
          await api.patch(editableFields[field], { [field]: tournamentData[field] });
        } catch (error) {
          console.error(`Error updating tournament field ${field}:`, error);
          success = false;
          errors.push({ field, message: error.response?.data?.message || error.message });
        }
      }
    } else if (
      Object.hasOwnProperty.call(tournamentData, field) &&
      tournamentData[field] !== undefined
    ) {
      console.warn(
        `Field ${field} is not directly updatable via a specific PATCH route in updateTournamentAdmin.`
      );
      // Potentially add to a list of fields that couldn't be updated this way.
    }
  }

  // After all updates, fetch the latest tournament details
  try {
    const response = await api.get(`/api/tournaments/${tournamentId}`);
    // Include success status and any errors from individual PATCH calls
    return {
      success: success && response.data.success,
      tournament: response.data.tournament,
      errors,
    };
  } catch (error) {
    console.error(`Error fetching tournament details after update for ${tournamentId}:`, error);
    return {
      success: false,
      tournament: null,
      errors: [
        ...errors,
        { field: 'general', message: 'Failed to fetch tournament after updates.' },
      ],
    };
  }
};

export const deleteTournamentAdmin = async (tournamentId, permanent = true) => {
  if (permanent) {
    const response = await api.delete(`/api/admin/trash/tournament/${tournamentId}`);
    return response.data;
  } else {
    const response = await api.patch(`/api/tournaments/${tournamentId}/status`, {
      status: 'Cancelado',
    });
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
export const getPlayers = async (tournamentId, params = {}) => {
  const url = tournamentId ? `/api/tournaments/${tournamentId}/players` : '/api/players';

  // Set default parameters for global players endpoint
  const defaultParams = {
    page: 1,
    limit: 50,
    sortBy: 'name',
    order: 'asc',
    filters: {},
  };

  // Merge default params with provided params
  const queryParams = tournamentId ? params : { ...defaultParams, ...params };

  const response = await api.get(url, { params: queryParams });
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

export const assignPlayerToTournamentAPI = async (tournamentId, playerId) => {
  const response = await api.post(`/api/tournaments/${tournamentId}/assign_player`, { playerId });
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
  order = 'desc',
  ...filters
} = {}) => {
  const response = await api.get('/api/admin/scores', {
    params: { page, limit, sortBy, order, ...filters },
  });
  return response.data;
};

export const createScoreAdmin = async (scoreData) => {
  const response = await api.post('/api/admin/scores', scoreData);
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

export const getAdminStats = async () => {
  const response = await api.get('/api/admin/stats');
  return response.data;
};

/**
 * Admin - Trash Management
 */
export const getTrashItems = async ({ page = 1, limit = 10, itemType = null } = {}) => {
  const response = await api.get('/api/admin/trash', {
    params: { page, limit, itemType },
  });
  return response.data;
};

export const restoreTrashItem = async (itemType, itemId) => {
  const response = await api.post(`/api/admin/trash/${itemType}/${itemId}/restore`);
  return response.data;
};

export const permanentlyDeleteTrashItem = async (itemType, itemId) => {
  const response = await api.delete(`/api/admin/trash/${itemType}/${itemId}`);
  return response.data;
};

/**
 * Admin - Import/Upload Management
 */
export const importPlayersAdmin = async (file, tournamentId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (tournamentId) {
    formData.append('tournamentId', tournamentId);
  }

  const response = await api.post('/api/admin/import/players', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const importTournamentsAdmin = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/admin/import/tournaments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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
  const response = await api.post('/api/system/security/honeypot-config', configData);
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

export const getUnscheduledMatchesAdmin = async (params = {}) => {
  const response = await api.get('/api/admin/matches/unscheduled', { params });
  return response.data; // Expected: { success: boolean, matches: [...] }
};

export const getSystemStats = async () => {
  const response = await api.get('/api/system/stats');
  return response.data; // Expected: { success: boolean, stats: {...} }
};

/**
 * Health Check/Status API
 */
export const checkApiStatus = async () => {
  try {
    const response = await api.get('/ping', { timeout: 5000 });
    return {
      status: 'online',
      details: response.data,
    };
  } catch (error) {
    return {
      status: 'offline',
      error: error.message,
    };
  }
};

export default api;
