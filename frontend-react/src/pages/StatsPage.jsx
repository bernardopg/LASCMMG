import React, { useState, useEffect, useCallback } from 'react';
import { useTournament } from '../context/TournamentContext';
import {
  getTournamentStats,
  getPlayerStats,
  getPlayers,
} from '../services/api';
import { useMessage } from '../context/MessageContext';
import { FaSyncAlt, FaChartBar, FaUsers } from 'react-icons/fa';

// Helper function to format bracket type (from old statsHandler)
const formatBracketType = (type) => {
  const types = {
    'single-elimination': 'Eliminação Simples',
    'double-elimination': 'Eliminação Dupla',
    'round-robin': 'Todos contra Todos',
  };
  return types[type] || type || 'Não especificado';
};

const StatsPage = () => {
  const { currentTournament } = useTournament();
  const { showMessage } = useMessage();

  const [activeTab, setActiveTab] = useState('tournament'); // 'tournament' or 'players'
  const [tournamentStats, setTournamentStats] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [allPlayersForSelect, setAllPlayersForSelect] = useState([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');

  const [loadingTournamentStats, setLoadingTournamentStats] = useState(false);
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(false);

  const fetchTournamentStats = useCallback(async () => {
    if (!currentTournament?.id) {
      setTournamentStats(null);
      setAllPlayersForSelect([]);
      return;
    }
    setLoadingTournamentStats(true);
    try {
      const stats = await getTournamentStats(currentTournament.id);
      setTournamentStats(stats);
      // Populate player select from tournament stats if available, or fetch separately
      if (stats?.playerPerformance) {
        setAllPlayersForSelect(
          stats.playerPerformance.sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        const players = await getPlayers(currentTournament.id);
        setAllPlayersForSelect(
          players.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        );
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas do torneio:', error);
      showMessage(
        `Erro ao carregar estatísticas do torneio: ${error.message}`,
        'error'
      );
      setTournamentStats(null);
    } finally {
      setLoadingTournamentStats(false);
    }
  }, [currentTournament?.id, showMessage]);

  const fetchPlayerStats = useCallback(async () => {
    if (!currentTournament?.id || !selectedPlayerName) {
      setPlayerStats(null);
      return;
    }
    setLoadingPlayerStats(true);
    try {
      const stats = await getPlayerStats(
        currentTournament.id,
        selectedPlayerName
      );
      setPlayerStats(stats);
    } catch (error) {
      console.error(
        `Erro ao carregar estatísticas do jogador ${selectedPlayerName}:`,
        error
      );
      showMessage(
        `Erro ao carregar estatísticas do jogador: ${error.message}`,
        'error'
      );
      setPlayerStats(null);
    } finally {
      setLoadingPlayerStats(false);
    }
  }, [currentTournament?.id, selectedPlayerName, showMessage]);

  useEffect(() => {
    fetchTournamentStats();
  }, [fetchTournamentStats]);

  useEffect(() => {
    if (activeTab === 'players' && selectedPlayerName) {
      fetchPlayerStats();
    } else {
      setPlayerStats(null); // Clear player stats if tab or player changes
    }
  }, [activeTab, selectedPlayerName, fetchPlayerStats]);

  const renderTournamentInfoCard = () => {
    if (!tournamentStats?.tournamentInfo)
      return (
        <p className="text-gray-400 dark:text-gray-500">
          Informações não disponíveis.
        </p>
      );
    const info = tournamentStats.tournamentInfo;
    const completionPercentage =
      info.totalMatches > 0
        ? Math.round((info.completedMatches / info.totalMatches) * 100)
        : 0;
    return (
      <div className="card bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
          Informações do Torneio
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <p>
            <strong>Nome:</strong> {info.name || 'N/A'}
          </p>
          <p>
            <strong>Tipo:</strong> {formatBracketType(info.bracketType)}
          </p>
          <p>
            <strong>Jogadores:</strong> {info.totalPlayers || 0}
          </p>
          <p>
            <strong>Partidas:</strong> {info.totalMatches || 0}
          </p>
          <p>
            <strong>Concluídas:</strong> {info.completedMatches || 0} de{' '}
            {info.totalMatches || 0} ({completionPercentage}%)
          </p>
        </div>
      </div>
    );
  };

  const renderTopPlayersCard = () => {
    if (!tournamentStats?.topPlayers || tournamentStats.topPlayers.length === 0)
      return (
        <p className="text-gray-400 dark:text-gray-500">
          Top jogadores não disponíveis.
        </p>
      );
    return (
      <div className="card bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
          TOP 5 Jogadores
        </h3>
        <ul className="space-y-2 text-gray-600 dark:text-gray-300">
          {tournamentStats.topPlayers.slice(0, 5).map((player, index) => (
            <li
              key={player.name || index}
              className={`flex justify-between items-center p-2 rounded ${index === 0 ? 'bg-yellow-400 bg-opacity-20 dark:bg-yellow-600 dark:bg-opacity-30' : 'dark:hover:bg-slate-700'}`}
            >
              <span>
                {index + 1}. {player.name}
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {player.wins} vitórias
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderCommonScoresCard = () => {
    if (
      !tournamentStats?.commonScores ||
      tournamentStats.commonScores.length === 0
    )
      return (
        <p className="text-gray-400 dark:text-gray-500">
          Resultados comuns não disponíveis.
        </p>
      );
    return (
      <div className="card bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
          Resultados Mais Comuns
        </h3>
        <ul className="space-y-2 text-gray-600 dark:text-gray-300">
          {tournamentStats.commonScores.slice(0, 5).map((score, index) => (
            <li
              key={index}
              className="flex justify-between p-2 dark:hover:bg-slate-700 rounded"
            >
              <span>{score.pattern}</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {score.count} vezes
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderMatchStatsCard = () => {
    if (!tournamentStats?.matchTimeStats)
      return (
        <p className="text-gray-400 dark:text-gray-500">
          Dados de partidas não disponíveis.
        </p>
      );
    const stats = tournamentStats.matchTimeStats;
    return (
      <div className="card bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
          Dados das Partidas
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <p>
            <strong>Tempo médio:</strong>{' '}
            {stats.averageDurationMinutes ?? 'N/A'} min
          </p>
          <p>
            <strong>Mais rápida:</strong> {stats.minDurationMinutes ?? 'N/A'}{' '}
            min
          </p>
          <p>
            <strong>Mais longa:</strong> {stats.maxDurationMinutes ?? 'N/A'} min
          </p>
        </div>
      </div>
    );
  };

  const renderPlayerStatsDetails = () => {
    if (loadingPlayerStats)
      return (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      );
    if (!playerStats)
      return (
        <p className="text-gray-400 dark:text-gray-500 mt-4 text-center">
          Selecione um jogador para ver suas estatísticas detalhadas.
        </p>
      );

    const {
      player,
      matchHistory,
      opponentStats,
      winRate,
      averageScoreDifference,
    } = playerStats;

    return (
      <div className="mt-6 space-y-6">
        <div className="card bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Perfil de {player.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              <strong>Apelido:</strong> {player.nickname || 'N/A'}
            </p>
            <p>
              <strong>Partidas:</strong> {player.gamesPlayed || 0}
            </p>
            <p>
              <strong>Vitórias:</strong> {player.wins || 0}
            </p>
            <p>
              <strong>Derrotas:</strong> {player.losses || 0}
            </p>
            <p>
              <strong>Taxa de Vitória:</strong>{' '}
              {winRate !== undefined ? `${winRate}%` : 'N/A'}
            </p>
            <p>
              <strong>Saldo Médio:</strong>{' '}
              {averageScoreDifference !== undefined
                ? averageScoreDifference > 0
                  ? `+${averageScoreDifference.toFixed(2)}`
                  : averageScoreDifference.toFixed(2)
                : 'N/A'}
            </p>
          </div>
        </div>

        {matchHistory && matchHistory.length > 0 && (
          <div className="card bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Histórico de Partidas
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-100 dark:bg-slate-700">
                  <tr>
                    <th className="p-2 text-left font-semibold">Data</th>
                    <th className="p-2 text-left font-semibold">Oponente</th>
                    <th className="p-2 text-left font-semibold">Resultado</th>
                    <th className="p-2 text-left font-semibold">Placar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {matchHistory.map((match, index) => {
                    const isPlayer1 =
                      match.player1_name === selectedPlayerName ||
                      match.player1 === selectedPlayerName; // Assuming API might return player1 or player1_name
                    const opponent = isPlayer1
                      ? match.player2_name || match.player2
                      : match.player1_name || match.player1;
                    const playerScore = isPlayer1 ? match.score1 : match.score2;
                    const opponentScore = isPlayer1
                      ? match.score2
                      : match.score1;
                    const isWin =
                      (match.winner_name || match.winner) ===
                      selectedPlayerName;
                    return (
                      <tr
                        key={match.id || index}
                        className={`${isWin ? 'bg-green-500 bg-opacity-10 dark:bg-green-700 dark:bg-opacity-20' : 'bg-red-500 bg-opacity-10 dark:bg-red-700 dark:bg-opacity-20'} hover:bg-gray-50 dark:hover:bg-slate-700`}
                      >
                        <td className="p-2">
                          {match.timestamp
                            ? new Date(match.timestamp).toLocaleDateString(
                                'pt-BR'
                              )
                            : '-'}
                        </td>
                        <td className="p-2">{opponent || 'N/A'}</td>
                        <td
                          className={`p-2 font-semibold ${isWin ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {isWin ? 'Vitória' : 'Derrota'}
                        </td>
                        <td className="p-2">{`${playerScore ?? 0} - ${opponentScore ?? 0}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {opponentStats && Object.keys(opponentStats).length > 0 && (
          <div className="card bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Contra Oponentes
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-100 dark:bg-slate-700">
                  <tr>
                    <th className="p-2 text-left font-semibold">Oponente</th>
                    <th className="p-2 text-center font-semibold">Partidas</th>
                    <th className="p-2 text-center font-semibold">V</th>
                    <th className="p-2 text-center font-semibold">D</th>
                    <th className="p-2 text-center font-semibold">Taxa V.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {Object.entries(opponentStats)
                    .sort(([, a], [, b]) => b.played - a.played)
                    .map(([name, stats]) => (
                      <tr
                        key={name}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
                        <td className="p-2">{name}</td>
                        <td className="p-2 text-center">{stats.played}</td>
                        <td className="p-2 text-center text-green-600 dark:text-green-400">
                          {stats.wins}
                        </td>
                        <td className="p-2 text-center text-red-600 dark:text-red-400">
                          {stats.losses}
                        </td>
                        <td className="p-2 text-center">
                          {stats.played > 0
                            ? Math.round((stats.wins / stats.played) * 100)
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 text-gray-900 dark:text-gray-100">
      {' '}
      {/* Adjusted base text color */}
      <div className="flex justify-between items-center mb-6">
        <h2
          id="stats-heading"
          className="text-2xl font-semibold text-gray-800 dark:text-gray-100"
        >
          Estatísticas
        </h2>
        <button
          onClick={
            activeTab === 'tournament' ? fetchTournamentStats : fetchPlayerStats
          }
          className="btn btn-outline border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm"
          disabled={loadingTournamentStats || loadingPlayerStats}
        >
          <FaSyncAlt
            className={`inline mr-2 ${loadingTournamentStats || loadingPlayerStats ? 'animate-spin' : ''}`}
          />
          Atualizar
        </button>
      </div>
      <div className="mb-6 border-b border-gray-300 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('tournament')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'tournament'
                  ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-300'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
          >
            <FaChartBar className="inline mr-2" /> Torneio
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'players'
                  ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-300'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
          >
            <FaUsers className="inline mr-2" /> Jogadores
          </button>
        </nav>
      </div>
      <div id="statistics-container">
        {activeTab === 'tournament' &&
          (loadingTournamentStats ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Carregando estatísticas do torneio...
              </p>
            </div>
          ) : tournamentStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderTournamentInfoCard()}
              {renderTopPlayersCard()}
              {renderCommonScoresCard()}
              {renderMatchStatsCard()}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">
              Nenhuma estatística de torneio para exibir. Selecione um torneio.
            </p>
          ))}

        {activeTab === 'players' && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="player-select-stats"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Selecione um Jogador:
              </label>
              <select
                id="player-select-stats"
                value={selectedPlayerName}
                onChange={(e) => setSelectedPlayerName(e.target.value)}
                className="input w-full md:w-1/2 lg:w-1/3 mt-1 block py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
                disabled={
                  allPlayersForSelect.length === 0 || loadingTournamentStats
                }
              >
                <option value="">-- Todos os Jogadores --</option>
                {allPlayersForSelect.map((player) => (
                  <option key={player.id || player.name} value={player.name}>
                    {player.nickname
                      ? `${player.name} (${player.nickname})`
                      : player.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedPlayerName ? (
              renderPlayerStatsDetails()
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Selecione um jogador para ver as estatísticas.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
