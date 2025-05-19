import React, { useEffect, useState, useCallback } from 'react';
import { getTrashItems, restoreTrashItem, permanentlyDeleteDBItem } from '../../services/api';
import { useMessage } from '../../context/MessageContext';

const ITEM_TYPE_LABELS = {
  player: 'Jogador',
  score: 'Placar',
  tournament: 'Torneio',
};

const TrashPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showMessage } = useMessage();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');

  const fetchTrash = useCallback(async (page = 1, type = '') => {
    setLoading(true);
    try {
      const data = await getTrashItems({ page, limit: 20, type: type || null });
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (error) {
      showMessage(`Erro ao carregar lixeira: ${error.message || 'Erro desconhecido'}`, 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchTrash(currentPage, filterType);
  }, [fetchTrash, currentPage, filterType]);

  const handleRestore = async (itemId, itemType) => {
    if (window.confirm('Deseja restaurar este item?')) {
      try {
        await restoreTrashItem(itemId, itemType);
        showMessage('Item restaurado com sucesso.', 'success');
        fetchTrash(currentPage, filterType);
      } catch (error) {
        showMessage(`Erro ao restaurar item: ${error.message || 'Erro desconhecido'}`, 'error');
      }
    }
  };

  const handlePermanentDelete = async (itemId, itemType) => {
    if (window.confirm('Deseja excluir permanentemente este item? Esta ação não pode ser desfeita.')) {
      try {
        await permanentlyDeleteDBItem(itemId, itemType);
        showMessage('Item excluído permanentemente.', 'success');
        fetchTrash(currentPage, filterType);
      } catch (error) {
        showMessage(`Erro ao excluir item: ${error.message || 'Erro desconhecido'}`, 'error');
      }
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Lixeira (Admin)</h1>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="player">Jogadores</option>
          <option value="score">Placares</option>
          <option value="tournament">Torneios</option>
        </select>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-400">Carregando itens da lixeira...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-lg">Nenhum item na lixeira.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome/Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data Exclusão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {items.map((item) => (
                  <tr key={item.id + '-' + item.type}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ITEM_TYPE_LABELS[item.type] || item.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.name || item.description || item.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button onClick={() => handleRestore(item.id, item.type)} className="text-green-500 hover:text-green-400" title="Restaurar">
                        Restaurar
                      </button>
                      <button onClick={() => handlePermanentDelete(item.id, item.type)} className="text-red-500 hover:text-red-400" title="Excluir permanentemente">
                        Excluir
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
                    onClick={() => fetchTrash(Math.max(1, currentPage - 1), filterType)}
                    disabled={currentPage === 1 || loading}
                    className="btn btn-outline btn-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => fetchTrash(Math.min(totalPages, currentPage + 1), filterType)}
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

export default TrashPage;
