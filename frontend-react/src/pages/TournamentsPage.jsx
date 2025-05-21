import { useCallback, useEffect, useState } from 'react';
import {
  FaChevronRight,
  FaFilter,
  FaPlusCircle,
  FaSearch,
  FaSitemap,
  FaSyncAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { getTournaments } from '../services/api';

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const { showError } = useMessage();
  const { isAuthenticated, hasPermission } = useAuth();

  const fetchTournaments = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');
      try {
        const data = await getTournaments({
          page,
          limit: pageSize,
          search,
          status: statusFilter
        });
        const list = data.tournaments || [];
        setTournaments(list);
        setFiltered(list);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError('Erro ao carregar torneios.');
        showError(
          `Erro ao carregar torneios: ${err.message || 'Erro desconhecido'}`
        );
      } finally {
        setLoading(false);
      }
    },
    [showError, pageSize, search, statusFilter]
  );

  useEffect(() => {
    fetchTournaments(currentPage);
  }, [fetchTournaments, currentPage, search, statusFilter]);

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
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="finished">Finalizado</option>
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
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary dark:border-primary-light"></div>
          <span className="ml-4 text-lg text-gray-700 dark:text-gray-200">
            Carregando torneios...
          </span>
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-700 rounded-md p-8 text-center">
              <div className="flex flex-col items-center justify-center py-12">
                <FaTrophy className="text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400">
                  Nenhum torneio encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {search || statusFilter
                    ? 'Tente ajustar seus filtros de busca'
                    : 'Não há torneios cadastrados no sistema'}
                </p>
                {(search || statusFilter) && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('');
                    }}
                    className="mt-4 btn btn-outline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                      Data Início
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      Data Fim
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Jogadores
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {filtered.map(tournament => (
                    <tr key={tournament.id}>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">
                        {tournament.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`badge ${tournament.status === 'ativo' || tournament.status === 'active' ? 'badge-success' : tournament.status === 'finalizado' || tournament.status === 'finished' ? 'badge-primary' : 'badge-warning'}`}
                        >
                          {tournament.status || 'Indefinido'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 hidden sm:table-cell">
                        {(() => {
                          try {
                            return tournament.startDate
                              ? new Date(tournament.startDate).toLocaleDateString('pt-BR')
                              : '-';
                          } catch (err) {
                            console.error('Erro ao formatar data de início:', err);
                            return '-';
                          }
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 hidden md:table-cell">
                        {(() => {
                          try {
                            return tournament.endDate
                              ? new Date(tournament.endDate).toLocaleDateString('pt-BR')
                              : '-';
                          } catch (err) {
                            console.error('Erro ao formatar data de fim:', err);
                            return '-';
                          }
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 flex items-center gap-1">
                        <FaUsers className="inline mr-1" />
                        {tournament.playersCount ??
                          tournament.players?.length ??
                          '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link
                            to={`/tournaments/${tournament.id}`}
                            className="btn btn-outline btn-sm flex items-center gap-1"
                            title="Ver detalhes"
                          >
                            <FaChevronRight /> Detalhes
                          </Link>
                          <Link
                            to={`/brackets?tournament=${tournament.id}`}
                            className="btn btn-outline btn-sm flex items-center gap-1"
                            title="Ver chaveamento"
                          >
                            <FaSitemap /> Chaveamento
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
