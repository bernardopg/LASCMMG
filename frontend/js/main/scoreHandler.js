import * as api from '../apiService.js';
import * as ui from '../uiUtils.js';
import * as state from '../state.js';
import { renderBracket } from './bracketRenderer.js';
import { createScoresFilterManager } from '../filterManager.js';

const elements = {
  scoresTableBody: document.getElementById('scores-body'),
  scoresTable: document.getElementById('scores-table'),
  scoreForm: document.getElementById('score-form'),
  player1Select: document.getElementById('player1'),
  player2Select: document.getElementById('player2'),
  score1Input: document.getElementById('score1'),
  score2Input: document.getElementById('score2'),
  roundInput: document.getElementById('round'),
};

let scoreSortColumn = null;
let scoreSortDirection = 'asc';

let scoresFilterManager = null;

export async function loadScoresHistory() {
  const currentTournamentId = state.getCurrentTournamentId();
  if (!elements.scoresTableBody || !currentTournamentId) {
    if (elements.scoresTableBody) {
      elements.scoresTableBody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">Selecione um torneio.</td></tr>';
    }
    state.setCurrentScores([]);
    return;
  }

  elements.scoresTableBody.innerHTML =
    '<tr><td colspan="6" style="text-align: center;"><div class="loading-indicator">Carregando...</div></td></tr>';
  try {
    const scores = await api.getScores(currentTournamentId);
    state.setCurrentScores(scores);
    renderScoresTable();
    addScoreTableSortListeners();
    updateSortIndicators();

    if (scoresFilterManager) {
      const players = state.getPlayersList();
      if (!players || players.length === 0) {
        const playersData = await api.getPlayers(currentTournamentId);
        state.setPlayersList(playersData);
      }
      scoresFilterManager.populatePlayerOptions(
        state.getPlayersList(),
        'filter-player'
      );
    }
  } catch (error) {
    ui.showMessage(
      'Erro ao carregar histórico de placares.',
      'error',
      error.message
    );
    state.setCurrentScores([]);
    if (elements.scoresTableBody) {
      elements.scoresTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erro: ${error.message}</td></tr>`;
    }
  }
}

function renderScoresTable(scoresToRender = null) {
  if (!elements.scoresTableBody) return;
  elements.scoresTableBody.innerHTML = '';

  const scores =
    scoresToRender !== null ? scoresToRender : state.getCurrentScores();

  if (!Array.isArray(scores) || scores.length === 0) {
    elements.scoresTableBody.innerHTML =
      '<tr><td colspan="6" style="text-align: center;">Nenhum placar encontrado.</td></tr>';
    return;
  }

  const sortedScores = sortScoresArray(scores);

  sortedScores.forEach((score) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${score.timestamp || '-'}</td>
            <td>${score.player1 || '-'}</td>
            <td>${score.player2 || '-'}</td>
            <td>${score.score1 ?? 0}-${score.score2 ?? 0}</td>
            <td>${score.winner || '-'}</td>
            <td>${score.round || '-'}</td>`;
    elements.scoresTableBody.appendChild(tr);
  });

  updateSortIndicators();
}

function sortScoresArray(scoresArray) {
  if (!scoreSortColumn) return scoresArray;

  const sortKeyMap = {
    Data: 'timestamp',
    'Jogador 1': 'player1',
    'Jogador 2': 'player2',
    Placar: (a, b) =>
      (a.score1 ?? 0) + (a.score2 ?? 0) - ((b.score1 ?? 0) + (b.score2 ?? 0)),
    Vencedor: 'winner',
    Rodada: 'round',
  };
  const sortKey = sortKeyMap[scoreSortColumn];
  if (!sortKey) return scoresArray;

  const sortedArray = [...scoresArray];

  sortedArray.sort((a, b) => {
    let valA, valB;
    if (typeof sortKey === 'function') {
      return scoreSortDirection === 'asc' ? sortKey(a, b) : sortKey(b, a);
    } else {
      valA = a[sortKey] || '';
      valB = b[sortKey] || '';
      if (scoreSortColumn === 'Data') {
        const dateA = ui.parseDateString(valA);
        const dateB = ui.parseDateString(valB);
        return scoreSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return scoreSortDirection === 'asc'
        ? String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true })
        : String(valB).localeCompare(String(valA), 'pt-BR', { numeric: true });
    }
  });
  return sortedArray;
}

