import * as api from '../api/apiService.js';
import * as ui from '../ui/utils/uiUtils.js';
import * as state from '../state/state.js';
import { loadTournamentState } from './bracketHandler.js';

const elements = {
  scoresTableBody: document.getElementById('admin-scores-body'),
  scoreForm: document.getElementById('admin-score-form'),
  matchSelect: document.getElementById('admin-match-select'),
  player1Select: document.getElementById('admin-player1'),
  player2Select: document.getElementById('admin-player2'),
  score1Input: document.getElementById('admin-score1'),
  score2Input: document.getElementById('admin-score2'),
  roundInput: document.getElementById('admin-round'),
  dateTimeInput: document.getElementById('admin-match-datetime'),
  refreshScoresBtn: document.getElementById('btn-refresh-scores'),
  scoresSearchInput: document.getElementById('search-scores'),
  scoresTable: document.getElementById('admin-scores-table'),
  paginationContainer: document.getElementById('admin-scores-pagination'),
};

let currentPageScores = 1;
const itemsPerPageScores = 15;

export async function loadScoresHistory() {
  const currentTournamentId = state.getCurrentTournamentId();
  if (!elements.scoresTableBody || !currentTournamentId) {
    if (elements.scoresTableBody) {
      elements.scoresTableBody.innerHTML =
        '<tr><td colspan="7" style="text-align: center;">Selecione um torneio.</td></tr>';
    }
    state.setCurrentScores([]);
    renderAdminScoresTable();
    return;
  }

  elements.scoresTableBody.innerHTML =
    '<tr><td colspan="7" style="text-align: center;"><div class="loading-indicator">Carregando...</div></td></tr>';
  if (elements.paginationContainer) elements.paginationContainer.innerHTML = '';

  try {
    const scores = await api.getScores(currentTournamentId);
    state.setCurrentScores(scores);
    currentPageScores = 1;
    renderAdminScoresTable();
    setupScoresSearchListener();
  } catch (error) {
    ui.showMessage(
      'Erro ao carregar histórico de placares.',
      'error',
      error.message
    );
    state.setCurrentScores([]);
    renderAdminScoresTable();
    if (elements.scoresTableBody) {
      elements.scoresTableBody.innerHTML = `<tr><td colspan="7"><div class="message error" style="text-align: center;">Erro: ${error.message}</div></td></tr>`;
    }
  }
}

function renderAdminScoresTable() {
  if (!elements.scoresTableBody) return;
  elements.scoresTableBody.innerHTML = '';

  const searchTerm =
    elements.scoresSearchInput?.value.toLowerCase().trim() || '';
  const allScores = state.getCurrentScores();

  const filteredScores = searchTerm
    ? allScores.filter(
        (score) =>
          score.player1?.toLowerCase().includes(searchTerm) ||
          score.player2?.toLowerCase().includes(searchTerm) ||
          score.winner?.toLowerCase().includes(searchTerm) ||
          score.round?.toLowerCase().includes(searchTerm) ||
          `${score.score1}-${score.score2}`.includes(searchTerm) ||
          score.timestamp?.includes(searchTerm)
      )
    : allScores;

  const sortedScores = sortScoresArray(filteredScores);

  const totalItems = sortedScores.length;
  const startIndex = (currentPageScores - 1) * itemsPerPageScores;
  const endIndex = startIndex + itemsPerPageScores;
  const paginatedScores = sortedScores.slice(startIndex, endIndex);

  if (paginatedScores.length === 0) {
    elements.scoresTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">${searchTerm ? 'Nenhum placar encontrado para a busca.' : 'Nenhum placar registrado.'}</td></tr>`;
  } else {
    paginatedScores.forEach((score) => {
      const originalIndex = allScores.findIndex(
        (s) =>
          s.player1 === score.player1 &&
          s.player2 === score.player2 &&
          s.round === score.round &&
          s.timestamp === score.timestamp
      );

      const row = elements.scoresTableBody.insertRow();
      row.dataset.originalIndex = originalIndex;
      row.dataset.matchId = score.matchId || '';

      const createCell = (text) => {
        const cell = row.insertCell();
        cell.textContent = text || '-';
        return cell;
      };

      createCell(ui.formatMatchDate(score.timestamp));
      createCell(score.player1);
      createCell(score.player2);
      createCell(`${score.score1 ?? 0}-${score.score2 ?? 0}`);
      createCell(score.winner);
      createCell(score.round);

      const actionCell = row.insertCell();
      actionCell.classList.add('action-cell');
      const editButton = ui.createActionButton(
        'Editar',
        'edit',
        null,
        ['btn-edit'],
        () => {
          editScore(originalIndex, score);
        }
      );
      const deleteButton = ui.createActionButton(
        'Excluir',
        'delete',
        null,
        ['btn-danger'], // Alterado de btn-delete para btn-danger
        async (e) => {
          await deleteScore(originalIndex, score, e.target);
        }
      );
      actionCell.append(editButton, deleteButton);
    });
  }

  updateAdminSortIndicators();
  renderScoresPaginationControls(totalItems);
}

