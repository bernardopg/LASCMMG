import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
  FaSync,
  FaStar,
  FaRegStar,
  FaUserPlus,
  FaTrashAlt,
  FaDownload,
  FaUpload,
  FaInfoCircle,
  FaUndo,
  FaUsers,
  FaTable,
  FaThList,
  FaCompress,
  FaExpand,
  FaSpinner
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import {
  deletePlayerAdmin,
  getAdminPlayers,
  createPlayerAdmin,
  updatePlayerAdmin
} from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Tooltip component
const Tooltip = ({ children, content }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="cursor-help"
        tabIndex="0"
        aria-describedby="tooltip"
      >
        {children}
      </div>
      {showTooltip && (
        <div
          id="tooltip"
          role="tooltip"
          className="absolute z-10 px-3 py-2 text-xs bg-gray-700 text-gray-100 rounded shadow-md -mt-2 min-w-max"
          style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)' }}
        >
          {content}
          <div className="absolute w-2 h-2 bg-gray-700 transform rotate-45" style={{ bottom: '-4px', left: '50%', marginLeft: '-4px' }}></div>
        </div>
      )}
    </div>
  );
};

// Skill level indicator component
const SkillLevelIndicator = ({ level }) => {
  const levels = {
    'Iniciante': 1,
    'Intermediário': 2,
    'Avançado': 3,
    'Profissional': 4,
  };
  const maxStars = 4;

  const stars = levels[level] || 0;
  const label = Object.keys(levels).includes(level) ? level : 'Desconhecido';

  return (
    <div
      className="flex items-center"
      aria-label={`Nível: ${label} (${stars} de ${maxStars})`}
    >
      {[...Array(maxStars)].map((_, i) => (
        i < stars
          ? <FaStar key={i} className="text-yellow-400 mr-0.5" aria-hidden="true" />
          : <FaRegStar key={i} className="text-gray-400 mr-0.5" aria-hidden="true" />
      ))}
      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({label})</span>
    </div>
  );
};

// Player card component for mobile/alternative view
const PlayerCard = ({ player, isSelected, onSelect, onEdit, onDelete, deleteLoading, deletingPlayerId }) => {
  return (
    <motion.div
      className={`bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm mb-3 border-l-4 ${
        isSelected ? 'border-blue-500' : 'border-transparent'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="mr-3 h-5 w-5"
            aria-label={`Selecionar jogador ${player.name}`}
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{player.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {player.nickname ? player.nickname : "Sem apelido"}
            </p>
            {player.email && (
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                {player.email}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(player)}
            className="p-2 text-blue-500 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label={`Editar jogador ${player.name}`}
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onDelete(player.id, player.name)}
            disabled={deleteLoading && deletingPlayerId === player.id}
            className={`p-2 text-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded ${
              deleteLoading && deletingPlayerId === player.id ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label={`Excluir jogador ${player.name}`}
          >
            {deleteLoading && deletingPlayerId === player.id ?
              <FaSpinner className="animate-spin" /> :
              <FaTrash />
            }
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600 flex justify-between items-center">
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400 mr-2">Gênero:</span>
          <span className="font-medium">{player.gender || 'N/A'}</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Nível:</span>
          <SkillLevelIndicator level={player.skill_level} />
        </div>
      </div>
    </motion.div>
  );
};

// Skeleton loader for table rows
const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, index) => (
      <tr key={index} className="animate-pulse">
        <td className="px-3 md:px-6 py-4">
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </td>
        <td className="px-3 md:px-6 py-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        </td>
        <td className="px-3 md:px-6 py-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </td>
        <td className="px-3 md:px-6 py-4 hidden md:table-cell">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
        </td>
        <td className="px-3 md:px-6 py-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
        </td>
      </tr>
    ))}
  </>
);

// Skeleton loader for card view
const CardSkeleton = () => (
  <>
    {[...Array(3)].map((_, index) => (
      <div key={index} className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm mb-3 animate-pulse">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded mr-3"></div>
            <div>
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600 flex justify-between">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
        </div>
      </div>
    ))}
  </>
);

