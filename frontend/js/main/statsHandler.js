import { getTournamentStats, getPlayerStats } from '../statsService.js';
import { getCurrentTournamentId } from '../state.js';
import * as ui from '../ui/utils/uiUtils.js';

let statsContainer;
let tournamentStatsSection;
let playerStatsSection;
let statsTabsContainer;

export function initStatsHandler() {
  statsContainer = document.getElementById('statistics-container');
  if (!statsContainer) {
    statsContainer = document.createElement('div');
    statsContainer.id = 'statistics-container';
    statsContainer.classList.add('statistics-container');

    const scoresHistoryContainer = document.getElementById(
      'scores-history-container'
    );
    if (scoresHistoryContainer) {
      scoresHistoryContainer.parentNode.insertBefore(
        statsContainer,
        scoresHistoryContainer.nextSibling
      );
    } else {
      const footer = document.querySelector('footer');
      const main = document.querySelector('main');
      if (footer) {
        footer.parentNode.insertBefore(statsContainer, footer);
      } else if (main) {
        main.appendChild(statsContainer);
      } else {
        document.body.appendChild(statsContainer);
      }
    }
  }

  createStatsContainerStructure();
  setupEventListeners();

  const currentTournamentId = getCurrentTournamentId();
  if (currentTournamentId) {
    loadTournamentStats(currentTournamentId);
  } else {
    showStatsPlaceholder();
  }
}

function createStatsContainerStructure() {
  statsContainer.innerHTML = `
    <div class="section-header">
      <h2>Estatísticas</h2>
      <div class="section-actions">
        <button id="refresh-stats-btn" class="btn btn-sm btn-outline">
          <i class="fas fa-sync-alt"></i> Atualizar
        </button>
      </div>
    </div>

    <div class="tabs" id="stats-tabs">
      <button class="tab-btn active" data-tab="tournament">Torneio</button>
      <button class="tab-btn" data-tab="players">Jogadores</button>
    </div>

    <div class="tab-content">
      <div id="tournament-stats" class="tab-pane active">
        <div class="stats-grid">
          <div class="stats-card" id="tournament-info-card">
            <h3>Informações do Torneio</h3>
            <div class="stats-card-content">
              <div class="loading-placeholder">Carregando...</div>
            </div>
          </div>

          <div class="stats-card" id="top-players-card">
            <h3>TOP 5 Jogadores</h3>
            <div class="stats-card-content">
              <div class="loading-placeholder">Carregando...</div>
            </div>
          </div>

          <div class="stats-card" id="common-scores-card">
            <h3>Resultados Mais Comuns</h3>
            <div class="stats-card-content">
              <div class="loading-placeholder">Carregando...</div>
            </div>
          </div>

          <div class="stats-card" id="match-stats-card">
            <h3>Dados das Partidas</h3>
            <div class="stats-card-content">
              <div class="loading-placeholder">Carregando...</div>
            </div>
          </div>
        </div>
      </div>

      <div id="players-stats" class="tab-pane">
        <div class="player-select-container">
          <label for="player-select">Selecione um jogador:</label>
          <select id="player-select">
            <option value="">-- Selecione --</option>
          </select>
        </div>

        <div class="player-stats-content">
          <div class="loading-placeholder">Selecione um jogador para ver suas estatísticas</div>
        </div>
      </div>
    </div>
  `;

  tournamentStatsSection = document.getElementById('tournament-stats');
  playerStatsSection = document.getElementById('players-stats');
  statsTabsContainer = document.getElementById('stats-tabs');
}

