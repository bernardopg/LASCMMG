import { ErrorMessage, Field, Form, Formik } from 'formik';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaCompress,
  FaDownload,
  FaEdit,
  FaExpand,
  FaFileCsv,
  FaFileExcel,
  FaFileUpload,
  FaInfoCircle,
  FaPlus,
  FaRegStar,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaSpinner,
  FaStar,
  FaSync,
  FaTable,
  FaThList,
  FaTrash,
  FaTrashAlt,
  FaUndo,
  FaUpload,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { useDebounce } from '../../hooks/useDebounce';
import {
  createPlayerAdmin,
  deletePlayerAdmin,
  getAdminPlayers,
  importPlayersAdmin,
  updatePlayerAdmin,
} from '../../services/api';

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
          <div
            className="absolute w-2 h-2 bg-gray-700 transform rotate-45"
            style={{ bottom: '-4px', left: '50%', marginLeft: '-4px' }}
          ></div>
        </div>
      )}
    </div>
  );
};

// Skill level indicator component
const SkillLevelIndicator = ({ level }) => {
  const levels = {
    Iniciante: 1,
    Intermediário: 2,
    Avançado: 3,
    Profissional: 4,
  };
  const maxStars = 4;

  const stars = levels[level] || 0;
  const label = Object.keys(levels).includes(level) ? level : 'Desconhecido';

  return (
    <div className="flex items-center" aria-label={`Nível: ${label} (${stars} de ${maxStars})`}>
      {[...Array(maxStars)].map((_, i) =>
        i < stars ? (
          <FaStar key={i} className="text-yellow-400 mr-0.5" aria-hidden="true" />
        ) : (
          <FaRegStar key={i} className="text-gray-400 mr-0.5" aria-hidden="true" />
        )
      )}
      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({label})</span>
    </div>
  );
};

