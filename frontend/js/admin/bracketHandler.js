import * as api from '../api/apiService.js';
import * as ui from '../ui/utils/uiUtils.js';
import * as state from '../state/state.js';
import { showSection } from './navigation.js';
import { loadScoresHistory } from './scoreHandler.js';

const elements = {
  bracketView: document.getElementById('admin-bracket-view'),
  generateBracketBtn: document.getElementById('btn-gerar-chaveamento'),
  resetTournamentBtn: document.getElementById('btn-reiniciar-torneio'),
  exportDataBtn: document.getElementById('btn-exportar-dados'),
};

export async function loadTournamentState() {
  const currentTournamentId = state.getCurrentTournamentId();
  if (!elements.bracketView || !currentTournamentId) {
    if (elements.bracketView) {
      elements.bracketView.innerHTML =
        '<div class="no-data">Selecione um torneio.</div>';
    }
    state.setTournamentState({});
    return;
  }

  elements.bracketView.innerHTML =
    '<div class="loading-indicator">Carregando chaveamento...</div>';
  try {
    const fetchedState = await api.getTournamentState(currentTournamentId);
    state.setTournamentState(fetchedState);
    renderAdminBracket();
  } catch (error) {
    ui.showMessage(
      'Erro ao carregar estado do torneio.',
      'error',
      error.message
    );
    state.setTournamentState({});
    if (elements.bracketView) {
      elements.bracketView.innerHTML = `<div class="error-message">Erro: ${error.message}</div>`;
    }
  }
}

export function renderAdminBracket() {
  if (!elements.bracketView) return;
  elements.bracketView.innerHTML = '';

  const tournamentState = state.getTournamentState();
  const bracketType = tournamentState?.bracket_type || 'single-elimination';

  if (
    !tournamentState?.matches ||
    Object.keys(tournamentState.matches).length === 0
  ) {
    const noData = document.createElement('div');
    noData.className = 'no-data';
    noData.innerHTML =
      '<p>Nenhum chaveamento gerado. Use o botão "Gerar Chaveamento".</p>';
    elements.bracketView.appendChild(noData);
    return;
  }

  const title = document.createElement('h3');
  title.textContent =
    tournamentState.tournamentName || 'Chaveamento do Torneio';
  title.classList.add('tournament-title');
  elements.bracketView.appendChild(title);

  const displayContainer = document.createElement('div');
  displayContainer.classList.add('bracket-display-container');
  elements.bracketView.appendChild(displayContainer);

  const matchesByBracket = { WB: [], LB: [], GF: [] };
  Object.entries(tournamentState.matches).forEach(([id, match]) => {
    const bracketKey = match.bracket?.toUpperCase() || 'WB';
    if (matchesByBracket[bracketKey]) {
      matchesByBracket[bracketKey].push({ id, ...match });
    } else {
      matchesByBracket.WB.push({ id, ...match });
    }
  });

  if (matchesByBracket.WB.length > 0) {
    const wbContainer = document.createElement('div');
    wbContainer.classList.add('bracket-section', 'winners-bracket');
    const wbTitle = document.createElement('h4');
    wbTitle.textContent = 'Chave Superior (Winners)';
    wbTitle.classList.add('bracket-section-title');
    wbContainer.appendChild(wbTitle);
    renderBracketSection(
      wbContainer,
      matchesByBracket.WB,
      bracketType === 'double-elimination' ? 'WB ' : ''
    );
    displayContainer.appendChild(wbContainer);
  }

  if (bracketType === 'double-elimination' && matchesByBracket.LB.length > 0) {
    const lbContainer = document.createElement('div');
    lbContainer.classList.add('bracket-section', 'losers-bracket');
    const lbTitle = document.createElement('h4');
    lbTitle.textContent = 'Chave Inferior (Losers)';
    lbTitle.classList.add('bracket-section-title');
    lbContainer.appendChild(lbTitle);
    renderBracketSection(lbContainer, matchesByBracket.LB, 'LB ');
    displayContainer.appendChild(lbContainer);
  }

  if (matchesByBracket.GF.length > 0) {
    const gfContainer = document.createElement('div');
    gfContainer.classList.add('bracket-section', 'grand-final');
    const gfTitle = document.createElement('h4');
    gfTitle.textContent = 'Grande Final';
    gfTitle.classList.add('bracket-section-title');
    gfContainer.appendChild(gfTitle);
    renderBracketSection(gfContainer, matchesByBracket.GF, '');
    displayContainer.appendChild(gfContainer);
  }
}

