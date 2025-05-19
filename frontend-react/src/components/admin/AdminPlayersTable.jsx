import React, { useState, useEffect, useCallback } from 'react';
import { getAdminPlayers, deletePlayerAdmin } from '../../services/api'; // Assuming deletePlayerAdmin handles soft/permanent
import { useMessage } from '../../context/MessageContext';
import React, { useState, useEffect, useCallback } from 'react';
import { getAdminPlayers, deletePlayerAdmin, createPlayerAdmin, updatePlayerAdmin } from '../../services/api';
import { useMessage } from '../../context/MessageContext';
import { FaEdit, FaTrash, FaUndo, FaPlusCircle } from 'react-icons/fa';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const PlayerFormModal = ({ isOpen, onClose, player, onSave }) => {
  if (!isOpen) return null;

  const initialValues = {
    name: player?.name || '',
    nickname: player?.nickname || '',
    gender: player?.gender || 'Masculino',
    level: player?.level || 'Iniciante',
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Nome é obrigatório').min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
    nickname: Yup.string().max(50, 'Apelido muito longo'),
    gender: Yup.string().oneOf(['Masculino', 'Feminino', 'Outro'], 'Gênero inválido').required('Gênero é obrigatório'),
    level: Yup.string().oneOf(['Iniciante', 'Intermediário', 'Avançado', 'Profissional'], 'Nível inválido').required('Nível é obrigatório'),
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
        <h3 className="text-xl font-semibold mb-6 text-white border-b border-gray-700 pb-3">
          {player ? 'Editar Jogador' : 'Adicionar Novo Jogador'}
        </h3>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            onSave(values, player?.id);
            setSubmitting(false);
          }}
          enableReinitialize
        >
          {({ isSubmitting, dirty, isValid }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="name" className="label">Nome Completo</label>
                <Field type="text" name="name" id="name" className="input" />
                <ErrorMessage name="name" component="div" className="error-message" />
              </div>
              <div>
                <label htmlFor="nickname" className="label">Apelido (Opcional)</label>
                <Field type="text" name="nickname" id="nickname" className="input" />
                <ErrorMessage name="nickname" component="div" className="error-message" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gender" className="label">Gênero</label>
                  <Field as="select" name="gender" id="gender" className="input">
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </Field>
                  <ErrorMessage name="gender" component="div" className="error-message" />
                </div>
                <div>
                  <label htmlFor="level" className="label">Nível de Habilidade</label>
                  <Field as="select" name="level" id="level" className="input">
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Profissional">Profissional</option>
                  </Field>
                  <ErrorMessage name="level" component="div" className="error-message" />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={onClose} className="btn btn-secondary text-sm" disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary text-sm" disabled={isSubmitting || !dirty || !isValid}>
                  {isSubmitting ? 'Salvando...' : (player ? 'Atualizar Jogador' : 'Adicionar Jogador')}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};


const AdminPlayersTable = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showMessage } = useMessage();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10); // Items per page

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  const fetchPlayers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminPlayers({ page, limit });
      setPlayers(data.players || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (err) {
      setError(err.message || 'Erro ao buscar jogadores.');
      showMessage(`Erro ao buscar jogadores: ${err.message || 'Erro desconhecido'}`, 'error');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [limit, showMessage]);

  useEffect(() => {
    fetchPlayers(currentPage);
  }, [fetchPlayers, currentPage]);

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setIsModalOpen(true);
  };

  const handleDelete = async (playerId) => {
    if (window.confirm('Tem certeza que deseja enviar este jogador para a lixeira?')) {
      try {
        await deletePlayerAdmin(playerId); // Soft delete by default
        showMessage('Jogador enviado para a lixeira.', 'success');
        fetchPlayers(currentPage); // Refresh list
      } catch (err) {
        showMessage(`Erro ao mover para lixeira: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    }
  };

  const handleSavePlayer = async (playerData, playerId) => {
    try {
      if (playerId) {
        await updatePlayerAdmin(playerId, playerData);
        showMessage('Jogador atualizado com sucesso!', 'success');
      } else {
        await createPlayerAdmin(playerData);
        showMessage('Jogador adicionado com sucesso!', 'success');
      }
      fetchPlayers(currentPage); // Refresh list
      setIsModalOpen(false);
      setEditingPlayer(null);
    } catch (err) {
      showMessage(`Erro ao salvar jogador: ${err.message || 'Erro desconhecido'}`, 'error');
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-300">Carregando jogadores...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-400">Erro: {error}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="btn btn-primary text-sm">
          <FaPlusCircle className="inline mr-2" /> Adicionar Jogador
        </button>
      </div>
      <div className="overflow-x-auto bg-gray-800 shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Apelido</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Gênero</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nível</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {players.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-400">Nenhum jogador encontrado.</td>
              </tr>
            ) : (
              players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{player.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{player.nickname || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{player.gender || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{player.level || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(player)} className="text-blue-400 hover:text-blue-300" title="Editar">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(player.id)} className="text-red-400 hover:text-red-300" title="Mover para Lixeira">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="py-4 flex justify-between items-center text-sm text-gray-400">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
      <PlayerFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPlayer(null); }}
        player={editingPlayer}
        onSave={handleSavePlayer}
      />
    </div>
  );
};

export default AdminPlayersTable;
