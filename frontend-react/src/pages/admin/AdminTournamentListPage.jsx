import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, deleteTournamentAdmin, generateTournamentBracket } from '../../services/api'; // Added generateTournamentBracket
import { useMessage } from '../../context/MessageContext';
import { FaPlus, FaEdit, FaTrash, FaCog, FaList, FaSitemap } from 'react-icons/fa'; // Added FaSitemap

const AdminTournamentListPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess, showInfo } = useMessage(); // Corrigido

  const [actionLoading, setActionLoading] = useState(null); // For specific row actions like generate
  // Pagination state (basic)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // const [totalTournaments, setTotalTournaments] = useState(0); // If API provides total

  const fetchTournaments = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        // Adjust getTournaments if it needs admin-specific version or pagination/filters
        const data = await getTournaments({ page, limit: 10 }); // Assuming getTournaments can take pagination
        setTournaments(data.tournaments || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
        // setTotalTournaments(data.totalTournaments || 0);
      } catch (error) {
        showError(
          `Erro ao carregar torneios: ${error.message || 'Erro desconhecido'}`
        ); // Corrigido
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    },
    [showError]
  ); // Corrigido

  useEffect(() => {
    fetchTournaments(currentPage);
  }, [fetchTournaments, currentPage]);

  const handleDeleteTournament = async (tournamentId, tournamentName) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o torneio "${tournamentName}"? Esta ação pode ser irreversível dependendo da configuração.`
      )
    ) {
      try {
        await deleteTournamentAdmin(tournamentId); // Assumes this API call exists and works
        showSuccess(`Torneio "${tournamentName}" excluído com sucesso.`); // Corrigido
        fetchTournaments(currentPage);
      } catch (error) {
        showError(
          `Erro ao excluir torneio: ${error.message || 'Erro desconhecido'}`
        ); // Corrigido
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
      showSuccess(result.message || 'Chaveamento gerado com sucesso! Status do torneio atualizado para "Em Andamento".');
      fetchTournaments(currentPage); // Refresh list
    } catch (error) {
      showError(`Erro ao gerar chaveamento: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="px-4 py-8"> {/* Removed container mx-auto */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Gerenciar Torneios
        </h1>
        <Link to="/admin/tournaments/create" className="btn btn-primary">
          <FaPlus className="mr-2" /> Criar Novo Torneio
        </Link>
      </div>

      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary-light mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Carregando torneios...
          </p>
        </div>
      )}

      {!loading && tournaments.length === 0 && (
        <div className="text-center py-10 card bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <FaList
            size={48}
            className="mx-auto text-gray-400 dark:text-gray-500 mb-4"
          />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nenhum torneio encontrado.
          </p>
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
                <tr
                  key={tournament.id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tournament.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(tournament.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`badge ${
                        // As classes badge-* devem ser responsivas ao tema
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <Link
                      to={`/admin/tournaments/edit/${tournament.id}`}
                      className="text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Editar"
                    >
                      <FaEdit />
                    </Link>
                    <Link
                      to={`/admin/tournaments/manage/${tournament.id}`}
                      className="text-green-500 hover:text-green-400 dark:text-green-400 dark:hover:text-green-300"
                      title="Gerenciar Estado e Chaveamento"
                    >
                      <FaCog />
                    </Link>
                    <button
                      onClick={() =>
                        handleDeleteTournament(tournament.id, tournament.name)
                      }
                      className="text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300"
                      title="Excluir"
                      disabled={actionLoading === tournament.id}
                    >
                      <FaTrash />
                    </button>
                    {tournament.status === 'Pendente' && (
                      <button
                        onClick={() => handleGenerateBracket(tournament.id)}
                        className="text-teal-500 hover:text-teal-400 dark:text-teal-400 dark:hover:text-teal-300"
                        title="Gerar Chaveamento"
                        disabled={actionLoading === tournament.id}
                      >
                        {actionLoading === tournament.id ? (
                          <FaSyncAlt className="animate-spin" />
                        ) : (
                          <FaSitemap />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Basic Pagination Controls */}
          {totalPages > 1 && (
            <div className="py-4 px-6 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-slate-700">
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => fetchTournaments(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="btn btn-outline btn-sm disabled:opacity-50" // btn e btn-outline devem ser responsivos ao tema
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    fetchTournaments(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages || loading}
                  className="btn btn-outline btn-sm disabled:opacity-50" // btn e btn-outline devem ser responsivos ao tema
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
