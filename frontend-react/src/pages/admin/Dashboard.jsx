import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';
import { useMessage } from '../../context/MessageContext';

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <div className="stat-card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
    <div className="flex items-start">
      <div className={`icon-wrapper mr-4 p-3 rounded-full bg-${color}-100`}>
        <span className={`text-${color}-600`} dangerouslySetInnerHTML={{ __html: icon }}></span>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const ActionCard = ({ title, description, icon, to, buttonText }) => (
  <div className="action-card bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
    <div className="icon-wrapper mb-4 text-primary">
      <span dangerouslySetInnerHTML={{ __html: icon }}></span>
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 mb-4 flex-grow">{description}</p>
    <Link
      to={to}
      className="mt-auto inline-flex items-center justify-center px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded-md"
    >
      {buttonText}
    </Link>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { currentTournament, loading: tournamentLoading } = useTournament();
  const { showError } = useMessage();

  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Simulação da chamada API
        setTimeout(() => {
          // Dados simulados para desenvolvimento
          const mockStats = {
            totalPlayers: 32,
            totalMatches: 28,
            pendingMatches: 4,
            totalTournaments: 3,
            averageScore: 2.7
          };

          const mockActivity = [
            {
              id: 1,
              type: 'match',
              description: 'Partida finalizada: Carlos Silva vs João Ferreira (3-1)',
              timestamp: '2025-05-18T18:30:00',
              user: 'Administrador'
            },
            {
              id: 2,
              type: 'player',
              description: 'Jogador adicionado: Marcos Oliveira',
              timestamp: '2025-05-18T17:15:00',
              user: 'Administrador'
            },
            {
              id: 3,
              type: 'tournament',
              description: 'Torneio atualizado: Campeonato de Verão 2025',
              timestamp: '2025-05-18T15:20:00',
              user: 'Administrador'
            },
            {
              id: 4,
              type: 'match',
              description: 'Partida agendada: Pedro Santos vs Lucas Pereira',
              timestamp: '2025-05-18T14:45:00',
              user: 'Administrador'
            },
            {
              id: 5,
              type: 'system',
              description: 'Backup do sistema realizado com sucesso',
              timestamp: '2025-05-18T12:00:00',
              user: 'Sistema'
            }
          ];

          setStats(mockStats);
          setRecentActivity(mockActivity);
          setLoading(false);
        }, 800);

      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        showError('Falha ao carregar dados', 'Verifique sua conexão e tente novamente.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showError]);

  // Obter a data formatada para exibição
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obter ícone com base no tipo de atividade
  const getActivityIcon = (type) => {
    switch (type) {
      case 'match':
        return '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19.5,3.09L15,7.59V4H9V11H14V17.59L19.5,12.09L18.09,10.68L14.5,14.27V13H10V5H14V7.18L15.5,5.68L19.5,3.09M20,20H4V20H4V4H5V20H20V20Z"></path></svg>';
      case 'player':
        return '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"></path></svg>';
      case 'tournament':
        return '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z"></path></svg>';
      case 'system':
        return '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12,3L2,12H5V20H19V12H22L12,3M12,8.5C14.34,8.5 16.46,9.43 18,10.94L16.8,12.12C15.58,10.91 13.88,10.17 12,10.17C10.12,10.17 8.42,10.91 7.2,12.12L6,10.94C7.54,9.43 9.66,8.5 12,8.5M12,11.83C13.4,11.83 14.67,12.39 15.6,13.3L14.4,14.47C13.79,13.87 12.94,13.5 12,13.5C11.06,13.5 10.21,13.87 9.6,14.47L8.4,13.3C9.33,12.39 10.6,11.83 12,11.83M12,15.17C12.94,15.17 13.7,15.91 13.73,16.83H10.27C10.3,15.91 11.06,15.17 12,15.17Z"></path></svg>';
      default:
        return '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M13,9H11V7H13V9M13,17H11V11H13V17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"></path></svg>';
    }
  };

  // Obter classe de cor com base no tipo de atividade
  const getActivityClass = (type) => {
    switch (type) {
      case 'match':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'player':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'tournament':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'system':
        return 'bg-gray-50 text-gray-600 border-gray-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="page-admin-dashboard py-6">
      <div className="container mx-auto px-4">
        <div className="dashboard-header mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600 mt-1">
                Bem-vindo, {user?.name || 'Administrador'}! Gerencie torneios, jogadores e partidas.
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex gap-2">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center">
                <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M17 19H7V5H19V17H17V19Z"></path>
                </svg>
                Relatórios
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center">
                <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"></path>
                </svg>
                Novo Torneio
              </button>
            </div>
          </div>
        </div>

        {loading || tournamentLoading ? (
          <div className="loading-spinner flex justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="dashboard-content">
            {/* Seção de estatísticas */}
            <div className="stats-section mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Estatísticas Gerais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total de Jogadores"
                  value={stats?.totalPlayers || 0}
                  icon='<svg class="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"></path></svg>'
                />
                <StatCard
                  title="Partidas Realizadas"
                  value={stats?.totalMatches || 0}
                  color="blue"
                  icon='<svg class="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M19.5,3.09L15,7.59V4H9V11H14V17.59L19.5,12.09L18.09,10.68L14.5,14.27V13H10V5H14V7.18L15.5,5.68L19.5,3.09M20,20H4V20H4V4H5V20H20V20Z"></path></svg>'
                />
                <StatCard
                  title="Partidas Pendentes"
                  value={stats?.pendingMatches || 0}
                  color="yellow"
                  icon='<svg class="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"></path></svg>'
                />
                <StatCard
                  title="Torneios Ativos"
                  value={stats?.totalTournaments || 0}
                  color="green"
                  icon='<svg class="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z"></path></svg>'
                />
              </div>
            </div>

            {/* Layout de duas colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna da esquerda: Ações rápidas */}
              <div className="lg:col-span-1">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Ações Rápidas</h2>
                <div className="grid grid-cols-1 gap-4">
                  <ActionCard
                    title="Gerenciar Jogadores"
                    description="Adicione, edite ou remova jogadores do sistema."
                    icon='<svg class="w-8 h-8" viewBox="0 0 24 24"><path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"></path></svg>'
                    to="/admin/jogadores"
                    buttonText="Gerenciar Jogadores"
                  />
                  <ActionCard
                    title="Registrar Partida"
                    description="Registre uma nova partida ou atualize o resultado de uma existente."
                    icon='<svg class="w-8 h-8" viewBox="0 0 24 24"><path fill="currentColor" d="M19.5,3.09L15,7.59V4H9V11H14V17.59L19.5,12.09L18.09,10.68L14.5,14.27V13H10V5H14V7.18L15.5,5.68L19.5,3.09M20,20H4V20H4V4H5V20H20V20Z"></path></svg>'
                    to="/admin/partidas/nova"
                    buttonText="Registrar Partida"
                  />
                  <ActionCard
                    title="Configurações do Sistema"
                    description="Ajuste configurações do sistema, backup de dados e mais."
                    icon='<svg class="w-8 h-8" viewBox="0 0 24 24"><path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"></path></svg>'
                    to="/admin/configuracoes"
                    buttonText="Abrir Configurações"
                  />
                </div>
              </div>

              {/* Coluna da direita: Atividade recente */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Atividade Recente</h2>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {recentActivity.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <p>Nenhuma atividade recente registrada.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex">
                            <div className={`activity-icon p-2 rounded-full mr-3 ${getActivityClass(activity.type)}`}>
                              <span dangerouslySetInnerHTML={{ __html: getActivityIcon(activity.type) }}></span>
                            </div>
                            <div className="flex-grow">
                              <div className="mb-1">{activity.description}</div>
                              <div className="text-sm text-gray-500 flex items-center justify-between">
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

                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <Link
                      to="/admin/atividades"
                      className="text-primary hover:underline inline-flex items-center"
                    >
                      Ver todas as atividades
                      <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"></path>
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
