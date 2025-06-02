import { useCallback, useEffect, useState } from 'react';
import {
  FaBolt,
  FaChartBar,
  FaChartLine,
  FaClock,
  FaCrown,
  FaGamepad,
  FaHistory,
  FaMedal,
  FaPercent,
  FaSearch,
  FaSyncAlt,
  FaTrophy,
  FaUser,
  FaUsers,
} from 'react-icons/fa';
import { useMessage } from '../context/MessageContext';
import { useTournament } from '../context/TournamentContext';
import { getPlayerStats, getPlayers, getTournamentStats } from '../services/api';

// Helper function to format bracket type
const formatBracketType = (type) => {
  const types = {
    'single-elimination': 'Eliminação Simples',
    'double-elimination': 'Eliminação Dupla',
    'round-robin': 'Todos contra Todos',
  };
  return types[type] || type || 'Não especificado';
};

// Componente de Card Estatística Modernizado
const StatCard = ({
  title,
  value,
  icon,
  color = 'primary',
  description,
  loading = false,
  index = 0,
}) => {
  const IconComponent = icon;
  const getColorClasses = (colorName) => {
    switch (colorName) {
      case 'primary': // green
        return {
          bgIcon: 'bg-gradient-to-r from-green-500 to-green-600',
          textValue: 'text-green-400',
          bgCard: 'bg-slate-800/70 border-slate-700/50',
          hoverOverlay: 'from-green-800/10 via-transparent to-green-800/5',
        };
      case 'secondary': // lime
        return {
          bgIcon: 'bg-gradient-to-r from-lime-500 to-lime-600',
          textValue: 'text-lime-400',
          bgCard: 'bg-slate-800/70 border-slate-700/50',
          hoverOverlay: 'from-lime-800/10 via-transparent to-lime-800/5',
        };
      case 'accent': // amber
        return {
          bgIcon: 'bg-gradient-to-r from-amber-500 to-amber-600',
          textValue: 'text-amber-400',
          bgCard: 'bg-slate-800/70 border-slate-700/50',
          hoverOverlay: 'from-amber-800/10 via-transparent to-amber-800/5',
        };
      case 'warning': // orange
        return {
          bgIcon: 'bg-gradient-to-r from-orange-500 to-orange-600',
          textValue: 'text-orange-400',
          bgCard: 'bg-slate-800/70 border-slate-700/50',
          hoverOverlay: 'from-orange-800/10 via-transparent to-orange-800/5',
        };
      default: // neutral/gray
        return {
          bgIcon: 'bg-gradient-to-r from-slate-500 to-slate-600',
          textValue: 'text-slate-400',
          bgCard: 'bg-slate-800/70 border-slate-700/50',
          hoverOverlay: 'from-slate-800/10 via-transparent to-slate-800/5',
        };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className="group relative cursor-pointer">
      <div
        className={`relative ${colorClasses.bgCard} backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden`}
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${colorClasses.bgIcon} shadow-lg`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-8 bg-slate-700 animate-pulse rounded-xl" />
              <div className="h-5 bg-slate-600 animate-pulse rounded-lg w-3/4" />
            </div>
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
                {title}
              </h3>
              <div className="mb-3">
                <span
                  className={`text-3xl font-black ${colorClasses.textValue} block leading-none`}
                >
                  {value}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">{description}</p>
            </>
          )}
        </div>

        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colorClasses.hoverOverlay} pointer-events-none`}
        />
      </div>
    </div>
  );
};

// Componente de Loading Modernizado
const ModernLoadingSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-lg"
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-slate-700 rounded-2xl" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-600 rounded-xl w-1/2" />
            <div className="h-8 bg-slate-700 rounded-xl w-3/4" />
            <div className="h-3 bg-slate-600 rounded-lg" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Component to display Player Statistics
