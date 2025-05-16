import * as api from '../api/apiService.js';
import * as ui from '../ui/utils/uiUtils.js';
import * as state from '../state/state.js';

const elements = {
  playersTableBody: document.getElementById('admin-players-body'),
  addPlayerForm: document.getElementById('admin-player-form'),
  playerNameInput: document.getElementById('player-name'),
  playerNicknameInput: document.getElementById('player-nickname'),
  playerGenderInput: document.getElementById('player-gender'), // Novo
  playerSkillLevelInput: document.getElementById('player-skill-level'), // Novo
  refreshPlayersBtn: document.getElementById('btn-refresh-players'),
  importPlayersJsonInput: document.getElementById('import-players-json'),
  importPlayersTournamentJsonInput: document.getElementById(
    'import-players-tournament-json'
  ),
  searchInput: document.getElementById('search-players'),
  manualAddPlayerForm: document.getElementById(
    'manual-add-player-to-tournament-form'
  ),
  manualPlayerNameInput: document.getElementById(
    'manual-tournament-player-name'
  ),
  manualPlayerNicknameInput: document.getElementById(
    'manual-tournament-player-nickname'
  ),
  manualPlayerGenderInput: document.getElementById(
    'manual-tournament-player-gender'
  ), // Novo
  manualPlayerSkillLevelInput: document.getElementById(
    'manual-tournament-player-skill-level'
  ), // Novo
  paginationContainer: document.getElementById('admin-players-pagination'),
};

let currentPagePlayers = 1;
const itemsPerPagePlayers = 15;

