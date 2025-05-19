import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments } from '../../services/api'; // Assuming this fetches all for admin
import { useMessage } from '../../context/MessageContext';
import { FaPlus, FaEdit, FaTrash, FaCog, FaList } from 'react-icons/fa';

const AdminTournamentListPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showMessage } = useMessage();

  // Pagination state (basic)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // const [totalTournaments, setTotalTournaments] = useState(0); // If API provides total

  const fetchTournaments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // Adjust getTournaments if it needs admin-specific version or pagination/filters
      const data = await getTournaments({ page, limit: 10 }); // Assuming getTournaments can take pagination
      setTournaments(data.tournaments || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
      // setTotalTournaments(data.totalTournaments || 0);
    } catch (error) {
      showMessage(`Erro ao carregar torneios: ${error.message || 'Erro desconhecido'}`, 'error');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchTournaments(currentPage);
  }, [fetchTournaments, currentPage]);

  const handleDeleteTournament = async (tournamentId, tournamentName) => {
    if (window.confirm(`Tem certeza que deseja excluir o torneio "${tournamentName}"? Esta ação pode ser irreversível dependendo da configuração.`)) {
      showMessage(`Simulando exclusão do torneio ${tournamentId}... (implementar API)`, 'info');
      // TODO: Implement API call: await deleteTournamentAdmin(tournamentId);
      // fetchTournaments(currentPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Gerenciar Torneios</h1>
        <Link to="/admin/tournaments/create" className="btn btn-primary">
          <FaPlus className="mr-2" /> Criar Novo Torneio
        </Link>
      </div>

      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-400">Carregando torneios...</p>
        </div>
      )}

      {!loading && tournaments.length === 0 && (
        <div className="text-center py-10 card">
          <FaList size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400 text-lg">Nenhum torneio encontrado.</p>
          <p className="text-gray-500 mt-2">Crie um novo torneio para começar.</p>
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tournaments.map((tournament) => (
                <tr key={tournament.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{tournament.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(tournament.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`badge ${
                      tournament.status === 'Em Andamento' ? 'badge-success' :
                      tournament.status === 'Pendente' ? 'badge-info' :
                      tournament.status === 'Concluído' ? 'badge-primary' : // Assuming primary for completed
                      'badge-warning' // For Cancelado or other
                    }`}>
                      {tournament.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tournament.bracket_type?.replace('-', ' ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button onClick={() => showMessage(`Editar torneio ${tournament.id} (implementar)`, 'info')} className="text-blue-400 hover:text-blue-300" title="Editar">
                      <FaEdit />
                    </button>
                    <button onClick={() => showMessage(`Gerenciar estado ${tournament.id} (implementar)`, 'info')} className="text-green-400 hover:text-green-300" title="Gerenciar Estado">
                      <FaCog />
                    </button>
                    <button onClick={() => handleDeleteTournament(tournament.id, tournament.name)} className="text-red-400 hover:text-red-300" title="Excluir">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Basic Pagination Controls */}
          {totalPages > 1 && (
            <div className="py-4 px-6 flex justify-between items-center text-sm text-gray-400 border-t border-gray-700">
              <span>Página {currentPage} de {totalPages}</span>
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
