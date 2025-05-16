import { API_CONSTANTS, LOGIN_TOKEN_KEY } from '../shared/constants.js';
import {
  sanitizeData,
  sanitizeURLParams,
  getCSRFToken,
} from '../utils/securityUtils.js';

const API_BASE_URL = API_CONSTANTS.BASE_URL;

const API_CONFIG = {
  timeout: API_CONSTANTS.DEFAULT_TIMEOUT || 30000,
  retryAttempts: API_CONSTANTS.RETRY_ATTEMPTS || 2,
  retryDelay: 1000,
  cacheTime: 60000,
};

const apiCache = new Map();

export async function fetchApi(endpoint, options = {}, requiresAuth = true) {
  const url = `${API_BASE_URL}${endpoint}`;

  const isGetMethod = !options.method || options.method === 'GET';
  const cacheKey = `${url}-${JSON.stringify(options.body || {})}`;

  if (isGetMethod && !requiresAuth) {
    const cachedResponse = apiCache.get(cacheKey);
    if (
      cachedResponse &&
      Date.now() - cachedResponse.timestamp < API_CONFIG.cacheTime
    ) {
      return cachedResponse.data;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requiresAuth) {
    const token = sessionStorage.getItem(LOGIN_TOKEN_KEY);
    if (!token) {
      throw new Error('Autenticação necessária. Token não encontrado.');
    }

    if (token && token.split('.').length === 3) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        if (payload && payload.exp && payload.exp * 1000 < Date.now()) {
          sessionStorage.removeItem(LOGIN_TOKEN_KEY);
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }

        if (!payload.sub && !payload.username) {
          /* Token válido, mas sem identificador de usuário */ void 0;
        }
      } catch {
        /* Ignora erro de parsing do token */ void 0;
      }
    } else {
      /* Token não parece ser JWT */ void 0;
    }

    headers['Authorization'] = `Bearer ${token}`;
  }

  const isModifyingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    options.method
  );
  if (isModifyingMethod) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    } else {
      void 0;
    }
  }

  if (options.body && typeof options.body === 'object') {
    const sanitizedBody = sanitizeData(options.body);
    options.body = JSON.stringify(sanitizedBody);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  let lastError = null;
  let attempts = 0;

  while (attempts <= API_CONFIG.retryAttempts) {
    attempts++;

    const fetchOptions = {
      ...options,
      headers,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          // Ignora erro de parsing se não for JSON
          data = { message: text };
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Erro HTTP: ${response.status}`);
      }

      if (isGetMethod && !requiresAuth) {
        apiCache.set(cacheKey, {
          data: data,
          timestamp: Date.now(),
        });
      }

      return sanitizeData(data);
    } catch (error) {
      lastError = error;

      if (
        (error.name === 'AbortError' || error.message.includes('network')) &&
        attempts <= API_CONFIG.retryAttempts
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.retryDelay)
        );
        continue;
      }

      clearTimeout(timeoutId);

      console.error(
        `API Error (${options.method || 'GET'} ${endpoint}):`,
        error
      );
      throw new Error(error.message || 'Erro de comunicação com a API.');
    }
  }

  throw lastError;
}

export function clearApiCache(endpoint = null) {
  if (endpoint) {
    const prefix = `${API_BASE_URL}${endpoint}`;
    for (const key of apiCache.keys()) {
      if (key.startsWith(prefix)) {
        apiCache.delete(key);
      }
    }
  } else {
    apiCache.clear();
  }
}

export async function getTournaments() {
  const response = await fetchApi('/tournaments', {}, false);
  return response.data;
}

export async function getTournamentStats(tournamentId) {
  return fetchApi(`/tournaments/${tournamentId}/stats`, {}, false);
}

export async function getTrashedTournaments() {
  return fetchApi('/tournaments/trash');
}

export async function createTournament(formData) {
  const token = sessionStorage.getItem(LOGIN_TOKEN_KEY);
  if (!token) throw new Error('Autenticação necessária. Token não encontrado.');

  if (token && token.split('.').length === 3) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        sessionStorage.removeItem(LOGIN_TOKEN_KEY);
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
    } catch {
      /* Ignora erro de parsing do token */ void 0;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const headers = { Authorization: `Bearer ${token}` };
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    } else {
      /* Sem token CSRF */ void 0;
    }

    const response = await fetch(`${API_BASE_URL}/tournaments/create`, {
      method: 'POST',
      headers: headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      throw new Error(data.message || `Erro HTTP: ${response.status}`);
    }

    return sanitizeData(data);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`API Error (POST /tournaments/create):`, error);
    throw new Error(error.message || 'Erro de comunicação ao criar torneio.');
  }
}

export async function getTournamentState(tournamentId) {
  return fetchApi(`/tournaments/${tournamentId}/state`, {}, false);
}

export async function saveTournamentState(tournamentId, stateData) {
  return fetchApi(`/tournaments/${tournamentId}/state`, {
    method: 'POST',
    body: { state: stateData },
  });
}

export async function getPlayers(tournamentId) {
  return fetchApi(`/tournaments/${tournamentId}/players`, {}, false);
}

export async function addPlayer(tournamentId, playerData) {
  return fetchApi(`/tournaments/${tournamentId}/players`, {
    method: 'POST',
    body: playerData,
  });
}

export async function updatePlayers(tournamentId, playersArray) {
  return fetchApi(`/tournaments/${tournamentId}/players/update`, {
    method: 'POST',
    body: { players: playersArray },
  });
}

export async function importPlayers(tournamentId, formData) {
  const token = sessionStorage.getItem(LOGIN_TOKEN_KEY);
  if (!token) throw new Error('Autenticação necessária.');
  try {
    const response = await fetch(
      `${API_BASE_URL}/tournaments/${tournamentId}/players/import`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || `Erro HTTP: ${response.status}`);
    return data;
  } catch (error) {
    console.error(`API Error (POST /tournaments/.../players/import):`, error);
    throw new Error(
      error.message || 'Erro de comunicação ao importar jogadores.'
    );
  }
}

export async function getScores(tournamentId) {
  return fetchApi(`/tournaments/${tournamentId}/scores`, {}, false);
}

export async function saveScore(scoreData) {
  return fetchApi('/tournaments/scores', {
    method: 'POST',
    body: scoreData,
  });
}

export async function updateScores(tournamentId, scoresArray) {
  return fetchApi(`/tournaments/${tournamentId}/scores/update`, {
    method: 'POST',
    body: { scores: scoresArray },
  });
}

export async function generateBracket(tournamentId) {
  return fetchApi(`/tournaments/${tournamentId}/generate-bracket`, {
    method: 'POST',
  });
}

export async function resetTournament(tournamentId) {
  return fetchApi(`/tournaments/${tournamentId}/reset`, { method: 'POST' });
}

export async function updateTournamentName(tournamentId, newName) {
  return fetchApi(`/tournaments/${tournamentId}/name`, {
    method: 'PATCH',
    body: { name: newName },
  });
}

export async function updateTournamentDescription(
  tournamentId,
  newDescription
) {
  return fetchApi(`/tournaments/${tournamentId}/description`, {
    method: 'PATCH',
    body: { description: newDescription },
  });
}

export async function updateTournamentStatus(tournamentId, newStatus) {
  return fetchApi(`/tournaments/${tournamentId}/status`, {
    method: 'PATCH',
    body: { status: newStatus },
  });
}

export async function updateMatchSchedule(tournamentId, matchId, isoDateTime) {
  return fetchApi(`/tournaments/${tournamentId}/matches/${matchId}/schedule`, {
    method: 'PATCH',
    body: { dateTime: isoDateTime },
  });
}

export async function setManualWinner(tournamentId, matchId, winnerIndex) {
  return fetchApi(`/tournaments/${tournamentId}/matches/${matchId}/winner`, {
    method: 'PATCH',
    body: { winnerIndex: winnerIndex },
  });
}

export async function advanceRound(tournamentId) {
  return fetchApi(`/tournaments/${tournamentId}/advance-round`, {
    method: 'POST',
  });
}

export async function trashTournament(tournamentId) {
  return fetchApi(`/tournaments/${tournamentId}/trash`, { method: 'POST' });
}

export async function restoreTournament(tournamentId) {
  return fetchApi(`/tournaments/${tournamentId}/restore`, { method: 'POST' });
}

export async function deleteTournamentPermanently(tournamentId) {
  return fetchApi(`/tournaments/${tournamentId}/permanent`, {
    method: 'DELETE',
  });
}

export async function emptyTrash() {
  return fetchApi('/tournaments/trash/empty', { method: 'DELETE' });
}

async function _handleFileDownload(
  endpoint,
  defaultFilename,
  errorContextMessage
) {
  const token = sessionStorage.getItem(LOGIN_TOKEN_KEY);

  if (!token) {
    throw new Error(`Autenticação necessária para ${errorContextMessage}.`);
  }

  try {
    const csrfToken = getCSRFToken();

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    } else {
      /* Sem token CSRF */ void 0;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: headers,
    });

    if (!response.ok) {
      try {
        const errData = await response.json();
        throw new Error(errData.message || `Erro ${response.status}`);
      } catch {
        // Ignora erro de parsing se não for JSON
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    }

    const contentType = response.headers.get('content-type');
    const safeContentTypes = [
      'application/json',
      'application/octet-stream',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
    ];

    if (
      !contentType ||
      !safeContentTypes.some((type) => contentType.includes(type))
    ) {
      throw new Error(
        `Tipo de conteúdo não suportado para download: ${contentType}`
      );
    }

    const disposition = response.headers.get('content-disposition');
    let filename = defaultFilename;
    if (disposition && disposition.includes('attachment')) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches?.[1]) {
        let rawFilename = matches[1].replace(/['"]/g, '');

        rawFilename = rawFilename.split(/[/\\]/).pop();

        filename = rawFilename
          .replace(/[^a-zA-Z0-9_.-]/g, '_')
          .substring(0, 255);

        const parts = filename.split('.');
        let extension = '';

        if (parts.length > 1) {
          extension = parts[parts.length - 1].toLowerCase();
        }

        const safeExtensions = ['json', 'txt', 'csv', 'xlsx', 'pdf', 'zip'];

        if (!extension || !safeExtensions.includes(extension)) {
          filename += '.txt';
        }
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.setAttribute('rel', 'noopener noreferrer');

    if (blob.size > 50 * 1024 * 1024) {
      throw new Error('Arquivo muito grande para download direto.');
    }

    const blobType = blob.type.toLowerCase();
    if (blobType && !safeContentTypes.some((type) => blobType.includes(type))) {
      throw new Error(
        `Tipo de arquivo detectado (${blobType}) não é seguro para download`
      );
    }

    document.body.appendChild(a);
    setTimeout(() => {
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0);
  } catch (error) {
    console.error(`Erro ao ${errorContextMessage}:`, error);

    let mensagemErro = error.message;

    if (
      error.message.includes('NetworkError') ||
      error.message.includes('Failed to fetch')
    ) {
      mensagemErro = 'Erro de conexão. Verifique sua rede e tente novamente.';
    } else if (error.message.includes('aborted')) {
      mensagemErro = 'A operação excedeu o tempo limite. Tente novamente.';
    }

    throw new Error(`Erro ao ${errorContextMessage}: ${mensagemErro}`);
  }
}

export function isAuthenticated() {
  const token = sessionStorage.getItem(LOGIN_TOKEN_KEY);
  if (!token) return false;

  try {
    if (token.split('.').length !== 3) return false;

    const payload = JSON.parse(atob(token.split('.')[1]));

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      sessionStorage.removeItem(LOGIN_TOKEN_KEY);
      return false;
    }

    if (!payload.sub && !payload.username) {
      return false;
    }

    return true;
  } catch {
    /* Ignora erros de parsing ou validação do token */
    return false;
  }
}

export function getSafeQueryString(params) {
  if (!params || typeof params !== 'object') return '';
  return sanitizeURLParams(params);
}

export async function exportPlayers(tournamentId) {
  await _handleFileDownload(
    `/tournaments/${tournamentId}/export/players`,
    `players_${tournamentId}.json`,
    'exportar jogadores'
  );
}

export async function exportScores(tournamentId) {
  await _handleFileDownload(
    `/tournaments/${tournamentId}/export/scores`,
    `scores_${tournamentId}.json`,
    'exportar placares'
  );
}

export async function exportBracket(tournamentId) {
  await _handleFileDownload(
    `/tournaments/${tournamentId}/export/bracket`,
    `bracket_${tournamentId}.json`,
    'exportar chaveamento'
  );
}
