import { useCallback, useEffect, useState } from 'react';
import {
  FaCog,
  FaEdit,
  FaList,
  FaPlus,
  FaSitemap,
  FaSync,
  FaTrash,
  FaSpinner,
  FaTrophy,
} from 'react-icons/fa'; // Added FaTrophy
import { Link } from 'react-router-dom';
import { useMessage } from '../../context/MessageContext';
import LoadingSpinner from '../../components/ui/loading/LoadingSpinner'; // Import LoadingSpinner
import PageHeader from '../../components/ui/page/PageHeader'; // For consistent page titles
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

  const cardBaseClasses = 'bg-slate-800 shadow-2xl rounded-xl border border-slate-700';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-3 py-1.5 rounded-md font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;
  const outlineButtonClasses = `${buttonBaseClasses} border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500`;
  const errorButtonClasses = `${buttonBaseClasses} border border-red-600 hover:border-red-500 bg-red-700/30 hover:bg-red-600/50 text-red-300 hover:text-red-200 focus:ring-red-500`;

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'Em Andamento':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'Pendente':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'Concluído':
        return 'bg-sky-500/20 text-sky-300 border border-sky-500/30';
      case 'Cancelado':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-slate-600/50 text-slate-300 border border-slate-500/50';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <PageHeader
          title="Gerenciar Torneios"
          icon={FaTrophy}
          iconColor="text-lime-400"
          smallMargin={true}
        />
        <Link
          to="/admin/tournaments/create"
          className={`${primaryButtonClasses} px-4 py-2 text-sm`}
        >
          <FaPlus className="mr-2 h-4 w-4" /> Criar Novo Torneio
        </Link>
      </div>

      {loading && (
        <div className="text-center py-10">
          <LoadingSpinner size="lg" message="Carregando torneios..." />
        </div>
      )}

      {!loading && tournaments.length === 0 && (
        <div className={`${cardBaseClasses} p-6 text-center`}>
          <FaList size={48} className="mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400 text-lg">Nenhum torneio encontrado.</p>
          <p className="text-slate-500 mt-2">Crie um novo torneio para começar.</p>
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <div className={`${cardBaseClasses} overflow-x-auto`}>
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {tournaments.map((tournament) => (
                <tr key={tournament.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                    {tournament.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {formatDate(tournament.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(tournament.status)}`}
                    >
                      {tournament.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {tournament.bracket_type?.replace('-', ' ') || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2 items-center justify-start">
                      <Link
                        to={`/admin/tournaments/${tournament.id}/edit`}
                        className={outlineButtonClasses}
                        title="Editar"
                      >
                        <FaEdit className="mr-1 h-3.5 w-3.5" /> Editar
                      </Link>
                      <Link
                        to={`/admin/tournaments/${tournament.id}/manage`}
                        className={outlineButtonClasses}
                        title="Gerenciar Estado e Chaveamento"
                      >
                        <FaCog className="mr-1 h-3.5 w-3.5" /> Gerenciar
                      </Link>
                      <button
                        onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                        className={errorButtonClasses}
                        title="Excluir"
                        disabled={actionLoading === tournament.id}
                      >
                        {actionLoading === tournament.id ? (
                          <FaSpinner className="animate-spin mr-1 h-3.5 w-3.5" />
                        ) : (
                          <FaTrash className="mr-1 h-3.5 w-3.5" />
                        )}
                        Excluir
                      </button>
                      {tournament.status === 'Pendente' && (
                        <button
                          onClick={() => handleGenerateBracket(tournament.id)}
                          className={outlineButtonClasses}
                          title="Gerar Chaveamento"
                          disabled={actionLoading === tournament.id}
                        >
                          {actionLoading === tournament.id ? (
                            <FaSpinner className="animate-spin mr-1 h-3.5 w-3.5" />
                          ) : (
                            <FaSitemap className="mr-1 h-3.5 w-3.5" />
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
            <div className="py-4 px-6 flex justify-between items-center text-sm text-slate-400 border-t border-slate-700">
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => fetchTournaments(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className={`${outlineButtonClasses} disabled:opacity-50`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchTournaments(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                  className={`${outlineButtonClasses} disabled:opacity-50`}
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
