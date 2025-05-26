import { useCallback, useEffect, useState } from 'react';
import { FaCog, FaEdit, FaList, FaPlus, FaSitemap, FaSync, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useMessage } from '../../context/MessageContext';
import {
  deleteTournamentAdmin,
  generateTournamentBracket,
  getTournaments,
} from '../../services/api';

const AdminTournamentListPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess, showInfo: _showInfo } = useMessage();

  const [actionLoading, setActionLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTournaments = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const data = await getTournaments({ page, limit: 10 });
        setTournaments(data.tournaments || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        showError(`Erro ao carregar torneios: ${error.message || 'Erro desconhecido'}`);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  useEffect(() => {
    fetchTournaments(currentPage);
  }, [fetchTournaments, currentPage]);

  const handleDeleteTournament = async (tournamentId, tournamentName) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o torneio "${tournamentName}"? Esta ação pode ser irreversível dependendo da configuração.`
      )
    ) {
      setActionLoading(tournamentId);
      try {
        await deleteTournamentAdmin(tournamentId);
        showSuccess(`Torneio "${tournamentName}" excluído com sucesso.`);
        fetchTournaments(currentPage);
      } catch (error) {
        showError(
          `Erro ao excluir torneio: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
        );
      } finally {
        setActionLoading(null);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleGenerateBracket = async (tournamentId) => {
    setActionLoading(tournamentId);
    try {
      const result = await generateTournamentBracket(tournamentId);
      showSuccess(
        result.message ||
          'Chaveamento gerado com sucesso! Status do torneio atualizado para "Em Andamento".'
      );
      fetchTournaments(currentPage);
    } catch (error) {
      showError(
        `Erro ao gerar chaveamento: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gerenciar Torneios</h1>
        <Link to="/admin/tournaments/create" className="btn btn-primary">
          <FaPlus className="mr-2" /> Criar Novo Torneio
        </Link>
      </div>

      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary-light mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando torneios...</p>
        </div>
      )}

      {!loading && tournaments.length === 0 && (
        <div className="text-center py-10 card bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <FaList size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum torneio encontrado.</p>
          <p className="text-gray-600 dark:text-gray-500 mt-2">
            Crie um novo torneio para começar.
          </p>
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <div className="card bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto border border-gray-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {tournaments.map((tournament) => (
                <tr key={tournament.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tournament.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(tournament.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`badge ${
                        tournament.status === 'Em Andamento'
                          ? 'badge-success'
                          : tournament.status === 'Pendente'
                            ? 'badge-info'
                            : tournament.status === 'Concluído'
                              ? 'badge-primary'
                              : 'badge-warning'
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {tournament.bracket_type?.replace('-', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2 items-center justify-start">
                      <Link
                        to={`/admin/tournaments/${tournament.id}/edit`}
                        className="btn btn-xs btn-outline flex items-center"
                        title="Editar"
                        aria-label="Editar torneio"
                      >
                        <FaEdit className="mr-1" /> Editar
                      </Link>
                      <Link
                        to={`/admin/tournaments/${tournament.id}/manage`}
                        className="btn btn-xs btn-outline flex items-center"
                        title="Gerenciar Estado e Chaveamento"
                        aria-label="Gerenciar Estado e Chaveamento"
                      >
                        <FaCog className="mr-1" /> Gerenciar
                      </Link>
                      <button
                        onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                        className="btn btn-xs btn-outline btn-error flex items-center"
                        title="Excluir"
                        aria-label="Excluir torneio"
                        disabled={actionLoading === tournament.id}
                      >
                        {actionLoading === tournament.id ? (
                          <FaSync className="animate-spin mr-1" />
                        ) : (
                          <FaTrash className="mr-1" />
                        )}
                        Excluir
                      </button>
                      {tournament.status === 'Pendente' && (
                        <button
                          onClick={() => handleGenerateBracket(tournament.id)}
                          className="btn btn-xs btn-outline flex items-center"
                          title="Gerar Chaveamento"
                          aria-label="Gerar Chaveamento"
                          disabled={actionLoading === tournament.id}
                        >
                          {actionLoading === tournament.id ? (
                            <FaSync className="animate-spin mr-1" />
                          ) : (
                            <FaSitemap className="mr-1" />
                          )}
                          Chaveamento
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="py-4 px-6 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-slate-700">
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => fetchTournaments(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="btn btn-outline btn-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchTournaments(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="btn btn-outline btn-sm disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTournamentListPage;
