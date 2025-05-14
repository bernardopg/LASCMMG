import * as api from '../apiService.js';
import * as ui from '../uiUtils.js';
import * as state from '../state.js';
import { loadTournamentsList } from './tournamentHandler.js';

const elements = {
  trashTableBody: document.getElementById('trash-body'),
  refreshTrashBtn: document.getElementById('btn-refresh-trash'),
  emptyTrashBtn: document.getElementById('btn-empty-trash'),
  paginationContainer: document.getElementById('admin-trash-pagination'),
};

let currentPageTrash = 1;
const itemsPerPageTrash = 15;

export async function loadTrash() {
  if (!elements.trashTableBody) return;

  elements.trashTableBody.innerHTML =
    '<tr><td colspan="3" style="text-align: center;"><div class="loading-indicator">Carregando lixeira...</div></td></tr>';
  if (elements.paginationContainer) elements.paginationContainer.innerHTML = '';

  try {
    const trashedTournaments = await api.getTrashedTournaments();
    state.setTrashedTournamentsList(trashedTournaments);
    currentPageTrash = 1;
    renderTrashTable();
  } catch (error) {
    ui.showMessage('Erro ao carregar lixeira.', 'error', error.message);
    state.setTrashedTournamentsList([]);
    renderTrashTable();
    elements.trashTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: red;">Erro ao carregar lixeira.</td></tr>`;
  }
}

function renderTrashTable() {
  if (!elements.trashTableBody) return;
  elements.trashTableBody.innerHTML = '';

  const allTrashed = state.getTrashedTournamentsList();

  const totalItems = allTrashed.length;
  const startIndex = (currentPageTrash - 1) * itemsPerPageTrash;
  const endIndex = startIndex + itemsPerPageTrash;
  const paginatedTrashed = allTrashed.slice(startIndex, endIndex);

  if (paginatedTrashed.length === 0) {
    elements.trashTableBody.innerHTML =
      '<tr><td colspan="3" style="text-align: center;">Lixeira vazia.</td></tr>';
  } else {
    paginatedTrashed.forEach((tournament) => {
      const row = elements.trashTableBody.insertRow();

      let dateStr = 'Data Indisponível';
      if (tournament.date) {
        try {
          const dateObj = new Date(tournament.date);
          if (!isNaN(dateObj.getTime())) {
            dateStr = dateObj.toLocaleDateString('pt-BR');
          }
        } catch {
          /* Ignora erro de data inválida */
        }
      }

      row.insertCell().textContent = tournament.name || 'Sem Nome';
      row.insertCell().textContent = dateStr;

      const actionCell = row.insertCell();
      actionCell.classList.add('action-cell');

      const restoreBtn = ui.createActionButton(
        'Restaurar',
        'restore',
        tournament.id,
        ['btn-success-custom'],
        async (e) => {
          await handleRestoreTournament(
            tournament.id,
            tournament.name,
            e.target
          );
        }
      );
      const deletePermBtn = ui.createActionButton(
        'Excluir Perm.',
        'delete-permanently',
        tournament.id,
        ['btn-delete'],
        async (e) => {
          await handleDeletePermanently(
            tournament.id,
            tournament.name,
            e.target
          );
        }
      );
      actionCell.append(restoreBtn, deletePermBtn);
    });
  }
  renderTrashPaginationControls(totalItems);
}

function renderTrashPaginationControls(totalItems) {
  if (!elements.paginationContainer) return;
  elements.paginationContainer.innerHTML = '';

  const totalPages = Math.ceil(totalItems / itemsPerPageTrash);

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
    button.addEventListener('click', () => changeTrashPage(pageNum));
    return button;
  };

  const prevButton = createPageButton(
    'Anterior',
    currentPageTrash - 1,
    currentPageTrash === 1
  );
  elements.paginationContainer.appendChild(prevButton);

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Página ${currentPageTrash} de ${totalPages}`;
  pageInfo.style.margin = '0 10px';
  pageInfo.setAttribute('aria-live', 'polite');
  elements.paginationContainer.appendChild(pageInfo);

  const nextButton = createPageButton(
    'Próximo',
    currentPageTrash + 1,
    currentPageTrash === totalPages
  );
  elements.paginationContainer.appendChild(nextButton);
}

function changeTrashPage(newPage) {
  const totalItems = state.getTrashedTournamentsList().length;
  const totalPages = Math.ceil(totalItems / itemsPerPageTrash);

  if (newPage >= 1 && newPage <= totalPages) {
    currentPageTrash = newPage;
    renderTrashTable();
  }
}

async function handleRestoreTournament(
  tournamentId,
  tournamentName,
  buttonElement
) {
  if (
    !confirm(
      `Tem certeza que deseja restaurar o torneio "${tournamentName || tournamentId}" da lixeira?`
    )
  )
    return;

  ui.setButtonLoading(buttonElement, true);
  try {
    const result = await api.restoreTournament(tournamentId);
    ui.showMessage(result.message, 'success');
    await loadTrash();
    await loadTournamentsList();
  } catch (error) {
    ui.showMessage('Erro ao restaurar torneio.', 'error', error.message);
  } finally {
    ui.setButtonLoading(buttonElement, false);
  }
}

async function handleDeletePermanently(
  tournamentId,
  tournamentName,
  buttonElement
) {
  if (
    !confirm(
      `ATENÇÃO! Excluir PERMANENTEMENTE o torneio "${tournamentName || tournamentId}"? Esta ação não pode ser desfeita.`
    )
  )
    return;

  ui.setButtonLoading(buttonElement, true);
  try {
    const result = await api.deleteTournamentPermanently(tournamentId);
    ui.showMessage(result.message, 'success');
    await loadTrash();
    const currentId = state.getCurrentTournamentId();
    const trashedList = state.getTrashedTournamentsList();
    if (currentId && trashedList.some((t) => t.id === currentId)) {
      state.setCurrentTournamentId(null);
    }
    await loadTournamentsList();
  } catch (error) {
    ui.showMessage(
      'Erro ao excluir torneio permanentemente.',
      'error',
      error.message
    );
  } finally {
    ui.setButtonLoading(elements.emptyTrashBtn, false);
  }
}

async function handleEmptyTrash() {
  if (
    !confirm(
      'ATENÇÃO! Esvaziar a lixeira? Todos os torneios nela serão excluídos PERMANENTEMENTE. Esta ação não pode ser desfeita.'
    )
  )
    return;

  ui.setButtonLoading(elements.emptyTrashBtn, true);
  try {
    const result = await api.emptyTrash();
    ui.showMessage(result.message, 'success');
    await loadTrash();
    const currentId = state.getCurrentTournamentId();
    const trashedList = state.getTrashedTournamentsList();
    if (currentId && trashedList.some((t) => t.id === currentId)) {
      state.setCurrentTournamentId(null);
    }
    await loadTournamentsList();
  } catch (error) {
    ui.showMessage('Erro ao esvaziar a lixeira.', 'error', error.message);
  } finally {
    ui.setButtonLoading(elements.emptyTrashBtn, false);
  }
}

export function initializeTrashSection() {
  elements.refreshTrashBtn?.addEventListener('click', loadTrash);
  elements.emptyTrashBtn?.addEventListener('click', handleEmptyTrash);
}