const PlayerStatsDisplay = ({ playerStats }) => {
  if (!playerStats) {
    return (
      <div className="text-center py-16">
        <div>
          <FaBolt className="w-24 h-24 text-slate-500 mx-auto mb-6" />
        </div>
        <h3 className="text-2xl font-black text-slate-300 mb-4">Dados Indisponíveis</h3>
        <p className="text-slate-400 font-medium">
          Não foi possível carregar as estatísticas para este jogador.
        </p>
      </div>
    );
  }

  const { playerName, matchesPlayed = 0, wins = 0, losses = 0 } = playerStats;

  const winRate = matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(1) : 0;

  const playerStatsCards = [
    {
      title: 'Partidas Jogadas',
      value: matchesPlayed.toString(),
      icon: FaGamepad,
      color: 'primary',
      description: 'Total de confrontos disputados.',
    },
    {
      title: 'Vitórias',
      value: wins.toString(),
      icon: FaMedal,
      color: 'accent',
      description: 'Número de partidas vencidas.',
    },
    {
      title: 'Derrotas',
      value: losses.toString(),
      icon: FaChartLine,
      color: 'warning',
      description: 'Número de partidas perdidas.',
    },
    {
      title: 'Taxa de Vitória',
      value: `${winRate}%`,
      icon: FaPercent,
      color: 'secondary',
      description: 'Percentual de vitórias.',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Player Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-4 bg-white/80 backdrop-blur-xl border border-white/30 rounded-full py-4 px-8 shadow-xl">
          <FaUser className="w-10 h-10 text-green-700" />
          <h2 className="text-4xl font-black text-transparent bg-gradient-to-r from-green-700 to-lime-600 bg-clip-text">
            {playerName || 'Jogador'}
          </h2>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {playerStatsCards.map((stat, index) => (
          <StatCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      {/* Placeholder for Match History */}
      <div className="mt-12 bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-lg">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-r from-neutral-500 to-neutral-600 rounded-2xl mr-4 shadow-lg">
            <FaHistory className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-black text-neutral-700">Histórico de Partidas</h3>
        </div>
        <p className="text-neutral-500 font-medium text-center py-8">
          (Em breve: Lista detalhada das partidas recentes do jogador aqui.)
        </p>
      </div>
    </div>
  );
};

const StatsPage = () => {
  const { currentTournament } = useTournament();
  const { showError } = useMessage();

  const [activeTab, setActiveTab] = useState('tournament');
  const [tournamentStats, setTournamentStats] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [allPlayersForSelect, setAllPlayersForSelect] = useState([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [loadingTournamentStats, setLoadingTournamentStats] = useState(false);
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTournamentStats = useCallback(
    async (showRefreshLoader = false) => {
      if (!currentTournament?.id || currentTournament.id === 'undefined') {
        setTournamentStats(null);
        setAllPlayersForSelect([]);
        return;
      }

      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoadingTournamentStats(true);
      }

      try {
        const stats = await getTournamentStats(currentTournament.id);
        setTournamentStats(stats);

        if (stats?.playerPerformance) {
          setAllPlayersForSelect(
            stats.playerPerformance.sort((a, b) => a.name.localeCompare(b.name))
          );
        } else {
          const playersData = await getPlayers(currentTournament.id);
          const playersArray = playersData?.players || [];
          setAllPlayersForSelect(
            playersArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          );
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas do torneio:', error);
        showError(`Erro ao carregar estatísticas do torneio: ${error.message}`);
        setTournamentStats(null);
      } finally {
        setLoadingTournamentStats(false);
        setRefreshing(false);
      }
    },
    [currentTournament?.id, showError]
  );

  const fetchPlayerStats = useCallback(async () => {
    if (!currentTournament?.id || currentTournament.id === 'undefined' || !selectedPlayerName) {
      setPlayerStats(null);
      return;
    }

    setLoadingPlayerStats(true);
    try {
      const stats = await getPlayerStats(currentTournament.id, selectedPlayerName);
      setPlayerStats(stats);
    } catch (error) {
      console.error(`Erro ao carregar estatísticas do jogador ${selectedPlayerName}:`, error);
      showError(`Erro ao carregar estatísticas do jogador: ${error.message}`);
      setPlayerStats(null);
    } finally {
      setLoadingPlayerStats(false);
    }
  }, [currentTournament?.id, selectedPlayerName, showError]);

  useEffect(() => {
    fetchTournamentStats();
  }, [fetchTournamentStats]);

  useEffect(() => {
    if (activeTab === 'players' && selectedPlayerName) {
      fetchPlayerStats();
    } else {
      setPlayerStats(null);
    }
  }, [activeTab, selectedPlayerName, fetchPlayerStats]);

  const handleRefresh = () => {
    if (activeTab === 'tournament') {
      fetchTournamentStats(true);
    } else {
      fetchPlayerStats();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-radial from-green-200/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-amber-200/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header Section */}
      <section className="relative z-10 mb-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 bg-slate-800/50 backdrop-blur-md rounded-full px-6 py-3 mb-8 border border-slate-700 shadow-lg">
            <div>
              <FaChartBar className="w-6 h-6 text-lime-400" />
            </div>
            <span className="text-lg font-bold text-slate-200 tracking-wide">
              Estatísticas da Liga
            </span>
            <div className="w-2 h-2 bg-amber-400 rounded-full" />
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            <span className="block text-slate-100">Análise</span>
            <span className="block bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-clip-text text-transparent">
              ESTATÍSTICA
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Explore dados detalhados, tendências e insights profundos sobre o desempenho dos
            jogadores e torneios.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex space-x-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-2 shadow-lg">
            {[
              { key: 'tournament', label: 'Torneio', icon: FaTrophy },
              { key: 'players', label: 'Jogadores', icon: FaUsers },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-lime-600 to-green-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700/70'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-700/50 backdrop-blur-xl border border-slate-600 text-lime-400 rounded-xl font-semibold hover:bg-slate-600/70 hover:border-lime-500 hover:shadow-lg transition-all duration-300 disabled:opacity-60"
          >
            <div className={refreshing ? 'animate-spin' : ''}>
              <FaSyncAlt className="w-5 h-5" />
            </div>
            <span>Atualizar</span>
          </button>
        </div>

        {/* Player Selector - Only show for players tab */}
        {activeTab === 'players' && (
          <div className="flex justify-center mb-8">
            <div className="relative max-w-md w-full">
              <div className="relative">
                <select
                  value={selectedPlayerName}
                  onChange={(e) => setSelectedPlayerName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-700/50 backdrop-blur-xl border-2 border-slate-600/80 rounded-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-lime-500/70 focus:border-lime-500/80 hover:border-slate-500/80 transition-all duration-300 shadow-lg appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-800">
                    Selecione um jogador...
                  </option>
                  {allPlayersForSelect.map((player, index) => (
                    <option key={index} value={player.name} className="bg-slate-800">
                      {player.name}
                    </option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <FaSearch className="w-5 h-5 text-lime-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Content Section */}
      <section className="relative z-10">
        {activeTab === 'tournament' ? (
          <div key="tournament" className="space-y-8">
            {loadingTournamentStats ? (
              <ModernLoadingSkeleton count={4} />
            ) : !currentTournament?.id || currentTournament.id === 'undefined' ? (
              <div className="text-center py-16">
                <div>
                  <FaTrophy className="w-24 h-24 text-neutral-400 mx-auto mb-6" />
                </div>
                <h3 className="text-2xl font-black text-neutral-700 mb-4">
                  Nenhum Torneio Selecionado
                </h3>
                <p className="text-neutral-500 font-medium">
                  Selecione um torneio para visualizar suas estatísticas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tournament Stats Cards */}
                <div className="grid grid-cols-1 gap-6">
                  <StatCard
                    title="Total de Jogadores"
                    value={tournamentStats?.tournamentInfo?.totalPlayers || 0}
                    icon={FaUsers}
                    color="primary"
                    description="Participantes registrados"
                    index={0}
                  />
                  <StatCard
                    title="Partidas Concluídas"
                    value={tournamentStats?.tournamentInfo?.completedMatches || 0}
                    icon={FaGamepad}
                    color="secondary"
                    description="Jogos finalizados"
                    index={1}
                  />
                  <StatCard
                    title="Taxa de Conclusão"
                    value={`${
                      tournamentStats?.tournamentInfo?.totalMatches > 0
                        ? Math.round(
                            (tournamentStats.tournamentInfo.completedMatches /
                              tournamentStats.tournamentInfo.totalMatches) *
                              100
                          )
                        : 0
                    }%`}
                    icon={FaPercent}
                    color="accent"
                    description="Progresso do torneio"
                    index={2}
                  />
                  <StatCard
                    title="Duração Média"
                    value={`${tournamentStats?.matchTimeStats?.averageDurationMinutes || 'N/A'}`}
                    icon={FaClock}
                    color="warning"
                    description="Tempo médio de partida"
                    index={3}
                  />
                </div>

                {/* Detailed Cards */}
                <div className="space-y-6">
                  {tournamentStats?.topPlayers && tournamentStats.topPlayers.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-2xl border border-white/30 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl mr-4 shadow-lg">
                          <FaCrown className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-green-800">TOP 3 Jogadores</h3>
                      </div>

                      <div className="space-y-4 mt-4">
                        {tournamentStats.topPlayers.map((player, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-slate-100/50 rounded-2xl p-4"
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                  index === 0
                                    ? 'bg-amber-500'
                                    : index === 1
                                      ? 'bg-slate-400'
                                      : 'bg-amber-700'
                                }`}
                              >
                                {index + 1}
                              </div>
                              <span className="ml-3 font-bold text-slate-700">{player.name}</span>
                            </div>
                            <span className="font-black text-green-600">
                              {player.winRate}% ({player.wins}/{player.totalMatches})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tournamentStats?.tournamentInfo && (
                    <div className="bg-white/80 backdrop-blur-2xl border border-white/30 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mr-4 shadow-lg">
                          <FaTrophy className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-green-800">Detalhes do Torneio</h3>
                      </div>

                      <div className="space-y-3 mt-4">
                        <div className="flex justify-between p-3 bg-slate-100/50 rounded-xl">
                          <span className="font-medium text-slate-600">Formato</span>
                          <span className="font-bold text-green-600">
                            {formatBracketType(tournamentStats.tournamentInfo.bracketType)}
                          </span>
                        </div>
                        <div className="flex justify-between p-3 bg-slate-100/50 rounded-xl">
                          <span className="font-medium text-slate-600">Data de Início</span>
                          <span className="font-bold text-green-600">
                            {new Date(tournamentStats.tournamentInfo.startDate).toLocaleDateString(
                              'pt-BR'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div key="players" className="space-y-8">
            {loadingPlayerStats ? (
              <ModernLoadingSkeleton count={4} />
            ) : !selectedPlayerName ? (
              <div className="text-center py-16">
                <div>
                  <FaUsers className="w-24 h-24 text-neutral-400 mx-auto mb-6" />
                </div>
                <h3 className="text-2xl font-black text-neutral-700 mb-4">Selecione um Jogador</h3>
                <p className="text-neutral-500 font-medium">
                  Escolha um jogador para ver suas estatísticas detalhadas.
                </p>
              </div>
            ) : (
              <PlayerStatsDisplay playerStats={playerStats} />
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default StatsPage;
