import { useState, useEffect, useCallback, memo } from 'react';
import {
  getAdminPlayers,
  deletePlayerAdmin,
  createPlayerAdmin,
  updatePlayerAdmin,
} from '../../../services/api';
import { useMessage } from '../../../context/MessageContext';
import { FaEdit, FaTrash, FaPlusCircle } from 'react-icons/fa';
import * as Yup from 'yup';
import FormModal from '../../ui/forms/FormModal.jsx';
import PaginatedTable from '../../common/PaginatedTable.jsx';

const playerFields = [
  { name: 'name', label: 'Nome Completo', type: 'text', fullWidth: true },
  { name: 'nickname', label: 'Apelido (Opcional)', type: 'text', fullWidth: true },
  { name: 'email', label: 'Email (Opcional)', type: 'email', fullWidth: true },
  {
    name: 'gender',
    label: 'Gênero',
    type: 'select',
    options: [
      { value: 'Masculino', label: 'Masculino' },
      { value: 'Feminino', label: 'Feminino' },
      { value: 'Outro', label: 'Outro' },
    ],
    fullWidth: false,
  },
  {
    name: 'skill_level',
    label: 'Nível de Habilidade',
    type: 'select',
    options: [
      { value: 'Iniciante', label: 'Iniciante' },
      { value: 'Intermediário', label: 'Intermediário' },
      { value: 'Avançado', label: 'Avançado' },
      { value: 'Profissional', label: 'Profissional' },
    ],
    fullWidth: false,
  },
];

const playerValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo'),
  nickname: Yup.string().max(50, 'Apelido muito longo').nullable(),
  email: Yup.string().email('Email inválido').max(100, 'Email muito longo').nullable(),
  gender: Yup.string()
    .oneOf(['Masculino', 'Feminino', 'Outro'], 'Gênero inválido')
    .required('Gênero é obrigatório'),
  skill_level: Yup.string()
    .oneOf(['Iniciante', 'Intermediário', 'Avançado', 'Profissional'], 'Nível inválido')
    .required('Nível é obrigatório'),
});

const AdminPlayersTable = memo(() => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showMessage } = useMessage();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  const fetchPlayers = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminPlayers({ page, limit });
        setPlayers(data.players || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (err) {
        const errorMessage = err.message || 'Erro ao buscar jogadores.';
        setError(errorMessage);
        showMessage(`Erro ao buscar jogadores: ${errorMessage}`, 'error');
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    },
    [limit, showMessage]
  );

  useEffect(() => {
    fetchPlayers(currentPage);
  }, [fetchPlayers, currentPage]);

  const handleEdit = useCallback((player) => {
    setEditingPlayer(player);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (playerId) => {
      if (window.confirm('Tem certeza que deseja enviar este jogador para a lixeira?')) {
        try {
          await deletePlayerAdmin(playerId);
          showMessage('Jogador enviado para a lixeira.', 'success');
          fetchPlayers(currentPage);
        } catch (err) {
          showMessage(`Erro ao mover para lixeira: ${err.message || 'Erro desconhecido'}`, 'error');
        }
      }
    },
    [showMessage, fetchPlayers, currentPage]
  );

  const handleSavePlayer = useCallback(
    async (playerData, playerId) => {
      try {
        if (playerId) {
          await updatePlayerAdmin(playerId, playerData);
          showMessage('Jogador atualizado com sucesso!', 'success');
        } else {
          await createPlayerAdmin(playerData);
          showMessage('Jogador adicionado com sucesso!', 'success');
        }
        fetchPlayers(currentPage);
        setIsModalOpen(false);
        setEditingPlayer(null);
      } catch (err) {
        showMessage(`Erro ao salvar jogador: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    },
    [showMessage, fetchPlayers, currentPage]
  );

  const handleOpenAddModal = useCallback(() => {
    setEditingPlayer(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingPlayer(null);
  }, []);

  const columns = [
    {
      key: 'name',
      label: 'Nome',
      render: (row) => <span className="text-slate-100 font-medium">{row.name}</span>,
    },
    {
      key: 'nickname',
      label: 'Apelido',
      render: (row) => <span className="text-slate-300">{row.nickname || '-'}</span>,
    },
    {
      key: 'gender',
      label: 'Gênero',
      render: (row) => <span className="text-slate-300">{row.gender || '-'}</span>,
    },
    {
      key: 'skill_level',
      label: 'Nível',
      render: (row) => {
        const levelColors = {
          Iniciante: 'text-blue-400',
          Intermediário: 'text-yellow-400',
          Avançado: 'text-orange-400',
          Profissional: 'text-red-400',
        };
        const colorClass = levelColors[row.skill_level] || 'text-slate-300';
        return <span className={`${colorClass} font-medium`}>{row.skill_level || '-'}</span>;
      },
    },
  ];

  const actions = [
    {
      icon: <FaEdit className="w-4 h-4" />,
      onClick: handleEdit,
      className:
        'p-2 rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800',
      title: 'Editar Jogador',
    },
    {
      icon: <FaTrash className="w-4 h-4" />,
      onClick: (player) => handleDelete(player.id),
      className:
        'p-2 rounded-md text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800',
      title: 'Mover para Lixeira',
    },
  ];

  return (
    <div className="p-6 bg-slate-900 rounded-xl shadow-lg">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Gerenciar Jogadores</h2>
          <p className="text-sm text-slate-400 mt-1">
            Adicione, edite e gerencie os jogadores do sistema
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white text-sm font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-200"
          aria-label="Adicionar novo jogador"
        >
          <FaPlusCircle className="mr-2 h-4 w-4" />
          Adicionar Jogador
        </button>
      </div>

      {/* Table */}
      <PaginatedTable
        columns={columns}
        data={players}
        loading={loading}
        error={error}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        actions={actions}
        emptyMessage="Nenhum jogador encontrado. Clique em 'Adicionar Jogador' para começar."
        tableClassName="rounded-lg overflow-hidden"
        headerClassName="bg-slate-700"
        rowClassName="bg-slate-800 hover:bg-slate-750 transition-colors duration-150"
        cellClassName="text-slate-300"
      />

      {/* Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPlayer ? 'Editar Jogador' : 'Adicionar Novo Jogador'}
        initialValues={{
          name: editingPlayer?.name || '',
          nickname: editingPlayer?.nickname || '',
          email: editingPlayer?.email || '',
          gender: editingPlayer?.gender || 'Masculino',
          skill_level: editingPlayer?.skill_level || 'Iniciante',
        }}
        validationSchema={playerValidationSchema}
        fields={playerFields}
        onSubmit={(values) => handleSavePlayer(values, editingPlayer?.id)}
        submitLabel={editingPlayer ? 'Atualizar Jogador' : 'Adicionar Jogador'}
        cancelLabel="Cancelar"
      />
    </div>
  );
});

AdminPlayersTable.displayName = 'AdminPlayersTable';

export default AdminPlayersTable;
