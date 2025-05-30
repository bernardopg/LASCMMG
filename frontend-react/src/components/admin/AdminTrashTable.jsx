import React, { useState, useEffect, useCallback } from 'react';
import { getTrashItems, restoreTrashItem, permanentlyDeleteTrashItem } from '../../services/api';
import { useMessage } from '../../context/MessageContext';
import { FaUndo, FaTrashAlt, FaFilter } from 'react-icons/fa';

const AdminTrashTable = () => {
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showMessage } = useMessage();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [itemTypeFilter, setItemTypeFilter] = useState(''); // 'player', 'score', 'tournament' or '' for all

  const fetchTrashItems = useCallback(
    async (page = 1, type = '') => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTrashItems({ page, limit, itemType: type || null });
        setTrashItems(data.trashItems || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (err) {
        setError(err.message || 'Erro ao buscar itens da lixeira.');
        showMessage(
          `Erro ao buscar itens da lixeira: ${err.message || 'Erro desconhecido'}`,
          'error'
        );
        setTrashItems([]);
      } finally {
        setLoading(false);
      }
    },
    [limit, showMessage]
  );

  useEffect(() => {
    fetchTrashItems(currentPage, itemTypeFilter);
  }, [fetchTrashItems, currentPage, itemTypeFilter]);

  const handleRestore = async (itemId, itemType) => {
    if (window.confirm(`Tem certeza que deseja restaurar este item (${itemType})?`)) {
      try {
        await restoreTrashItem(itemType, itemId);
        showMessage('Item restaurado com sucesso!', 'success');
        fetchTrashItems(currentPage, itemTypeFilter); // Refresh list
      } catch (err) {
        showMessage(`Erro ao restaurar item: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    }
  };

  const handlePermanentDelete = async (itemId, itemType) => {
    if (
      window.confirm(
        `ATENÇÃO: Esta ação é irreversível! Tem certeza que deseja excluir permanentemente este item (${itemType})?`
      )
    ) {
      try {
        await permanentlyDeleteTrashItem(itemType, itemId);
        showMessage('Item excluído permanentemente.', 'success');
        fetchTrashItems(currentPage, itemTypeFilter); // Refresh list
      } catch (err) {
        showMessage(
          `Erro ao excluir item permanentemente: ${err.message || 'Erro desconhecido'}`,
          'error'
        );
      }
    }
  };

  const getItemDescription = (item) => {
    switch (item.type) {
      case 'player':
        return `Jogador: ${item.name || item.nickname || item.id}`;
      case 'score':
        return `Placar: ${item.player1_name || 'Jogador 1'} vs ${item.player2_name || 'Jogador 2'} (${item.player1_score || 0}-${item.player2_score || 0})`;
      case 'tournament':
        return `Torneio: ${item.name || item.id}`;
      default:
        return `ID: ${item.id} (Tipo: ${item.type})`;
    }
  };

  const getItemTypeName = (type) => {
    switch (type) {
      case 'player':
        return 'Jogador';
      case 'score':
        return 'Placar';
      case 'tournament':
        return 'Torneio';
      default:
        return type;
    }
  };

  if (loading)
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-300">Carregando lixeira...</p>
      </div>
    );
  if (error) return <div className="text-center py-10 text-red-400">Erro: {error}</div>;

  return (
    <div>
      <div className="mb-4 flex items-center space-x-4">
        <label htmlFor="itemTypeFilter" className="label text-sm">
          Filtrar por tipo:
        </label>
        <select
          id="itemTypeFilter"
          value={itemTypeFilter}
          onChange={(e) => {
            setItemTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="input text-sm py-1.5"
        >
          <option value="">Todos</option>
          <option value="players">Jogadores</option>
          <option value="scores">Placares</option>
          <option value="tournaments">Torneios</option>
        </select>
      </div>
      <div className="overflow-x-auto bg-gray-800 shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Data Exclusão
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {trashItems.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-400">
                  Lixeira vazia.
                </td>
              </tr>
            ) : (
              trashItems.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                    {getItemDescription(item)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {getItemTypeName(item.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.deleted_at ? new Date(item.deleted_at).toLocaleString('pt-BR') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleRestore(item.id, item.type)}
                      className="text-green-400 hover:text-green-300"
                      title="Restaurar Item"
                    >
                      <FaUndo />
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id, item.type)}
                      className="text-red-500 hover:text-red-400"
                      title="Excluir Permanentemente"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="py-4 flex justify-between items-center text-sm text-gray-400">
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <div className="space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrashTable;
