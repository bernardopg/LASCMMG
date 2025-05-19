import React, { useState, useEffect, useCallback } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getPlayers, saveScore } from '../services/api'; // Import actual API functions
import { useMessage } from '../context/MessageContext';
import { useTournament } from '../context/TournamentContext';
import { useNavigate } from 'react-router-dom';

const AddScorePage = () => {
  const [players, setPlayers] = useState([]);
  const { showMessage } = useMessage();
  const { currentTournament, refreshCurrentTournamentDetails } =
    useTournament(); // Get current tournament and a way to refresh
  const navigate = useNavigate();

  const fetchPlayersData = useCallback(async () => {
    if (!currentTournament?.id) {
      setPlayers([]);
      return;
    }
    try {
      const fetchedPlayers = await getPlayers(currentTournament.id);
      setPlayers(fetchedPlayers || []);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      showMessage(
        `Erro ao carregar jogadores: ${error.message || 'Erro desconhecido'}`,
        'error'
      );
      setPlayers([]);
    }
  }, [currentTournament?.id, showMessage]);

  useEffect(() => {
    fetchPlayersData();
  }, [fetchPlayersData]);

  const initialValues = {
    player1_name: '', // Changed to match expected backend or typical naming
    score1: '',
    player2_name: '', // Changed to match expected backend or typical naming
    score2: '',
    round: '',
  };

  const validationSchema = Yup.object().shape({
    player1_name: Yup.string().required('Jogador 1 é obrigatório'),
    score1: Yup.number()
      .required('Placar do Jogador 1 é obrigatório')
      .min(0, 'Placar não pode ser negativo')
      .max(2, 'Placar não pode ser maior que 2')
      .integer('Placar deve ser um número inteiro'),
    player2_name: Yup.string()
      .required('Jogador 2 é obrigatório')
      .notOneOf([Yup.ref('player1_name')], 'Jogadores não podem ser iguais'),
    score2: Yup.number()
      .required('Placar do Jogador 2 é obrigatório')
      .min(0, 'Placar não pode ser negativo')
      .max(2, 'Placar não pode ser maior que 2')
      .integer('Placar deve ser um número inteiro')
      .test(
        'scores-cannot-be-equal-if-max',
        'Ambos os placares não podem ser 2',
        function (value) {
          const { score1 } = this.parent;
          return !(score1 === 2 && value === 2);
        }
      )
      .test(
        'one-player-must-win',
        'Um jogador deve ter placar 2 se o outro não tiver, ou os placares devem ser diferentes (ex: 2x0, 2x1, 1x0).',
        function (value) {
          // value is score2
          const { score1 } = this.parent;
          // Ensure scores are numbers for comparison
          const s1 = Number(score1);
          const s2 = Number(value);

          if (s1 === 2 && s2 === 2) return false; // Both can't be 2
          if ((s1 === 2 && s2 < 2) || (s2 === 2 && s1 < 2)) return true; // One player reached 2, the other didn't
          if (s1 < 2 && s2 < 2 && s1 !== s2) return true; // Neither reached 2, scores must be different (e.g., 1-0)

          // This case implies s1 < 2, s2 < 2, and s1 === s2 (e.g. 0-0, 1-1), which is invalid if neither reached 2.
          // Or one score is not a number yet.
          if (s1 < 2 && s2 < 2 && s1 === s2) return false;

          return true; // Default to true if conditions not met, allowing other validations to catch NaN etc.
        }
      ),
    round: Yup.string().required('Rodada é obrigatória'),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    if (!currentTournament?.id) {
      showMessage('Nenhum torneio selecionado.', 'error');
      setSubmitting(false);
      return;
    }

    const payload = {
      ...values,
      tournament_id: currentTournament.id,
      score1: Number(values.score1),
      score2: Number(values.score2),
    };

    try {
      await saveScore(payload);
      showMessage('Placar adicionado com sucesso!', 'success');
      resetForm();
      if (refreshCurrentTournamentDetails) {
        // If context provides a way to refresh bracket/details
        refreshCurrentTournamentDetails();
      }
      // Optionally navigate to scores page or bracket page
      // navigate(`/scores?tournament=${currentTournament.id}`);
    } catch (error) {
      console.error('Erro ao adicionar placar:', error);
      showMessage(
        `Erro ao adicionar placar: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`,
        'error'
      );
    }
    setSubmitting(false);
  };

  return (
    <div className="p-4 md:p-6">
      <h2
        id="add-score-heading"
        className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6"
      >
        Adicionar Novo Placar
      </h2>
      <div className="card card-form bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, dirty, isValid }) => (
            <Form className="form space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label
                    htmlFor="player1"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Jogador 1:
                  </label>
                  <Field
                    as="select"
                    id="player1_name"
                    name="player1_name"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Selecione Jogador 1</option>
                    {players.map((player) => (
                      <option
                        key={player.id || player.name}
                        value={player.name}
                      >
                        {player.nickname
                          ? `${player.name} (${player.nickname})`
                          : player.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="player1_name"
                    component="div"
                    className="text-red-500 dark:text-red-400 text-xs mt-1"
                  />
                </div>
                <div className="form-group">
                  <label
                    htmlFor="score1"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Placar Jogador 1:
                  </label>
                  <Field
                    type="number"
                    id="score1"
                    name="score1"
                    min="0"
                    max="2"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
                    aria-label="Placar do jogador 1"
                  />
                  <ErrorMessage
                    name="score1"
                    component="div"
                    className="text-red-500 dark:text-red-400 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label
                    htmlFor="player2"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Jogador 2:
                  </label>
                  <Field
                    as="select"
                    id="player2_name"
                    name="player2_name"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Selecione Jogador 2</option>
                    {players.map((player) => (
                      <option
                        key={player.id || player.name}
                        value={player.name}
                      >
                        {player.nickname
                          ? `${player.name} (${player.nickname})`
                          : player.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="player2_name"
                    component="div"
                    className="text-red-500 dark:text-red-400 text-xs mt-1"
                  />
                </div>
                <div className="form-group">
                  <label
                    htmlFor="score2"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Placar Jogador 2:
                  </label>
                  <Field
                    type="number"
                    id="score2"
                    name="score2"
                    min="0"
                    max="2"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
                    aria-label="Placar do jogador 2"
                  />
                  <ErrorMessage
                    name="score2"
                    component="div"
                    className="text-red-500 dark:text-red-400 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label
                  htmlFor="round"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Rodada:
                </label>
                <Field
                  as="select"
                  id="round"
                  name="round"
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">Selecione a rodada</option>
                  <option value="Round 1">Round 1</option>
                  <option value="Round 2">Round 2</option>
                  <option value="Quartas de Final">Quartas de Final</option>
                  <option value="Semifinais">Semifinais</option>
                  <option value="Final">Final</option>
                </Field>
                <ErrorMessage
                  name="round"
                  component="div"
                  className="text-red-500 dark:text-red-400 text-xs mt-1"
                />
              </div>

              <div className="form-actions flex justify-end space-x-3 pt-4">
                <button
                  type="reset"
                  className="btn btn-secondary px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                  disabled={isSubmitting}
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  disabled={!dirty || !isValid || isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Placar'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddScorePage;
