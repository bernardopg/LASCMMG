import React, { useEffect, useState, useCallback } from 'react';
import {
  getTrashItems,
  restoreTrashItem,
  permanentlyDeleteTrashItem,
} from '../../services/api';
import { useMessage } from '../../context/MessageContext';
import { FaUndo, FaTrashAlt } from 'react-icons/fa'; // Ícones para ações

const ITEM_TYPE_LABELS = {
  player: 'Jogador',
  score: 'Placar',
  tournament: 'Torneio',
  // Add other types if they can be soft-deleted
};

const TrashPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useMessage(); // Corrigido
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');

  const fetchTrash = useCallback(
    async (page = 1, type = '') => {
      setLoading(true);
      try {
        const data = await getTrashItems({
          page,
          limit: 20,
          itemType: type || null,
        });
        setItems(data.items || []); // API returns 'items'
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        showError(
          `Erro ao carregar lixeira: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  useEffect(() => {
    fetchTrash(currentPage, filterType);
  }, [fetchTrash, currentPage, filterType]);

  const handleRestore = async (itemId, itemApiType) => { // Use itemApiType from item.itemType
    if (window.confirm('Deseja restaurar este item?')) {
      try {
        await restoreTrashItem(itemApiType, itemId); // Correct parameter order: itemType, itemId
        showSuccess('Item restaurado com sucesso.');
        fetchTrash(currentPage, filterType);
      } catch (error) {
        showError(
          `Erro ao restaurar item: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
        );
      }
    }
  };

  const handlePermanentDelete = async (itemId, itemApiType) => { // Use itemApiType from item.itemType
    if (
      window.confirm(
        'Deseja excluir permanentemente este item? Esta ação não pode ser desfeita.'
      )
    ) {
      try {
        await permanentlyDeleteTrashItem(itemApiType, itemId); // Correct parameter order: itemType, itemId
        showSuccess('Item excluído permanentemente.');
        fetchTrash(currentPage, filterType);
      } catch (error) {
        showError(
          `Erro ao excluir item: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
        );
      }
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Lixeira (Admin)
        </h1>
        <select
          className="form-select mt-1 block w-auto py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          aria-label="Filtrar tipo de item na lixeira"
        >
          <option value="">Todos os tipos</option>
          <option value="player">Jogadores</option>
          <option value="score">Placares</option>
          <option value="tournament">Torneios</option>
        </select>
      </div>
      <div className="card bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary-light mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Carregando itens da lixeira...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Nenhum item na lixeira.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome/Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data Exclusão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {items.map((item) => (
                  // API returns item.id (original entity ID) and item.itemType
                  <tr key={item.id + '-' + item.itemType}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ITEM_TYPE_LABELS[item.itemType] || item.itemType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.name || '-'} {/* Backend provides a 'name' field for display */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.deleted_at  // Use deleted_at from backend
                        ? new Date(item.deleted_at).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit', // Added time
                            minute: '2-digit' // Added time
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleRestore(item.id, item.itemType)}
                        className="text-green-500 hover:text-green-400 dark:text-green-400 dark:hover:text-green-300 flex items-center"
                        title="Restaurar"
                      >
                        <FaUndo className="mr-1" /> Restaurar
                      </button>
                      <button
                        onClick={() =>
                          handlePermanentDelete(item.id, item.itemType)
                        }
                        className="text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                        title="Excluir permanentemente"
                      >
                        <FaTrashAlt className="mr-1" /> Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="py-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-slate-700">
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() =>
                      fetchTrash(Math.max(1, currentPage - 1), filterType)
                    }
                    disabled={currentPage === 1 || loading}
                    className="btn btn-outline btn-sm disabled:opacity-50" // btn e btn-outline devem ser responsivos ao tema
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      fetchTrash(
                        Math.min(totalPages, currentPage + 1),
                        filterType
                      )
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
    </div>
  );
};

export default TrashPage;
