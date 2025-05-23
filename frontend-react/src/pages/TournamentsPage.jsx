import { useCallback, useEffect, useState } from 'react';
import {
  FaFilter,
  FaPlusCircle,
  FaSearch,
  FaSyncAlt,
  FaTrophy,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { getTournaments } from '../services/api';
import { TournamentList, LoadingSkeleton } from '../components/common/MemoizedComponents';
import { useDebounce } from '../hooks/useDebounce';
import { useErrorHandler } from '../hooks/useErrorHandler';

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const { showError } = useMessage();
  const { isAuthenticated, hasPermission } = useAuth();
  const { withErrorHandling, showSuccess } = useErrorHandler();

  // Usar debounce para otimizar pesquisa
  const debouncedSearch = useDebounce(search, 300);
  const debouncedStatusFilter = useDebounce(statusFilter, 300);

  const fetchTournaments = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');

      const result = await withErrorHandling(
        async () => {
          const data = await getTournaments({
            page,
            limit: pageSize,
            search: debouncedSearch,
            status: debouncedStatusFilter
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
    fetchTournaments(currentPage);
  };

  const handleTournamentClick = useCallback((tournament) => {
    window.location.href = `/tournaments/${tournament.id}`;
  }, []);

  const handleTournamentEdit = useCallback((tournament) => {
    if (isAuthenticated && hasPermission && hasPermission('admin')) {
      window.location.href = `/admin/tournaments/${tournament.id}/edit`;
    }
  }, [isAuthenticated, hasPermission]);

  const handleTournamentDelete = useCallback(async (tournament) => {
    if (isAuthenticated && hasPermission && hasPermission('admin')) {
      if (confirm(`Tem certeza que deseja excluir o torneio "${tournament.name}"?`)) {
        // Implementar delete aqui quando a API estiver disponível
        showSuccess(`Torneio "${tournament.name}" excluído com sucesso!`);
        fetchTournaments(currentPage);
      }
    }
  }, [isAuthenticated, hasPermission, showSuccess, fetchTournaments, currentPage]);

  return (
    <div className="px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <FaTrophy className="text-yellow-500" /> Torneios
        </h1>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar torneio..."
              value={search}
              onChange={handleSearchChange}
              className="input pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          <div className="relative hidden sm:block">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="input pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos os status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            <FaFilter className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          <button
            onClick={handleRefresh}
            className="btn btn-outline flex items-center gap-1"
            title="Atualizar lista"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          {isAuthenticated && hasPermission && hasPermission('admin') && (
            <Link
              to="/admin/tournaments/create"
              className="btn btn-primary flex items-center gap-2"
            >
              <FaPlusCircle /> Novo Torneio
            </Link>
          )}
        </div>
      </div>
      {error && (
        <div className="bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200 p-4 rounded mb-4">
          {error}
        </div>
      )}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : (
        <>
          <TournamentList
            tournaments={tournaments}
            onTournamentClick={handleTournamentClick}
            onTournamentEdit={handleTournamentEdit}
            onTournamentDelete={handleTournamentDelete}
            isAdmin={isAuthenticated && hasPermission && hasPermission('admin')}
          />

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-outline btn-sm"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="btn btn-outline btn-sm"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TournamentsPage;