function renderBracketSection(container, matches, roundPrefix) {
  const matchesByRound = {};
  matches.forEach((match) => {
    const roundName = match.roundName || 'Desconhecida';
    if (!matchesByRound[roundName]) matchesByRound[roundName] = [];
    matchesByRound[roundName].push(match);
  });

  const roundOrder = [
    `${roundPrefix}Rodada 1`,
    `${roundPrefix}Rodada 2`,
    `${roundPrefix}Rodada 3`,
    `${roundPrefix}Rodada 4`,
    `${roundPrefix}Rodada 5`,
    `${roundPrefix}Rodada 6`,
    `${roundPrefix}Rodada 7`,
    `${roundPrefix}Rodada 8`,
    `${roundPrefix}Oitavas de Final`,
    `${roundPrefix}Quartas de Final`,
    `${roundPrefix}Semifinais`,
    `${roundPrefix}Final`,
    'Grande Final',
    'Grande Final Reset',
  ];

  const sortedRoundNames = Object.keys(matchesByRound).sort((a, b) => {
    const indexA = roundOrder.indexOf(a);
    const indexB = roundOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    const numA = parseInt(a.split(' ').pop());
    const numB = parseInt(b.split(' ').pop());
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  const display = document.createElement('div');
  display.classList.add('bracket-display');
  container.appendChild(display);

  sortedRoundNames.forEach((roundName) => {
    const roundDiv = document.createElement('div');
    roundDiv.classList.add('bracket-round');

    const roundTitle = document.createElement('h5');
    roundTitle.textContent = roundName.startsWith(roundPrefix)
      ? roundName.substring(roundPrefix.length)
      : roundName;
    roundTitle.classList.add('round-title');
    roundDiv.appendChild(roundTitle);

    matchesByRound[roundName].sort((a, b) => parseInt(a.id) - parseInt(b.id));

    matchesByRound[roundName].forEach((match) => {
      const matchDiv = createAdminMatchElement(match);
      roundDiv.appendChild(matchDiv);
    });
    display.appendChild(roundDiv);
  });
}

function createAdminMatchElement(match) {
  const matchDiv = document.createElement('div');
  matchDiv.classList.add('admin-match');
  matchDiv.dataset.matchId = match.id;
  matchDiv.tabIndex = 0;
  matchDiv.role = 'button';

  const p1Name = match.players?.[0]?.name || 'A definir';
  const p2Name = match.players?.[1]?.name || 'A definir';
  const isPending = match.winner === null;
  const isReady =
    p1Name !== 'A definir' &&
    p1Name !== 'BYE' &&
    p2Name !== 'A definir' &&
    p2Name !== 'BYE';

  matchDiv.setAttribute(
    'aria-label',
    `Partida ${match.id}: ${p1Name} vs ${p2Name}. ${!isPending ? 'Concluída.' : 'Pendente.'} Data: ${ui.formatMatchDateTime(match.dateTime)}`
  );

  const p1Div = createPlayerElement(
    match.players?.[0],
    match.winner === 0,
    !isPending && match.winner !== 0
  );
  matchDiv.appendChild(p1Div);

  const vs = document.createElement('div');
  vs.className = 'vs';
  vs.textContent = 'vs';
  matchDiv.appendChild(vs);

  const p2Div = createPlayerElement(
    match.players?.[1],
    match.winner === 1,
    !isPending && match.winner !== 1
  );
  matchDiv.appendChild(p2Div);

  const dateTimeDiv = document.createElement('div');
  dateTimeDiv.className = 'admin-match-datetime';
  dateTimeDiv.textContent = ui.formatMatchDateTime(match.dateTime);
  matchDiv.appendChild(dateTimeDiv);

  if (isReady && isPending) {
    const manualWinnerDiv = document.createElement('div');
    manualWinnerDiv.className = 'manual-winner-controls';

    const btnP1 = ui.createActionButton(
      `W ${p1Name.split(' ')[0]}`,
      'win-p1',
      match.id,
      ['btn-wo', 'btn-small'],
      (e) => {
        e.stopPropagation();
        handleSetManualWinner(match.id, 0, e.target);
      }
    );
    const btnP2 = ui.createActionButton(
      `W ${p2Name.split(' ')[0]}`,
      'win-p2',
      match.id,
      ['btn-wo', 'btn-small'],
      (e) => {
        e.stopPropagation();
        handleSetManualWinner(match.id, 1, e.target);
      }
    );

    manualWinnerDiv.append(btnP1, btnP2);
    matchDiv.appendChild(manualWinnerDiv);
  }

  if (isReady) {
    matchDiv.addEventListener('click', () => showMatchEditDialog(match));
    matchDiv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showMatchEditDialog(match);
      }
    });
  } else {
    matchDiv.style.cursor = 'default';
    matchDiv.removeAttribute('role');
    matchDiv.removeAttribute('tabindex');
  }

  return matchDiv;
}