// Modal component for confirming bulk actions
const ConfirmationModal = ({ isOpen, onClose, title, message, onConfirm, confirmText, confirmType = "primary" }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded focus:outline-none focus:ring-2 ${
              confirmType === "danger"
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white"
            }`}
          >
            {confirmText || "Confirmar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Player form modal
const PlayerFormModal = ({ isOpen, onClose, player, onSave }) => {
  if (!isOpen) return null;

  const initialValues = {
    name: player?.name || '',
    nickname: player?.nickname || '',
    email: player?.email || '',
    gender: player?.gender || 'Masculino',
    skill_level: player?.skill_level || 'Iniciante',
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Nome é obrigatório')
      .min(2, 'Nome muito curto')
      .max(100, 'Nome muito longo'),
    nickname: Yup.string().max(50, 'Apelido muito longo').nullable(),
    email: Yup.string().email('Email inválido').nullable(),
    gender: Yup.string().oneOf(['Masculino', 'Feminino', 'Outro'], 'Gênero inválido').required('Gênero é obrigatório'),
    skill_level: Yup.string().oneOf(
      ['Iniciante', 'Intermediário', 'Avançado', 'Profissional'],
      'Nível inválido'
    ).required('Nível é obrigatório'),
  });

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        role="dialog"
        aria-labelledby="player-form-title"
        aria-modal="true"
      >
        <div className="p-6">
          <h2 id="player-form-title" className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700 text-gray-900 dark:text-white">
            {player ? 'Editar Jogador' : 'Adicionar Novo Jogador'}
          </h2>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values, { setSubmitting }) => {
              onSave(values, player?.id);
              setSubmitting(false);
            }}
          >
            {({ isSubmitting, dirty, isValid, values }) => (
              <Form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    name="name"
                    id="name"
                    aria-required="true"
                    placeholder="Nome do jogador"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center">
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 mr-2">
                      Apelido
                    </label>
                    <Tooltip content="O apelido será exibido nos torneios e tabelas de pontuação">
                      <FaInfoCircle className="text-gray-500 dark:text-gray-400 text-sm" />
                    </Tooltip>
                  </div>
                  <Field
                    type="text"
                    name="nickname"
                    id="nickname"
                    placeholder="Apelido (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <ErrorMessage
                    name="nickname"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <Field
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Email (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gênero
                    </label>
                    <Field
                      as="select"
                      name="gender"
                      id="gender"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                    </Field>
                    <ErrorMessage
                      name="gender"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="skill_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nível de Habilidade
                    </label>
                    <Field
                      as="select"
                      name="skill_level"
                      id="skill_level"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                      <option value="Profissional">Profissional</option>
                    </Field>
                    <ErrorMessage
                      name="skill_level"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="pt-3 mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Visualização do Nível de Habilidade:
                  </p>
                  <SkillLevelIndicator level={values.skill_level} />
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting || !dirty || !isValid}
                  >
                    {isSubmitting
                      ? 'Salvando...'
                      : player
                        ? 'Atualizar Jogador'
                        : 'Adicionar Jogador'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PlayersPage = () => {
  // State variables
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletingPlayerId, setDeletingPlayerId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    confirmType: 'primary',
    onConfirm: () => {}
  });
  const [playerFormModalOpen, setPlayerFormModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [viewType, setViewType] = useState('table'); // 'table' or 'card'
  const [densityLevel, setDensityLevel] = useState('normal'); // 'compact', 'normal', 'spacious'

  // Hooks
  const { showError, showSuccess } = useMessage();
  const { isAuthenticated } = useAuth();
  const searchInputRef = useRef(null);

  // Filter options
  const [filters, setFilters] = useState({
    gender: '',
    skill_level: ''
  });

  // Debounced search value
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Data fetching - Fixed to avoid infinite loops
  const fetchPlayers = useCallback(
    async (page = 1) => {
      if (!isAuthenticated) {
        setLoading(false);
        setInitialLoading(false);
        setPlayers([]);
        return;
      }

      setLoading(true);

      try {
        const data = await getAdminPlayers({
          page,
          limit: 20,
          search: debouncedSearchTerm,
          sortBy: sortConfig.key,
          sortDirection: sortConfig.direction,
          ...filters
        });

        // Clear selected players when fetching new data
        setSelectedPlayers([]);

        setPlayers(data.players || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        showError(
          `Erro ao carregar jogadores: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
        );
        setPlayers([]);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [isAuthenticated, showError, debouncedSearchTerm, sortConfig, filters]
  );

  // Effect for initial load and when dependencies change
  useEffect(() => {
    fetchPlayers(currentPage);
  }, [debouncedSearchTerm, sortConfig, filters, currentPage]);

  // Handle player form submission (create/update)
  const handleSavePlayer = async (playerData, playerId = null) => {
    try {
      if (playerId) {
        await updatePlayerAdmin(playerId, playerData);
        showSuccess('Jogador atualizado com sucesso!');
      } else {
        await createPlayerAdmin(playerData);
        showSuccess('Jogador criado com sucesso!');
      }

      setPlayerFormModalOpen(false);
      setEditingPlayer(null);
      fetchPlayers(currentPage);
    } catch (error) {
      showError(
        `Erro ao salvar jogador: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
      );
    }
  };

  // Delete player
  const handleDeletePlayer = async (playerId, playerName) => {
    setConfirmModalConfig({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja mover o jogador "${playerName}" para a lixeira?`,
      confirmText: 'Excluir',
      confirmType: 'danger',
      onConfirm: async () => {
        try {
          setDeleteLoading(true);
          setDeletingPlayerId(playerId);

          await deletePlayerAdmin(playerId);

          // Remove the player from the current list with animation
          setPlayers((prevPlayers) =>
            prevPlayers.filter((player) => player.id !== playerId)
          );

          showSuccess(`Jogador "${playerName}" movido para a lixeira com sucesso.`);

          // After animation completes, refresh the list
          setTimeout(() => {
            fetchPlayers(
              players.length === 1 && currentPage > 1
                ? currentPage - 1
                : currentPage
            );
          }, 300);
        } catch (error) {
          showError(
            `Erro ao excluir jogador: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
          );
        } finally {
          setConfirmModalOpen(false);
          setDeleteLoading(false);
          setDeletingPlayerId(null);
        }
      }
    });
    setConfirmModalOpen(true);
  };

  // Bulk delete players
  const handleBulkDelete = () => {
    if (selectedPlayers.length === 0) {
      showError('Nenhum jogador selecionado');
      return;
    }

    setConfirmModalConfig({
      title: 'Confirmar Exclusão em Massa',
      message: `Tem certeza que deseja mover ${selectedPlayers.length} jogador(es) para a lixeira?`,
      confirmText: 'Excluir Selecionados',
      confirmType: 'danger',
      onConfirm: async () => {
        try {
          await Promise.all(
            selectedPlayers.map(playerId => deletePlayerAdmin(playerId))
          );

          showSuccess(`${selectedPlayers.length} jogadores movidos para a lixeira com sucesso.`);
          setSelectedPlayers([]);
          fetchPlayers(currentPage);
        } catch (error) {
          showError(
            `Erro ao excluir jogadores em massa: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
          );
        } finally {
          setConfirmModalOpen(false);
        }
      }
    });
    setConfirmModalOpen(true);
  };

  // Search and filter handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    fetchPlayers(1);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleApplyFilters = () => {
    fetchPlayers(1);
    setFiltersVisible(false);
  };

  const handleClearFilters = () => {
    setFilters({
      gender: '',
      skill_level: ''
    });
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPlayers(players.map(player => player.id));
    } else {
      setSelectedPlayers([]);
    }
  };

  const handleSelectPlayer = (playerId) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  // Edit player handler
  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setPlayerFormModalOpen(true);
  };

  // Add new player handler
  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setPlayerFormModalOpen(true);
  };

  // Computed values
  const allSelected = players.length > 0 && selectedPlayers.length === players.length;
  const someSelected = selectedPlayers.length > 0 && selectedPlayers.length < players.length;

  // Render sort icon
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort className="ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'asc'
      ? <FaSortUp className="ml-1 text-blue-500" />
      : <FaSortDown className="ml-1 text-blue-500" />;
  };

  // Generate pagination numbers
  const generatePaginationNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="px-4 py-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
            <FaUsers className="mr-3 text-primary dark:text-primary-light" />
            Gerenciar Jogadores
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {players.length > 0 ? `${players.length} jogador(es) encontrado(s)` : 'Nenhum jogador encontrado'}
            {selectedPlayers.length > 0 && ` • ${selectedPlayers.length} selecionado(s)`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleAddPlayer}
            className="btn btn-primary flex items-center"
            aria-label="Adicionar novo jogador"
          >
            <FaUserPlus className="mr-2" />
            Novo Jogador
          </button>
          <Link
            to="/admin/players/create"
            className="btn btn-outline flex items-center"
            aria-label="Página dedicada para criar jogador"
          >
            <FaPlus className="mr-2" />
            Página de Criação
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card bg-white dark:bg-slate-800 p-4 mb-6 border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSubmitSearch} className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por nome, apelido ou email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="input pl-10 pr-4 w-full"
                aria-label="Buscar jogadores"
              />
            </div>
          </form>

          <div className="flex gap-2">
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`btn btn-outline flex items-center ${filtersVisible ? 'bg-gray-100 dark:bg-slate-700' : ''}`}
              aria-label="Toggle filtros"
            >
              <FaFilter className="mr-2" />
              Filtros
            </button>

            <div className="flex border border-gray-300 dark:border-slate-600 rounded-md p-0.5 bg-gray-100 dark:bg-slate-700">
              <button
                onClick={() => setViewType('table')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center transition-colors duration-150 ease-in-out ${
                  viewType === 'table'
                    ? 'bg-primary text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
                aria-label="Visualização em tabela"
              >
                <FaTable className="mr-1" />
                Tabela
              </button>
              <button
                onClick={() => setViewType('card')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center transition-colors duration-150 ease-in-out ${
                  viewType === 'card'
                    ? 'bg-primary text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
                aria-label="Visualização em cartões"
              >
                <FaThList className="mr-1" />
                Cartões
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {filtersVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="filter-gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gênero
                  </label>
                  <select
                    id="filter-gender"
                    name="gender"
                    value={filters.gender}
                    onChange={handleFilterChange}
                    className="input w-full"
                  >
                    <option value="">Todos os gêneros</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-skill" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nível de Habilidade
                  </label>
                  <select
                    id="filter-skill"
                    name="skill_level"
                    value={filters.skill_level}
                    onChange={handleFilterChange}
                    className="input w-full"
                  >
                    <option value="">Todos os níveis</option>
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Profissional">Profissional</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleApplyFilters}
                    className="btn btn-primary flex-1"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="btn btn-outline"
                  >
                    <FaUndo />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions */}
      {selectedPlayers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                {selectedPlayers.length} jogador(es) selecionado(s)
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="btn btn-sm btn-danger flex items-center"
                aria-label="Excluir jogadores selecionados"
              >
                <FaTrashAlt className="mr-1" />
                Excluir Selecionados
              </button>
              <button
                onClick={() => setSelectedPlayers([])}
                className="btn btn-sm btn-outline"
                aria-label="Limpar seleção"
              >
                Limpar Seleção
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {initialLoading && (
        <div className="card bg-white dark:bg-slate-800 p-8">
          <div className="flex justify-center items-center">
            <FaSpinner className="animate-spin text-4xl text-primary mr-4" />
            <span className="text-lg">Carregando jogadores...</span>
          </div>
        </div>
      )}

      {/* No Players Found */}
      {!loading && !initialLoading && players.length === 0 && (
        <div className="card bg-white dark:bg-slate-800 p-8 text-center">
          <FaUsers className="mx-auto text-6xl text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Nenhum jogador encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || Object.values(filters).some(f => f)
              ? 'Tente ajustar os filtros de busca ou adicionar um novo jogador.'
              : 'Comece adicionando seu primeiro jogador ao sistema.'}
          </p>
          <button
            onClick={handleAddPlayer}
            className="btn btn-primary flex items-center mx-auto"
          >
            <FaUserPlus className="mr-2" />
            Adicionar Primeiro Jogador
          </button>
        </div>
      )}

      {/* Players List - Table View */}
      {viewType === 'table' && !initialLoading && players.length > 0 && (
        <div className="card bg-white dark:bg-slate-800 overflow-hidden border border-gray-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={handleSelectAll}
                      className="h-4 w-4"
                      aria-label="Selecionar todos os jogadores"
                    />
                  </th>
                  <th
                    className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Nome
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                    onClick={() => handleSort('nickname')}
                  >
                    <div className="flex items-center">
                      Apelido
                      {renderSortIcon('nickname')}
                    </div>
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th
                    className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                    onClick={() => handleSort('gender')}
                  >
                    <div className="flex items-center">
                      Gênero
                      {renderSortIcon('gender')}
                    </div>
                  </th>
                  <th
                    className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                    onClick={() => handleSort('skill_level')}
                  >
                    <div className="flex items-center">
                      Nível
                      {renderSortIcon('skill_level')}
                    </div>
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {loading && <TableSkeleton />}
                <AnimatePresence>
                  {!loading && players.map((player) => (
                    <motion.tr
                      key={player.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-700 ${
                        selectedPlayers.includes(player.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(player.id)}
                          onChange={() => handleSelectPlayer(player.id)}
                          className="h-4 w-4"
                          aria-label={`Selecionar jogador ${player.name}`}
                        />
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {player.name}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {player.nickname || '-'}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {player.email || '-'}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {player.gender || '-'}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <SkillLevelIndicator level={player.skill_level} />
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditPlayer(player)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            aria-label={`Editar jogador ${player.name}`}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                            disabled={deleteLoading && deletingPlayerId === player.id}
                            className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                              deleteLoading && deletingPlayerId === player.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            aria-label={`Excluir jogador ${player.name}`}
                          >
                            {deleteLoading && deletingPlayerId === player.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaTrash />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Players List - Card View */}
      {viewType === 'card' && !initialLoading && players.length > 0 && (
        <div className="space-y-4">
          {loading && <CardSkeleton />}
          <AnimatePresence>
            {!loading && players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isSelected={selectedPlayers.includes(player.id)}
                onSelect={() => handleSelectPlayer(player.id)}
                onEdit={handleEditPlayer}
                onDelete={handleDeletePlayer}
                deleteLoading={deleteLoading}
                deletingPlayerId={deletingPlayerId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="btn btn-outline btn-sm disabled:opacity-50"
              aria-label="Primeira página"
            >
              Primeira
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-outline btn-sm disabled:opacity-50"
              aria-label="Página anterior"
            >
              Anterior
            </button>

            {generatePaginationNumbers().map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`btn btn-sm ${
                  page === currentPage
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
                aria-label={`Ir para página ${page}`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-outline btn-sm disabled:opacity-50"
              aria-label="Próxima página"
            >
              Próxima
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="btn btn-outline btn-sm disabled:opacity-50"
              aria-label="Última página"
            >
              Última
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {confirmModalOpen && (
          <ConfirmationModal
            isOpen={confirmModalOpen}
            onClose={() => setConfirmModalOpen(false)}
            {...confirmModalConfig}
          />
        )}
        {playerFormModalOpen && (
          <PlayerFormModal
            isOpen={playerFormModalOpen}
            onClose={() => {
              setPlayerFormModalOpen(false);
              setEditingPlayer(null);
            }}
            player={editingPlayer}
            onSave={handleSavePlayer}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayersPage;