function setupEventListeners() {
  const refreshBtn = document.getElementById('refresh-stats-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const currentTournamentId = getCurrentTournamentId();
      if (currentTournamentId) {
        loadTournamentStats(currentTournamentId);
      } else {
        ui.showMessage('Nenhum torneio selecionado', 'warning');
      }
    });
  }

  const tabButtons = statsTabsContainer.querySelectorAll('.tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const tabId = e.target.dataset.tab;

      tabButtons.forEach((btn) => btn.classList.remove('active'));
      e.target.classList.add('active');

      document
        .querySelectorAll('.tab-pane')
        .forEach((pane) => pane.classList.remove('active'));
      document.getElementById(`${tabId}-stats`).classList.add('active');
    });
  });

  const playerSelect = document.getElementById('player-select');
  if (playerSelect) {
    playerSelect.addEventListener('change', () => {
      const selectedPlayer = playerSelect.value;
      const currentTournamentId = getCurrentTournamentId();

      if (selectedPlayer && currentTournamentId) {
        loadPlayerStats(currentTournamentId, selectedPlayer);
      }
    });
  }

  document.addEventListener('tournamentChanged', (e) => {
    if (e.detail && e.detail.tournamentId) {
      loadTournamentStats(e.detail.tournamentId);
    }
  });
}

function showStatsPlaceholder() {
  tournamentStatsSection.innerHTML = `
    <div class="no-data-message">
      <p>Selecione um torneio para visualizar suas estatísticas</p>
    </div>
  `;

  const playerSelect = document.getElementById('player-select');
  if (playerSelect) {
    playerSelect.innerHTML = '<option value="">-- Selecione --</option>';
    playerSelect.disabled = true;
  }

  const playerStatsContent = playerStatsSection.querySelector(
    '.player-stats-content'
  );
  if (playerStatsContent) {
    playerStatsContent.innerHTML = `
      <div class="no-data-message">
        <p>Selecione um torneio e um jogador para visualizar estatísticas</p>
      </div>
    `;
  }
}

export async function loadTournamentStats(tournamentId) {
  if (!tournamentId) return;

  const spinner = ui.createLoadingSpinner();
  tournamentStatsSection.querySelector('.stats-grid').appendChild(spinner);

  document
    .getElementById('tournament-info-card')
    .querySelector('.stats-card-content').innerHTML =
    '<div class="loading-placeholder">Carregando...</div>';
  document
    .getElementById('top-players-card')
    .querySelector('.stats-card-content').innerHTML =
    '<div class="loading-placeholder">Carregando...</div>';
  document
    .getElementById('common-scores-card')
    .querySelector('.stats-card-content').innerHTML =
    '<div class="loading-placeholder">Carregando...</div>';
  document
    .getElementById('match-stats-card')
    .querySelector('.stats-card-content').innerHTML =
    '<div class="loading-placeholder">Carregando...</div>';

  try {
    const stats = await getTournamentStats(tournamentId);

    if (stats) {
      renderTournamentInfo(stats.tournamentInfo);

      renderTopPlayers(stats.topPlayers);

      renderCommonScores(stats.commonScores);

      renderMatchStats(stats.matchTimeStats);

      updatePlayerSelectOptions(stats.playerPerformance);
    }
  } catch (error) {
    console.error('Erro ao carregar estatísticas do torneio:', error);
    ui.showMessage('Erro ao carregar estatísticas do torneio', 'error');

    tournamentStatsSection.querySelector('.stats-grid').innerHTML = `
      <div class="error-message">
        <p>Erro ao carregar estatísticas. Tente novamente mais tarde.</p>
      </div>
    `;
  } finally {
    ui.removeLoadingSpinner();
  }
}

function renderTournamentInfo(info) {
  if (!info) return;

  const container = document
    .getElementById('tournament-info-card')
    .querySelector('.stats-card-content');

  container.innerHTML = `
    <div class="info-item">
      <span class="info-label">Nome:</span>
      <span class="info-value">${info.name}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Tipo de Chaveamento:</span>
      <span class="info-value">${formatBracketType(info.bracketType)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Total de Jogadores:</span>
      <span class="info-value">${info.totalPlayers}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Partidas Totais:</span>
      <span class="info-value">${info.totalMatches}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Partidas Concluídas:</span>
      <span class="info-value">${info.completedMatches} de ${info.totalMatches} (${Math.round((info.completedMatches / info.totalMatches) * 100) || 0}%)</span>
    </div>
  `;
}

