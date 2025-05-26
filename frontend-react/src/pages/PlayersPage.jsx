import { useEffect, useState } from 'react';
import {
  FaChartBar,
  FaEdit,
  FaEye,
  FaFilter,
  FaGamepad,
  FaSearch,
  FaSort,
  FaTrash,
  FaTrophy,
  FaUserPlus,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { deletePlayerAdmin, getPlayers } from '../services/api';

const PlayersPage = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');

  const { hasPermission, currentUser: _currentUser } = useAuth();

  // Função helper para validar se um ID é válido
  const isValidId = (id) => {
    return id && typeof id === 'number' && id > 0 && !isNaN(id);
  };

  // Carregar dados reais do backend
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getPlayers();

        if (response.success && response.players) {
          // Transformar os dados do backend para o formato esperado pelo frontend
          // Filtrar players com IDs inválidos primeiro - validação rigorosa
          const validPlayers = response.players.filter(
            (player) =>
              player &&
              isValidId(player.id) &&
              player.name &&
              typeof player.name === 'string' &&
              player.name.trim() !== ''
          );

          const transformedPlayers = validPlayers.map((player, index) => ({
            id: player.id,
            name: player.name,
            email: player.email || '',
            nickname: player.nickname || '',
            gender: player.gender || '',
            skill_level: player.skill_level || '',
            totalMatches: player.games_played || 0,
            wins: player.wins || 0,
            losses: player.losses || 0,
            winRate:
              player.games_played > 0 ? Math.round((player.wins / player.games_played) * 100) : 0,
            ranking: index + 1, // Simples ranking baseado na ordem
            status: player.is_deleted ? 'inactive' : 'active',
            createdAt: player.created_at,
          }));

          setPlayers(transformedPlayers);
          setFilteredPlayers(transformedPlayers);
        } else {
          setError('Erro ao carregar jogadores. Tente novamente.');
        }
      } catch (err) {
        console.error('Erro ao carregar jogadores:', err);
        setError('Erro ao conectar com o servidor. Verifique sua conexão.');
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  // Filtrar e ordenar jogadores
  useEffect(() => {
    let filtered = [...players];

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (player) =>
          player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (player.email && player.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (player.nickname && player.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Aplicar filtro de status
    if (filterBy !== 'all') {
      filtered = filtered.filter((player) => player.status === filterBy);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPlayers(filtered);
  }, [players, searchTerm, sortBy, sortOrder, filterBy]);

  const handleDelete = async (playerId) => {
    if (!isValidId(playerId)) {
      setError('ID de jogador inválido.');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este jogador?')) {
      try {
        setLoading(true);
        const response = await deletePlayerAdmin(playerId, false); // soft delete

        if (response.success) {
          // Remover o jogador da lista local ou marcar como inativo
          setPlayers(players.map((p) => (p.id === playerId ? { ...p, status: 'inactive' } : p)));
        } else {
          setError(response.message || 'Erro ao excluir jogador.');
        }
      } catch (err) {
        console.error('Erro ao excluir jogador:', err);
        setError('Erro ao excluir jogador. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  const getRankingColor = (ranking) => {
    if (ranking === 1) return 'text-yellow-500';
    if (ranking === 2) return 'text-gray-400';
    if (ranking === 3) return 'text-orange-600';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jogadores</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerencie todos os jogadores cadastrados na plataforma
              </p>
            </div>

            {hasPermission('admin') && (
              <Link
                to="/admin/players/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-200"
              >
                <FaUserPlus className="w-4 h-4 mr-2" />
                Novo Jogador
              </Link>
            )}
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Jogadores</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{players.length}</p>
              </div>
              <FaUserPlus className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Jogadores Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {players.filter((p) => p.status === 'active').length}
                </p>
              </div>
              <FaGamepad className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Partidas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {players.reduce((acc, p) => acc + p.totalMatches, 0)}
                </p>
              </div>
              <FaTrophy className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taxa Média de Vitória</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(players.reduce((acc, p) => acc + p.winRate, 0) / players.length || 0)}
                  %
                </p>
              </div>
              <FaChartBar className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar jogadores..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtro por Status */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            {/* Ordenar por */}
            <div className="relative">
              <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Nome</option>
                <option value="ranking">Ranking</option>
                <option value="winRate">Taxa de Vitória</option>
                <option value="totalMatches">Total de Partidas</option>
              </select>
            </div>

            {/* Ordem */}
            <div>
              <select
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 dark:bg-red-900/50 dark:border-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Tabela de Jogadores */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ranking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Jogador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estatísticas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredPlayers.map((player) => (
                  <tr
                    key={player.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-2xl font-bold ${getRankingColor(player.ranking)}`}>
                          #{player.ranking}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {player.name}
                            {player.nickname && (
                              <span className="text-gray-500 dark:text-gray-400 ml-1">
                                ({player.nickname})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {player.email || 'Email não informado'}
                          </div>
                          {player.skill_level && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Nível: {player.skill_level}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div>
                          Partidas: <span className="font-medium">{player.totalMatches}</span>
                        </div>
                        <div>
                          V: <span className="text-green-600 font-medium">{player.wins}</span> | D:{' '}
                          <span className="text-red-600 font-medium">{player.losses}</span>
                        </div>
                        <div>
                          Taxa: <span className="font-medium">{player.winRate}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(player.status)}>
                        {player.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Only show links if player has a valid ID - validação rigorosa */}
                        {isValidId(player.id) && (
                          <Link
                            to={`/players/${player.id}`}
                            className="text-primary hover:text-primary-dark transition-colors duration-200"
                            title="Ver perfil"
                          >
                            <FaEye className="w-4 h-4" />
                          </Link>
                        )}
                        {hasPermission('admin') && isValidId(player.id) && (
                          <>
                            <Link
                              to={`/admin/players/${player.id}/edit`}
                              className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                              title="Editar jogador"
                            >
                              <FaEdit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(player.id)}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200"
                              title="Excluir jogador"
                              disabled={loading}
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {/* Show disabled state if no valid ID */}
                        {!isValidId(player.id) && (
                          <span className="text-gray-400" title="Jogador com dados inválidos">
                            <FaEye className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mensagem quando não há jogadores */}
        {filteredPlayers.length === 0 && !loading && (
          <div className="text-center py-12">
            <FaUserPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhum jogador encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando um novo jogador.'}
            </p>
            {hasPermission('admin') && !searchTerm && (
              <div className="mt-6">
                <Link
                  to="/admin/players/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <FaUserPlus className="w-4 h-4 mr-2" />
                  Criar Primeiro Jogador
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayersPage;
