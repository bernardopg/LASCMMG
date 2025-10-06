import { useEffect, useState } from 'react';
import { FaCalendarAlt, FaChartBar, FaGamepad, FaTrophy, FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/ui/loading/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useTournament } from '../context/TournamentContext';
import api from '../services/api';

const StatCard = ({ title, value, icon, color = 'primary', description, loading = false }) => {
  const IconComponent = icon;
  const colorClasses = {
    primary: 'bg-gradient-to-r from-green-600 to-green-700',
    secondary: 'bg-gradient-to-r from-lime-500 to-lime-600',
    accent: 'bg-gradient-to-r from-amber-500 to-amber-600',
    warning: 'bg-gradient-to-r from-orange-500 to-orange-600',
  };
  const selectedColor = colorClasses[color] || colorClasses.primary;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${selectedColor} shadow-lg`}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">
          <div className="h-8 bg-slate-700 rounded-xl" />
          <div className="h-5 bg-slate-600 rounded-lg w-3/4" />
        </div>
      ) : (
        <>
          <h3 className="text-lg font-bold text-slate-300 mb-2">{title}</h3>
          <div className="mb-3">
            <span className="text-3xl font-black text-green-400 block leading-none">{value}</span>
          </div>
          <p className="text-sm font-medium text-slate-400">{description}</p>
        </>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { currentTournament } = useTournament();
  const { showError } = useMessage();
  const [stats, setStats] = useState({
    players: 0,
    matches: 0,
    tournaments: 0,
    activeTournaments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/system/stats');
        if (response.data && response.data.success) {
          const systemStats = response.data.stats;
          setStats({
            players: systemStats.entities?.players || 0,
            matches: systemStats.entities?.matches || 0,
            tournaments: systemStats.tournaments?.total || 0,
            activeTournaments: systemStats.tournaments?.active || 0,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        showError('Erro ao carregar estatísticas do sistema');
      }
      setLoading(false);
    };

    fetchStats();
  }, [showError]);

  const formatGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const quickActions = [
    {
      title: 'Ver Chaveamentos',
      description: 'Visualizar brackets dos torneios',
      icon: FaTrophy,
      link: '/brackets',
      color: 'bg-gradient-to-r from-green-600 to-green-700',
    },
    {
      title: 'Jogadores',
      description: 'Lista de atletas cadastrados',
      icon: FaUsers,
      link: '/players',
      color: 'bg-gradient-to-r from-lime-500 to-lime-600',
    },
    {
      title: 'Estatísticas',
      description: 'Análises e dados',
      icon: FaChartBar,
      link: '/stats',
      color: 'bg-gradient-to-r from-amber-500 to-amber-600',
    },
    {
      title: 'Torneios',
      description: 'Competições disponíveis',
      icon: FaCalendarAlt,
      link: '/tournaments',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">
          {formatGreeting()}, {currentUser?.name || currentUser?.username || 'Usuário'}!
        </h1>
        <p className="text-lg text-slate-400">
          Bem-vindo ao sistema de gerenciamento da Liga Acadêmica de Sinuca CMMG
        </p>
      </div>

      {/* Current Tournament */}
      {currentTournament && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-lime-400 mb-4">Torneio Atual</h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">{currentTournament.name}</h3>
              <p className="text-slate-400 mb-2">
                {currentTournament.description || 'Torneio em andamento'}
              </p>
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <span>Status: {currentTournament.status || 'Ativo'}</span>
                {currentTournament.date && (
                  <span>Data: {new Date(currentTournament.date).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                to={`/tournaments/${currentTournament.id}`}
                className="inline-flex items-center px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors"
              >
                Ver Detalhes
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Jogadores"
          value={stats.players}
          icon={FaUsers}
          color="primary"
          description="Atletas cadastrados"
          loading={loading}
        />
        <StatCard
          title="Partidas Realizadas"
          value={stats.matches}
          icon={FaGamepad}
          color="secondary"
          description="Jogos finalizados"
          loading={loading}
        />
        <StatCard
          title="Torneios Criados"
          value={stats.tournaments}
          icon={FaTrophy}
          color="accent"
          description="Total de competições"
          loading={loading}
        />
        <StatCard
          title="Torneios Ativos"
          value={stats.activeTournaments}
          icon={FaCalendarAlt}
          color="warning"
          description="Em andamento"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600"
            >
              <div
                className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4`}
              >
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{action.title}</h3>
              <p className="text-slate-400 text-sm">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Atividade Recente</h2>
        <div className="text-center py-8">
          <FaChartBar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            Atividades recentes e notificações aparecerão aqui em breve.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
