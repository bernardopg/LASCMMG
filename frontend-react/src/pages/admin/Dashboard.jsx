import { useCallback, useEffect, useState } from 'react';
import {
  FaChartBar,
  FaClock,
  FaCog,
  FaExclamationTriangle,
  FaInfoCircle,
  FaListOl,
  FaPlus,
  FaPlusCircle,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
// Import getSystemStats and remove direct axios import
import { LoadingSpinner } from '../../components/common/LoadingSpinner'; // Import LoadingSpinner
import PageHeader from '../../components/common/PageHeader'; // For consistent page titles
import {
  getAdminPlayers,
  getAdminScores,
  getSystemStats,
  getTournaments,
} from '../../services/api';

const StatCard = ({ title, value, icon: Icon, colorScheme = 'neutral' }) => {
  const schemes = {
    sky: {
      bg: 'bg-sky-600/20',
      text: 'text-sky-200',
      iconBg: 'bg-sky-500',
      iconText: 'text-white',
    },
    lime: {
      bg: 'bg-lime-600/20',
      text: 'text-lime-200',
      iconBg: 'bg-lime-500',
      iconText: 'text-white',
    },
    amber: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-200',
      iconBg: 'bg-amber-500',
      iconText: 'text-white',
    },
    violet: {
      bg: 'bg-violet-600/20',
      text: 'text-violet-200',
      iconBg: 'bg-violet-500',
      iconText: 'text-white',
    },
    neutral: {
      bg: 'bg-slate-700/50',
      text: 'text-slate-200',
      iconBg: 'bg-slate-500',
      iconText: 'text-white',
    },
  };
  const currentScheme = schemes[colorScheme] || schemes.neutral;

  return (
    <div className={`${currentScheme.bg} p-5 rounded-xl shadow-lg border border-slate-700/50`}>
      <div className="flex items-start">
        <div className={`p-3 rounded-full mr-4 ${currentScheme.iconBg}`}>
          <Icon className={`h-6 w-6 ${currentScheme.iconText}`} />
        </div>
        <div>
          <h3 className={`text-sm font-medium ${currentScheme.text} opacity-80`}>{title}</h3>
          <p className={`text-2xl font-semibold mt-1 ${currentScheme.text}`}>{value}</p>
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ title, description, icon: Icon, to, buttonText }) => {
  const cardBaseClasses =
    'bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 flex flex-col h-full';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const outlineButtonClasses = `${buttonBaseClasses} border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500`;

  return (
    <div className={cardBaseClasses}>
      <div className="mb-4 text-lime-400 text-3xl">
        <Icon />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-slate-100">{title}</h3>
      <p className="text-slate-300 mb-4 flex-grow">{description}</p>
      <Link to={to} className={`${outlineButtonClasses} mt-auto`}>
        {buttonText}
      </Link>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { showError } = useMessage();

  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalMatches: 0, // This will be total scores
    pendingMatches: 0, // This might need a dedicated endpoint or calculation
    totalTournaments: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Local error for dashboard specific failures

  // Memoized fetch functions
  const fetchSystemStats = useCallback(async () => {
    // Now uses the centralized API service
    try {
      const response = await getSystemStats();
      return response?.success ? response.stats : null;
    } catch (error) {
      console.warn('System stats not available:', error.message);
      // showError('Falha ao buscar estatísticas do sistema.'); // Optional: notify user
      return null;
    }
  }, []);

  const fetchRecentData = useCallback(async () => {
    try {
      const [scoresData, playersData, tournamentsData] = await Promise.allSettled([
        getAdminScores({ limit: 5, sortBy: 'completed_at', sortDirection: 'desc' }),
        getAdminPlayers({ limit: 5, sortBy: 'created_at', sortDirection: 'desc' }),
        getTournaments({ limit: 5, sortBy: 'created_at', sortDirection: 'desc' }), // Assuming this fetches all tournaments
      ]);

      const activity = [];

      // Process scores
      if (scoresData.status === 'fulfilled' && scoresData.value?.scores) {
        scoresData.value.scores.forEach((score) => {
          activity.push({
            id: `score-${score.id}`,
            type: 'match',
            description: `Placar: ${score.player1_name || 'P1'} ${score.player1_score}-${score.player2_score} ${score.player2_name || 'P2'}`,
            timestamp: score.completed_at || score.updated_at || score.created_at,
            user: 'Sistema', // Or derive from score if available
          });
        });
      }

      // Process players
      if (playersData.status === 'fulfilled' && playersData.value?.players) {
        playersData.value.players.forEach((player) => {
          activity.push({
            id: `player-${player.id}`,
            type: 'player',
            description: `Novo jogador: ${player.name}`,
            timestamp: player.created_at || player.updated_at,
            user: 'Admin', // Or derive from player data if available
          });
        });
      }

      // Process tournaments
      if (tournamentsData.status === 'fulfilled' && tournamentsData.value?.tournaments) {
        tournamentsData.value.tournaments.slice(0, 5).forEach((tournament) => {
          activity.push({
            id: `tournament-${tournament.id}`,
            type: 'tournament',
            description: `Torneio: ${tournament.name}`,
            timestamp: tournament.updated_at || tournament.created_at,
            user: 'Admin', // Or derive from tournament data
          });
        });
      }

      activity.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      return activity.slice(0, 10); // Limit to 10 recent activities
    } catch (error) {
      console.error('Error fetching recent data:', error);
      showError('Falha ao buscar atividades recentes.');
      return [];
    }
  }, [showError]);

  const fetchDashboardData = useCallback(async () => {
    // Auth check is handled by API interceptor now
    setLoading(true);
    setError(null);
    try {
      const [statsDataResult, activityDataResult] = await Promise.allSettled([
        fetchSystemStats(),
        fetchRecentData(),
      ]);

      if (statsDataResult.status === 'fulfilled' && statsDataResult.value) {
        setStats({
          totalPlayers: statsDataResult.value.entities?.players || 0,
          totalMatches: statsDataResult.value.entities?.scores || 0,
          pendingMatches: statsDataResult.value.matches?.pending || 0, // Assuming stats endpoint provides this
          totalTournaments: statsDataResult.value.tournaments?.total || 0,
        });
      } else if (statsDataResult.status === 'rejected') {
        console.error('Failed to fetch system stats:', statsDataResult.reason);
        // Optionally set a specific error or use default stats
      }

      if (activityDataResult.status === 'fulfilled') {
        setRecentActivity(activityDataResult.value);
      } else if (activityDataResult.status === 'rejected') {
        console.error('Failed to fetch recent activity:', activityDataResult.reason);
        // Optionally set a specific error or use empty activity
      }
    } catch (error) {
      // This catch might be redundant if allSettled handles individual errors
      console.error('Dashboard data fetch error:', error);
      setError('Falha ao carregar dados do dashboard.');
      showError('Falha ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  }, [fetchSystemStats, fetchRecentData, showError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Obter a data formatada para exibição
  const formatDate = (dateString) => {
    if (!dateString) return 'Data indisponível';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data inválida';
    }
  };

  // Obter ícone com base no tipo de atividade
  const getActivityIcon = (type) => {
    switch (type) {
      case 'match':
        return <FaListOl className="w-5 h-5" />;
      case 'player':
        return <FaUsers className="w-5 h-5" />;
      case 'tournament':
        return <FaTrophy className="w-5 h-5" />;
      case 'system':
        return <FaCog className="w-5 h-5" />;
      default:
        return <FaInfoCircle className="w-5 h-5" />;
    }
  };

  // Obter classe de cor com base no tipo de atividade
  const getActivityClass = (type) => {
    // Aligned with theme colors
    switch (type) {
      case 'match': // Sky
        return 'bg-sky-700/20 text-sky-300 border-sky-600/50';
      case 'player': // Lime
        return 'bg-lime-700/20 text-lime-300 border-lime-600/50';
      case 'tournament': // Violet
        return 'bg-violet-700/20 text-violet-300 border-violet-600/50';
      case 'system': // Slate (neutral)
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;
  const outlineButtonClasses = `${buttonBaseClasses} border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500`;
  const cardBaseClasses = 'bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700';

  return (
    <div className="py-6 bg-slate-900 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <PageHeader
              title="Dashboard Administrativo"
              subtitle={`Bem-vindo, ${user?.name || 'Administrador'}!`}
              smallMargin={true}
            />
            <div className="mt-4 md:mt-0 flex gap-2">
              <Link to="/admin/reports" className={`${outlineButtonClasses} text-sm`}>
                <FaChartBar className="w-4 h-4 mr-2" />
                Relatórios
              </Link>
              <Link to="/admin/tournaments/create" className={`${primaryButtonClasses} text-sm`}>
                <FaPlus className="w-4 h-4 mr-2" />
                Novo Torneio
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
            <LoadingSpinner size="xl" message="Carregando dados do dashboard..." />
          </div>
        ) : error ? (
          <div className={`${cardBaseClasses} flex flex-col items-center justify-center py-16`}>
            <FaExclamationTriangle className="text-4xl text-red-400 mb-4" />
            <p className="text-lg text-red-300 mb-4">{error}</p>
            <button onClick={fetchDashboardData} className={primaryButtonClasses}>
              Tentar Novamente
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-slate-200">Estatísticas Gerais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total de Jogadores"
                  value={stats?.totalPlayers || 0}
                  icon={FaUsers}
                  colorScheme="sky"
                />
                <StatCard
                  title="Partidas Realizadas"
                  value={stats?.totalMatches || 0}
                  colorScheme="lime"
                  icon={FaListOl}
                />
                <StatCard
                  title="Partidas Pendentes"
                  value={stats?.pendingMatches || 0}
                  colorScheme="amber"
                  icon={FaClock}
                />
                <StatCard
                  title="Torneios Ativos"
                  value={stats?.totalTournaments || 0}
                  colorScheme="violet"
                  icon={FaTrophy}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h2 className="text-xl font-semibold mb-4 text-slate-200">Ações Rápidas</h2>
                <div className="grid grid-cols-1 gap-6">
                  <ActionCard
                    title="Gerenciar Jogadores"
                    description="Adicione, edite ou remova jogadores do sistema."
                    icon={FaUsers}
                    to="/admin/players"
                    buttonText="Gerenciar Jogadores"
                  />
                  <ActionCard
                    title="Adicionar Placar"
                    description="Registre o resultado de uma partida existente."
                    icon={FaPlusCircle}
                    to="/add-score"
                    buttonText="Adicionar Placar"
                  />
                  <ActionCard
                    title="Configurações"
                    description="Ajuste configurações do sistema e segurança."
                    icon={FaCog}
                    to="/admin/settings"
                    buttonText="Abrir Configurações"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-slate-200">Atividade Recente</h2>
                <div className={`${cardBaseClasses} overflow-hidden`}>
                  {recentActivity.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      <p>Nenhuma atividade recente registrada.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-4 hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-start">
                            <div
                              className={`p-2 rounded-full mr-3 border ${getActivityClass(activity.type)}`}
                            >
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-grow">
                              <div className="mb-1 text-slate-100">{activity.description}</div>
                              <div className="text-sm text-slate-400 flex items-center justify-between">
                                <div>
                                  <span className="mr-2">por {activity.user}</span>
                                </div>
                                <div>{formatDate(activity.timestamp)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                    <Link
                      to="/admin/activity-log"
                      className="text-lime-400 hover:text-lime-300 hover:underline inline-flex items-center text-sm font-medium"
                    >
                      Ver todas as atividades
                      <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
