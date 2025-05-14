import * as api from '../apiService.js';
import * as ui from '../uiUtils.js';
import * as state from '../state.js';
import { loadTournamentState } from './bracketHandler.js';
import { loadPlayersList } from './playerHandler.js';
import { loadScoresHistory } from './scoreHandler.js';

const elements = {
  tournamentsTableBody: document.getElementById('tournaments-body'),
  tournamentSelect: document.getElementById('current-tournament'),
  refreshBtnList: document.getElementById('btn-refresh-tournaments-list'),
  newTournamentForm: document.getElementById('new-tournament-form'),
  searchInput: document.getElementById('search-tournaments'),
  editCard: document.getElementById('selected-tournament-details-card'),
  editForm: document.getElementById('edit-tournament-form'),
  editHeading: document.getElementById('selected-tournament-heading'),
  editIdInput: document.getElementById('edit-tournament-id'),
  editNameInput: document.getElementById('edit-tournament-name'),
  editDescInput: document.getElementById('edit-tournament-description'),
  editStatusSelect: document.getElementById('edit-tournament-status'),
  editDateDisplay: document.getElementById('edit-tournament-date'),
  editTypeDisplay: document.getElementById('edit-tournament-type-display'),
  editEntryFeeInput: document.getElementById('edit-tournament-entry-fee'),
  editPrizePoolInput: document.getElementById('edit-tournament-prize-pool'),
  editRulesInput: document.getElementById('edit-tournament-rules'),
  saveDetailsBtn: document.getElementById('btn-save-tournament-details'),
};

async function fetchAndUpdateTournaments() {
  try {
    console.log('[tournamentHandler] Fetching tournaments...');
    const tournaments = await api.getTournaments();
    console.log('[tournamentHandler] Tournaments fetched:', tournaments);
    // Filter out tournaments with status 'Cancelado'
    const activeTournaments = Array.isArray(tournaments)
      ? tournaments.filter((t) => t.status !== 'Cancelado')
      : [];
    console.log('[tournamentHandler] Active tournaments:', activeTournaments);
    state.setTournamentsList(activeTournaments);
  } catch (error) {
    ui.showMessage(
      'Erro ao carregar lista de torneios.',
      'error',
      error.message
    );
    state.setTournamentsList([]);
  }
}

function populateTournamentSelect() {
  if (!elements.tournamentSelect) return;
  const previouslySelectedTournamentId = elements.tournamentSelect.value;
  const currentGlobalId = state.getCurrentTournamentId();
  const tournaments = state.getTournamentsList();

  elements.tournamentSelect.innerHTML =
    '<option value="">Selecione um torneio</option>';

  tournaments.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    return dateB - dateA;
  });

  tournaments.forEach((tournament) => {
    const option = document.createElement('option');
    option.value = tournament.id;
    option.textContent = tournament.name || `Torneio ${tournament.id}`;
    elements.tournamentSelect.appendChild(option);
  });

  const isValidPrevious =
    previouslySelectedTournamentId &&
    tournaments.some((t) => t.id === previouslySelectedTournamentId);
  const isValidCurrentGlobal =
    currentGlobalId && tournaments.some((t) => t.id === currentGlobalId);

  if (isValidCurrentGlobal) {
    elements.tournamentSelect.value = currentGlobalId;
  } else if (isValidPrevious) {
    elements.tournamentSelect.value = previouslySelectedTournamentId;
    if (!currentGlobalId) {
      state.setCurrentTournamentId(previouslySelectedTournamentId);
    }
  } else {
    elements.tournamentSelect.value = '';
  }
}

