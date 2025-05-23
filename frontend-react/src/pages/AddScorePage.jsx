import React, { useState, useEffect, useCallback } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getPlayers, createScoreAdmin } from '../services/api';
import { useMessage } from '../context/MessageContext';
import { useNavigate } from 'react-router-dom';
import { FaSpinner } from 'react-icons/fa';

const AddScorePage = () => {
  const { showError, showSuccess } = useMessage();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winner, setWinner] = useState(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlayers();
      setPlayers(data.players || []);
    } catch (error) {
      showError(`Erro ao carregar jogadores: ${error.response?.data?.message || error.message}`);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const validationSchema = Yup.object().shape({
    player1Id: Yup.string().required('Jogador 1 é obrigatório'),
    player2Id: Yup.string().required('Jogador 2 é obrigatório'),
    player1Score: Yup.number()
      .required('Placar é obrigatório')
      .min(0, 'Placar deve ser entre 0 e 21')
      .max(21, 'Placar deve ser entre 0 e 21')
      .integer('Placar deve ser um número inteiro'),
    player2Score: Yup.number()
      .required('Placar é obrigatório')
      .min(0, 'Placar deve ser entre 0 e 21')
      .max(21, 'Placar deve ser entre 0 e 21')
      .integer('Placar deve ser um número inteiro'),
    round: Yup.string().required('Rodada é obrigatória'),
  }).test('different-players', 'Jogadores devem ser diferentes', function(values) {
    if (values.player1Id && values.player2Id && values.player1Id === values.player2Id) {
      return this.createError({
        path: 'player2Id',
        message: 'Jogadores devem ser diferentes'
      });
    }
    return true;
  });

  const calculateWinner = (player1Score, player2Score, player1Id, player2Id) => {
    if (!player1Score && player1Score !== 0) return null;
    if (!player2Score && player2Score !== 0) return null;
    if (!player1Id || !player2Id) return null;

    const score1 = Number(player1Score);
    const score2 = Number(player2Score);

    if (score1 === score2) {
      return 'Empate';
    }

    const player1 = players.find(p => p.id.toString() === player1Id);
    const player2 = players.find(p => p.id.toString() === player2Id);

    if (score1 > score2) {
      return player1 ? `Vencedor: ${player1.name}` : 'Jogador 1';
    } else {
      return player2 ? `Vencedor: ${player2.name}` : 'Jogador 2';
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    const player1 = players.find(p => p.id.toString() === values.player1Id);
    const player2 = players.find(p => p.id.toString() === values.player2Id);

    if (!player1 || !player2) {
      showError('Jogadores selecionados não encontrados.');
      setSubmitting(false);
      return;
    }

    const payload = {
      player1_name: player1.name,
      player2_name: player2.name,
      player1_score: Number(values.player1Score),
      player2_score: Number(values.player2Score),
      winner_name: Number(values.player1Score) > Number(values.player2Score)
        ? player1.name
        : Number(values.player2Score) > Number(values.player1Score)
        ? player2.name
        : null, // Handle ties
      round: values.round,
    };

    try {
      await createScoreAdmin(payload);
      showSuccess('Placar salvo com sucesso!');
      navigate('/admin/scores');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      showError(errorMessage);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
        Adicionar Placar
      </h2>

      <div className="card card-form bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 md:p-8">
        <Formik
          initialValues={{
            player1Id: '',
            player2Id: '',
            player1Score: '',
            player2Score: '',
            round: '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, dirty, isValid, values, setFieldValue }) => {
            // Update winner display when scores change
            const currentWinner = calculateWinner(
              values.player1Score,
              values.player2Score,
              values.player1Id,
              values.player2Id
            );

            if (currentWinner !== winner) {
              setWinner(currentWinner);
            }

            return (
              <Form className="form space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="player1Id" className="label">
                      Jogador 1
                    </label>
                    <Field as="select" name="player1Id" id="player1Id" className="input" aria-label="Jogador 1">
                      <option value="">Selecione o Jogador 1</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="player1Id" component="div" className="error-message" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="player2Id" className="label">
                      Jogador 2
                    </label>
                    <Field as="select" name="player2Id" id="player2Id" className="input" aria-label="Jogador 2">
                      <option value="">Selecione o Jogador 2</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="player2Id" component="div" className="error-message" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="player1Score" className="label">
                      Placar Jogador 1
                    </label>
                    <Field
                      type="number"
                      id="player1Score"
                      name="player1Score"
                      min="0"
                      max="21"
                      className="input"
                      aria-label="Placar Jogador 1"
                    />
                    <ErrorMessage name="player1Score" component="div" className="error-message" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="player2Score" className="label">
                      Placar Jogador 2
                    </label>
                    <Field
                      type="number"
                      id="player2Score"
                      name="player2Score"
                      min="0"
                      max="21"
                      className="input"
                      aria-label="Placar Jogador 2"
                    />
                    <ErrorMessage name="player2Score" component="div" className="error-message" />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="round" className="label">
                    Rodada *
                  </label>
                  <Field as="select" name="round" id="round" className="input">
                    <option value="">Selecione a Rodada</option>
                    <option value="Oitavas de Final">Oitavas de Final</option>
                    <option value="Quartas de Final">Quartas de Final</option>
                    <option value="Semifinal">Semifinal</option>
                    <option value="Final">Final</option>
                  </Field>
                  <ErrorMessage name="round" component="div" className="error-message" />
                </div>

                {winner && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 font-medium">
                      {winner}
                    </p>
                  </div>
                )}

                <div className="form-actions flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/scores')}
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!dirty || !isValid || isSubmitting}
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Placar'}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default AddScorePage;