function updateSortIndicators() {
  if (!elements.scoresTable) return;
  const headers = elements.scoresTable.querySelectorAll(
    "thead th[scope='col']"
  );
  const currentSortColumn = scoreSortColumn;
  const currentSortDirection = scoreSortDirection;

  headers.forEach((th) => {
    th.classList.remove('sort-asc', 'sort-desc');
    th.removeAttribute('aria-sort');
    if (th.textContent === currentSortColumn) {
      const directionClass =
        currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
      th.classList.add(directionClass);
      th.setAttribute(
        'aria-sort',
        currentSortDirection === 'asc' ? 'ascending' : 'descending'
      );
    }
  });
}

function handleSortClick(column) {
  if (scoreSortColumn === column) {
    scoreSortDirection = scoreSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    scoreSortColumn = column;
    scoreSortDirection = 'asc';
  }
  renderScoresTable();
}

function addScoreTableSortListeners() {
  if (!elements.scoresTable) return;
  const headers = elements.scoresTable.querySelectorAll(
    "thead th[scope='col']"
  );
  headers.forEach((th) => {
    if (!th.dataset.sortListenerAdded) {
      th.style.cursor = 'pointer';
      th.setAttribute('tabindex', '0');
      th.setAttribute('role', 'button');
      th.setAttribute('aria-label', `Ordenar por ${th.textContent}`);

      const clickHandler = () => handleSortClick(th.textContent);
      const keydownHandler = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSortClick(th.textContent);
        }
      };

      th.addEventListener('click', clickHandler);
      th.addEventListener('keydown', keydownHandler);
      th.dataset.sortListenerAdded = 'true';
    }
  });
}

export async function loadPlayerSelectOptions() {
  if (!elements.player1Select || !elements.player2Select) return;

  const currentTournamentId = state.getCurrentTournamentId();
  if (!currentTournamentId) {
    elements.player1Select.innerHTML =
      '<option value="">Selecione Torneio</option>';
    elements.player2Select.innerHTML =
      '<option value="">Selecione Torneio</option>';
    return;
  }

  try {
    let players = state.getPlayersList();
    if (!players || players.length === 0) {
      const playersData = await api.getPlayers(currentTournamentId);
      state.setPlayersList(playersData);
      players = state.getPlayersList();
    }

    elements.player1Select.innerHTML =
      '<option value="">Selecione Jogador 1</option>';
    elements.player2Select.innerHTML =
      '<option value="">Selecione Jogador 2</option>';

    players.forEach((player) => {
      if (player.name && player.name.toLowerCase() !== 'bye') {
        const dName = player.nickname
          ? `${player.name} (${player.nickname})`
          : player.name;
        [elements.player1Select, elements.player2Select].forEach((sel) => {
          const opt = document.createElement('option');
          opt.value = player.name;
          opt.textContent = dName;
          sel.appendChild(opt);
        });
      }
    });
  } catch (error) {
    console.error('Erro ao carregar jogadores para o formulário:', error);
    ui.showMessage(
      'Não foi possível carregar a lista de jogadores.',
      'error',
      error.message
    );
    elements.player1Select.innerHTML =
      '<option value="">Erro ao Carregar</option>';
    elements.player2Select.innerHTML =
      '<option value="">Erro ao Carregar</option>';
  }
}