function renderTournamentsTable(tournamentsToRender = null) {
  if (!elements.tournamentsTableBody) return;
  elements.tournamentsTableBody.innerHTML = '';

  const currentId = state.getCurrentTournamentId();
  const tournaments =
    tournamentsToRender !== null
      ? tournamentsToRender
      : state.getTournamentsList().filter((t) => t.status !== 'Cancelado'); // Ensure 'Cancelado' are not rendered

  console.log(
    '[tournamentHandler] Rendering table with tournaments:',
    tournaments
  );

  if (!Array.isArray(tournaments) || tournaments.length === 0) {
    elements.tournamentsTableBody.innerHTML =
      '<tr><td colspan="4" style="text-align: center;">Nenhum torneio encontrado.</td></tr>';
    return;
  }

  tournaments.forEach((tournament) => {
    const row = elements.tournamentsTableBody.insertRow();
    if (tournament.id === currentId) {
      row.classList.add('selected-row');
    }

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
    row.insertCell().textContent = tournament.status || 'Pendente';

    const actionCell = row.insertCell();
    actionCell.classList.add('action-cell');

    const selectBtn = ui.createActionButton(
      'Selecionar',
      'select',
      tournament.id,
      [],
      async (e) => {
        ui.setButtonLoading(e.target, true);
        await selectTournament(tournament.id);
      }
    );
    const viewBtn = ui.createActionButton(
      'Visualizar',
      'view',
      tournament.id,
      ['btn-edit'],
      () => {
        window.open(`index.html?tournament=${tournament.id}`, '_blank');
      }
    );
    const trashBtn = ui.createActionButton(
      'Excluir',
      'delete',
      tournament.id,
      ['btn-delete'],
      async (e) => {
        const tournamentId = tournament.id;
        const tournamentName = tournament.name || tournament.id;
        console.log(
          `[tournamentHandler] Attempting to trash tournament: ${tournamentName} (ID: ${tournamentId})`
        );
        if (
          !confirm(
            `Tem certeza que deseja mover o torneio "${tournamentName}" para a lixeira?`
          )
        ) {
          console.log(
            `[tournamentHandler] Trashing cancelled by user for tournament: ${tournamentName}`
          );
          return;
        }
        const buttonElement = e.target;
        ui.setButtonLoading(buttonElement, true);
        try {
          console.log(
            `[tournamentHandler] Calling api.trashTournament for ID: ${tournamentId}`
          );
          const result = await api.trashTournament(tournamentId);
          console.log(
            '[tournamentHandler] trashTournament API result:',
            result
          );
          ui.showMessage(
            result.message,
            result.success ? 'success' : 'warning'
          );
          console.log(
            '[tournamentHandler] Calling loadTournamentsList after trashing.'
          );
          await loadTournamentsList(); // This line was reported as slow
          console.log(
            '[tournamentHandler] loadTournamentsList completed after trashing.'
          );
        } catch (error) {
          ui.showMessage(
            'Erro ao mover torneio para a lixeira.',
            'error',
            error.message
          );
        } finally {
          ui.setButtonLoading(buttonElement, false);
        }
      }
    );

    actionCell.append(selectBtn, viewBtn, trashBtn);
  });
}

export async function selectTournament(tournamentId) {
  state.setCurrentTournamentId(tournamentId);
  if (elements.tournamentSelect) elements.tournamentSelect.value = tournamentId;

  renderTournamentsTable();

  const selectedTournamentData = state.findTournamentById(tournamentId);
  if (selectedTournamentData) {
    displaySelectedTournamentDetails(selectedTournamentData);
  } else {
    hideSelectedTournamentDetails();
  }

  const loadPromises = [
    loadTournamentState(),
    loadPlayersList(),
    loadScoresHistory(),
  ];

  const results = await Promise.allSettled(loadPromises);
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Error loading data part ${index}:`, result.reason);
    }
  });

  const selectedTournamentName = selectedTournamentData?.name || tournamentId;
  ui.showMessage(`Torneio "${selectedTournamentName}" selecionado.`);
}

async function handleCreateTournament(event) {
  event.preventDefault();
  if (!elements.newTournamentForm) return;

  const submitButton = elements.newTournamentForm.querySelector(
    "button[type='submit']"
  );
  ui.setButtonLoading(submitButton, true);
  const formData = new FormData(elements.newTournamentForm);

  try {
    const data = await api.createTournament(formData);
    ui.showMessage(data.message || 'Torneio criado com sucesso!', 'success');
    elements.newTournamentForm.reset();
    await loadTournamentsList();
    if (data.tournamentId) {
      await selectTournament(data.tournamentId);
    }
  } catch (error) {
    ui.showMessage(`Erro ao criar torneio: ${error.message}`, 'error');
  } finally {
    ui.setButtonLoading(submitButton, false);
  }
}

async function handleSaveTournamentDetails(event) {
  event.preventDefault();
  if (!elements.editForm || !elements.saveDetailsBtn) return;

  ui.setButtonLoading(elements.saveDetailsBtn, true);

  const tournamentId = elements.editIdInput.value;
  const name = elements.editNameInput.value.trim();
  const description = elements.editDescInput.value.trim();
  const status = elements.editStatusSelect.value;
  const entryFee = elements.editEntryFeeInput.value.trim();
  const prizePool = elements.editPrizePoolInput.value.trim();
  const rules = elements.editRulesInput.value.trim();

  if (!tournamentId) {
    ui.showMessage('Erro: ID do torneio ausente no formulário.', 'error');
    ui.setButtonLoading(elements.saveDetailsBtn, false);
    return;
  }

  const originalData = state.findTournamentById(tournamentId);
  let changesMade = false;
  let errors = [];

  try {
    if (originalData && name !== originalData.name) {
      try {
        await api.updateTournamentName(tournamentId, name);
        changesMade = true;
      } catch (err) {
        errors.push(`Nome: ${err.message}`);
      }
    }

    if (originalData && description !== originalData.description) {
      try {
        await api.updateTournamentDescription(tournamentId, description);
        changesMade = true;
      } catch (err) {
        errors.push(`Descrição: ${err.message}`);
      }
    }

    if (originalData && status !== originalData.status) {
      try {
        await api.updateTournamentStatus(tournamentId, status);
        changesMade = true;
      } catch (err) {
        errors.push(`Status: ${err.message}`);
      }
    }

    // Novos campos
    if (
      originalData &&
      entryFee !== (originalData.entry_fee?.toString() || '')
    ) {
      try {
        await api.updateTournamentEntryFee(
          tournamentId,
          parseFloat(entryFee) || 0
        );
        changesMade = true;
      } catch (err) {
        errors.push(`Taxa de Inscrição: ${err.message}`);
      }
    }

    if (originalData && prizePool !== (originalData.prize_pool || '')) {
      try {
        await api.updateTournamentPrizePool(tournamentId, prizePool);
        changesMade = true;
      } catch (err) {
        errors.push(`Premiação: ${err.message}`);
      }
    }

    if (originalData && rules !== (originalData.rules || '')) {
      try {
        await api.updateTournamentRules(tournamentId, rules);
        changesMade = true;
      } catch (err) {
        errors.push(`Regras: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      ui.showMessage(
        'Erro ao salvar algumas alterações:',
        'error',
        errors.join('<br>')
      );
    } else if (changesMade) {
      ui.showMessage('Alterações salvas com sucesso!', 'success');
      await loadTournamentsList();
      const updatedData = state.findTournamentById(tournamentId);
      if (updatedData) displaySelectedTournamentDetails(updatedData);
      renderTournamentsTable();
    } else {
      ui.showMessage('Nenhuma alteração detectada.', 'info');
    }
  } catch (error) {
    console.error('Erro geral ao salvar detalhes do torneio:', error);
    ui.showMessage(
      'Erro de comunicação ao salvar alterações.',
      'error',
      error.message
    );
  } finally {
    ui.setButtonLoading(elements.saveDetailsBtn, false);
  }
}