function formatBracketType(type) {
  const types = {
    'single-elimination': 'Eliminação Simples',
    'double-elimination': 'Eliminação Dupla',
    'round-robin': 'Todos contra Todos',
  };

  return types[type] || type;
}

function renderTopPlayers(players) {
  if (!players || players.length === 0) {
    document
      .getElementById('top-players-card')
      .querySelector('.stats-card-content').innerHTML =
      '<p>Nenhum dado disponível</p>';
    return;
  }

  const container = document
    .getElementById('top-players-card')
    .querySelector('.stats-card-content');

  let html = '<div class="top-players-list">';

  players.forEach((player, index) => {
    html += `
      <div class="top-player-item ${index === 0 ? 'champion' : ''}">
        <span class="player-rank">${index + 1}</span>
        <span class="player-name">${player.name}</span>
        <span class="player-wins">${player.wins} vitória${player.wins !== 1 ? 's' : ''}</span>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function renderCommonScores(scores) {
  if (!scores || scores.length === 0) {
    document
      .getElementById('common-scores-card')
      .querySelector('.stats-card-content').innerHTML =
      '<p>Nenhum dado disponível</p>';
    return;
  }

  const container = document
    .getElementById('common-scores-card')
    .querySelector('.stats-card-content');

  let html = '<div class="common-scores-list">';

  scores.slice(0, 5).forEach((score) => {
    html += `
      <div class="score-item">
        <span class="score-pattern">${score.pattern}</span>
        <span class="score-count">${score.count} vez${score.count !== 1 ? 'es' : ''}</span>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function renderMatchStats(stats) {
  const container = document
    .getElementById('match-stats-card')
    .querySelector('.stats-card-content');

  if (
    !stats ||
    (stats.averageDurationMinutes === null && stats.maxDurationMinutes === null)
  ) {
    container.innerHTML = `
      <p>Dados de tempo de partida não disponíveis.</p>
      <p class="stats-note">Esta funcionalidade será implementada em breve.</p>
    `;
    return;
  }

  container.innerHTML = `
    <div class="info-item">
      <span class="info-label">Tempo médio de partida:</span>
      <span class="info-value">${stats.averageDurationMinutes} minutos</span>
    </div>
    <div class="info-item">
      <span class="info-label">Partida mais rápida:</span>
      <span class="info-value">${stats.minDurationMinutes} minutos</span>
    </div>
    <div class="info-item">
      <span class="info-label">Partida mais longa:</span>
      <span class="info-value">${stats.maxDurationMinutes} minutos</span>
    </div>
  `;
}

function updatePlayerSelectOptions(players) {
  if (!players || players.length === 0) return;

  const playerSelect = document.getElementById('player-select');

  playerSelect.innerHTML = '<option value="">-- Selecione --</option>';
  playerSelect.disabled = false;

  players
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((player) => {
      const option = document.createElement('option');
      option.value = player.name;
      option.textContent = player.name;
      playerSelect.appendChild(option);
    });
}

export async function loadPlayerStats(tournamentId, playerName) {
  if (!tournamentId || !playerName) return;

  const playerStatsContent = playerStatsSection.querySelector(
    '.player-stats-content'
  );

  playerStatsContent.innerHTML = '';
  const spinner = ui.createLoadingSpinner();
  playerStatsContent.appendChild(spinner);

  try {
    const stats = await getPlayerStats(tournamentId, playerName);

    if (stats) {
      renderPlayerStats(stats);
    }
  } catch (error) {
    console.error(
      `Erro ao carregar estatísticas do jogador ${playerName}:`,
      error
    );
    ui.showMessage('Erro ao carregar estatísticas do jogador', 'error');

    playerStatsContent.innerHTML = `
      <div class="error-message">
        <p>Erro ao carregar estatísticas do jogador. Tente novamente mais tarde.</p>
      </div>
    `;
  } finally {
    ui.removeLoadingSpinner();
  }
}

function renderPlayerStats(stats) {
  if (!stats) return;

  const playerStatsContent = playerStatsSection.querySelector(
    '.player-stats-content'
  );

  playerStatsContent.innerHTML = `
    <div class="player-stats-grid">
      <div class="stats-card">
        <h3>Perfil do Jogador</h3>
        <div class="stats-card-content">
          <div class="info-item">
            <span class="info-label">Nome:</span>
            <span class="info-value">${stats.player.name}</span>
          </div>
          ${
            stats.player.nickname
              ? `
            <div class="info-item">
              <span class="info-label">Apelido:</span>
              <span class="info-value">${stats.player.nickname}</span>
            </div>
          `
              : ''
          }
          <div class="info-item">
            <span class="info-label">Partidas Jogadas:</span>
            <span class="info-value">${stats.player.gamesPlayed}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Vitórias:</span>
            <span class="info-value">${stats.player.wins}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Derrotas:</span>
            <span class="info-value">${stats.player.losses}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Taxa de Vitória:</span>
            <span class="info-value">${stats.winRate}%</span>
          </div>
          <div class="info-item">
            <span class="info-label">Diferença Média de Pontos:</span>
            <span class="info-value">${stats.averageScoreDifference > 0 ? '+' : ''}${stats.averageScoreDifference}</span>
          </div>
        </div>
      </div>

      <div class="stats-card">
        <h3>Histórico de Partidas</h3>
        <div class="stats-card-content">
          ${renderMatchHistory(stats.matchHistory)}
        </div>
      </div>

      <div class="stats-card">
        <h3>Estatísticas Contra Oponentes</h3>
        <div class="stats-card-content">
          ${renderOpponentStats(stats.opponentStats)}
        </div>
      </div>
    </div>
  `;
}

function renderMatchHistory(matches) {
  if (!matches || matches.length === 0) {
    return '<p>Nenhuma partida registrada</p>';
  }

  let html = `
    <div class="match-history-table">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Adversário</th>
            <th>Resultado</th>
            <th>Placar</th>
          </tr>
        </thead>
        <tbody>
  `;

  matches.forEach((match) => {
    const isPlayer1 =
      match.player1 === document.getElementById('player-select').value;
    const opponent = isPlayer1 ? match.player2 : match.player1;
    const playerScore = isPlayer1 ? match.score1 : match.score2;
    const opponentScore = isPlayer1 ? match.score2 : match.score1;

    const isWin =
      match.winner === document.getElementById('player-select').value;

    html += `
      <tr class="${isWin ? 'win' : 'loss'}">
        <td>${ui.formatMatchDate(match.date)}</td>
        <td>${opponent || 'N/A'}</td>
        <td><span class="result-badge ${isWin ? 'win' : 'loss'}">${isWin ? 'Vitória' : 'Derrota'}</span></td>
        <td>${playerScore} - ${opponentScore}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

function renderOpponentStats(opponentStats) {
  if (!opponentStats || Object.keys(opponentStats).length === 0) {
    return '<p>Nenhuma estatística contra oponentes disponível</p>';
  }

  let html = `
    <div class="opponent-stats-table">
      <table>
        <thead>
          <tr>
            <th>Oponente</th>
            <th>Partidas</th>
            <th>V</th>
            <th>D</th>
            <th>Taxa</th>
          </tr>
        </thead>
        <tbody>
  `;

  const opponents = Object.entries(opponentStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.played - a.played);

  opponents.forEach((opponent) => {
    const winRate = Math.round((opponent.wins / opponent.played) * 100);

    html += `
      <tr>
        <td>${opponent.name}</td>
        <td>${opponent.played}</td>
        <td>${opponent.wins}</td>
        <td>${opponent.losses}</td>
        <td>${winRate}%</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}
