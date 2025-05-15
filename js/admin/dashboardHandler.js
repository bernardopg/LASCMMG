import * as api from '../apiService.js';
import * as ui from '../uiUtils.js';
import { safeDOM, sanitizeData } from '../securityUtils.js';

const elements = {
  dashboardSection: document.getElementById('section-dashboard'),
  activeTournamentsContainer: null,
  upcomingMatchesContainer: null,
  statsContainer: null,
  refreshBtn: null,
};

let dashboardData = {
  activeTournaments: [],
  upcomingMatches: [],
  systemStats: {},
};

export function initDashboard() {
  if (elements.activeTournamentsContainer) return;

  elements.activeTournamentsContainer = document.getElementById(
    'active-tournaments-container'
  );
  elements.upcomingMatchesContainer = document.getElementById(
    'upcoming-matches-container'
  );
  elements.statsContainer = document.getElementById(
    'dashboard-stats-container'
  );
  elements.refreshBtn = document.getElementById('refresh-dashboard-btn');

  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', () => refreshDashboard());
  }

  refreshDashboard();
}

export async function refreshDashboard() {
  ui.setButtonLoading(elements.refreshBtn, true);

  try {
    const [activeTournaments, upcomingMatches, systemStats] = await Promise.all(
      [fetchActiveTournaments(), fetchUpcomingMatches(), fetchSystemStats()]
    );

    dashboardData = {
      activeTournaments: sanitizeData(activeTournaments),
      upcomingMatches: sanitizeData(upcomingMatches),
      systemStats: sanitizeData(systemStats),
    };

    renderActiveTournaments();
    renderUpcomingMatches();
    renderSystemStats();

    ui.showMessage('Dashboard atualizado com sucesso', 'success');
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
    ui.showMessage('Erro ao atualizar o dashboard', 'error', error.message);
  } finally {
    ui.setButtonLoading(elements.refreshBtn, false);
  }
}

async function fetchActiveTournaments() {
  try {
    const response = await api.getTournaments();
    if (!response || !Array.isArray(response)) {
      throw new Error('Formato inválido de resposta');
    }

    return response.filter(
      (tournament) => tournament.status === 'Em Andamento'
    );
  } catch (error) {
    console.error('Erro ao buscar torneios ativos:', error);
    return [];
  }
}

async function fetchUpcomingMatches() {
  try {
    const allTournaments = await api.getTournaments();
    if (!allTournaments || !Array.isArray(allTournaments)) {
      throw new Error('Formato inválido de resposta para torneios');
    }

    const allMatches = [];

    for (const tournament of allTournaments) {
      if (
        tournament.status !== 'Em Andamento' &&
        tournament.status !== 'Pendente'
      ) {
        continue;
      }

      try {
        const tournamentState = await api.getTournamentState(tournament.id);
        if (!tournamentState || !Array.isArray(tournamentState.matches))
          continue;

        const now = new Date();
        const upcomingInTournament = tournamentState.matches
          .filter((match) => {
            if (!match.datetime) return false;

            const matchDate = new Date(match.datetime);
            const isInFuture = matchDate > now;
            const notPlayed = !match.winner || match.winner === '';

            return isInFuture && notPlayed;
          })
          .map((match) => ({
            ...match,
            tournamentId: tournament.id,
            tournamentName: tournament.name,
          }));

        allMatches.push(...upcomingInTournament);
      } catch (error) {
        console.error(
          `Erro ao buscar estado do torneio ${tournament.id}:`,
          error
        );
      }
    }

    allMatches.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    return allMatches.slice(0, 10);
  } catch (error) {
    console.error('Erro ao buscar próximos jogos:', error);
    return [];
  }
}

async function fetchSystemStats() {
  try {
    const response = await fetch('/api/system/stats');
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estatísticas do sistema:', error);
    return {
      totalTournaments: 0,
      totalPlayers: 0,
      totalMatches: 0,
      recentActivity: [],
    };
  }
}

