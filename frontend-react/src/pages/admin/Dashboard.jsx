import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  FaChartBar,
  FaClock,
  FaCog,
  FaInfoCircle,
  FaListOl,
  FaPlus,
  FaPlusCircle,
  FaTrophy,
  FaUsers,
  FaSpinner,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { useTournament } from '../../context/TournamentContext';
import api, {
  getAdminPlayers,
  getAdminScores,
  getTournaments,
} from '../../services/api';

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <div className="stat-card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
    <div className="flex items-start">
      <div
        className={`icon-wrapper mr-4 p-3 rounded-full bg-${color}-100 dark:bg-${color}-700 dark:bg-opacity-50`}
      >
        <span className={`text-${color}-600 dark:text-${color}-300 text-2xl`}>
          {icon}
        </span>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        <p className="text-2xl font-semibold mt-1 text-gray-800 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  </div>
);

const ActionCard = ({ title, description, icon, to, buttonText }) => (
  <div className="action-card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col h-full">
    <div className="icon-wrapper mb-4 text-primary dark:text-primary-light text-3xl">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">
      {description}
    </p>
    <Link
      to={to}
      className="btn btn-outline btn-primary mt-auto" // Using global button styles
    >
      {buttonText}
    </Link>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { showError } = useMessage();

  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalMatches: 0,
    pendingMatches: 0,
    totalTournaments: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized fetch functions
  const fetchSystemStats = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return null;

    const apiUrl = api.defaults.baseURL || 'http://localhost:3000';

    try {
      const response = await axios.get(`${apiUrl}/api/system/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        withCredentials: true
      });

      return response.data?.success ? response.data.stats : null;
    } catch (error) {
      console.warn('System stats not available:', error.message);
      return null;
    }
  }, []);

  const fetchRecentData = useCallback(async () => {
    try {
      const [scoresData, playersData, tournamentsData] = await Promise.allSettled([
        getAdminScores({ limit: 5, sortBy: 'completed_at', sortDirection: 'desc' }),
        getAdminPlayers({ limit: 5, sortBy: 'created_at', sortDirection: 'desc' }),
        getTournaments({ limit: 5, sortBy: 'created_at', sortDirection: 'desc' })
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
            user: 'Sistema',
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
            user: 'Admin',
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
            user: 'Admin',
          });
        });
      }

      activity.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      return activity.slice(0, 10);
    } catch (error) {
      console.error('Error fetching recent data:', error);
      return [];
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
      setError('Sessão expirada. Faça login novamente.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch system stats and recent data in parallel
      const [statsData, activityData] = await Promise.allSettled([
        fetchSystemStats(),
        fetchRecentData()
      ]);

      // Update stats
      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats({
          totalPlayers: statsData.value.entities?.players || 0,
          totalMatches: statsData.value.entities?.scores || 0,
          pendingMatches: 0,
          totalTournaments: statsData.value.tournaments?.total || 0,
        });
      }

      // Update activity
      if (activityData.status === 'fulfilled') {
        setRecentActivity(activityData.value);
      }

    } catch (error) {
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
    } catch (e) {
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
    // Estas classes devem ser responsivas ao tema
    switch (type) {
      case 'match':
        return 'bg-blue-100 dark:bg-blue-700 dark:bg-opacity-40 text-blue-600 dark:text-blue-200 border-blue-200 dark:border-blue-600';
      case 'player':
        return 'bg-green-100 dark:bg-green-700 dark:bg-opacity-40 text-green-600 dark:text-green-200 border-green-200 dark:border-green-600';
      case 'tournament':
        return 'bg-purple-100 dark:bg-purple-700 dark:bg-opacity-40 text-purple-600 dark:text-purple-200 border-purple-200 dark:border-purple-600';
      case 'system':
        return 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600';
      default:
        return 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600';
    }
  };

  return (
    <div className="page-admin-dashboard py-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Removed container mx-auto, kept px-4. MainLayout provides some padding already. */}
      <div className="px-4">
        <div className="dashboard-header mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Bem-vindo, {user?.name || 'Administrador'}! Gerencie torneios,
                jogadores e partidas.
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex gap-2">
              <Link
                to="/admin/reports"
                className="btn btn-outline btn-white text-sm"
              >
                <FaChartBar className="w-4 h-4 mr-2" />
                Relatórios
              </Link>
              <Link
                to="/admin/tournaments/create"
                className="btn btn-primary text-sm"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Novo Torneio
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner flex justify-center py-16">
            <FaSpinner className="animate-spin text-4xl text-primary dark:border-primary-light" />
            <p className="ml-4 text-lg text-gray-600 dark:text-gray-300">Carregando dados...</p>
          </div>
        ) : error ? (
          <div className="error-state flex flex-col items-center justify-center py-16">
            <FaExclamationTriangle className="text-4xl text-red-500 mb-4" />
            <p className="text-lg text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="btn btn-primary"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <div className="dashboard-content">
            <div className="stats-section mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                Estatísticas Gerais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total de Jogadores"
                  value={stats?.totalPlayers || 0}
                  icon={<FaUsers />}
                  color="blue"
                />
                <StatCard
                  title="Partidas Realizadas"
                  value={stats?.totalMatches || 0}
                  color="green"
                  icon={<FaListOl />}
                />
                <StatCard
                  title="Partidas Pendentes"
                  value={stats?.pendingMatches || 0}
                  color="yellow"
                  icon={<FaClock />}
                />
                <StatCard
                  title="Torneios Ativos"
                  value={stats?.totalTournaments || 0}
                  color="purple"
                  icon={<FaTrophy />}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                  Ações Rápidas
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <ActionCard
                    title="Gerenciar Jogadores"
                    description="Adicione, edite ou remova jogadores do sistema."
                    icon={<FaUsers />}
                    to="/admin/players" // Corrigido
                    buttonText="Gerenciar Jogadores"
                  />
                  <ActionCard
                    title="Adicionar Placar" // Alterado de "Registrar Partida"
                    description="Registre o resultado de uma partida existente."
                    icon={<FaPlusCircle />} // Ícone mais apropriado
                    to="/add-score" // Rota para adicionar placar (precisa de lógica para selecionar partida)
                    buttonText="Adicionar Placar"
                  />
                  <ActionCard
                    title="Configurações" // Simplificado
                    description="Ajuste configurações do sistema e segurança."
                    icon={<FaCog />}
                    to="/admin/settings" // Corrigido
                    buttonText="Abrir Configurações"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                  Atividade Recente
                </h2>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700">
                  {recentActivity.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      <p>Nenhuma atividade recente registrada.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-start">
                            <div
                              className={`activity-icon p-2 rounded-full mr-3 border ${getActivityClass(activity.type)}`}
                            >
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-grow">
                              <div className="mb-1 text-gray-800 dark:text-gray-100">
                                {activity.description}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
                                <div>
                                  <span className="mr-2">
                                    por {activity.user}
                                  </span>
                                </div>
                                <div>{formatDate(activity.timestamp)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    <Link
                      to="/admin/activity-log"
                      className="text-primary dark:text-primary-light hover:underline inline-flex items-center text-sm"
                    >
                      Ver todas as atividades
                      <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"
                        ></path>
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
