import { useCallback, useEffect, useState } from 'react';
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaGamepad,
  FaSearch,
  FaSort,
  FaSyncAlt,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useMessage } from '../../../context/MessageContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { deletePlayerAdmin, getPlayers } from '../../../services/api';
import PlayerCard from './PlayerCard';
import LoadingSkeleton from './LoadingSkeleton';
import PlayerStats from './PlayerStats';

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const playersPerPage = 12;

  const { hasPermission } = useAuth();
  const { showError, showSuccess } = useMessage();
  const { withErrorHandling } = useErrorHandler();
  const navigate = useNavigate();

  const debouncedSearch = useDebounce(searchTerm, 300);

  const isValidId = (id) => {
    return id && typeof id === 'number' && id > 0 && !isNaN(id);
  };

  const fetchPlayers = useCallback(
    async (showRefreshLoader = false) => {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const result = await withErrorHandling(
        async () => {
          const response = await getPlayers();
          return response;
        },
        { defaultMessage: 'Erro ao carregar jogadores' }
      );

      if (result && !result.handled) {
        if (result.success && result.players) {
          const validPlayers = result.players.filter(
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
            ranking: index + 1,
            status: player.is_deleted ? 'inactive' : 'active',
            createdAt: player.created_at,
          }));

          setPlayers(transformedPlayers);
        } else {
          setError('Erro ao carregar jogadores. Tente novamente.');
        }
      } else {
        setError('Erro ao carregar jogadores.');
      }

      setLoading(false);
      setRefreshing(false);
    },
    [withErrorHandling]
  );

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    let filtered = [...players];

    if (debouncedSearch) {
      filtered = filtered.filter(
        (player) =>
          player.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (player.email && player.email.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (player.nickname && player.nickname.toLowerCase().includes(debouncedSearch.toLowerCase()))
      );
    }

    if (filterBy !== 'all') {
      filtered = filtered.filter((player) => player.status === filterBy);
    }

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
    setCurrentPage(1);
  }, [players, debouncedSearch, sortBy, sortOrder, filterBy]);

  const handleDelete = useCallback(
    async (player) => {
      if (!isValidId(player.id)) {
        showError('ID de jogador inválido.');
        return;
      }

      if (confirm(`Tem certeza que deseja excluir o jogador "${player.name}"?`)) {
        const result = await withErrorHandling(
          async () => {
            const response = await deletePlayerAdmin(player.id, false);
            return response;
          },
          { defaultMessage: 'Erro ao excluir jogador' }
        );

        if (result && !result.handled) {
          if (result.success) {
            showSuccess(`Jogador "${player.name}" excluído com sucesso!`);
            setPlayers(players.map((p) => (p.id === player.id ? { ...p, status: 'inactive' } : p)));
          } else {
            showError(result.message || 'Erro ao excluir jogador.');
          }
        }
      }
    },
    [players, withErrorHandling, showError, showSuccess]
  );

  const handleView = useCallback(
    (player) => {
      if (isValidId(player.id)) {
        navigate(`/players/${player.id}`);
      }
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (player) => {
      if (hasPermission('admin') && isValidId(player.id)) {
        navigate(`/admin/players/${player.id}/edit`);
      }
    },
    [hasPermission, navigate]
  );

  const handleRefresh = () => {
    fetchPlayers(true);
  };

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const startIndex = (currentPage - 1) * playersPerPage;
  const endIndex = startIndex + playersPerPage;
  const currentPlayers = filteredPlayers.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Header Section */}
      <section className="relative z-10 mb-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 bg-green-800/30 backdrop-blur-md rounded-full px-6 py-3 mb-8 border border-green-600/50 shadow-lg">
            <FaUsers className="w-6 h-6 text-lime-400" />
            <span className="text-lg font-bold text-lime-300 tracking-wide">Atletas da Liga</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="block text-white">Nossos</span>
            <span className="block bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-clip-text text-transparent">
              JOGADORES
            </span>
          </h1>

          <p className="text-xl text-neutral-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Conheça os atletas que fazem parte da maior liga de sinuca acadêmica do país e acompanhe
            suas estatísticas em tempo real.
          </p>
        </div>

        {/* Stats Cards */}
        <PlayerStats players={players} />

        {/* Controls Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10 p-6 bg-green-900/30 backdrop-blur-lg border border-green-700/40 rounded-3xl shadow-2xl">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar jogadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-green-800/50 backdrop-blur-md border-2 border-green-600/60 rounded-xl
                         text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/70
                         focus:border-amber-500/80 hover:border-green-500/80 transition-all duration-300 shadow-inner"
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lime-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Filter Dropdown */}
            <div className="relative min-w-[180px]">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="w-full appearance-none pl-12 pr-8 py-3.5 bg-green-800/50 backdrop-blur-md border-2 border-green-600/60 rounded-xl
                         text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/70
                         focus:border-amber-500/80 hover:border-green-500/80 transition-all duration-300 cursor-pointer shadow-inner"
              >
                <option value="all" className="bg-green-800 text-white">
                  Todos Status
                </option>
                <option value="active" className="bg-green-800 text-white">
                  Ativos
                </option>
                <option value="inactive" className="bg-green-800 text-white">
                  Inativos
                </option>
              </select>
              <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lime-400 w-4 h-4 pointer-events-none" />
              <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lime-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[220px]">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full appearance-none pl-12 pr-8 py-3.5 bg-green-800/50 backdrop-blur-md border-2 border-green-600/60 rounded-xl
                         text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/70
                         focus:border-amber-500/80 hover:border-green-500/80 transition-all duration-300 cursor-pointer shadow-inner"
              >
                <option value="name-asc" className="bg-green-800 text-white">
                  Nome (A-Z)
                </option>
                <option value="name-desc" className="bg-green-800 text-white">
                  Nome (Z-A)
                </option>
                <option value="ranking-asc" className="bg-green-800 text-white">
                  Ranking (Melhor)
                </option>
                <option value="ranking-desc" className="bg-green-800 text-white">
                  Ranking (Pior)
                </option>
                <option value="totalMatches-desc" className="bg-green-800 text-white">
                  Mais Partidas
                </option>
                <option value="winRate-desc" className="bg-green-800 text-white">
                  Maior Taxa de Vitória
                </option>
              </select>
              <FaSort className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lime-400 w-4 h-4 pointer-events-none" />
              <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lime-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 items-center justify-center lg:justify-end">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-br from-green-600 to-green-700 text-white
                       rounded-xl shadow-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaSyncAlt className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-semibold">Atualizar</span>
            </button>

            {hasPermission('admin') && (
              <Link to="/admin/players/new">
                <button
                  className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-br from-amber-500 to-amber-600 text-white
                         rounded-xl shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300"
                >
                  <FaUserPlus className="w-4 h-4" />
                  <span className="font-semibold">Novo Jogador</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <FaGamepad className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Ops! Algo deu errado</h3>
              <p className="text-neutral-300 mb-6">{error}</p>
              <button
                onClick={() => fetchPlayers()}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && <LoadingSkeleton count={12} />}

        {/* Players Grid */}
        {!loading && !error && (
          <>
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-r from-neutral-300 to-neutral-400 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                    <FaUsers className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4">Nenhum jogador encontrado</h3>
                  <p className="text-neutral-300 mb-6">
                    {searchTerm || filterBy !== 'all'
                      ? 'Tente ajustar os filtros de busca.'
                      : 'Parece que ainda não há jogadores cadastrados.'}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Limpar Busca
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  {currentPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isAdmin={hasPermission('admin')}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-12">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-3 bg-green-800/50 backdrop-blur-md text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700/50 transition-all duration-300"
                    >
                      <FaChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          currentPage === index + 1
                            ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg'
                            : 'bg-green-800/50 backdrop-blur-md text-neutral-300 hover:bg-green-700/50 hover:text-white'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-3 bg-green-800/50 backdrop-blur-md text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700/50 transition-all duration-300"
                    >
                      <FaChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Results Summary */}
                <div className="text-center mt-8">
                  <p className="text-neutral-400 text-sm">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, filteredPlayers.length)} de{' '}
                    {filteredPlayers.length} jogadores
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PlayerList;
