import React, { useEffect, useState, useCallback } from 'react';
import { getTournaments } from '../services/api';
import { Link } from 'react-router-dom'; // Removed useNavigate
import {
  FaSearch,
  FaPlusCircle,
  FaTrophy,
  FaUsers,
  // FaCalendarAlt, // Removed as it's not used
  FaChevronRight,
  FaSyncAlt,
  FaSitemap, // Added FaSitemap
} from 'react-icons/fa';
import { useMessage } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  const { showError } = useMessage();
  const { isAuthenticated, hasPermission } = useAuth();
  // const navigate = useNavigate(); // Removed as it's not used

  const fetchTournaments = useCallback(
    async (page = 1) => {
      // Added page parameter
      setLoading(true);
      setError('');
      try {
        const data = await getTournaments({ page, limit: pageSize, search }); // Pass pagination and search to API
        const list = data.tournaments || [];
        setTournaments(list); // This will now be the current page's data
        // Client-side filtering is still applied on the fetched page's data
        if (!search) {
          setFiltered(list);
        } else {
          setFiltered(
            list.filter((t) =>
              t.name.toLowerCase().includes(search.toLowerCase())
            )
          );
        }
        setTotalPages(data.totalPages || 1);
        // setCurrentPage should only be updated by user actions (pagination clicks)
        // or if the API forcefully dictates a different page (e.g. if requested page is out of bounds and API returns page 1)
        // For now, assume the API returns data for the 'page' requested.
        // If data.currentPage is reliably returned and might differ (e.g. for out-of-bounds requests),
        // then: if (page !== data.currentPage) setCurrentPage(data.currentPage);
      } catch (err) {
        setError('Erro ao carregar torneios.');
        showError(
          `Erro ao carregar torneios: ${err.message || 'Erro desconhecido'}`
        );
      } finally {
        setLoading(false);
      }
    },
    [showError, pageSize, search]
  ); // Added pageSize and search to dependencies

  useEffect(() => {
    fetchTournaments(currentPage); // Fetch based on currentPage
  }, [fetchTournaments, currentPage]); // Re-fetch when currentPage changes

  // Client-side search on the currently fetched page data
  useEffect(() => {
    if (!search) {
      setFiltered(tournaments); // tournaments is now the current page's data
    } else {
      setFiltered(
        tournaments.filter((t) =>
          t.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, tournaments]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    // Optionally, trigger a re-fetch if search is meant to be server-side
    // For now, client-side search on current page, or refetch page 1 on search change:
    // setCurrentPage(1);
    // fetchTournaments(1); // This would make search server-side if API supports it
  };

  const handleRefresh = () => {
    fetchTournaments(currentPage); // Refresh current page
  };

  // No longer need client-side slicing for pagination, 'filtered' is the data for the current page
  // const paginated = filtered.slice(
  //   (currentPage - 1) * pageSize,
  //   currentPage * pageSize
  // );

  return (
    // Removed "container mx-auto" to allow content to use more width
    // The <main> tag in MainLayout already provides p-6.
    // Keeping px-4 py-8 for now, can be removed if p-6 from main is sufficient.
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
          <button
            onClick={handleRefresh}
            className="btn btn-outline flex items-center gap-1"
            title="Atualizar lista"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} />
            Atualizar
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
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              Nenhum torneio encontrado.
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data Início
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
                  {filtered.map(
                    (
                      tournament // Iterate over 'filtered' which is the current page's data
                    ) => (
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
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {tournament.startDate
                            ? new Date(tournament.startDate).toLocaleDateString(
                                'pt-BR'
                              )
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {tournament.endDate
                            ? new Date(tournament.endDate).toLocaleDateString(
                                'pt-BR'
                              )
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 flex items-center gap-1">
                          <FaUsers className="inline mr-1" />
                          {tournament.playersCount ??
                            tournament.players?.length ??
                            '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
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
                    )
                  )}
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
