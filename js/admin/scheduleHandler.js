import * as api from '../apiService.js';
import * as ui from '../uiUtils.js';
import * as state from '../state.js';
import { renderAdminBracket } from './bracketHandler.js';

const elements = {
  scheduleMatchSelect: document.getElementById('schedule-match-select'),
  scheduleMatchDateTimeInput: document.getElementById(
    'schedule-match-datetime'
  ),
  scheduleMatchForm: document.getElementById('schedule-match-form'),
};

export async function populateScheduleMatchSelect() {
  if (!elements.scheduleMatchSelect || !elements.scheduleMatchDateTimeInput)
    return;

  const tournamentState = state.getTournamentState();
  const currentTournamentId = state.getCurrentTournamentId();

  elements.scheduleMatchSelect.innerHTML =
    '<option value="">-- Selecione uma partida pendente --</option>';
  elements.scheduleMatchDateTimeInput.value = '';

  if (!tournamentState?.matches || !currentTournamentId) {
    return;
  }

  const pendingMatches = Object.entries(tournamentState.matches)
    .map(([id, match]) => ({ id, ...match }))
    .filter(
      (match) =>
        match.players?.[0]?.name &&
        match.players?.[1]?.name &&
        match.players[0].name !== 'A definir' &&
        match.players[1].name !== 'A definir' &&
        match.players[0].name !== 'BYE' &&
        match.players[1].name !== 'BYE' &&
        match.winner === null
    )
    .sort((a, b) => parseInt(a.id) - parseInt(b.id));

  pendingMatches.forEach((match) => {
    const option = document.createElement('option');
    option.value = match.id;
    const currentDateTime = match.dateTime
      ? ` [${ui.formatMatchDateTime(match.dateTime)}]`
      : '';
    option.textContent = `${match.roundName || '?'} (#${match.id}): ${match.players[0].name} vs ${match.players[1].name}${currentDateTime}`;
    option.dataset.currentDatetime = match.dateTime || '';
    elements.scheduleMatchSelect.appendChild(option);
  });

  elements.scheduleMatchSelect.removeEventListener(
    'change',
    handleScheduleMatchSelectChange
  );
  elements.scheduleMatchSelect.addEventListener(
    'change',
    handleScheduleMatchSelectChange
  );
}

function handleScheduleMatchSelectChange() {
  if (!elements.scheduleMatchSelect || !elements.scheduleMatchDateTimeInput)
    return;

  const selectedOption =
    elements.scheduleMatchSelect.options[
      elements.scheduleMatchSelect.selectedIndex
    ];

  if (elements.scheduleMatchSelect.value && selectedOption) {
    const currentDateTime = selectedOption.dataset.currentDatetime;
    try {
      elements.scheduleMatchDateTimeInput.value = currentDateTime
        ? new Date(currentDateTime).toISOString().slice(0, 16)
        : '';
    } catch (e) {
      console.warn(
        'Could not format existing date for input:',
        currentDateTime,
        e
      );
      elements.scheduleMatchDateTimeInput.value = '';
    }
  } else {
    elements.scheduleMatchDateTimeInput.value = '';
  }
}

async function handleScheduleSubmit(event) {
  event.preventDefault();
  if (!elements.scheduleMatchForm) return;

  const matchId = elements.scheduleMatchSelect.value;
  const dateTimeValue = elements.scheduleMatchDateTimeInput.value;
  const submitButton = elements.scheduleMatchForm.querySelector(
    'button[type="submit"]'
  );
  const currentTournamentId = state.getCurrentTournamentId();

  if (!currentTournamentId || !matchId || !dateTimeValue) {
    ui.showMessage('Selecione uma partida e defina a data/hora.', 'warning');
    return;
  }

  let matchDateTimeISO = null;
  try {
    matchDateTimeISO = new Date(dateTimeValue).toISOString();
  } catch {
    ui.showMessage('Formato de data/hora inválido.', 'error');
    return;
  }

  ui.setButtonLoading(submitButton, true);

  try {
    await api.updateMatchSchedule(
      currentTournamentId,
      matchId,
      matchDateTimeISO
    );

    const tournamentState = state.getTournamentState();
    if (tournamentState.matches && tournamentState.matches[matchId]) {
      tournamentState.matches[matchId].dateTime = matchDateTimeISO;
      state.setTournamentState(tournamentState);

      ui.showMessage('Agendamento salvo com sucesso!', 'success');
      await populateScheduleMatchSelect();
      renderAdminBracket();
    } else {
      ui.showMessage(
        'Erro: Partida não encontrada no estado local após salvar.',
        'warning'
      );
      await populateScheduleMatchSelect();
    }
  } catch (_error) {
    ui.showMessage('Erro ao salvar agendamento.', 'error', _error.message);
  } finally {
    ui.setButtonLoading(submitButton, false);
  }
}

export function initializeScheduleSection() {
  elements.scheduleMatchForm?.addEventListener('submit', handleScheduleSubmit);
}