function renderScoresPaginationControls(totalItems) {
  if (!elements.paginationContainer) return;
  elements.paginationContainer.innerHTML = '';

  const totalPages = Math.ceil(totalItems / itemsPerPageScores);

  if (totalPages <= 1) return;

  const createPageButton = (
    text,
    pageNum,
    isDisabled = false,
    isActive = false
  ) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `btn btn-secondary btn-small ${isActive ? 'active' : ''}`;
    button.disabled = isDisabled;
    button.setAttribute('aria-label', `Ir para página ${pageNum}`);
    if (isActive) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => changeScoresPage(pageNum));
    return button;
  };

  const prevButton = createPageButton(
    'Anterior',
    currentPageScores - 1,
    currentPageScores === 1
  );
  elements.paginationContainer.appendChild(prevButton);

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Página ${currentPageScores} de ${totalPages}`;
  pageInfo.style.margin = '0 10px';
  pageInfo.setAttribute('aria-live', 'polite');
  elements.paginationContainer.appendChild(pageInfo);

  const nextButton = createPageButton(
    'Próximo',
    currentPageScores + 1,
    currentPageScores === totalPages
  );
  elements.paginationContainer.appendChild(nextButton);
}

function changeScoresPage(newPage) {
  const totalItems = elements.scoresSearchInput?.value.toLowerCase().trim()
    ? state.getCurrentScores().filter(/* apply filter again */).length
    : state.getCurrentScores().length;
  const totalPages = Math.ceil(totalItems / itemsPerPageScores);

  if (newPage >= 1 && newPage <= totalPages) {
    currentPageScores = newPage;
    renderAdminScoresTable();
  }
}

function sortScoresArray(scoresArray) {
  const column = state.getAdminScoreSortColumn();
  const direction = state.getAdminScoreSortDirection();

  if (!column) return scoresArray;

  const sortKeyMap = {
    Data: 'timestamp',
    'Jogador 1': 'player1',
    'Jogador 2': 'player2',
    Placar: (a, b) =>
      (a.score1 ?? 0) + (a.score2 ?? 0) - ((b.score1 ?? 0) + (b.score2 ?? 0)),
    Vencedor: 'winner',
    Rodada: 'round',
  };
  const sortKey = sortKeyMap[column];
  if (!sortKey) return scoresArray;

  const sortedArray = [...scoresArray];

  sortedArray.sort((a, b) => {
    let valA, valB;
    if (typeof sortKey === 'function') {
      return direction === 'asc' ? sortKey(a, b) : sortKey(b, a);
    } else {
      valA = a[sortKey] || '';
      valB = b[sortKey] || '';

      if (column === 'Data') {
        const dateA = ui.parseDateString(valA);
        const dateB = ui.parseDateString(valB);
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return direction === 'asc'
        ? String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true })
        : String(valB).localeCompare(String(valA), 'pt-BR', { numeric: true });
    }
  });
  return sortedArray;
}

function updateAdminSortIndicators() {
  if (!elements.scoresTable) return;
  const headers = elements.scoresTable.querySelectorAll(
    "thead th[scope='col']"
  );
  const currentSortColumn = state.getAdminScoreSortColumn();
  const currentSortDirection = state.getAdminScoreSortDirection();

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
  const currentColumn = state.getAdminScoreSortColumn();
  const currentDirection = state.getAdminScoreSortDirection();
  let newDirection = 'asc';

  if (currentColumn === column) {
    newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
  }
  state.setAdminScoreSort(column, newDirection);
  currentPageScores = 1;
  renderAdminScoresTable();
}

function editScore(originalIndex, scoreData) {
  if (
    !elements.scoreForm ||
    !elements.player1Select ||
    !elements.player2Select ||
    !elements.score1Input ||
    !elements.score2Input ||
    !elements.roundInput ||
    !elements.dateTimeInput
  )
    return;

  elements.player1Select.innerHTML = `<option value="${scoreData.player1}">${scoreData.player1}</option>`;
  elements.player2Select.innerHTML = `<option value="${scoreData.player2}">${scoreData.player2}</option>`;
  elements.player1Select.value = scoreData.player1;
  elements.player2Select.value = scoreData.player2;
  elements.player1Select.disabled = true;
  elements.player2Select.disabled = true;

  elements.score1Input.value = scoreData.score1 ?? '';
  elements.score2Input.value = scoreData.score2 ?? '';
  elements.roundInput.value = scoreData.round || '';

  const tournamentState = state.getTournamentState();
  const matchDataFromState = tournamentState.matches?.[scoreData.matchId];
  const dateTimeValue = scoreData.dateTime || matchDataFromState?.dateTime;
  if (dateTimeValue) {
    try {
      elements.dateTimeInput.value = new Date(dateTimeValue)
        .toISOString()
        .slice(0, 16);
    } catch (e) {
      console.warn(
        'Could not format existing date for input:',
        dateTimeValue,
        e
      );
      elements.dateTimeInput.value = '';
    }
  } else {
    elements.dateTimeInput.value = '';
  }

  elements.scoreForm.dataset.editing = 'true';
  elements.scoreForm.dataset.originalIndex = originalIndex;
  elements.scoreForm.dataset.matchId = scoreData.matchId || '';

  const submitButton = elements.scoreForm.querySelector(
    "button[type='submit']"
  );
  if (submitButton) submitButton.textContent = 'Atualizar Placar';

  if (elements.matchSelect)
    elements.matchSelect.value = scoreData.matchId || '';

  elements.scoreForm.scrollIntoView({ behavior: 'smooth' });
}

async function deleteScore(originalIndex, scoreObject, buttonElement) {
  const currentTournamentId = state.getCurrentTournamentId();
  if (!currentTournamentId) return;

  const confirmMsg = `Tem certeza que deseja excluir o placar ${scoreObject.score1 ?? 0}-${scoreObject.score2 ?? 0} entre ${scoreObject.player1 || '?'} e ${scoreObject.player2 || '?'}?`;
  if (!confirm(confirmMsg)) return;

  ui.setButtonLoading(buttonElement, true);

  const currentScores = state.getCurrentScores();
  if (originalIndex < 0 || originalIndex >= currentScores.length) {
    ui.showMessage('Erro: Índice de placar inválido para exclusão.', 'error');
    ui.setButtonLoading(buttonElement, false);
    return;
  }
  const updatedScoresPayload = currentScores.filter(
    (_, index) => index !== originalIndex
  );

  try {
    await api.updateScores(currentTournamentId, updatedScoresPayload);
    ui.showMessage('Placar excluído com sucesso!', 'success');
    await loadScoresHistory();
    resetScoreForm();
    if (scoreObject.matchId) {
      await loadTournamentState();
    }
  } catch (error) {
    ui.showMessage(`Erro ao excluir placar: ${error.message}`, 'error');
  } finally {
    ui.setButtonLoading(buttonElement, false);
  }
}

function resetScoreForm() {
  if (!elements.scoreForm) return;
  elements.scoreForm.reset();
  elements.scoreForm.dataset.editing = 'false';
  delete elements.scoreForm.dataset.originalIndex;
  delete elements.scoreForm.dataset.matchId;

  const submitButton = elements.scoreForm.querySelector(
    "button[type='submit']"
  );
  if (submitButton) submitButton.textContent = 'Salvar Placar';

  if (elements.matchSelect) elements.matchSelect.value = '';
  if (elements.dateTimeInput) elements.dateTimeInput.value = '';

  if (elements.player1Select) {
    elements.player1Select.innerHTML =
      '<option value="">-- Selecione Partida --</option>';
    elements.player1Select.disabled = true;
  }
  if (elements.player2Select) {
    elements.player2Select.innerHTML =
      '<option value="">-- Selecione Partida --</option>';
    elements.player2Select.disabled = true;
  }
}

async function handleScoreFormSubmit(event) {
  event.preventDefault();
  if (!elements.scoreForm) return;

  const submitButton = elements.scoreForm.querySelector(
    "button[type='submit']"
  );
  ui.setButtonLoading(submitButton, true);

  const currentTournamentId = state.getCurrentTournamentId();
  if (!currentTournamentId) {
    ui.showMessage('Nenhum torneio selecionado.', 'error');
    ui.setButtonLoading(submitButton, false);
    return;
  }

  const player1 = elements.player1Select.value;
  const player2 = elements.player2Select.value;
  const score1 = parseInt(elements.score1Input.value, 10);
  const score2 = parseInt(elements.score2Input.value, 10);
  const round = elements.roundInput.value;
  const matchDateTimeValue = elements.dateTimeInput.value;
  const matchIdFromForm = elements.scoreForm.dataset.matchId || null;
  const isEditing = elements.scoreForm.dataset.editing === 'true';
  const originalIndex = parseInt(elements.scoreForm.dataset.originalIndex, 10);

  if (!player1 || !player2) {
    ui.showMessage('Selecione os jogadores (via seleção de partida).', 'error');
    ui.setButtonLoading(submitButton, false);
    return;
  }
  if (player1 === player2) {
    ui.showMessage('Jogadores não podem ser iguais.', 'error');
    ui.setButtonLoading(submitButton, false);
    return;
  }
  if (!ui.isValidScore(score1, score2)) {
    ui.showMessage('Placar inválido (deve ser 2x0 ou 2x1).', 'error');
    ui.setButtonLoading(submitButton, false);
    return;
  }

  let matchDateTimeISO = null;
  if (matchDateTimeValue) {
    try {
      matchDateTimeISO = new Date(matchDateTimeValue).toISOString();
    } catch {
      ui.showMessage('Formato de data/hora inválido.', 'error');
      ui.setButtonLoading(submitButton, false);
      return;
    }
  }

  const winnerName = score1 > score2 ? player1 : player2;
  const timestamp = ui.formatMatchDate(new Date()); // Use ui.formatMatchDate for consistency

  try {
    let responseData;
    if (isEditing) {
      const currentScores = state.getCurrentScores();
      if (
        isNaN(originalIndex) ||
        originalIndex < 0 ||
        originalIndex >= currentScores.length
      ) {
        throw new Error('Índice inválido para edição de placar.');
      }
      const scoreToUpdate = currentScores[originalIndex];
      const updatedScoreEntry = {
        ...scoreToUpdate,
        player1,
        player2,
        score1,
        score2,
        round,
        winner: winnerName,
        timestamp,
        matchId: matchIdFromForm || scoreToUpdate.matchId || null,
        dateTime: matchDateTimeISO,
      };
      const updatedScoresPayload = currentScores.map((s, i) =>
        i === originalIndex ? updatedScoreEntry : s
      );
      responseData = await api.updateScores(
        currentTournamentId,
        updatedScoresPayload
      );
    } else {
      const newScorePayload = {
        tournament_id: currentTournamentId,
        player1,
        player2,
        score1,
        score2,
        round,
        matchId: matchIdFromForm,
        dateTime: matchDateTimeISO,
      };
      responseData = await api.saveScore(newScorePayload);
    }

    ui.showMessage(
      responseData.message ||
        (isEditing ? 'Placar atualizado!' : 'Placar salvo!'),
      'success'
    );
    await loadScoresHistory();
    resetScoreForm();
    if (matchIdFromForm) {
      await loadTournamentState();
    }
  } catch (_error) {
    ui.showMessage(`Erro ao salvar placar: ${_error.message}`, 'error');
  } finally {
    ui.setButtonLoading(submitButton, false);
  }
}

function setupScoresSearchListener() {
  elements.scoresSearchInput?.removeEventListener('input', handleScoresSearch);
  elements.scoresSearchInput?.addEventListener('input', handleScoresSearch);
}

function handleScoresSearch() {
  currentPageScores = 1;
  renderAdminScoresTable();
}

export function initializeScoreSection() {
  elements.scoreForm?.addEventListener('submit', handleScoreFormSubmit);
  elements.refreshScoresBtn?.addEventListener('click', loadScoresHistory);

  elements.scoresTable
    ?.querySelectorAll("thead th[scope='col']")
    .forEach((th) => {
      if (th.textContent !== 'Ações') {
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
        th.removeEventListener('click', clickHandler);
        th.removeEventListener('keydown', keydownHandler);

        th.addEventListener('click', clickHandler);
        th.addEventListener('keydown', keydownHandler);
      }
    });

  setupScoresSearchListener();
}
