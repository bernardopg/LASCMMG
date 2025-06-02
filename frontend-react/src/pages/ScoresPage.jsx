import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaChartLine, FaCrown, FaGamepad, FaHistory, FaTrophy, FaUsers } from 'react-icons/fa';
import { useTournament } from '../context/TournamentContext';
import { useDebounce } from '../hooks/useDebounce';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { getScores } from '../services/api';

// Card de Score sem animações
const ScoreCard = ({ score }) => {
  const getWinnerStyle = (winnerName, playerName) => {
    if (winnerName === playerName) {
      return {
        bg: 'bg-lime-500/10',
        text: 'text-lime-300',
        border: 'border-lime-500/30',
        icon: 'text-lime-400',
        scoreText: 'text-lime-400',
      };
    }
    return {
      bg: 'bg-slate-700/20',
      text: 'text-slate-400',
      border: 'border-slate-600/30',
      icon: 'text-slate-500',
      scoreText: 'text-slate-300',
    };
  };

  const player1Style = getWinnerStyle(score.winner_name, score.player1_name);
  const player2Style = getWinnerStyle(score.winner_name, score.player2_name);

  return (
    <div className="group relative">
      <div className="relative bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-lg">
        <div className="h-2 bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-lime-600 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaGamepad className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-lime-300">
                  {score.round || 'Partida Amistosa'}
                </p>
                <p className="text-sm text-slate-400">
                  {score.completed_at
                    ? new Date(score.completed_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Data não informada'}
                </p>
              </div>
            </div>
            {score.winner_name && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300 rounded-xl">
                <FaCrown className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-800">Vencedor</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div
              className={`flex items-center justify-between p-4 rounded-2xl border ${player1Style.bg} ${player1Style.border}`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-md">
                  {(score.player1_name || 'J1').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`text-md sm:text-lg font-black ${player1Style.text}`}>
                    {score.player1_name || 'Jogador 1'}
                  </p>
                  {score.winner_name === score.player1_name && (
                    <p
                      className={`text-xs sm:text-sm font-bold ${player1Style.icon} flex items-center gap-1`}
                    >
                      <FaTrophy className="w-3 h-3" />
                      Vitória
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl sm:text-3xl font-black ${player1Style.scoreText} mb-1`}>
                  {score.player1_score ?? 0}
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Pontos</p>
              </div>
            </div>
            <div className="flex items-center justify-center py-1 sm:py-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg border border-slate-500">
                <span className="text-white font-black text-sm sm:text-lg">VS</span>
              </div>
            </div>
            <div
              className={`flex items-center justify-between p-4 rounded-2xl border ${player2Style.bg} ${player2Style.border}`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-md">
                  {(score.player2_name || 'J2').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`text-md sm:text-lg font-black ${player2Style.text}`}>
                    {score.player2_name || 'Jogador 2'}
                  </p>
                  {score.winner_name === score.player2_name && (
                    <p
                      className={`text-xs sm:text-sm font-bold ${player2Style.icon} flex items-center gap-1`}
                    >
                      <FaTrophy className="w-3 h-3" />
                      Vitória
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl sm:text-3xl font-black ${player2Style.scoreText} mb-1`}>
                  {score.player2_score ?? 0}
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Pontos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModernLoadingSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-lg"
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-slate-700 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-5 bg-slate-600 rounded-xl w-24" />
                <div className="h-4 bg-slate-700 rounded-lg w-32" />
              </div>
            </div>
            <div className="h-8 bg-slate-600 rounded-xl w-20" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/70 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-600 rounded-xl" />
                <div className="h-5 bg-slate-700 rounded-xl w-20" />
              </div>
              <div className="h-8 bg-slate-600 rounded-lg w-8" />
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-slate-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/70 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-600 rounded-xl" />
                <div className="h-5 bg-slate-700 rounded-xl w-20" />
              </div>
              <div className="h-8 bg-slate-600 rounded-lg w-8" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ScoresPage = () => {
  const { currentTournament } = useTournament();
  const { withErrorHandling } = useErrorHandler();

  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'descending',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const scoresPerPage = 9;

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchScoresAndPlayers = useCallback(
    async (showRefreshLoader = false) => {
      if (!currentTournament?.id || currentTournament.id === 'undefined') {
        setScores([]);
        setLoading(false);
        return;
      }

      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await withErrorHandling(
        async () => {
          const [fetchedScores] = await Promise.all([getScores(currentTournament.id)]);
          return { scores: fetchedScores };
        },
        { defaultMessage: 'Erro ao carregar dados' }
      );

      if (result && !result.handled) {
        if (result.success) {
          setScores(result.scores?.scores || []);
        } else {
          setScores([]);
        }
      }

      setLoading(false);
      setRefreshing(false);
    },
    [currentTournament?.id, withErrorHandling]
  );

  useEffect(() => {
    fetchScoresAndPlayers();
  }, [fetchScoresAndPlayers]);

  const handleFilterChange = (filterName, value) => {
    setActiveFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const sortedAndFilteredScores = useMemo(() => {
    let sortableScores = [...scores];

    // Search filtering
    if (debouncedSearch) {
      sortableScores = sortableScores.filter((score) => {
        const searchLower = debouncedSearch.toLowerCase();
        const p1 = (score.player1_name || '').toLowerCase();
        const p2 = (score.player2_name || '').toLowerCase();
        const winner = (score.winner_name || '').toLowerCase();
        const round = (score.round || '').toLowerCase();

        return (
          p1.includes(searchLower) ||
          p2.includes(searchLower) ||
          winner.includes(searchLower) ||
          round.includes(searchLower)
        );
      });
    }

    // Active filters
    if (Object.keys(activeFilters).length > 0) {
      sortableScores = sortableScores.filter((score) => {
        if (activeFilters.player) {
          const playerName = activeFilters.player.toLowerCase();
          const p1 = (score.player1_name || '').toLowerCase();
          const p2 = (score.player2_name || '').toLowerCase();
          const winner = (score.winner_name || '').toLowerCase();
          if (
            !(p1.includes(playerName) || p2.includes(playerName) || winner.includes(playerName))
          ) {
            return false;
          }
        }
        if (activeFilters.round && score.round !== activeFilters.round) {
          return false;
        }
        if (activeFilters.dateAfter) {
          if (!score.completed_at) return false;
          try {
            const filterDate = new Date(activeFilters.dateAfter);
            const scoreDate = new Date(score.completed_at);
            scoreDate.setHours(0, 0, 0, 0);
            filterDate.setHours(0, 0, 0, 0);
            if (scoreDate < filterDate) return false;
          } catch (e) {
            return false;
          }
        }
        if (activeFilters.result && activeFilters.player) {
          const playerFilter = activeFilters.player;
          if (activeFilters.result === 'vitoria') {
            if ((score.winner_name || '') !== playerFilter) return false;
          } else if (activeFilters.result === 'derrota') {
            if (
              !(
                (score.player1_name || '') === playerFilter ||
                (score.player2_name || '') === playerFilter
              ) ||
              (score.winner_name || '') === playerFilter
            ) {
              return false;
            }
          }
        }
        return true;
      });
    }

    // Sorting
    if (sortConfig.key !== null) {
      sortableScores.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'date') {
          valA = new Date(a.completed_at || 0).getTime();
          valB = new Date(b.completed_at || 0).getTime();
        } else if (sortConfig.key === 'score') {
          valA = (a.player1_score ?? 0) + (a.player2_score ?? 0);
          valB = (b.player1_score ?? 0) + (b.player2_score ?? 0);
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableScores;
  }, [scores, activeFilters, sortConfig, debouncedSearch]);

  const handleRefresh = () => {
    fetchScoresAndPlayers(true);
  };

  // Pagination
  const totalPages = Math.ceil(sortedAndFilteredScores.length / scoresPerPage);
  const startIndex = (currentPage - 1) * scoresPerPage;
  const endIndex = startIndex + scoresPerPage;
  const currentScores = sortedAndFilteredScores.slice(startIndex, endIndex);

  // Stats calculations
  const totalMatches = scores.length;
  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((acc, s) => acc + (s.player1_score || 0) + (s.player2_score || 0), 0) /
            (scores.length * 2)
        )
      : 0;
  const uniquePlayers = new Set([
    ...scores.map((s) => s.player1_name),
    ...scores.map((s) => s.player2_name),
  ]).size;

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="fixed inset-0 pointer-events-none z-0"></div>
      <section className="relative z-10 mb-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 bg-white/15 backdrop-blur-xl rounded-full px-6 py-3 mb-8 border border-white/20">
            <FaHistory className="w-6 h-6 text-amber-600" />
            <span className="text-lg font-bold text-lime-300 tracking-wide">
              Histórico de Placares
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            <span className="block text-slate-100">Histórico de</span>
            <span className="block bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-clip-text text-transparent">
              PLACARES
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Acompanhe todos os resultados das partidas da liga e veja o desempenho dos jogadores ao
            longo do tempo.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              label: 'Total de Partidas',
              value: totalMatches,
              icon: FaGamepad,
              color: 'from-lime-600 to-green-600',
              bgColor: 'from-lime-700/20 to-green-700/20',
            },
            {
              label: 'Jogadores Únicos',
              value: uniquePlayers,
              icon: FaUsers,
              color: 'from-green-500 to-emerald-500',
              bgColor: 'from-green-700/20 to-emerald-700/20',
            },
            {
              label: 'Pontuação Média',
              value: averageScore,
              icon: FaChartLine,
              color: 'from-amber-500 to-orange-500',
              bgColor: 'from-amber-700/20 to-orange-700/20',
            },
          ].map((stat) => (
            <div key={stat.label} className="group relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
                  <span className="text-3xl font-black text-slate-100">{stat.value}</span>
                </div>
                <div className={`p-4 bg-gradient-to-r ${stat.color} rounded-2xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Controles, filtros e paginação podem ser implementados aqui, sem animações */}
      </section>
      <main className="relative z-10">
        {loading && <ModernLoadingSkeleton count={9} />}
        {!loading && sortedAndFilteredScores.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                <FaHistory className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-100 mb-4">
                Nenhuma partida encontrada
              </h3>
              <p className="text-slate-400 mb-6">
                Ainda não há placares registrados para este torneio.
              </p>
            </div>
          </div>
        )}
        {!loading && sortedAndFilteredScores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {currentScores.map((score, index) => (
              <ScoreCard
                key={score.id || `${score.player1_name}-${score.player2_name}-${index}`}
                score={score}
                index={index}
              />
            ))}
          </div>
        )}
        {/* Paginação e sumário podem ser mantidos, removendo animações */}
      </main>
    </div>
  );
};

export default ScoresPage;