export async function loadPlayersList() {
  const currentTournamentId = state.getCurrentTournamentId();
  if (!elements.playersTableBody || !currentTournamentId) {
    if (elements.playersTableBody) {
      elements.playersTableBody.innerHTML =
        '<tr><td colspan="5" style="text-align: center;">Selecione um torneio.</td></tr>'; // Colspan atualizado para 5
    }
    state.setPlayersList([]);
    renderAdminPlayersTable();
    return;
  }

  elements.playersTableBody.innerHTML =
    '<tr><td colspan="3" style="text-align: center;"><div class="loading-indicator">Carregando...</div></td></tr>';
  if (elements.paginationContainer) elements.paginationContainer.innerHTML = '';

  try {
    const playersData = await api.getPlayers(currentTournamentId);
    // Certifique-se de que gender e skill_level estão sendo retornados e mapeados corretamente
    const processedPlayers = playersData.map((p, index) => ({
      ...p,
      originalIndex: index, // Mantém o índice original para edição
      serverData: p, // Guarda os dados originais do servidor
    }));
    state.setPlayersList(processedPlayers);
    currentPagePlayers = 1;
    renderAdminPlayersTable();
    setupPlayerSearchListener();
  } catch (error) {
    ui.showMessage('Erro ao carregar jogadores.', 'error', error.message);
    state.setPlayersList([]);
    renderAdminPlayersTable();
    if (elements.playersTableBody) {
      elements.playersTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Erro: ${error.message}</td></tr>`; // Colspan atualizado para 5
    }
  }
}

function renderAdminPlayersTable() {
  if (!elements.playersTableBody) return;
  elements.playersTableBody.innerHTML = '';

  const searchTerm = elements.searchInput?.value.toLowerCase().trim() || '';
  const allPlayers = state.getPlayersList();

  const filteredPlayers = searchTerm
    ? allPlayers.filter(
        (player) =>
          player.name?.toLowerCase().includes(searchTerm) ||
          player.nickname?.toLowerCase().includes(searchTerm)
      )
    : allPlayers;

  const totalItems = filteredPlayers.length;
  const startIndex = (currentPagePlayers - 1) * itemsPerPagePlayers;
  const endIndex = startIndex + itemsPerPagePlayers;
  const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

  if (paginatedPlayers.length === 0) {
    elements.playersTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">${searchTerm ? 'Nenhum jogador encontrado para a busca.' : 'Nenhum jogador encontrado.'}</td></tr>`; // Colspan atualizado para 5
  } else {
    paginatedPlayers.forEach((player) => {
      const row = elements.playersTableBody.insertRow();
      row.dataset.playerNameForDelete = player.name;

      row.insertCell().textContent = player.name;
      row.insertCell().textContent = player.nickname || '-';
      row.insertCell().textContent = player.gender || '-'; // Novo
      row.insertCell().textContent = player.skill_level || '-'; // Novo

      const actionCell = row.insertCell();
      actionCell.classList.add('action-cell');

      const editBtn = ui.createActionButton(
        'Editar',
        'edit',
        null,
        ['btn-edit'],
        () => {
          editPlayer(
            player.originalIndex,
            player.name,
            player.nickname,
            player.gender,
            player.skill_level
          );
        }
      );
      const deleteBtn = ui.createActionButton(
        'Excluir',
        'delete',
        null,
        ['btn-danger'], // Alterado de btn-delete para btn-danger
        async (e) => {
          await deletePlayer(player.name, e.target);
        }
      );
      actionCell.append(editBtn, deleteBtn);
    });
  }
  renderPlayersPaginationControls(totalItems);
}

function renderPlayersPaginationControls(totalItems) {
  if (!elements.paginationContainer) return;
  elements.paginationContainer.innerHTML = '';

  const totalPages = Math.ceil(totalItems / itemsPerPagePlayers);

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
    button.addEventListener('click', () => changePlayersPage(pageNum));
    return button;
  };

  const prevButton = createPageButton(
    'Anterior',
    currentPagePlayers - 1,
    currentPagePlayers === 1
  );
  elements.paginationContainer.appendChild(prevButton);

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Página ${currentPagePlayers} de ${totalPages}`;
  pageInfo.style.margin = '0 10px';
  pageInfo.setAttribute('aria-live', 'polite');
  elements.paginationContainer.appendChild(pageInfo);

  const nextButton = createPageButton(
    'Próximo',
    currentPagePlayers + 1,
    currentPagePlayers === totalPages
  );
  elements.paginationContainer.appendChild(nextButton);
}

function changePlayersPage(newPage) {
  const searchTerm = elements.searchInput?.value.toLowerCase().trim() || '';
  const totalItems = searchTerm
    ? state
        .getPlayersList()
        .filter(
          (p) =>
            p.name?.toLowerCase().includes(searchTerm) ||
            p.nickname?.toLowerCase().includes(searchTerm)
        ).length
    : state.getPlayersList().length;
  const totalPages = Math.ceil(totalItems / itemsPerPagePlayers);

  if (newPage >= 1 && newPage <= totalPages) {
    currentPagePlayers = newPage;
    renderAdminPlayersTable();
  }
}

function editPlayer(originalIndex, name, nickname, gender, skillLevel) {
  if (
    !elements.addPlayerForm ||
    !elements.playerNameInput ||
    !elements.playerNicknameInput ||
    !elements.playerGenderInput || // Novo
    !elements.playerSkillLevelInput // Novo
  )
    return;

  elements.playerNameInput.value = name;
  elements.playerNicknameInput.value = nickname;
  elements.playerGenderInput.value = gender || ''; // Novo
  elements.playerSkillLevelInput.value = skillLevel || ''; // Novo
  elements.addPlayerForm.dataset.editing = 'true';
  elements.addPlayerForm.dataset.originalName = name;
  const submitButton = elements.addPlayerForm.querySelector(
    "button[type='submit']"
  );
  if (submitButton) submitButton.textContent = 'Atualizar Jogador';
  elements.addPlayerForm.scrollIntoView({ behavior: 'smooth' });
}

async function deletePlayer(playerName, buttonElement) {
  const currentTournamentId = state.getCurrentTournamentId();
  if (!currentTournamentId) {
    ui.showMessage('Selecione um torneio.', 'error');
    return;
  }
  if (
    !confirm(
      `Tem certeza que deseja excluir o jogador "${playerName}" deste torneio?`
    )
  ) {
    return;
  }

  ui.setButtonLoading(buttonElement, true);

  const updatedPlayersPayload = state
    .getPlayersList()
    .filter((p) => p.name !== playerName)
    .map((p) => p.serverData);

  try {
    await api.updatePlayers(currentTournamentId, updatedPlayersPayload);
    ui.showMessage('Jogador excluído com sucesso!', 'success');
    await loadPlayersList();
  } catch (error) {
    ui.showMessage(`Erro ao excluir jogador: ${error.message}`, 'error');
  } finally {
    ui.setButtonLoading(buttonElement, false);
  }
}

function resetPlayerForm() {
  if (elements.addPlayerForm) {
    elements.addPlayerForm.reset();
    elements.addPlayerForm.dataset.editing = 'false';
    delete elements.addPlayerForm.dataset.originalName;
    const submitButton = elements.addPlayerForm.querySelector(
      "button[type='submit']"
    );
    if (submitButton) submitButton.textContent = 'Adicionar';
  }
}

async function handleAddEditPlayer(event) {
  event.preventDefault();
  const currentTournamentId = state.getCurrentTournamentId();
  if (!currentTournamentId) {
    ui.showMessage('Selecione um torneio.', 'error');
    return;
  }
  if (
    !elements.addPlayerForm ||
    !elements.playerNameInput ||
    !elements.playerNicknameInput ||
    !elements.playerGenderInput || // Novo
    !elements.playerSkillLevelInput // Novo
  )
    return;

  const playerName = elements.playerNameInput.value.trim();
  const playerNickname = elements.playerNicknameInput.value.trim();
  const playerGender = elements.playerGenderInput.value; // Novo
  const playerSkillLevel = elements.playerSkillLevelInput.value; // Novo

  if (!playerName) {
    ui.showMessage('Nome do jogador é obrigatório.', 'error');
    return;
  }

  const submitButton = elements.addPlayerForm.querySelector(
    "button[type='submit']"
  );
  ui.setButtonLoading(submitButton, true);

  const isEditing = elements.addPlayerForm.dataset.editing === 'true';
  const originalName = elements.addPlayerForm.dataset.originalName;

  try {
    if (isEditing && originalName) {
      const playerToEdit = state.findPlayersListEntryByName(originalName);
      if (!playerToEdit) {
        throw new Error('Jogador original não encontrado para edição.');
      }
      const updatedPlayersPayload = state.getPlayersList().map((p) => {
        if (p.name === originalName) {
          return {
            ...p.serverData,
            PlayerName: playerName,
            Nickname: playerNickname,
            gender: playerGender, // Novo
            skill_level: playerSkillLevel, // Novo
          };
        }
        return p.serverData;
      });
      await api.updatePlayers(currentTournamentId, updatedPlayersPayload);
      ui.showMessage('Jogador atualizado com sucesso!', 'success');
    } else {
      await api.addPlayer(currentTournamentId, {
        PlayerName: playerName,
        Nickname: playerNickname,
        gender: playerGender, // Novo
        skill_level: playerSkillLevel, // Novo
      });
      ui.showMessage('Jogador adicionado com sucesso!', 'success');
    }
    await loadPlayersList();
    resetPlayerForm();
  } catch (error) {
    ui.showMessage(`Erro ao salvar jogador: ${error.message}`, 'error');
  } finally {
    ui.setButtonLoading(submitButton, false);
  }
}

async function handleManualAddPlayer(event) {
  event.preventDefault();
  const currentTournamentId = state.getCurrentTournamentId();
  if (!currentTournamentId) {
    ui.showMessage('Selecione um torneio.', 'error');
    return;
  }
  if (
    !elements.manualAddPlayerForm ||
    !elements.manualPlayerNameInput ||
    !elements.manualPlayerNicknameInput ||
    !elements.manualPlayerGenderInput || // Novo
    !elements.manualPlayerSkillLevelInput // Novo
  )
    return;

  const name = elements.manualPlayerNameInput.value.trim();
  const nick = elements.manualPlayerNicknameInput.value.trim();
  const gender = elements.manualPlayerGenderInput.value; // Novo
  const skillLevel = elements.manualPlayerSkillLevelInput.value; // Novo

  if (!name) {
    ui.showMessage('Nome do jogador é obrigatório.', 'error');
    return;
  }

  const btn = elements.manualAddPlayerForm.querySelector(
    "button[type='submit']"
  );
  ui.setButtonLoading(btn, true);

  try {
    await api.addPlayer(currentTournamentId, {
      PlayerName: name,
      Nickname: nick,
      gender, // Novo
      skill_level: skillLevel, // Novo
    });
    ui.showMessage('Jogador adicionado com sucesso!', 'success');
    elements.manualPlayerNameInput.value = '';
    elements.manualPlayerNicknameInput.value = '';
    elements.manualPlayerGenderInput.value = ''; // Novo
    elements.manualPlayerSkillLevelInput.value = ''; // Novo
    await loadPlayersList();
  } catch (error) {
    ui.showMessage(`Erro ao adicionar jogador: ${error.message}`, 'error');
  } finally {
    ui.setButtonLoading(btn, false);
  }
}

async function importPlayersFromFile(tournamentId, file, buttonElement) {
  if (!tournamentId || !file) {
    ui.showMessage('ID do torneio ou arquivo ausente.', 'error');
    return;
  }
  ui.setButtonLoading(buttonElement, true);
  const formData = new FormData();
  formData.append('jsonFile', file);

  try {
    const data = await api.importPlayers(tournamentId, formData);
    ui.showMessage(`${data.message} (${data.count || 0} jogadores)`, 'success');
    await loadPlayersList();
  } catch (error) {
    ui.showMessage(`Erro ao importar jogadores: ${error.message}`, 'error');
  } finally {
    ui.setButtonLoading(buttonElement, false);
    const fileInputId = buttonElement?.getAttribute('for');
    const fileInput = fileInputId
      ? document.getElementById(fileInputId)
      : buttonElement.tagName === 'INPUT'
        ? buttonElement
        : null;
    if (fileInput && fileInput.type === 'file') {
      fileInput.value = '';
    }
  }
}

function setupPlayerSearchListener() {
  elements.searchInput?.removeEventListener('input', handlePlayerSearch);
  elements.searchInput?.addEventListener('input', handlePlayerSearch);
}

function handlePlayerSearch() {
  currentPagePlayers = 1;
  renderAdminPlayersTable();
}

export function initializePlayerSection() {
  elements.addPlayerForm?.addEventListener('submit', handleAddEditPlayer);
  elements.refreshPlayersBtn?.addEventListener('click', loadPlayersList);
  elements.manualAddPlayerForm?.addEventListener(
    'submit',
    handleManualAddPlayer
  );

  elements.importPlayersJsonInput?.addEventListener('change', function (event) {
    const currentId = state.getCurrentTournamentId();
    if (event.target.files.length > 0 && currentId) {
      const label = document.querySelector(`label[for="import-players-json"]`);
      importPlayersFromFile(
        currentId,
        event.target.files[0],
        label || event.target
      );
    } else if (!currentId) {
      ui.showMessage('Selecione um torneio primeiro.', 'warning');
      event.target.value = '';
    }
  });

  elements.importPlayersTournamentJsonInput?.addEventListener(
    'change',
    function (event) {
      const currentId = state.getCurrentTournamentId();
      if (event.target.files.length > 0 && currentId) {
        const label = document.querySelector(
          `label[for="import-players-tournament-json"]`
        );
        importPlayersFromFile(
          currentId,
          event.target.files[0],
          label || event.target
        );
      } else if (!currentId) {
        ui.showMessage('Selecione um torneio primeiro.', 'warning');
        event.target.value = '';
      }
    }
  );

  setupPlayerSearchListener();
}
