import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import LoadingSpinner from '../components/ui/loading/LoadingSpinner';
import { useMessage } from '../context/MessageContext';
import {
  createScoreAdmin,
  getPlayers,
  getTournamentState,
  updateMatchScoreAdmin,
} from '../services/api';

const AddScorePage = () => {
  const { showError, showSuccess } = useMessage();
  const navigate = useNavigate();
  const { matchId, tournamentId } = useParams();

  const [players, setPlayers] = useState([]);
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const isEditing = !!matchId;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (isEditing && tournamentId && matchId) {
          const tournamentState = await getTournamentState(tournamentId);
          const matchData = tournamentState.matches?.[matchId];
          setMatchDetails(matchData || {});

          if (matchData && matchData.players) {
            setPlayers(matchData.players || []);
          } else {
            const playersData = await getPlayers();
            setPlayers(playersData.players || []);
          }
        } else {
          const playersData = await getPlayers();
          setPlayers(playersData.players || []);
        }
      } catch (error) {
        showError(`Erro ao carregar dados: ${error.response?.data?.message || error.message}`);
        setPlayers([]);
        if (isEditing) setMatchDetails(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isEditing, tournamentId, matchId, showError]);

  const validationSchema = Yup.object().shape({
    player1Id: Yup.string().when([], {
      is: () => !isEditing,
      then: (schema) => schema.required('Jogador 1 é obrigatório'),
      otherwise: (schema) => schema.notRequired(),
    }),
    player2Id: Yup.string().when([], {
      is: () => !isEditing,
      then: (schema) => schema.required('Jogador 2 é obrigatório'),
      otherwise: (schema) => schema.notRequired(),
    }),
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
    round: Yup.string().when([], {
      is: () => !isEditing,
      then: (schema) => schema.required('Rodada é obrigatória'),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const calculateWinner = (player1Score, player2Score, p1Id, p2Id) => {
    const score1 = Number(player1Score);
    const score2 = Number(player2Score);

    if (isNaN(score1) || isNaN(score2)) return null;
    if (!p1Id || !p2Id) return null;

    if (score1 === score2) return 'Empate';

    const player1 = isEditing
      ? matchDetails?.player1
      : players.find((p) => p.id.toString() === p1Id);
    const player2 = isEditing
      ? matchDetails?.player2
      : players.find((p) => p.id.toString() === p2Id);

    if (score1 > score2) return player1 ? `Vencedor: ${player1.name}` : 'Jogador 1';
    return player2 ? `Vencedor: ${player2.name}` : 'Jogador 2';
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    const scorePayload = {
      player1_score: Number(values.player1Score),
      player2_score: Number(values.player2Score),
    };

    try {
      if (isEditing && tournamentId && matchId) {
        await updateMatchScoreAdmin(tournamentId, matchId, scorePayload);
        showSuccess('Placar atualizado com sucesso!');
        navigate(`/admin/tournaments/${tournamentId}`);
      } else {
        const player1 = players.find((p) => p.id.toString() === values.player1Id);
        const player2 = players.find((p) => p.id.toString() === values.player2Id);

        if (!player1 || !player2) {
          showError('Jogadores selecionados não encontrados.');
          setSubmitting(false);
          return;
        }

        const newScorePayload = {
          ...scorePayload,
          player1_name: player1.name,
          player2_name: player2.name,
          round: values.round,
        };

        await createScoreAdmin(newScorePayload);
        showSuccess('Placar adicionado com sucesso!');
        navigate('/admin/scores');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      showError(`Erro ao salvar placar: ${errorMessage}`);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isEditing && !matchDetails) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold text-red-400 mb-2">Erro ao Carregar Partida</h1>
        <p className="text-slate-400">Erro ao carregar detalhes da partida. Tente novamente.</p>
      </div>
    );
  }

  const initialFormValues =
    isEditing && matchDetails
      ? {
          player1Id: matchDetails.player1?.id.toString() || '',
          player2Id: matchDetails.player2?.id.toString() || '',
          player1Score: matchDetails.player1_score?.toString() || '',
          player2Score: matchDetails.player2_score?.toString() || '',
          round: matchDetails.round || '',
        }
      : {
          player1Id: '',
          player2Id: '',
          player1Score: '',
          player2Score: '',
          round: '',
        };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        {isEditing ? 'Editar Placar da Partida' : 'Adicionar Novo Placar'}
      </h2>

      <div className="max-w-2xl mx-auto bg-slate-800 rounded-xl p-6 border border-slate-700">
        {isEditing && matchDetails && (
          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <h3 className="text-lg font-semibold text-lime-400 mb-2">Detalhes da Partida</h3>
            <p className="text-sm text-slate-300">
              <strong>Jogadores:</strong> {matchDetails.player1?.name || 'N/A'} vs{' '}
              {matchDetails.player2?.name || 'N/A'}
            </p>
            <p className="text-sm text-slate-300">
              <strong>Rodada:</strong> {matchDetails.round || 'N/A'}
            </p>
            {tournamentId && (
              <p className="text-xs text-slate-400 mt-1">Torneio ID: {tournamentId}</p>
            )}
          </div>
        )}

        <Formik
          initialValues={initialFormValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, dirty, isValid, values, errors, touched }) => {
            const winner = calculateWinner(
              values.player1Score,
              values.player2Score,
              isEditing ? matchDetails?.player1?.id.toString() : values.player1Id,
              isEditing ? matchDetails?.player2?.id.toString() : values.player2Id
            );

            return (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="player1Id" className="block text-sm font-medium text-slate-300">
                      Jogador 1{' '}
                      {isEditing && matchDetails?.player1 ? `(${matchDetails.player1.name})` : ''}
                    </label>
                    <Field
                      as="select"
                      name="player1Id"
                      id="player1Id"
                      className={`block w-full mt-1 px-3 py-2 bg-slate-700 border rounded-md text-sm text-white ${
                        errors.player1Id && touched.player1Id
                          ? 'border-red-500'
                          : 'border-slate-600'
                      }`}
                      disabled={isEditing}
                    >
                      <option value="">Selecione o Jogador 1</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id.toString()}>
                          {player.name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="player1Id"
                      component="div"
                      className="mt-1 text-xs text-red-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="player2Id" className="block text-sm font-medium text-slate-300">
                      Jogador 2{' '}
                      {isEditing && matchDetails?.player2 ? `(${matchDetails.player2.name})` : ''}
                    </label>
                    <Field
                      as="select"
                      name="player2Id"
                      id="player2Id"
                      className={`block w-full mt-1 px-3 py-2 bg-slate-700 border rounded-md text-sm text-white ${
                        errors.player2Id && touched.player2Id
                          ? 'border-red-500'
                          : 'border-slate-600'
                      }`}
                      disabled={isEditing}
                    >
                      <option value="">Selecione o Jogador 2</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id.toString()}>
                          {player.name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="player2Id"
                      component="div"
                      className="mt-1 text-xs text-red-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="player1Score"
                      className="block text-sm font-medium text-slate-300"
                    >
                      Placar Jogador 1
                    </label>
                    <Field
                      type="number"
                      id="player1Score"
                      name="player1Score"
                      min="0"
                      max="21"
                      className={`block w-full mt-1 px-3 py-2 bg-slate-700 border rounded-md text-sm text-white ${
                        errors.player1Score && touched.player1Score
                          ? 'border-red-500'
                          : 'border-slate-600'
                      }`}
                    />
                    <ErrorMessage
                      name="player1Score"
                      component="div"
                      className="mt-1 text-xs text-red-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="player2Score"
                      className="block text-sm font-medium text-slate-300"
                    >
                      Placar Jogador 2
                    </label>
                    <Field
                      type="number"
                      id="player2Score"
                      name="player2Score"
                      min="0"
                      max="21"
                      className={`block w-full mt-1 px-3 py-2 bg-slate-700 border rounded-md text-sm text-white ${
                        errors.player2Score && touched.player2Score
                          ? 'border-red-500'
                          : 'border-slate-600'
                      }`}
                    />
                    <ErrorMessage
                      name="player2Score"
                      component="div"
                      className="mt-1 text-xs text-red-400"
                    />
                  </div>
                </div>

                {!isEditing && (
                  <div>
                    <label htmlFor="round" className="block text-sm font-medium text-slate-300">
                      Rodada
                    </label>
                    <Field
                      as="select"
                      name="round"
                      id="round"
                      className={`block w-full mt-1 px-3 py-2 bg-slate-700 border rounded-md text-sm text-white ${
                        errors.round && touched.round ? 'border-red-500' : 'border-slate-600'
                      }`}
                    >
                      <option value="">Selecione a Rodada</option>
                      <option value="Oitavas de Final">Oitavas de Final</option>
                      <option value="Quartas de Final">Quartas de Final</option>
                      <option value="Semifinal">Semifinal</option>
                      <option value="Final">Final</option>
                      <option value="Amistoso">Amistoso</option>
                      <option value="Outra">Outra</option>
                    </Field>
                    <ErrorMessage
                      name="round"
                      component="div"
                      className="mt-1 text-xs text-red-400"
                    />
                  </div>
                )}

                {winner && (
                  <div className="mt-6 p-3 bg-sky-800/30 rounded-md border border-sky-700/50">
                    <p className="text-sky-300 font-medium text-center">{winner}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        isEditing && tournamentId
                          ? `/admin/tournaments/${tournamentId}`
                          : '/admin/scores'
                      )
                    }
                    className="inline-flex items-center justify-center px-4 py-2 bg-slate-600 text-slate-200 rounded-md hover:bg-slate-500 transition-colors disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    <FaTimes className="mr-2 h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors disabled:opacity-60"
                    disabled={!dirty || !isValid || isSubmitting}
                  >
                    <FaSave className="mr-2 h-4 w-4" />
                    {isSubmitting
                      ? 'Salvando...'
                      : isEditing
                        ? 'Atualizar Placar'
                        : 'Adicionar Placar'}
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
