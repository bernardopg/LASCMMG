import { useCallback, useEffect, useState } from 'react';
import {
  FaCalendarAlt,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaCrown,
  FaEdit,
  FaEye,
  FaFilter,
  FaGamepad,
  FaGem,
  FaPlus,
  FaSearch,
  FaSitemap,
  FaSyncAlt,
  FaTrash,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { deleteTournamentAdmin, getTournaments } from '../services/api';

const TournamentCard = ({ tournament, onView, onEdit, onDelete, isAdmin }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'em andamento':
        return {
          bg: 'bg-lime-600/20',
          text: 'text-lime-300',
          border: 'border-lime-500/50',
          dot: 'bg-lime-400',
        };
      case 'pendente':
        return {
          bg: 'bg-amber-600/20',
          text: 'text-amber-300',
          border: 'border-amber-500/50',
          dot: 'bg-amber-400',
        };
      case 'concluído':
        return {
          bg: 'bg-green-700/20',
          text: 'text-green-300',
          border: 'border-green-600/50',
          dot: 'bg-green-400',
        };
      case 'cancelado':
        return {
          bg: 'bg-red-600/20',
          text: 'text-red-400',
          border: 'border-red-500/50',
          dot: 'bg-red-500',
        };
      default:
        return {
          bg: 'bg-neutral-700/30',
          text: 'text-neutral-300',
          border: 'border-neutral-600/50',
          dot: 'bg-neutral-500',
        };
    }
  };

  const statusStyle = getStatusColor(tournament.status);

  return (
    <div className="bg-gradient-to-br from-green-900/80 via-green-800/70 to-neutral-900/60 backdrop-blur-xl border border-green-700/30 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
      <div
        className={`h-2 bg-gradient-to-r ${statusStyle.dot === 'bg-amber-400' ? 'from-amber-500 to-amber-600' : statusStyle.dot === 'bg-lime-400' ? 'from-lime-500 to-lime-600' : 'from-green-600 to-green-700'}`}
      />

      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 pr-4">
            <button
              className="text-2xl font-black text-white mb-2 leading-tight cursor-pointer hover:text-amber-400 transition-colors line-clamp-2 text-left w-full"
              onClick={() => onView(tournament)}
              title={tournament.name}
              type="button"
            >
              {tournament.name}
            </button>

            <p className="text-neutral-400 text-sm leading-relaxed mb-3 line-clamp-3">
              {tournament.description || 'Competição oficial da Liga Acadêmica de Sinuca CMMG'}
            </p>

            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase backdrop-blur-md border shadow-md ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
              {tournament.status || 'Ativo'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onView(tournament)}
              className="p-3 bg-lime-600/70 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-lime-600 transition-all duration-300"
              title="Ver detalhes"
            >
              <FaEye className="w-4 h-4" />
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(tournament)}
                  className="p-3 bg-amber-500/70 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-amber-500 transition-all duration-300"
                  title="Editar"
                >
                  <FaEdit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDelete(tournament)}
                  className="p-3 bg-red-700/70 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-red-700 transition-all duration-300"
                  title="Excluir"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tournament Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              label: 'Participantes',
              value: tournament.num_players_expected || 'N/A',
              icon: FaUsers,
              color: 'from-green-600 to-green-700',
              textColor: 'text-green-300',
            },
            {
              label: 'Formato',
              value: tournament.bracket_type?.replace('-', ' ').toUpperCase() || 'ELIMINATÓRIA',
              icon: FaSitemap,
              color: 'from-lime-500 to-lime-600',
              textColor: 'text-lime-300',
            },
            {
              label: 'Taxa',
              value:
                tournament.entry_fee !== null && tournament.entry_fee !== undefined
                  ? `R$ ${tournament.entry_fee.toFixed(2)}`
                  : 'GRÁTIS',
              icon: FaGem,
              color: 'from-amber-500 to-amber-600',
              textColor: 'text-amber-300',
            },
            {
              label: 'Premiação',
              value: tournament.prize_pool || 'A definir',
              icon: FaCrown,
              color: 'from-sky-500 to-sky-600',
              textColor: 'text-sky-300',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} shadow-md mb-2`}
              >
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <div className={`text-sm font-black ${stat.textColor} mb-1`}>{stat.value}</div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tournament Date */}
        {tournament.date && (
          <div className="flex items-center justify-center space-x-2 text-neutral-300 bg-green-800/30 backdrop-blur-sm rounded-xl p-3 border border-green-700/40">
            <FaCalendarAlt className="w-4 h-4 text-green-400" />
            <span className="font-medium text-sm">
              {new Date(tournament.date).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'short',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const LoadingSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="bg-green-800/30 backdrop-blur-md border border-green-700/40 rounded-3xl p-8 shadow-xl"
      >
        <div className="animate-pulse space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-green-700/50 rounded-2xl w-3/4" />
              <div className="h-4 bg-green-600/40 rounded-xl w-full" />
              <div className="h-6 bg-lime-600/40 rounded-full w-24" />
            </div>
            <div className="flex flex-col gap-2 ml-6">
              <div className="w-12 h-12 bg-green-700/50 rounded-xl" />
              <div className="w-12 h-12 bg-green-700/50 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, idx) => (
              <div key={idx} className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-700/50 rounded-xl mx-auto" />
                <div className="h-4 bg-green-600/40 rounded-lg" />
                <div className="h-3 bg-green-600/40 rounded-lg w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const TournamentsPage = () => {
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
            { defaultMessage: `Erro ao excluir torneio &quot;${tournament.name}&quot;` }
          );

          if (result && !result.handled && result.success) {
            showSuccess(`Torneio &quot;${tournament.name}&quot; excluído com sucesso!`);
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
          <LoadingSkeleton count={6} />
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

export default TournamentsPage;