async function handleScoreSubmit(event) {
  event.preventDefault();
  const currentTournamentId = state.getCurrentTournamentId();
  const authToken = localStorage.getItem('adminToken');

  if (!authToken) {
    ui.showMessage(
      'Login de administrador necessário para salvar placar.',
      'error'
    );
    return;
  }
  if (!currentTournamentId) {
    ui.showMessage('Selecione um torneio antes de salvar o placar.', 'error');
    return;
  }
  if (!elements.scoreForm) return;

  const submitButton = elements.scoreForm.querySelector(
    "button[type='submit']"
  );
  ui.setButtonLoading(submitButton, true);

  const player1 = elements.player1Select.value;
  const player2 = elements.player2Select.value;
  const score1 = elements.score1Input.value;
  const score2 = elements.score2Input.value;
  const round = elements.roundInput?.value;

  if (!player1 || !player2 || score1 === '' || score2 === '' || !round) {
    ui.showMessage(
      'Preencha todos os campos: jogadores, placar e rodada.',
      'error'
    );
    return;
  }
  if (player1 === player2) {
    ui.showMessage('Preencha todos os campos de jogador e placar.', 'error');
    return;
  }
  if (player1 === player2) {
    ui.showMessage('Selecione jogadores diferentes.', 'error');
    return;
  }
  if (!ui.isValidScore(score1, score2)) {
    ui.showMessage(
      'Placar inválido.',
      'error',
      'O placar deve ser 2-0 ou 2-1 (ou vice-versa).'
    );
    return;
  }

  ui.setButtonLoading(submitButton, true);
  try {
    const payload = {
      player1,
      player2,
      score1: parseInt(score1),
      score2: parseInt(score2),
      round,
      tournament_id: currentTournamentId,
    };
    await api.saveScore(payload);

    ui.showMessage('Placar salvo com sucesso!', 'success');
    elements.scoreForm.reset();

    try {
      const fetchedState = await api.getTournamentState(currentTournamentId);
      state.setTournamentState(fetchedState);
      renderBracket();
    } catch (stateError) {
      ui.showMessage(
        'Erro ao recarregar o chaveamento após salvar placar.',
        'error',
        stateError.message
      );
    }

    await loadScoresHistory();
  } catch (error) {
    ui.showMessage('Erro ao salvar placar.', 'error', error.message);
  } finally {
    ui.setButtonLoading(submitButton, false);
  }
}

function applyFiltersToScores(_filterValues) {
  const scores = state.getCurrentScores();
  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return;
  }

  const filterMap = {
    'filter-player': (score, value) => {
      return (
        score.player1 === value ||
        score.player2 === value ||
        score.winner === value
      );
    },
    'filter-round': 'round',
    'filter-winner': (score, value) => {
      if (value === 'vitoria') {
        const playerFilter = document.getElementById('filter-player')?.value;
        if (!playerFilter) return true;
        return score.winner === playerFilter;
      } else if (value === 'derrota') {
        const playerFilter = document.getElementById('filter-player')?.value;
        if (!playerFilter) return true;
        return (
          (score.player1 === playerFilter || score.player2 === playerFilter) &&
          score.winner !== playerFilter
        );
      }
      return true;
    },
    'filter-date': (score, value) => {
      if (!value) return true;
      if (!score.timestamp) return false;

      const filterDate = new Date(value);
      const scoreDate = ui.parseDateString(score.timestamp);

      return scoreDate >= filterDate;
    },
  };

  const filteredScores = scoresFilterManager.filterData(scores, filterMap);

  renderScoresTable(filteredScores);
}

function initializeScoresFilter() {
  if (scoresFilterManager) return;

  scoresFilterManager = createScoresFilterManager(applyFiltersToScores);

  scoresFilterManager.initialize();

  const players = state.getPlayersList();
  if (players && players.length > 0) {
    scoresFilterManager.populatePlayerOptions(players, 'filter-player');
  }
}

export function initializeScoreSection() {
  elements.scoreForm?.addEventListener('submit', handleScoreSubmit);
  addScoreTableSortListeners();

  initializeScoresFilter();
}
