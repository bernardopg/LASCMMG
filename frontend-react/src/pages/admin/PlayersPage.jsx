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
  FaRedo,
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
  FaExpand
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
  // bulkDeletePlayersAdmin, // This function is not exported from api.js as the backend endpoint doesn't exist
} from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { PlayerList, LoadingSkeleton } from '../../components/common/MemoizedComponents';
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
  // Align with backend: 'Iniciante', 'Intermediário', 'Avançado', 'Profissional'
  const levels = {
    'Iniciante': 1,
    'Intermediário': 2,
    'Avançado': 3,
    'Profissional': 4, // Assuming 4 stars for Profissional
  };
  const maxStars = 4; // Max stars to display

  const stars = levels[level] || 0;
  // Label is already the Portuguese value from `level` prop if it matches keys
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
              <span className="animate-spin block"><FaRedo /></span> :
              <FaTrash />
            }
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600 flex justify-between items-center">
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400 mr-2">Gênero:</span>
          {/* Assuming player.gender is already 'Masculino', 'Feminino', 'Outro' from backend */}
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
    gender: player?.gender || 'Masculino', // Align with backend
    skill_level: player?.skill_level || 'Iniciante', // Align with backend
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Nome é obrigatório')
      .min(2, 'Nome muito curto')
      .max(100, 'Nome muito longo'),
    nickname: Yup.string().max(50, 'Apelido muito longo').nullable(),
    email: Yup.string().email('Email inválido').nullable(),
    gender: Yup.string().oneOf(['Masculino', 'Feminino', 'Outro'], 'Gênero inválido').required('Gênero é obrigatório'), // Align
    skill_level: Yup.string().oneOf(
      ['Iniciante', 'Intermediário', 'Avançado', 'Profissional'], // Align
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

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((term) => {
      fetchPlayers(1, term);
    }, 500),
    [filters, sortConfig]
  );

  // Data fetching
  const fetchPlayers = useCallback(
    async (page = 1, searchTermParam = searchTerm) => {
      let isMounted = true;

      if (!isAuthenticated) {
        if (isMounted) {
          setLoading(false);
          setInitialLoading(false);
          setPlayers([]);
        }
        return;
      }

      if (isMounted) setLoading(true);

      try {
        const data = await getAdminPlayers({
          page,
          limit: 20,
          search: searchTermParam,
          sortBy: sortConfig.key,
          sortDirection: sortConfig.direction,
          ...filters
        });

        if (isMounted) {
          // Clear selected players when fetching new data
          setSelectedPlayers([]);

          setPlayers(data.players || []);
          setTotalPages(data.totalPages || 1);
          setCurrentPage(data.currentPage || 1);
        }
      } catch (error) {
        if (isMounted) {
          showError(
            `Erro ao carregar jogadores: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
          );
          setPlayers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    },
    [isAuthenticated, showError, searchTerm, sortConfig, filters]
  );

  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated) {
      fetchPlayers(currentPage);
    } else if (isMounted) {
      setLoading(false);
      setInitialLoading(false);
      setPlayers([]);
    }

    return () => {
      isMounted = false;
    };
  }, [fetchPlayers, currentPage, isAuthenticated]);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

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
    fetchPlayers(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
    setTimeout(() => fetchPlayers(1), 0);
  };

  // Selection handlers
  const handleSelectPlayer = (playerId) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAllPlayers = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(players.map(player => player.id));
    }
  };

  // View and display options handlers
  const handleChangeViewType = (type) => {
    setViewType(type);
  };

  const handleChangeDensity = (level) => {
    setDensityLevel(level);
  };

  // Modal handlers
  const handleOpenEditModal = (player) => {
    setEditingPlayer(player);
    setPlayerFormModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingPlayer(null);
    setPlayerFormModalOpen(true);
  };

  // Get CSS class and style based on density setting
  const getDensityProps = () => {
    switch (densityLevel) {
      case 'compact':
        return { className: 'px-2 py-1', style: { minHeight: 32 } };
      case 'spacious':
        return { className: 'px-6 py-5', style: { minHeight: 64 } };
      default: // normal
        return { className: 'px-4 py-3', style: { minHeight: 48 } };
    }
  };

  return (
    <div className="py-4 md:py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-primary mb-3 md:mb-0">
          Gerenciamento de Jogadores
        </h1>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center mr-4">
            <div className="btn-group">
              <button
                onClick={() => handleChangeViewType('table')}
                className={`btn btn-sm ${viewType === 'table' ? 'btn-active' : 'btn-outline'}`}
                aria-label="Visualização em tabela"
                aria-pressed={viewType === 'table'}
              >
                <FaTable className="mr-1" /> Tabela
              </button>
              <button
                onClick={() => handleChangeViewType('card')}
                className={`btn btn-sm ${viewType === 'card' ? 'btn-active' : 'btn-outline'}`}
                aria-label="Visualização em cards"
                aria-pressed={viewType === 'card'}
              >
                <FaThList className="mr-1" /> Cards
              </button>
            </div>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            aria-label="Adicionar novo jogador"
          >
            <FaPlus className="mr-2" /> Adicionar Jogador
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 md:p-6">
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
          <form
            onSubmit={handleSubmitSearch}
            className="flex flex-col sm:flex-row items-stretch gap-2 w-full md:w-auto"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar jogadores..."
                value={searchTerm}
                onChange={handleSearchChange}
                ref={searchInputRef}
                className="input input-bordered pr-10 w-full"
                aria-label="Buscar jogadores"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Buscar"
              >
                <FaSearch />
              </button>
            </div>
          </form>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
            {selectedPlayers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="btn btn-error btn-sm w-full sm:w-auto"
                aria-label={`Excluir ${selectedPlayers.length} jogadores selecionados`}
              >
                <FaTrashAlt className="mr-1" /> Excluir ({selectedPlayers.length})
              </button>
            )}
            <div className="flex flex-row gap-1 w-full sm:w-auto" role="group" aria-label="Densidade da tabela">
              <button
                type="button"
                onClick={() => handleChangeDensity('compact')}
                className={`btn btn-xs flex-1 sm:flex-none ${densityLevel === 'compact' ? 'btn-primary' : 'btn-outline'}`}
                aria-pressed={densityLevel === 'compact'}
                aria-label="Densidade Compacta"
              >
                <FaCompress className="mr-1" /> Compacto
              </button>
              <button
                type="button"
                onClick={() => handleChangeDensity('normal')}
                className={`btn btn-xs flex-1 sm:flex-none ${densityLevel === 'normal' ? 'btn-primary' : 'btn-outline'}`}
                aria-pressed={densityLevel === 'normal'}
                aria-label="Densidade Normal"
              >
                <FaUsers className="mr-1" /> Normal
              </button>
              <button
                type="button"
                onClick={() => handleChangeDensity('spacious')}
                className={`btn btn-xs flex-1 sm:flex-none ${densityLevel === 'spacious' ? 'btn-primary' : 'btn-outline'}`}
                aria-pressed={densityLevel === 'spacious'}
                aria-label="Densidade Espaçosa"
              >
                <FaExpand className="mr-1" /> Espaçoso
              </button>
            </div>
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`btn btn-outline btn-sm w-full sm:w-auto ${filtersVisible ? 'btn-active' : ''}`}
              aria-expanded={filtersVisible}
              aria-controls="filter-panel"
            >
              <FaFilter className="mr-2" /> Filtros
            </button>
          </div>
        </div>

        {/* Filters panel */}
        {filtersVisible && (
          <div id="filter-panel" className="mb-4 bg-gray-50 dark:bg-slate-700 p-4 rounded-md">
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gênero
                </label>
                <select
                  name="gender"
                  value={filters.gender}
                  onChange={handleFilterChange}
                  className="select select-bordered w-full"
                  aria-label="Filtrar por gênero"
                >
                  <option value="">Todos</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nível de Habilidade
                </label>
                <select
                  name="skill_level"
                  value={filters.skill_level}
                  onChange={handleFilterChange}
                  className="select select-bordered w-full"
                  aria-label="Filtrar por nível de habilidade"
                >
                  <option value="">Todos</option>
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                  <option value="Profissional">Profissional</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleClearFilters}
                className="btn btn-outline btn-sm mr-2"
                aria-label="Limpar filtros"
              >
                <FaRedo className="mr-2" /> Limpar Filtros
              </button>
              <button
                onClick={handleApplyFilters}
                className="btn btn-primary btn-sm"
                aria-label="Aplicar filtros"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Loading states */}
        {initialLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-400">Carregando jogadores...</p>
          </div>
        ) : players.length === 0 ? (
          // Empty state
          <div className="text-center py-10">
            <div className="mb-3">
              <FaUsers className="mx-auto text-gray-300 dark:text-gray-600 text-5xl" />
            </div>
            <p className="text-gray-400 text-lg font-semibold">Nenhum jogador encontrado.</p>
            <p className="text-gray-500 mt-2">
              Adicione um novo jogador para começar ou ajuste os filtros de busca.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-primary mt-4"
              aria-label="Adicionar novo jogador"
            >
              <FaUserPlus className="mr-2" /> Adicionar Jogador
            </button>
            <div className="mt-6 flex justify-center">
              <img
                src="/assets/empty-state-players.svg"
                alt="Nenhum jogador"
                className="w-40 h-40 opacity-80"
                style={{ pointerEvents: 'none' }}
                aria-hidden="true"
              />
            </div>
          </div>
        ) : (
          // Content
          <>
            {/* Table View */}
            {viewType === 'table' && (
              <div className="overflow-x-auto -mx-3 md:mx-0">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th {...getDensityProps()} className={`text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-10 ${getDensityProps().className}`}>
                        <input
                          type="checkbox"
                          checked={selectedPlayers.length === players.length && players.length > 0}
                          onChange={handleSelectAllPlayers}
                          className="checkbox checkbox-sm"
                          aria-label="Selecionar todos os jogadores"
                        />
                      </th>
                      <th
                        {...getDensityProps()}
                        className={`text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer ${getDensityProps().className}`}
                        onClick={() => handleSort('name')}
                        aria-sort={sortConfig.key === 'name' ? sortConfig.direction : 'none'}
                      >
                        <div className="flex items-center">
                          Nome
                          {sortConfig.key === 'name' && (
                            sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                          )}
                          {sortConfig.key !== 'name' && <FaSort className="ml-1 text-gray-400" />}
                        </div>
                      </th>
                      <th
                        {...getDensityProps()}
                        className={`text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer ${getDensityProps().className}`}
                        onClick={() => handleSort('nickname')}
                        aria-sort={sortConfig.key === 'nickname' ? sortConfig.direction : 'none'}
                      >
                        <div className="flex items-center">
                          Apelido
                          {sortConfig.key === 'nickname' && (
                            sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                          )}
                          {sortConfig.key !== 'nickname' && <FaSort className="ml-1 text-gray-400" />}
                        </div>
                      </th>
                      <th
                        {...getDensityProps()}
                        className={`text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell cursor-pointer ${getDensityProps().className}`}
                        onClick={() => handleSort('email')}
                        aria-sort={sortConfig.key === 'email' ? sortConfig.direction : 'none'}
                      >
                        <div className="flex items-center">
                          E-mail
                          {sortConfig.key === 'email' && (
                            sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                          )}
                          {sortConfig.key !== 'email' && <FaSort className="ml-1 text-gray-400" />}
                        </div>
                      </th>
                      <th
                        {...getDensityProps()}
                        className={`text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell ${getDensityProps().className}`}
                      >
                        Nível
                      </th>
                      <th {...getDensityProps()} className={`text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${getDensityProps().className}`}>
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {loading ? <TableSkeleton /> : (
                      <AnimatePresence>
                        {players.map((player) => (
                          <motion.tr
                            key={player.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className={selectedPlayers.includes(player.id) ? "bg-blue-50 dark:bg-slate-700" : ""}
                          >
                            <td {...getDensityProps()} className={getDensityProps().className}>
                              <input
                                type="checkbox"
                                checked={selectedPlayers.includes(player.id)}
                                onChange={() => handleSelectPlayer(player.id)}
                                className="checkbox checkbox-sm"
                                aria-label={`Selecionar jogador ${player.name}`}
                              />
                            </td>
                            <td {...getDensityProps()} className={`font-medium text-gray-900 dark:text-white ${getDensityProps().className}`}>
                              {player.name}
                            </td>
                            <td {...getDensityProps()} className={`text-gray-700 dark:text-gray-300 ${getDensityProps().className}`}>
                              {player.nickname || '-'}
                            </td>
                            <td {...getDensityProps()} className={`text-gray-700 dark:text-gray-300 hidden md:table-cell ${getDensityProps().className}`}>
                              {player.email || '-'}
                            </td>
                            <td {...getDensityProps()} className={`hidden md:table-cell ${getDensityProps().className}`}>
                              <SkillLevelIndicator level={player.skill_level} />
                            </td>
                            <td {...getDensityProps()} className={`space-x-3 whitespace-nowrap ${getDensityProps().className}`}>
                              <Tooltip content="Editar jogador">
                                <button
                                  onClick={() => handleOpenEditModal(player)}
                                  className="text-blue-500 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                                  aria-label={`Editar jogador ${player.name}`}
                                >
                                  <FaEdit />
                                </button>
                              </Tooltip>
                              <Tooltip content="Excluir jogador">
                                <button
                                  onClick={() => handleDeletePlayer(player.id, player.name)}
                                  className="text-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full p-1"
                                  aria-label={`Excluir jogador ${player.name}`}
                                  disabled={deleteLoading && deletingPlayerId === player.id}
                                >
                                  {deleteLoading && deletingPlayerId === player.id ? (
                                    <span className="animate-spin block"><FaRedo /></span>
                                  ) : (
                                    <FaTrash />
                                  )}
                                </button>
                              </Tooltip>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Card View */}
            {viewType === 'card' && (
              <div className="space-y-4">
                {loading ? <CardSkeleton /> : (
                  <AnimatePresence>
                    {players.map(player => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        layout
                        className={`rounded-lg shadow-sm mb-3 border-l-4 ${selectedPlayers.includes(player.id) ? 'border-blue-500' : 'border-transparent'}
                          bg-white dark:bg-slate-700
                          ${densityLevel === 'compact' ? 'p-2' : densityLevel === 'spacious' ? 'p-8' : 'p-4'}`}
                        style={{
                          minHeight: densityLevel === 'compact' ? 32 : densityLevel === 'spacious' ? 64 : 48,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <PlayerCard
                          player={player}
                          isSelected={selectedPlayers.includes(player.id)}
                          onSelect={() => handleSelectPlayer(player.id)}
                          onEdit={() => handleOpenEditModal(player)}
                          onDelete={handleDeletePlayer}
                          deleteLoading={deleteLoading}
                          deletingPlayerId={deletingPlayerId}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="py-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="mb-2 md:mb-0">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => fetchPlayers(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}
                    className="btn btn-outline btn-sm disabled:opacity-50"
                    aria-label="Página anterior"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => fetchPlayers(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="btn btn-outline btn-sm disabled:opacity-50"
                    aria-label="Próxima página"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <PlayerFormModal
        isOpen={playerFormModalOpen}
        onClose={() => setPlayerFormModalOpen(false)}
        player={editingPlayer}
        onSave={handleSavePlayer}
      />

      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        confirmType={confirmModalConfig.confirmType}
        onConfirm={confirmModalConfig.onConfirm}
      />
    </div>
  );
};

export default PlayersPage;
