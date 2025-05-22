import React, { useState, useEffect, useCallback } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getTournamentState, updateMatchScoreAdmin, getPlayers } from '../services/api'; // Corrected path
import { useMessage } from '../context/MessageContext'; // Corrected path
import { useTournament } from '../context/TournamentContext';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSpinner } from 'react-icons/fa';

const AddScorePage = () => {
  const { showError, showSuccess } = useMessage();
  const { currentTournament, refreshCurrentTournament } = useTournament(); // Using currentTournament from context
  const navigate = useNavigate();
  const { tournamentId: routeTournamentId, matchId } = useParams(); // Renamed to avoid conflict

  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formInitialValues, setFormInitialValues] = useState({
    score1: '',
    score2: '',
    winnerId: '', // To select winner if scores are equal or for manual override
  });

  // Use routeTournamentId if currentTournament from context doesn't match or is not available
  const tournamentIdToUse = currentTournament?.id === routeTournamentId ? currentTournament.id : routeTournamentId;

  const fetchMatchData = useCallback(async () => {
    if (!tournamentIdToUse || !matchId) {
      showError('ID do torneio ou da partida ausente.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const state = await getTournamentState(tournamentIdToUse);
      const match = state?.matches?.[matchId];

      if (match) {
        setMatchDetails(match);
        setFormInitialValues({
          score1: match.score && match.score[0] !== null ? match.score[0].toString() : '',
          score2: match.score && match.score[1] !== null ? match.score[1].toString() : '',
          winnerId: match.winner !== null && match.players[match.winner] ? match.players[match.winner].db_id : '',
        });
      } else {
        showError('Detalhes da partida não encontrados.');
        setMatchDetails(null);
      }
    } catch (error) {
      showError(`Erro ao carregar detalhes da partida: ${error.response?.data?.message || error.message}`);
      setMatchDetails(null);
    } finally {
      setLoading(false);
    }
  }, [tournamentIdToUse, matchId, showError]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const validationSchema = Yup.object().shape({
    score1: Yup.number()
      .required('Placar do Jogador 1 é obrigatório')
      .min(0, 'Placar não pode ser negativo')
      .integer('Placar deve ser um número inteiro'),
    score2: Yup.number()
      .required('Placar do Jogador 2 é obrigatório')
      .min(0, 'Placar não pode ser negativo')
      .integer('Placar deve ser um número inteiro'),
    winnerId: Yup.string().when(['score1', 'score2'], {
      is: (score1, score2) => Number(score1) === Number(score2),
      then: (schema) => schema.required('Se os placares forem iguais, o vencedor deve ser selecionado manualmente.'),
      otherwise: (schema) => schema.nullable(),
    }),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    if (!tournamentIdToUse || !matchId || !matchDetails) {
      showError('Dados do torneio ou partida ausentes. Não é possível salvar.');
      setSubmitting(false);
      return;
    }

    let finalWinnerId = values.winnerId;
    if (!finalWinnerId) { // If winnerId was not manually selected via a dropdown (e.g. for ties)
      if (Number(values.score1) > Number(values.score2)) {
        finalWinnerId = matchDetails.players[0]?.db_id;
      } else if (Number(values.score2) > Number(values.score1)) {
        finalWinnerId = matchDetails.players[1]?.db_id;
      }
    }

    if (!finalWinnerId && Number(values.score1) === Number(values.score2)) {
        showError('Para placares iguais, por favor, selecione manualmente o vencedor.');
        setSubmitting(false);
        return;
    }
    if (!finalWinnerId) {
        showError('Não foi possível determinar o vencedor. Verifique os placares ou selecione manualmente.');
        setSubmitting(false);
        return;
    }


    const payload = {
      score1: Number(values.score1), // Changed from player1Score
      score2: Number(values.score2), // Changed from player2Score
      winnerId: finalWinnerId,     // This is the player's database ID
    };

    try {
      // Using updateMatchScoreAdmin which should call PATCH /api/tournaments/:tournamentId/matches/:matchId/winner
      await updateMatchScoreAdmin(tournamentIdToUse, matchId, payload);
      showSuccess('Placar salvo com sucesso!');
      if (refreshCurrentTournament) {
        refreshCurrentTournament(); // Refresh context if current tournament was updated
      }
      fetchMatchData(); // Re-fetch match data to show updated scores/winner
      // Consider navigating away or resetting form based on UX preference
      // navigate(`/admin/tournaments/manage/${tournamentIdToUse}`);
    } catch (error) {
      showError(`Erro ao salvar placar: ${error.response?.data?.message || error.message}`);
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

  if (!matchDetails) {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-red-500">Detalhes da partida não puderam ser carregados ou partida não encontrada.</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary mt-4">Voltar</button>
      </div>
    );
  }

  const player1 = matchDetails.players?.[0];
  const player2 = matchDetails.players?.[1];

  return (
    <div className="p-4 md:p-6">
      <h2
        id="add-score-heading"
        className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2"
      >
        Registrar Placar da Partida
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Torneio: {currentTournament?.name || routeTournamentId} - Rodada: {matchDetails.round || 'N/A'}
      </p>
      <div className="card card-form bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 md:p-8">
        <Formik
          initialValues={formInitialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize // Important for pre-filling form with fetched data
        >
          {({ isSubmitting, dirty, isValid, values }) => (
            <Form className="form space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-center">
                <div className="form-group">
                  <label className="label font-semibold text-lg">
                    {player1?.name || 'Jogador 1'}
                    {player1?.nickname && <span className="text-xs text-gray-500"> ({player1.nickname})</span>}
                  </label>
                </div>
                <div className="form-group">
                  <label htmlFor="score1" className="sr-only">Placar Jogador 1</label>
                  <Field
                    type="number"
                    id="score1"
                    name="score1"
                    min="0"
                    className="input text-center text-lg"
                    aria-label="Placar do jogador 1"
                  />
                  <ErrorMessage name="score1" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label className="label font-semibold text-lg">
                    {player2?.name || 'Jogador 2'}
                    {player2?.nickname && <span className="text-xs text-gray-500"> ({player2.nickname})</span>}
                  </label>
                </div>
                <div className="form-group">
                  <label htmlFor="score2" className="sr-only">Placar Jogador 2</label>
                  <Field
                    type="number"
                    id="score2"
                    name="score2"
                    min="0"
                    className="input text-center text-lg"
                    aria-label="Placar do jogador 2"
                  />
                  <ErrorMessage name="score2" component="div" className="error-message" />
                </div>
              </div>

              {/* Winner selection for ties or manual override */}
              {(Number(values.score1) === Number(values.score2) && (player1 && player2)) && (
                <div className="form-group pt-4">
                  <label htmlFor="winnerId" className="label">Vencedor (em caso de empate nos pontos ou WO):</label>
                  <Field as="select" name="winnerId" id="winnerId" className="input mt-1">
                    <option value="">Selecione o vencedor</option>
                    {player1 && <option value={player1.db_id}>{player1.name}</option>}
                    {player2 && <option value={player2.db_id}>{player2.name}</option>}
                  </Field>
                  <ErrorMessage name="winnerId" component="div" className="error-message" />
                </div>
              )}

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
