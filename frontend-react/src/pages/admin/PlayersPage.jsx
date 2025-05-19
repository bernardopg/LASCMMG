import React, { useEffect, useState, useCallback } from 'react';
import { getAdminPlayers, deletePlayerAdmin } from '../../services/api';
import { useMessage } from '../../context/MessageContext';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const PlayersPage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showMessage } = useMessage();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPlayers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await getAdminPlayers({ page, limit: 20 });
      setPlayers(data.players || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (error) {
      showMessage(`Erro ao carregar jogadores: ${error.message || 'Erro desconhecido'}`, 'error');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchPlayers(currentPage);
  }, [fetchPlayers, currentPage]);

  const handleDeletePlayer = async (playerId, playerName) => {
    if (window.confirm(`Tem certeza que deseja excluir o jogador "${playerName}"?`)) {
      try {
        await deletePlayerAdmin(playerId);
        showMessage(`Jogador "${playerName}" excluído com sucesso.`, 'success');
        fetchPlayers(currentPage);
      } catch (error) {
        showMessage(`Erro ao excluir jogador: ${error.message || 'Erro desconhecido'}`, 'error');
      }
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Gerenciamento de Jogadores (Admin)</h1>
        <Link to="/admin/players/create" className="btn btn-primary">
          <FaPlus className="mr-2" /> Adicionar Jogador
        </Link>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-400">Carregando jogadores...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-lg">Nenhum jogador encontrado.</p>
            <p className="text-gray-500 mt-2">Adicione um novo jogador para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Apelido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {players.map((player) => (
                  <tr key={player.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{player.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{player.nickname || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{player.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button onClick={() => showMessage(`Editar jogador ${player.id} (implementar)`, 'info')} className="text-blue-500 hover:text-blue-400" title="Editar">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeletePlayer(player.id, player.name)} className="text-red-500 hover:text-red-400" title="Excluir">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="py-4 flex justify-between items-center text-sm text-gray-400">
                <span>Página {currentPage} de {totalPages}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => fetchPlayers(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}
                    className="btn btn-outline btn-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => fetchPlayers(Math.min(totalPages, currentPage + 1))}
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
    </div>
  );
};

export default PlayersPage;