function displaySelectedTournamentDetails(tournamentData) {
  if (
    !elements.editCard ||
    !elements.editForm ||
    !elements.editHeading ||
    !tournamentData
  ) {
    console.error('Edit form elements not found or no tournament data.');
    return;
  }
  elements.editIdInput.value = tournamentData.id || '';
  elements.editNameInput.value = tournamentData.name || '';
  elements.editDescInput.value = tournamentData.description || '';
  elements.editStatusSelect.value = tournamentData.status || 'Pendente';
  elements.editDateDisplay.value = tournamentData.date
    ? new Date(tournamentData.date).toLocaleDateString('pt-BR')
    : 'N/A';
  elements.editTypeDisplay.value = tournamentData.type || 'N/A';
  elements.editEntryFeeInput.value = tournamentData.entry_fee?.toString() || '';
  elements.editPrizePoolInput.value = tournamentData.prize_pool || '';
  elements.editRulesInput.value = tournamentData.rules || '';

  elements.editHeading.textContent = `Detalhes/Editar: ${tournamentData.name || tournamentData.id}`;
  elements.editCard.classList.remove('hidden-section');
}

function hideSelectedTournamentDetails() {
  if (elements.editCard) {
    elements.editCard.classList.add('hidden-section');
  }
  if (elements.editForm) {
    elements.editForm.reset();
    elements.editIdInput.value = '';
  }
}

export async function loadTournamentsList() {
  if (elements.refreshBtnList)
    ui.setButtonLoading(elements.refreshBtnList, true);
  await fetchAndUpdateTournaments();
  populateTournamentSelect();
  renderTournamentsTable();
  const currentId = state.getCurrentTournamentId();
  if (currentId) {
    const currentData = state.findTournamentById(currentId);
    if (currentData) {
      displaySelectedTournamentDetails(currentData);
    } else {
      state.setCurrentTournamentId(null);
      hideSelectedTournamentDetails();
    }
  } else {
    hideSelectedTournamentDetails();
  }
  if (elements.refreshBtnList)
    ui.setButtonLoading(elements.refreshBtnList, false);
}

export function initializeTournamentSection() {
  elements.tournamentSelect?.addEventListener('change', function () {
    if (this.value) {
      selectTournament(this.value);
    } else {
      state.setCurrentTournamentId(null);
      renderTournamentsTable();
      hideSelectedTournamentDetails();
    }
  });

  elements.refreshBtnList?.addEventListener('click', loadTournamentsList);

  elements.newTournamentForm?.addEventListener(
    'submit',
    handleCreateTournament
  );

  elements.searchInput?.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    const filteredTournaments = state
      .getTournamentsList()
      .filter(
        (t) =>
          t.name?.toLowerCase().includes(searchTerm) ||
          t.id?.toLowerCase().includes(searchTerm)
      );
    renderTournamentsTable(filteredTournaments);
  });

  elements.editForm?.addEventListener('submit', handleSaveTournamentDetails);
}