function createPlayerElement(playerData, isWinner, isLoser) {
  const pDiv = document.createElement('div');
  pDiv.classList.add('admin-player');
  if (isWinner) pDiv.classList.add('winner');
  if (isLoser) pDiv.classList.add('loser');

  const nameSpan = document.createElement('span');
  nameSpan.className = 'name';
  nameSpan.textContent = playerData?.name || 'A definir';
  pDiv.appendChild(nameSpan);

  const scoreSpan = document.createElement('span');
  scoreSpan.classList.add('score');
  if (playerData?.score !== null && playerData?.score !== undefined) {
    scoreSpan.textContent = playerData.score;
  } else {
    scoreSpan.textContent = '-';
    scoreSpan.classList.add('not-played');
  }
  pDiv.appendChild(scoreSpan);

  return pDiv;
}

function showMatchEditDialog(match) {
  if (
    confirm(
      `Registrar/Atualizar resultado para: ${match.players[0].name} vs ${match.players[1].name}?`
    )
  ) {
    showSection('placar');

    const scoreForm = document.getElementById('admin-score-form');
    const matchSelect = document.getElementById('admin-match-select');
    const player1Select = document.getElementById('admin-player1');
    const player2Select = document.getElementById('admin-player2');
    const score1Input = document.getElementById('admin-score1');
    const score2Input = document.getElementById('admin-score2');
    const roundInput = document.getElementById('admin-round');
    const dateTimeInput = document.getElementById('admin-match-datetime');

    if (
      !scoreForm ||
      !matchSelect ||
      !player1Select ||
      !player2Select ||
      !score1Input ||
      !score2Input ||
      !roundInput ||
      !dateTimeInput
    ) {
      console.error('Score form elements not found for pre-filling.');
      ui.showMessage('Erro ao preparar formulário de placar.', 'error');
      return;
    }

    player1Select.innerHTML = `<option value="${match.players[0].name}">${match.players[0].name}</option>`;
    player2Select.innerHTML = `<option value="${match.players[1].name}">${match.players[1].name}</option>`;
    player1Select.value = match.players[0].name;
    player2Select.value = match.players[1].name;
    player1Select.disabled = true;
    player2Select.disabled = true;
    score1Input.value = match.players[0].score ?? '';
    score2Input.value = match.players[1].score ?? '';
    roundInput.value = match.roundName || '';
    try {
      elements.dateTimeInput.value = match.dateTime
        ? new Date(match.dateTime).toISOString().slice(0, 16)
        : '';
    } catch {
      /* Ignora o erro de data inválida */
    }
    scoreForm.dataset.editing = 'false';
    delete scoreForm.dataset.originalIndex;
    scoreForm.dataset.matchId = match.id;
    const submitButton = scoreForm.querySelector("button[type='submit']");
    if (submitButton) submitButton.textContent = 'Salvar Placar';
    matchSelect.value = match.id;
    scoreForm.scrollIntoView({ behavior: 'smooth' });
  }
}