// Player card component for mobile/alternative view
const PlayerCard = ({
  player,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  deleteLoading,
  deletingPlayerId,
}) => {
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
              {player.nickname ? player.nickname : 'Sem apelido'}
            </p>
            {player.email && (
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{player.email}</p>
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
            {deleteLoading && deletingPlayerId === player.id ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaTrash />
            )}
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
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-slate-700">
        <tr>
          <th className="px-3 md:px-6 py-3 text-left">
            <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </th>
          <th className="px-3 md:px-6 py-3 text-left">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
          </th>
          <th className="px-3 md:px-6 py-3 text-left">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
          </th>
          <th className="px-3 md:px-6 py-3 text-left hidden md:table-cell">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
          </th>
          <th className="px-3 md:px-6 py-3 text-left">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
          </th>
          <th className="px-3 md:px-6 py-3 text-left">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
          </th>
          <th className="px-3 md:px-6 py-3 text-right">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
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
            <td className="px-3 md:px-6 py-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            </td>
            <td className="px-3 md:px-6 py-4 text-right">
              <div className="flex items-center justify-end space-x-2">
                <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Skeleton loader for card view
const CardSkeleton = () => (
  <>
    {[...Array(3)].map((_, index) => (
      <div
        key={index}
        className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm mb-3 animate-pulse"
      >
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
const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText,
  confirmType = 'primary',
}) => {
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
              confirmType === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white'
            }`}
          >
            {confirmText || 'Confirmar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Import modal component
const ImportModal = ({ isOpen, onClose, onImport }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    try {
      await onImport(selectedFile);
      setSelectedFile(null);
      onClose();
    } catch {
      // Error handling is done in the parent component
    } finally {
      setImporting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'csv':
        return <FaFileCsv className="text-green-500" />;
      case 'xlsx':
      case 'xls':
        return <FaFileExcel className="text-green-600" />;
      case 'json':
        return <FaFileUpload className="text-blue-500" />;
      default:
        return <FaFileUpload className="text-gray-500" />;
    }
  };

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
        aria-labelledby="import-modal-title"
        aria-modal="true"
      >
        <div className="p-6">
          <h2
            id="import-modal-title"
            className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700 text-gray-900 dark:text-white"
          >
            Importar Jogadores
          </h2>

          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p className="mb-2">Formatos suportados:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>JSON:</strong> Array de objetos com campos name, nickname, email, gender,
                  skill_level
                </li>
                <li>
                  <strong>CSV:</strong> Arquivo com cabeçalhos
                  (name,nickname,email,gender,skill_level)
                </li>
                <li>
                  <strong>Excel:</strong> Planilha com colunas Name, Nickname, Email, Gender, Skill
                  Level
                </li>
              </ul>
            </div>

            <div
              className={`border-2 border-dashed p-6 rounded-lg text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center text-2xl">
                    {getFileIcon(selectedFile.name)}
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remover arquivo
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FaUpload className="mx-auto text-4xl text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-300">Arraste um arquivo aqui ou</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-outline btn-sm"
                  >
                    Escolher Arquivo
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <div className="flex items-start">
                <FaInfoCircle className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Exemplo de formato JSON:</p>
                  <pre className="text-xs bg-white dark:bg-slate-700 p-2 rounded border overflow-x-auto">
                    {`[
  {
    "name": "João Silva",
    "nickname": "João",
    "email": "joao@email.com",
    "gender": "Masculino",
    "skill_level": "Intermediário"
  }
]`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={importing}
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || importing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {importing ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  Importar Jogadores
                </>
              )}
            </button>
          </div>
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
    gender: Yup.string()
      .oneOf(['Masculino', 'Feminino', 'Outro'], 'Gênero inválido')
      .required('Gênero é obrigatório'),
    skill_level: Yup.string()
      .oneOf(['Iniciante', 'Intermediário', 'Avançado', 'Profissional'], 'Nível inválido')
      .required('Nível é obrigatório'),
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
          <h2
            id="player-form-title"
            className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-700 text-gray-900 dark:text-white"
          >
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
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
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
                  <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <div className="flex items-center">
                    <label
                      htmlFor="nickname"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 mr-2"
                    >
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
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
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
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
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
                    <label
                      htmlFor="skill_level"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
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
  const [refreshing, setRefreshing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletingPlayerId, setDeletingPlayerId] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // UI states
  const [viewMode, setViewMode] = useState('table');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [isCompactView, setIsCompactView] = useState(false);

  // Modal states
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerToDelete, setPlayerToDelete] = useState(null);

  // Hooks
  const { showMessage } = useMessage();
  const { user } = useAuth();

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load players effect
  useEffect(() => {
    loadPlayers();
  }, []);

  // Search effect
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      loadPlayers();
    }
  }, [debouncedSearchTerm]);

  // Filter players based on search and filters
  const filteredPlayers = useMemo(() => {
    let filtered = players.filter((player) => {
      const matchesSearch =
        !debouncedSearchTerm ||
        player.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (player.nickname &&
          player.nickname.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (player.email && player.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      const matchesGender = !filterGender || player.gender === filterGender;
      const matchesSkill = !filterSkill || player.skill_level === filterSkill;

      return matchesSearch && matchesGender && matchesSkill;
    });

    // Sort players
    filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';

      if (sortDirection === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    return filtered;
  }, [players, debouncedSearchTerm, filterGender, filterSkill, sortField, sortDirection]);

  // Load players function
  const loadPlayers = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);

      const response = await getAdminPlayers({
        search: debouncedSearchTerm,
        gender: filterGender,
        skill_level: filterSkill,
        sort_by: sortField,
        sort_direction: sortDirection,
      });

      if (response.success) {
        setPlayers(response.players || []);
      } else {
        showMessage(response.message || 'Erro ao carregar jogadores', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      showMessage('Erro ao carregar jogadores', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    debouncedSearchTerm,
    filterGender,
    filterSkill,
    sortField,
    sortDirection,
    refreshing,
    showMessage,
  ]);

  // Refresh players
  const refreshPlayers = useCallback(() => {
    setRefreshing(true);
    loadPlayers();
  }, [loadPlayers]);

  // Handle sort
  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField, sortDirection]
  );

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterGender('');
    setFilterSkill('');
    setSortField('name');
    setSortDirection('asc');
  }, []);

  // Player selection handlers
  const handleSelectPlayer = useCallback((playerId, checked) => {
    if (checked) {
      setSelectedPlayers((prev) => [...prev, playerId]);
    } else {
      setSelectedPlayers((prev) => prev.filter((id) => id !== playerId));
    }
  }, []);

  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedPlayers(filteredPlayers.map((player) => player.id));
      } else {
        setSelectedPlayers([]);
      }
    },
    [filteredPlayers]
  );

  // CRUD operations
  const handleAddPlayer = useCallback(() => {
    setEditingPlayer(null);
    setShowPlayerModal(true);
  }, []);

  const handleEditPlayer = useCallback((player) => {
    setEditingPlayer(player);
    setShowPlayerModal(true);
  }, []);

  const handleSavePlayer = useCallback(
    async (playerData, playerId) => {
      try {
        let response;

        if (playerId) {
          response = await updatePlayerAdmin(playerId, playerData);
          showMessage('Jogador atualizado com sucesso!', 'success');
        } else {
          response = await createPlayerAdmin(playerData);
          showMessage('Jogador criado com sucesso!', 'success');
        }

        if (response.success) {
          setShowPlayerModal(false);
          setEditingPlayer(null);
          loadPlayers();
        } else {
          showMessage(response.message || 'Erro ao salvar jogador', 'error');
        }
      } catch (error) {
        console.error('Erro ao salvar jogador:', error);
        showMessage('Erro ao salvar jogador', 'error');
      }
    },
    [loadPlayers, showMessage]
  );

  const handleDeletePlayer = useCallback((playerId, playerName) => {
    setPlayerToDelete({ id: playerId, name: playerName });
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeletePlayer = useCallback(async () => {
    if (!playerToDelete) return;

    try {
      setDeleteLoading(true);
      setDeletingPlayerId(playerToDelete.id);

      const response = await deletePlayerAdmin(playerToDelete.id);

      if (response.success) {
        showMessage('Jogador excluído com sucesso!', 'success');
        setSelectedPlayers((prev) => prev.filter((id) => id !== playerToDelete.id));
        loadPlayers();
      } else {
        showMessage(response.message || 'Erro ao excluir jogador', 'error');
      }
    } catch (error) {
      console.error('Erro ao excluir jogador:', error);
      showMessage('Erro ao excluir jogador', 'error');
    } finally {
      setDeleteLoading(false);
      setDeletingPlayerId(null);
      setShowDeleteConfirm(false);
      setPlayerToDelete(null);
    }
  }, [playerToDelete, loadPlayers, showMessage]);

  const handleBulkDelete = useCallback(() => {
    if (selectedPlayers.length === 0) return;
    setShowBulkDeleteConfirm(true);
  }, [selectedPlayers]);

  const confirmBulkDelete = useCallback(async () => {
    try {
      setDeleteLoading(true);

      const deletePromises = selectedPlayers.map((playerId) => deletePlayerAdmin(playerId));

      await Promise.all(deletePromises);

      showMessage(`${selectedPlayers.length} jogador(es) excluído(s) com sucesso!`, 'success');
      setSelectedPlayers([]);
      loadPlayers();
    } catch (error) {
      console.error('Erro ao excluir jogadores:', error);
      showMessage('Erro ao excluir jogadores selecionados', 'error');
    } finally {
      setDeleteLoading(false);
      setShowBulkDeleteConfirm(false);
    }
  }, [selectedPlayers, loadPlayers, showMessage]);

  // Import players
  const handleImportPlayers = useCallback(
    async (file) => {
      try {
        const response = await importPlayersAdmin(file);

        if (response.success) {
          showMessage(`${response.imported || 0} jogador(es) importado(s) com sucesso!`, 'success');
          loadPlayers();
        } else {
          showMessage(response.message || 'Erro ao importar jogadores', 'error');
        }
      } catch (error) {
        console.error('Erro ao importar jogadores:', error);
        showMessage('Erro ao importar jogadores', 'error');
      }
    },
    [loadPlayers, showMessage]
  );

  // Export players
  const handleExportPlayers = useCallback(() => {
    const dataToExport = filteredPlayers.map((player) => ({
      name: player.name,
      nickname: player.nickname || '',
      email: player.email || '',
      gender: player.gender,
      skill_level: player.skill_level,
    }));

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `jogadores_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showMessage('Dados exportados com sucesso!', 'success');
  }, [filteredPlayers, showMessage]);

  // Render sort icon
  const renderSortIcon = useCallback(
    (field) => {
      if (sortField !== field) {
        return <FaSort className="ml-1 text-gray-400" />;
      }
      return sortDirection === 'asc' ? (
        <FaSortUp className="ml-1 text-blue-500" />
      ) : (
        <FaSortDown className="ml-1 text-blue-500" />
      );
    },
    [sortField, sortDirection]
  );

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaUsers className="mr-3 text-blue-600" />
              Gerenciar Jogadores
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {filteredPlayers.length} de {players.length} jogador(es)
              {selectedPlayers.length > 0 && ` • ${selectedPlayers.length} selecionado(s)`}
            </p>
          </div>

          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Visualização em tabela"
              >
                <FaTable className="text-sm" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Visualização em cards"
              >
                <FaThList className="text-sm" />
              </button>
            </div>

            {/* Compact view toggle */}
            <button
              onClick={() => setIsCompactView(!isCompactView)}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              title={isCompactView ? 'Expandir visualização' : 'Compactar visualização'}
            >
              {isCompactView ? <FaExpand /> : <FaCompress />}
            </button>

            {/* Refresh button */}
            <button
              onClick={refreshPlayers}
              disabled={refreshing}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50"
              title="Atualizar lista"
            >
              <FaSync className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button onClick={handleAddPlayer} className="btn btn-primary flex items-center">
            <FaPlus className="mr-2" />
            Adicionar Jogador
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-outline flex items-center"
          >
            <FaUpload className="mr-2" />
            Importar
          </button>

          <button
            onClick={handleExportPlayers}
            disabled={filteredPlayers.length === 0}
            className="btn btn-outline flex items-center disabled:opacity-50"
          >
            <FaDownload className="mr-2" />
            Exportar
          </button>

          {selectedPlayers.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleteLoading}
              className="btn btn-danger flex items-center"
            >
              <FaTrashAlt className="mr-2" />
              Excluir Selecionados ({selectedPlayers.length})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar jogadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Gender filter */}
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos os gêneros</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Outro">Outro</option>
          </select>

          {/* Skill level filter */}
          <select
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos os níveis</option>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Avançado">Avançado</option>
            <option value="Profissional">Profissional</option>
          </select>

          {/* Clear filters */}
          <button
            onClick={clearFilters}
            className="btn btn-outline flex items-center justify-center"
          >
            <FaUndo className="mr-2" />
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        {loading ? (
          <div className="p-6">{viewMode === 'table' ? <TableSkeleton /> : <CardSkeleton />}</div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum jogador encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {players.length === 0
                ? 'Adicione o primeiro jogador para começar'
                : 'Tente ajustar os filtros de busca'}
            </p>
            {players.length === 0 && (
              <button
                onClick={handleAddPlayer}
                className="btn btn-primary flex items-center mx-auto"
              >
                <FaUserPlus className="mr-2" />
                Adicionar Primeiro Jogador
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Table view */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedPlayers.length === filteredPlayers.length &&
                        filteredPlayers.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-5 w-5"
                      aria-label="Selecionar todos os jogadores"
                    />
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      Nome
                      {renderSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('nickname')}
                      className="flex items-center font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      Apelido
                      {renderSortIcon('nickname')}
                    </button>
                  </th>
                  {!isCompactView && (
                    <th className="px-3 md:px-6 py-3 text-left hidden md:table-cell">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        Email
                        {renderSortIcon('email')}
                      </button>
                    </th>
                  )}
                  <th className="px-3 md:px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('gender')}
                      className="flex items-center font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      Gênero
                      {renderSortIcon('gender')}
                    </button>
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('skill_level')}
                      className="flex items-center font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      Nível
                      {renderSortIcon('skill_level')}
                    </button>
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {filteredPlayers.map((player) => (
                    <motion.tr
                      key={player.id}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-700 ${
                        selectedPlayers.includes(player.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      layout
                    >
                      <td className="px-3 md:px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(player.id)}
                          onChange={(e) => handleSelectPlayer(player.id, e.target.checked)}
                          className="h-5 w-5"
                          aria-label={`Selecionar jogador ${player.name}`}
                        />
                      </td>
                      <td className="px-3 md:px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {player.name}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4">
                        <div className="text-gray-500 dark:text-gray-400">
                          {player.nickname || '-'}
                        </div>
                      </td>
                      {!isCompactView && (
                        <td className="px-3 md:px-6 py-4 hidden md:table-cell">
                          <div className="text-gray-500 dark:text-gray-400">
                            {player.email || '-'}
                          </div>
                        </td>
                      )}
                      <td className="px-3 md:px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full">
                          {player.gender}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-4">
                        <SkillLevelIndicator level={player.skill_level} />
                      </td>
                      <td className="px-3 md:px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditPlayer(player)}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            aria-label={`Editar jogador ${player.name}`}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                            disabled={deleteLoading && deletingPlayerId === player.id}
                            className={`p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded ${
                              deleteLoading && deletingPlayerId === player.id
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
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
        ) : (
          /* Cards view */
          <div className="p-6">
            <AnimatePresence>
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelected={selectedPlayers.includes(player.id)}
                  onSelect={(e) => handleSelectPlayer(player.id, e.target.checked)}
                  onEdit={handleEditPlayer}
                  onDelete={handleDeletePlayer}
                  deleteLoading={deleteLoading}
                  deletingPlayerId={deletingPlayerId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showPlayerModal && (
          <PlayerFormModal
            isOpen={showPlayerModal}
            onClose={() => {
              setShowPlayerModal(false);
              setEditingPlayer(null);
            }}
            player={editingPlayer}
            onSave={handleSavePlayer}
          />
        )}

        {showImportModal && (
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImportPlayers}
          />
        )}

        {showDeleteConfirm && (
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => {
              setShowDeleteConfirm(false);
              setPlayerToDelete(null);
            }}
            title="Confirmar Exclusão"
            message={`Tem certeza que deseja excluir o jogador "${playerToDelete?.name}"? Esta ação não pode ser desfeita.`}
            onConfirm={confirmDeletePlayer}
            confirmText="Excluir"
            confirmType="danger"
          />
        )}

        {showBulkDeleteConfirm && (
          <ConfirmationModal
            isOpen={showBulkDeleteConfirm}
            onClose={() => setShowBulkDeleteConfirm(false)}
            title="Confirmar Exclusão em Lote"
            message={`Tem certeza que deseja excluir ${selectedPlayers.length} jogador(es) selecionado(s)? Esta ação não pode ser desfeita.`}
            onConfirm={confirmBulkDelete}
            confirmText={`Excluir ${selectedPlayers.length} Jogador(es)`}
            confirmType="danger"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayersPage;
