import { showMessage } from './uiUtils.js';

const STATS_API_BASE_URL = '/api/stats';

export async function getSystemStats() {
  try {
    const response = await fetch(`${STATS_API_BASE_URL}/system`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Erro ao buscar estatísticas do sistema'
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estatísticas do sistema:', error);
    showMessage('Erro ao carregar estatísticas do sistema', 'error');
    return null;
  }
}

export async function getTournamentStats(tournamentId) {
  if (!tournamentId) {
    showMessage('ID de torneio não fornecido', 'error');
    return null;
  }

  try {
    const response = await fetch(
      `${STATS_API_BASE_URL}/tournaments/${tournamentId}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Erro ao buscar estatísticas do torneio'
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Erro ao buscar estatísticas do torneio ${tournamentId}:`,
      error
    );
    showMessage('Erro ao carregar estatísticas do torneio', 'error');
    return null;
  }
}

export async function getPlayerStats(tournamentId, playerName) {
  if (!tournamentId || !playerName) {
    showMessage('ID de torneio e nome do jogador são obrigatórios', 'error');
    return null;
  }

  try {
    const response = await fetch(
      `${STATS_API_BASE_URL}/players/${tournamentId}/${encodeURIComponent(playerName)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Erro ao buscar estatísticas do jogador'
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Erro ao buscar estatísticas do jogador ${playerName}:`,
      error
    );
    showMessage('Erro ao carregar estatísticas do jogador', 'error');
    return null;
  }
}
