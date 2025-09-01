import { useState, useEffect, useCallback, memo } from 'react';
import { getTrashItems, restoreTrashItem, permanentlyDeleteTrashItem } from '../../../services/api';
import { useMessage } from '../../../context/MessageContext';
import { FaUndo, FaTrashAlt, FaFilter } from 'react-icons/fa';
import PaginatedTable from '../../common/PaginatedTable.jsx';
import { formatDateTimeReadable } from '../../../utils/dateUtils';

const AdminTrashTable = memo(() => {
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showMessage } = useMessage();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [itemTypeFilter, setItemTypeFilter] = useState('');

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
        const errorMessage = err.message || 'Erro ao buscar itens da lixeira.';
        setError(errorMessage);
        showMessage(`Erro ao buscar itens da lixeira: ${errorMessage}`, 'error');
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

  const handleRestore = useCallback(
    async (itemId, itemType) => {
      if (window.confirm(`Tem certeza que deseja restaurar este item (${itemType})?`)) {
        try {
          await restoreTrashItem(itemType, itemId);
          showMessage('Item restaurado com sucesso!', 'success');
          fetchTrashItems(currentPage, itemTypeFilter);
        } catch (err) {
          showMessage(`Erro ao restaurar item: ${err.message || 'Erro desconhecido'}`, 'error');
        }
      }
    },
    [showMessage, fetchTrashItems, currentPage, itemTypeFilter]
  );

  const handlePermanentDelete = useCallback(
    async (itemId, itemType) => {
      if (
        window.confirm(
          `ATENÇÃO: Esta ação é irreversível! Tem certeza que deseja excluir permanentemente este item (${itemType})?`
        )
      ) {
        try {
          await permanentlyDeleteTrashItem(itemType, itemId);
          showMessage('Item excluído permanentemente.', 'success');
          fetchTrashItems(currentPage, itemTypeFilter);
        } catch (err) {
          showMessage(
            `Erro ao excluir item permanentemente: ${err.message || 'Erro desconhecido'}`,
            'error'
          );
        }
      }
    },
    [showMessage, fetchTrashItems, currentPage, itemTypeFilter]
  );

  const handleFilterChange = useCallback((e) => {
    setItemTypeFilter(e.target.value);
    setCurrentPage(1);
  }, []);

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
    const typeMap = {
      player: 'Jogador',
      score: 'Placar',
      tournament: 'Torneio',
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type) => {
    const colorMap = {
      player: 'text-blue-400 bg-blue-400/10',
      score: 'text-yellow-400 bg-yellow-400/10',
      tournament: 'text-green-400 bg-green-400/10',
    };
    return colorMap[type] || 'text-slate-400 bg-slate-400/10';
  };

  const columns = [
    {
      key: 'descricao',
      label: 'Descrição',
      render: (item) => (
        <div className="max-w-xs">
          <span className="text-slate-100 font-medium break-words">{getItemDescription(item)}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
          {getItemTypeName(item.type)}
        </span>
      ),
    },
    {
      key: 'deleted_at',
      label: 'Data Exclusão',
      render: (item) => (
        <span className="text-slate-300 text-sm">{formatDateTimeReadable(item.deleted_at)}</span>
      ),
    },
  ];

  const actions = [
    {
      icon: <FaUndo className="w-4 h-4" />,
      onClick: (item) => handleRestore(item.id, item.type),
      className:
        'p-2 rounded-md text-green-400 hover:text-green-300 hover:bg-green-400/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800',
      title: 'Restaurar Item',
    },
    {
      icon: <FaTrashAlt className="w-4 h-4" />,
      onClick: (item) => handlePermanentDelete(item.id, item.type),
      className:
        'p-2 rounded-md text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800',
      title: 'Excluir Permanentemente',
    },
  ];

  return (
    <div className="p-6 bg-slate-900 rounded-xl shadow-lg">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Lixeira Administrativa</h2>
          <p className="text-sm text-slate-400 mt-1">
            Restaure ou exclua permanentemente itens deletados
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <FaFilter className="text-slate-400 h-5 w-5" />
          <select
            value={itemTypeFilter}
            onChange={handleFilterChange}
            className="px-3 py-2 text-sm text-slate-200 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-colors duration-200"
            aria-label="Filtrar itens da lixeira por tipo"
          >
            <option value="">Todos os Tipos</option>
            <option value="player">Jogadores</option>
            <option value="score">Placares</option>
            <option value="tournament">Torneios</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <PaginatedTable
        columns={columns}
        data={trashItems}
        loading={loading}
        error={error}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        actions={actions}
        emptyMessage="Lixeira vazia."
        tableClassName="rounded-lg overflow-hidden"
        headerClassName="bg-slate-700"
        rowClassName="bg-slate-800 hover:bg-slate-750 transition-colors duration-150"
        cellClassName="text-slate-300"
      />
    </div>
  );
});

AdminTrashTable.displayName = 'AdminTrashTable';

export default AdminTrashTable;