function renderActiveTournaments() {
  if (!elements.activeTournamentsContainer) return;

  elements.activeTournamentsContainer.innerHTML = '';

  if (dashboardData.activeTournaments.length === 0) {
    elements.activeTournamentsContainer.appendChild(
      safeDOM.createElement(
        'p',
        { class: 'info-message' },
        'Não há torneios ativos no momento.'
      )
    );
    return;
  }

  const table = safeDOM.createElement('table', { class: 'data-table' });
  const thead = safeDOM.createElement('thead');
  const tbody = safeDOM.createElement('tbody');

  const headerRow = safeDOM.createElement('tr');
  ['Nome', 'Data', 'Jogadores', 'Progresso', 'Ações'].forEach((text) => {
    const th = safeDOM.createElement('th', {}, text);
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  dashboardData.activeTournaments.forEach((tournament) => {
    const row = safeDOM.createElement('tr');

    const nameCell = safeDOM.createElement('td');
    const nameLink = safeDOM.createElement(
      'a',
      {
        href: '#',
        'data-id': tournament.id,
        'data-action': 'view-tournament',
      },
      tournament.name
    );
    nameLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('current-tournament').value = tournament.id;
      document
        .getElementById('current-tournament')
        .dispatchEvent(new Event('change'));
      document.getElementById('menu-tournaments').click();
    });
    nameCell.appendChild(nameLink);

    const dateCell = safeDOM.createElement('td');
    try {
      const date = new Date(tournament.date);
      safeDOM.setText(dateCell, date.toLocaleDateString('pt-BR'));
    } catch {
      safeDOM.setText(dateCell, 'Data inválida');
    }

    const playersCell = safeDOM.createElement('td');
    safeDOM.setText(playersCell, tournament.playerCount || 'N/A');

    const progressCell = safeDOM.createElement('td');
    if (tournament.progress !== undefined) {
      const progressWrapper = safeDOM.createElement('div', {
        class: 'progress-wrapper',
      });
      const progressBar = safeDOM.createElement('div', {
        class: 'progress-bar',
        style: `width: ${tournament.progress}%`,
      });
      const progressText = safeDOM.createElement(
        'span',
        { class: 'progress-text' },
        `${tournament.progress}%`
      );
      progressWrapper.appendChild(progressBar);
      progressWrapper.appendChild(progressText);
      progressCell.appendChild(progressWrapper);
    } else {
      safeDOM.setText(progressCell, 'N/A');
    }

    const actionsCell = safeDOM.createElement('td', { class: 'actions-cell' });
    const viewBtn = safeDOM.createElement(
      'button',
      {
        class: 'btn btn-primary btn-small',
        'data-id': tournament.id,
        'data-action': 'view-tournament',
      },
      'Ver'
    );
    viewBtn.addEventListener('click', () => {
      document.getElementById('current-tournament').value = tournament.id;
      document
        .getElementById('current-tournament')
        .dispatchEvent(new Event('change'));
      document.getElementById('menu-tournaments').click();
    });
    actionsCell.appendChild(viewBtn);

    row.appendChild(nameCell);
    row.appendChild(dateCell);
    row.appendChild(playersCell);
    row.appendChild(progressCell);
    row.appendChild(actionsCell);

    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  elements.activeTournamentsContainer.appendChild(table);
}

function renderUpcomingMatches() {
  if (!elements.upcomingMatchesContainer) return;

  elements.upcomingMatchesContainer.innerHTML = '';

  if (dashboardData.upcomingMatches.length === 0) {
    elements.upcomingMatchesContainer.appendChild(
      safeDOM.createElement(
        'p',
        { class: 'info-message' },
        'Não há jogos agendados no momento.'
      )
    );
    return;
  }

  const matchesList = safeDOM.createElement('ul', { class: 'matches-list' });

  dashboardData.upcomingMatches.forEach((match) => {
    const matchItem = safeDOM.createElement('li', { class: 'match-item' });

    const matchHeader = safeDOM.createElement('div', { class: 'match-header' });

    const tournamentName = safeDOM.createElement(
      'span',
      { class: 'tournament-name' },
      match.tournamentName || 'Torneio desconhecido'
    );

    const matchDate = safeDOM.createElement('span', { class: 'match-date' });
    safeDOM.setText(matchDate, ui.formatMatchDateTime(match.datetime));

    matchHeader.appendChild(tournamentName);
    matchHeader.appendChild(matchDate);

    const matchContent = safeDOM.createElement('div', {
      class: 'match-content',
    });

    const player1 = safeDOM.createElement(
      'div',
      { class: 'player' },
      match.player1 || 'A definir'
    );

    const player2 = safeDOM.createElement(
      'div',
      { class: 'player' },
      match.player2 || 'A definir'
    );

    matchContent.appendChild(player1);
    matchContent.appendChild(
      safeDOM.createElement('div', { class: 'vs' }, 'vs')
    );
    matchContent.appendChild(player2);

    const matchActions = safeDOM.createElement('div', {
      class: 'match-actions',
    });
    const editBtn = safeDOM.createElement(
      'button',
      {
        class: 'btn btn-primary btn-small',
        'data-tournament-id': match.tournamentId,
        'data-match-id': match.id,
      },
      'Editar'
    );

    editBtn.addEventListener('click', () => {
      document.getElementById('current-tournament').value = match.tournamentId;
      document
        .getElementById('current-tournament')
        .dispatchEvent(new Event('change'));
      document.getElementById('menu-agendamento').click();

      setTimeout(() => {
        const scheduleSelect = document.getElementById('schedule-match-select');
        if (scheduleSelect) {
          scheduleSelect.value = match.id;
          scheduleSelect.dispatchEvent(new Event('change'));
        }
      }, 500);
    });

    matchActions.appendChild(editBtn);

    matchItem.appendChild(matchHeader);
    matchItem.appendChild(matchContent);
    matchItem.appendChild(matchActions);

    matchesList.appendChild(matchItem);
  });

  elements.upcomingMatchesContainer.appendChild(matchesList);
}

function renderSystemStats() {
  if (!elements.statsContainer) return;

  elements.statsContainer.innerHTML = '';

  const stats = dashboardData.systemStats;

  const statsCards = safeDOM.createElement('div', { class: 'stats-cards' });

  const tournamentsCard = createStatCard(
    'Torneios',
    stats.totalTournaments || 0,
    'tournament-icon'
  );
  statsCards.appendChild(tournamentsCard);

  const playersCard = createStatCard(
    'Jogadores',
    stats.totalPlayers || 0,
    'player-icon'
  );
  statsCards.appendChild(playersCard);

  const matchesCard = createStatCard(
    'Partidas',
    stats.totalMatches || 0,
    'match-icon'
  );
  statsCards.appendChild(matchesCard);

  const activityCard = safeDOM.createElement('div', {
    class: 'stat-card activity-card',
  });
  const activityTitle = safeDOM.createElement(
    'h3',
    { class: 'stat-title' },
    'Atividade Recente'
  );
  const activityList = safeDOM.createElement('ul', { class: 'activity-list' });

  if (stats.recentActivity && stats.recentActivity.length > 0) {
    stats.recentActivity.forEach((activity) => {
      const activityItem = safeDOM.createElement('li', {
        class: 'activity-item',
      });
      const activityText = safeDOM.createElement(
        'span',
        { class: 'activity-text' },
        activity.description || 'Atividade desconhecida'
      );
      const activityTime = safeDOM.createElement('span', {
        class: 'activity-time',
      });
      safeDOM.setText(activityTime, ui.formatMatchDateTime(activity.timestamp));

      activityItem.appendChild(activityText);
      activityItem.appendChild(activityTime);
      activityList.appendChild(activityItem);
    });
  } else {
    const emptyItem = safeDOM.createElement(
      'li',
      { class: 'empty-item' },
      'Nenhuma atividade recente.'
    );
    activityList.appendChild(emptyItem);
  }

  activityCard.appendChild(activityTitle);
  activityCard.appendChild(activityList);

  elements.statsContainer.appendChild(statsCards);
  elements.statsContainer.appendChild(activityCard);
}

function createStatCard(title, value, iconClass) {
  const card = safeDOM.createElement('div', { class: 'stat-card' });
  const icon = safeDOM.createElement('div', {
    class: `stat-icon ${iconClass}`,
  });
  const content = safeDOM.createElement('div', { class: 'stat-content' });
  const valueElem = safeDOM.createElement(
    'div',
    { class: 'stat-value' },
    String(value)
  );
  const titleElem = safeDOM.createElement(
    'div',
    { class: 'stat-title' },
    title
  );

  content.appendChild(valueElem);
  content.appendChild(titleElem);

  card.appendChild(icon);
  card.appendChild(content);

  return card;
}

export default {
  initDashboard,
  refreshDashboard,
};
