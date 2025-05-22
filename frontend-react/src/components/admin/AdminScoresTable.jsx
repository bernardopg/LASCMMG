import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminScores,
  deleteScoreAdmin,
  updateScoreAdmin,
} from '../../services/api';
import { useMessage } from '../../context/MessageContext';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Score Edit Modal (Simplified for now)
const ScoreEditModal = ({ isOpen, onClose, score, onSave }) => {
  if (!isOpen) return null;

  const initialValues = {
    player1_name: score?.player1_name || '', // Keep for display
    player1_score: score?.player1_score ?? '', // Use player1_score
    player2_name: score?.player2_name || '', // Keep for display
    player2_score: score?.player2_score ?? '', // Use player2_score
    round: score?.round || '',
    // winner_id could be added here if editing winner is desired
  };

  const validationSchema = Yup.object().shape({
    player1_score: Yup.number().required('Placar obrigatório').min(0).integer(), // Validate player1_score
    player2_score: Yup.number().required('Placar obrigatório').min(0).integer(), // Validate player2_score
    round: Yup.string().required('Rodada obrigatória'),
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 text-white">
          Editar Placar (Partida ID: {score?.id})
        </h3>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            onSave(
              {
                player1_score: Number(values.player1_score), // Send player1_score
                player2_score: Number(values.player2_score), // Send player2_score
                round: values.round,
                // winner_id: values.winner_id, // If winner editing is added
              },
              score.id
            );
            setSubmitting(false);
          }}
          enableReinitialize
        >
          {({ isSubmitting, dirty, isValid }) => (
            <Form className="space-y-4">
              <p className="text-sm text-gray-300">
                Jogadores: {initialValues.player1_name || 'Jogador 1'} vs{' '}
                {initialValues.player2_name || 'Jogador 2'}
              </p>
              <div>
                <label htmlFor="player1_score_edit" className="label">
                  Placar {initialValues.player1_name || 'Jogador 1'}
                </label>
                <Field
                  type="number"
                  name="player1_score" // Use player1_score
                  id="player1_score_edit"
                  className="input"
                />
                <ErrorMessage
                  name="player1_score" // Use player1_score
                  component="div"
                  className="error-message"
                />
              </div>
              <div>
                <label htmlFor="player2_score_edit" className="label">
                  Placar {initialValues.player2_name || 'Jogador 2'}
                </label>
                <Field
                  type="number"
                  name="player2_score" // Use player2_score
                  id="player2_score_edit"
                  className="input"
                />
                <ErrorMessage
                  name="player2_score" // Use player2_score
                  component="div"
                  className="error-message"
                />
              </div>
              <div>
                <label htmlFor="round_edit" className="label">
                  Rodada
                </label>
                <Field
                  type="text"
                  name="round"
                  id="round_edit"
                  className="input"
                />
                <ErrorMessage
                  name="round"
                  component="div"
                  className="error-message"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary text-sm"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-sm"
                  disabled={isSubmitting || !dirty || !isValid}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

const AdminScoresTable = () => {
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
        setError(err.message || 'Erro ao buscar placares.');
        showMessage(
          `Erro ao buscar placares: ${err.message || 'Erro desconhecido'}`,
          'error'
        );
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

  const handleEdit = (score) => {
    setEditingScore(score);
    setIsModalOpen(true);
  };

  const handleDelete = async (scoreId) => {
    if (
      window.confirm(
        'Tem certeza que deseja enviar este placar para a lixeira?'
      )
    ) {
      try {
        await deleteScoreAdmin(scoreId); // Soft delete
        showMessage('Placar enviado para a lixeira.', 'success');
        fetchScores(currentPage);
      } catch (err) {
        showMessage(
          `Erro ao mover placar para lixeira: ${err.message || 'Erro desconhecido'}`,
          'error'
        );
      }
    }
  };

  const handleSaveScore = async (scoreData, scoreId) => {
    try {
      await updateScoreAdmin(scoreId, scoreData);
      showMessage('Placar atualizado com sucesso!', 'success');
      fetchScores(currentPage);
      setIsModalOpen(false);
      setEditingScore(null);
    } catch (err) {
      showMessage(
        `Erro ao atualizar placar: ${err.message || 'Erro desconhecido'}`,
        'error'
      );
    }
  };

  if (loading)
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-300">Carregando placares...</p>
      </div>
    );
  if (error)
    return <div className="text-center py-10 text-red-400">Erro: {error}</div>;

  return (
    <div>
      <div className="overflow-x-auto bg-gray-800 shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Concluído em
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Jogador 1
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Jogador 2
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Placar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Vencedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Rodada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {scores.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-4 text-center text-sm text-gray-400"
                >
                  Nenhum placar encontrado.
                </td>
              </tr>
            ) : (
              scores.map((score) => (
                <tr key={score.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                    {score.completed_at ? new Date(score.completed_at).toLocaleString('pt-BR') : score.timestamp ? new Date(score.timestamp).toLocaleString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                    {score.player1_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                    {score.player2_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{`${score.player1_score ?? 0} - ${score.player2_score ?? 0}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                    {score.winner_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {score.round || score.match_round || '-'} {/* Fallback to match_round if score.round is not set */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(score)}
                      className="text-blue-400 hover:text-blue-300"
                      title="Editar Placar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(score.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Mover para Lixeira"
                    >
                      <FaTrash />
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
      <ScoreEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingScore(null);
        }}
        score={editingScore}
        onSave={handleSaveScore}
      />
    </div>
  );
};

export default AdminScoresTable;
