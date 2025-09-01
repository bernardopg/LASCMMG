import { useState, useEffect, useCallback, memo } from 'react';
import { getAdminScores, deleteScoreAdmin, updateScoreAdmin } from '../../../services/api';
import { useMessage } from '../../../context/MessageContext';
import { FaEdit, FaTrash } from 'react-icons/fa';
import * as Yup from 'yup';
import FormModal from '../../ui/forms/FormModal.jsx';
import PaginatedTable from '../../common/PaginatedTable.jsx';
import { formatDateTimeReadable } from '../../../utils/dateUtils';

const scoreFields = [
  {
    name: 'player1_score',
    label: 'Placar Jogador 1',
    type: 'number',
    fullWidth: true,
  },
  {
    name: 'player2_score',
    label: 'Placar Jogador 2',
    type: 'number',
    fullWidth: true,
  },
  {
    name: 'round',
    label: 'Rodada',
    type: 'text',
    fullWidth: true,
  },
];

const scoreValidationSchema = Yup.object().shape({
  player1_score: Yup.number()
    .required('Placar obrigatório')
    .min(0, 'Mínimo 0')
    .integer('Deve ser inteiro'),
  player2_score: Yup.number()
    .required('Placar obrigatório')
    .min(0, 'Mínimo 0')
    .integer('Deve ser inteiro'),
  round: Yup.string().required('Rodada obrigatória'),
});

const AdminScoresTable = memo(() => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showMessage } = useMessage();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScore, setEditingScore] = useState(null);

  const fetchScores = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminScores({
          page,
          limit,
          sortBy: 'timestamp',
          order: 'desc',
        });
        setScores(data.scores || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (err) {
        const errorMessage = err.message || 'Erro ao buscar placares.';
        setError(errorMessage);
        showMessage(`Erro ao buscar placares: ${errorMessage}`, 'error');
        setScores([]);
      } finally {
        setLoading(false);
      }
    },
    [limit, showMessage]
  );

  useEffect(() => {
    fetchScores(currentPage);
  }, [fetchScores, currentPage]);

  const handleEdit = useCallback((score) => {
    setEditingScore(score);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (scoreId) => {
      if (window.confirm('Tem certeza que deseja enviar este placar para a lixeira?')) {
        try {
          await deleteScoreAdmin(scoreId);
          showMessage('Placar enviado para a lixeira.', 'success');
          fetchScores(currentPage);
        } catch (err) {
          showMessage(
            `Erro ao mover placar para lixeira: ${err.message || 'Erro desconhecido'}`,
            'error'
          );
        }
      }
    },
    [showMessage, fetchScores, currentPage]
  );

  const handleSaveScore = useCallback(
    async (scoreData, scoreId) => {
      try {
        await updateScoreAdmin(scoreId, scoreData);
        showMessage('Placar atualizado com sucesso!', 'success');
        fetchScores(currentPage);
        setIsModalOpen(false);
        setEditingScore(null);
      } catch (err) {
        showMessage(`Erro ao atualizar placar: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    },
    [showMessage, fetchScores, currentPage]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingScore(null);
  }, []);

  const getWinnerDisplay = (row) => {
    if (!row.winner_name) return 'A definir';
    return <span className="text-green-400 font-medium">{row.winner_name}</span>;
  };

  const getScoreDisplay = (row) => {
    const score1 = row.player1_score ?? '?';
    const score2 = row.player2_score ?? '?';
    return (
      <span className="font-mono font-medium text-slate-100">
        {score1} - {score2}
      </span>
    );
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Data/Hora',
      render: (row) => (
        <span className="text-slate-300 text-sm">
          {formatDateTimeReadable(row.timestamp || row.completed_at)}
        </span>
      ),
    },
    {
      key: 'player1_name',
      label: 'Jogador 1',
      render: (row) => (
        <span className="text-slate-100 font-medium">{row.player1_name || 'N/A'}</span>
      ),
    },
    {
      key: 'player2_name',
      label: 'Jogador 2',
      render: (row) => (
        <span className="text-slate-100 font-medium">{row.player2_name || 'N/A'}</span>
      ),
    },
    {
      key: 'placar',
      label: 'Placar',
      render: getScoreDisplay,
    },
    {
      key: 'winner_name',
      label: 'Vencedor',
      render: getWinnerDisplay,
    },
    {
      key: 'round',
      label: 'Rodada',
      render: (row) => (
        <span className="text-slate-300 bg-slate-700 px-2 py-1 rounded text-xs font-medium">
          {row.round || row.match_round || 'N/A'}
        </span>
      ),
    },
  ];

  const actions = [
    {
      icon: <FaEdit className="w-4 h-4" />,
      onClick: handleEdit,
      className:
        'p-2 rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800',
      title: 'Editar Placar',
    },
    {
      icon: <FaTrash className="w-4 h-4" />,
      onClick: (score) => handleDelete(score.id),
      className:
        'p-2 rounded-md text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800',
      title: 'Mover para Lixeira',
    },
  ];

  return (
    <div className="p-6 bg-slate-900 rounded-xl shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-100">Gerenciar Placares</h2>
        <p className="text-sm text-slate-400 mt-1">
          Visualize e edite os placares registrados no sistema
        </p>
      </div>

      {/* Table */}
      <PaginatedTable
        columns={columns}
        data={scores}
        loading={loading}
        error={error}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        actions={actions}
        emptyMessage="Nenhum placar encontrado."
        tableClassName="rounded-lg overflow-hidden"
        headerClassName="bg-slate-700"
        rowClassName="bg-slate-800 hover:bg-slate-750 transition-colors duration-150"
        cellClassName="text-slate-300"
      />

      {/* Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingScore ? `Editar Placar (ID: ${editingScore?.id})` : 'Editar Placar'}
        initialValues={{
          player1_score: editingScore?.player1_score ?? '',
          player2_score: editingScore?.player2_score ?? '',
          round: editingScore?.round || '',
        }}
        validationSchema={scoreValidationSchema}
        fields={scoreFields}
        onSubmit={(values) =>
          handleSaveScore(
            {
              player1_score: Number(values.player1_score),
              player2_score: Number(values.player2_score),
              round: values.round,
            },
            editingScore?.id
          )
        }
        submitLabel="Salvar Alterações"
        cancelLabel="Cancelar"
        extraFooter={
          editingScore ? (
            <div className="mt-3 p-3 bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-300">
                <span className="font-medium text-slate-200">Partida:</span>{' '}
                {editingScore.player1_name || 'Jogador 1'} vs{' '}
                {editingScore.player2_name || 'Jogador 2'}
              </p>
            </div>
          ) : null
        }
      />
    </div>
  );
});

AdminScoresTable.displayName = 'AdminScoresTable';

export default AdminScoresTable;