async function handleSetManualWinner(matchId, winnerIndex, buttonElement) {
  const currentTournamentId = state.getCurrentTournamentId();
  if (!currentTournamentId) return;

  const matchData = state.getTournamentState().matches?.[matchId];
  if (!matchData || !matchData.players) return;
  const winnerName = matchData.players[winnerIndex]?.name;
  const loserName = matchData.players[1 - winnerIndex]?.name;

  if (
    !confirm(
      `Confirmar vitória de ${winnerName} sobre ${loserName} (W.O.) para a partida #${matchId}?`
    )
  ) {
    return;
  }

  ui.setButtonLoading(buttonElement, true);
  try {
    const result = await api.setManualWinner(
      currentTournamentId,
      matchId,
      winnerIndex
    );
    ui.showMessage(result.message, 'success');
    await loadTournamentState();
  } catch (error) {
    ui.showMessage(`Erro ao definir vencedor: ${error.message}`, 'error');
  } finally {
    const parent = buttonElement.parentElement;
    parent
      ?.querySelectorAll('.btn-wo')
      .forEach((btn) => ui.setButtonLoading(btn, false));
  }
}

async function handleGenerateBracket() {
  const currentTournamentId = state.getCurrentTournamentId();
  if (!currentTournamentId) {
    ui.showMessage('Selecione um torneio.', 'error');
    return;
  }
  if (
    !confirm(
      `Tem certeza que deseja gerar um novo chaveamento para o torneio atual? O chaveamento existente será perdido.`
    )
  ) {
    return;
  }

  ui.setButtonLoading(elements.generateBracketBtn, true);
  try {
    const data = await api.generateBracket(currentTournamentId);
    ui.showMessage(data.message, 'success');
    await loadTournamentState();
  } catch (error) {
    ui.showMessage(`Erro ao gerar chaveamento: ${error.message}`, 'error');
  } finally {
    ui.setButtonLoading(elements.generateBracketBtn, false);
  }
}

async function handleResetTournament() {
  const currentTournamentId = state.getCurrentTournamentId();
  if (!currentTournamentId) {
    ui.showMessage('Selecione um torneio.', 'error');
    return;
  }
  if (
    !confirm(
      `Tem certeza que deseja resetar o torneio atual? Placares e estado do chaveamento serão perdidos.`
    )
  ) {
    return;
  }

  ui.setButtonLoading(elements.resetTournamentBtn, true);
  try {
    const data = await api.resetTournament(currentTournamentId);
    ui.showMessage(data.message, 'success');
    await loadTournamentState();
    await loadScoresHistory();
  } catch (error) {
    ui.showMessage(`Erro ao resetar torneio: ${error.message}`, 'error');
  } finally {
    ui.setButtonLoading(elements.resetTournamentBtn, false);
  }
}

function handleExportData() {
  const currentTournamentId = state.getCurrentTournamentId();
  if (!currentTournamentId) {
    ui.showMessage('Selecione um torneio para exportar.', 'error');
    return;
  }
  try {
    ui.showMessage('Iniciando exportação de jogadores...', 'info');
    api.exportPlayers(currentTournamentId);
  } catch (error) {
    ui.showMessage(
      'Erro ao iniciar exportação de jogadores.',
      'error',
      error.message
    );
  }

  try {
    ui.showMessage('Iniciando exportação de placares...', 'info');
    api.exportScores(currentTournamentId);
  } catch (error) {
    ui.showMessage(
      'Erro ao iniciar exportação de placares.',
      'error',
      error.message
    );
  }

  try {
    ui.showMessage('Iniciando exportação de chaveamento...', 'info');
    api.exportBracket(currentTournamentId);
  } catch (error) {
    ui.showMessage(
      'Erro ao iniciar exportação de chaveamento.',
      'error',
      error.message
    );
  }
}

export function initializeBracketSection() {
  elements.generateBracketBtn?.addEventListener('click', handleGenerateBracket);
  elements.resetTournamentBtn?.addEventListener('click', handleResetTournament);
  elements.exportDataBtn?.addEventListener('click', handleExportData);
}
