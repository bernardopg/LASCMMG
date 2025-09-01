import { useCallback, useEffect, useState } from 'react';
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaGamepad,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTrophy,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { deleteTournamentAdmin, getTournaments } from '../../../services/api';
import TournamentCard from './TournamentCard';
import TournamentLoadingSkeleton from './TournamentLoadingSkeleton';

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { isAuthenticated, hasPermission } = useAuth();
  const { withErrorHandling, showSuccess } = useErrorHandler();
  const navigate = useNavigate();

  const debouncedSearch = useDebounce(search, 300);
  const debouncedStatusFilter = useDebounce(statusFilter, 300);

  const fetchTournaments = useCallback(
    async (page = 1, showRefreshLoader = false) => {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const result = await withErrorHandling(
        async () => {
          const data = await getTournaments({
            page,
            limit: pageSize,
            search: debouncedSearch,
            status: debouncedStatusFilter,
          });
          return data;
        },
        { defaultMessage: 'Erro ao carregar torneios' }
      );

      if (result && !result.handled) {
        const list = result.tournaments || [];
        setTournaments(list);
        setTotalPages(result.totalPages || 1);
      } else {
        setError('Erro ao carregar torneios.');
      }

      setLoading(false);
      setRefreshing(false);
    },
    [pageSize, debouncedSearch, debouncedStatusFilter, withErrorHandling]
  );

  useEffect(() => {
    fetchTournaments(currentPage);
  }, [fetchTournaments, currentPage, debouncedSearch, debouncedStatusFilter]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchTournaments(currentPage, true);
  };

  const handleTournamentClick = useCallback(
    (tournament) => {
      navigate(`/tournaments/${tournament.id}`);
    },
    [navigate]
  );

  const handleTournamentEdit = useCallback(
    (tournament) => {
      if (isAuthenticated && hasPermission && hasPermission('admin')) {
        navigate(`/admin/tournaments/${tournament.id}`);
      }
    },
    [isAuthenticated, hasPermission, navigate]
  );

  const handleTournamentDelete = useCallback(
    async (tournament) => {
      if (isAuthenticated && hasPermission && hasPermission('admin')) {
        if (confirm(`Tem certeza que deseja excluir o torneio "${tournament.name}"?`)) {
          const result = await withErrorHandling(
            async () => deleteTournamentAdmin(tournament.id, true),
            { defaultMessage: `Erro ao excluir torneio "${tournament.name}"` }
          );

          if (result && !result.handled && result.success) {
            showSuccess(`Torneio "${tournament.name}" excluído com sucesso!`);
            fetchTournaments(currentPage);
          }
        }
      }
    },
    [isAuthenticated, hasPermission, withErrorHandling, showSuccess, fetchTournaments, currentPage]
  );

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Header Section */}
      <section className="relative z-10 mb-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 bg-green-800/40 backdrop-blur-md rounded-full px-6 py-3 mb-8 border border-green-600/60 shadow-xl">
            <FaTrophy className="w-6 h-6 text-amber-400" />
            <span className="text-lg font-bold text-amber-300 tracking-wide">
              Torneios Oficiais
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="block text-white">Explore Nossos</span>
            <span className="block bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-clip-text text-transparent">
              TORNEIOS
            </span>
          </h1>

          <p className="text-xl text-neutral-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Descubra competições emocionantes, acompanhe resultados em tempo real e participe da
            maior liga de sinuca acadêmica do país.
          </p>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10 p-6 bg-green-900/40 backdrop-blur-lg border border-green-700/50 rounded-3xl shadow-2xl">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Buscar torneios..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-3 bg-green-800/60 backdrop-blur-md border-2 border-green-600/70 rounded-xl
                         text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/80
                         focus:border-amber-500/90 hover:border-green-500/90 transition-all duration-300"
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lime-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[200px]">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full appearance-none pl-12 pr-8 py-3 bg-green-800/60 backdrop-blur-md border-2 border-green-600/70 rounded-xl
                         text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/80
                         focus:border-amber-500/90 hover:border-green-500/90 transition-all duration-300 cursor-pointer"
              >
                <option value="" className="bg-green-800 text-white">
                  Todos Status
                </option>
                <option value="Pendente" className="bg-green-800 text-white">
                  Pendente
                </option>
                <option value="Em Andamento" className="bg-green-800 text-white">
                  Em Andamento
                </option>
                <option value="Concluído" className="bg-green-800 text-white">
                  Concluído
                </option>
                <option value="Cancelado" className="bg-green-800 text-white">
                  Cancelado
                </option>
              </select>
              <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lime-400 w-4 h-4 pointer-events-none" />
              <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lime-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 justify-center lg:justify-end">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-lime-500 to-lime-600 text-green-900
                       rounded-xl shadow-lg hover:from-lime-400 hover:to-lime-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Atualizar lista"
            >
              <FaSyncAlt className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-semibold hidden sm:inline">Atualizar</span>
            </button>

            {isAuthenticated && hasPermission && hasPermission('admin') && (
              <Link to="/admin/tournaments/create">
                <button
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-amber-500 to-amber-600 text-white
                         rounded-xl shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300"
                >
                  <FaPlus className="w-4 h-4" />
                  <span className="font-semibold">Novo Torneio</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="relative mb-8 p-6 bg-red-800/30 backdrop-blur-md border-2 border-red-600/50 rounded-3xl shadow-xl text-white">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-lg">
              <FaGamepad className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-200 mb-1">Ops! Algo deu errado</h3>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <section className="relative z-10">
        {loading ? (
          <TournamentLoadingSkeleton count={6} />
        ) : tournaments.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <div
                  className="w-32 h-32 bg-gradient-to-br from-green-700/50 via-green-800/40 to-neutral-800/30 rounded-full
                               flex items-center justify-center mx-auto shadow-2xl border-2 border-green-600/30"
                >
                  <FaGamepad className="w-16 h-16 text-lime-400 opacity-80" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-white mb-4">Nenhum torneio encontrado</h3>
              <p className="text-lg text-neutral-400 mb-8">
                {search || statusFilter
                  ? 'Tente ajustar os filtros para encontrar torneios.'
                  : 'Ainda não há torneios cadastrados no sistema.'}
              </p>
              {isAuthenticated && hasPermission && hasPermission('admin') && (
                <Link to="/admin/tournaments/create">
                  <button
                    className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-br from-amber-500 to-amber-600
                           text-white rounded-2xl font-semibold shadow-xl hover:from-amber-400 hover:to-amber-500 transition-all duration-300"
                  >
                    <FaPlus className="w-5 h-5" />
                    <span>Criar Primeiro Torneio</span>
                  </button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Tournament Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {tournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onView={handleTournamentClick}
                  onEdit={handleTournamentEdit}
                  onDelete={handleTournamentDelete}
                  isAdmin={isAuthenticated && hasPermission && hasPermission('admin')}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-green-700/30">
                {/* Page Info */}
                <div className="flex items-center space-x-2 text-neutral-400">
                  <span className="font-medium">Página</span>
                  <span
                    className="px-3 py-1 bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-400/70
                           rounded-lg font-bold text-white shadow-md"
                  >
                    {currentPage}
                  </span>
                  <span className="font-medium">de {totalPages}</span>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-2 px-5 py-2 bg-green-800/50 backdrop-blur-md border-2 border-green-600/60
                             text-lime-300 rounded-xl font-semibold hover:border-lime-500/70
                             hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-2 px-5 py-2 bg-green-800/50 backdrop-blur-md border-2 border-green-600/60
                             text-lime-300 rounded-xl font-semibold hover:border-lime-500/70
                             hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <FaChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default TournamentList;
