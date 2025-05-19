import React, { useState, useEffect, useCallback } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getPlayers, saveScore } from '../services/api'; // Import actual API functions
import { useMessage } from '../context/MessageContext';
import { useTournament } from '../context/TournamentContext';
import { useNavigate } from 'react-router-dom';

const AddScorePage = () => {
  const [players, setPlayers] = useState([]);
  const { showError, showSuccess, showInfo } = useMessage(); // Corrigido para usar funções específicas
  const { currentTournament, refreshCurrentTournament } =
    useTournament();
  const navigate = useNavigate();

  // TODO: Esta página precisa receber matchId e, idealmente, os nomes dos jogadores da partida
  // via props ou useParams (ex: /tournaments/:tournamentId/match/:matchId/add-score)
  // Sem isso, não é possível associar o placar à partida correta no chaveamento.

  const fetchPlayersData = useCallback(async () => {
    if (!currentTournament?.id) {
      setPlayers([]);
      return;
    }
    try {
      const fetchedPlayers = await getPlayers(currentTournament.id); // Assumindo que isso busca jogadores do torneio
      setPlayers(fetchedPlayers || []);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      showError( // Corrigido
        `Erro ao carregar jogadores: ${error.message || 'Erro desconhecido'}`
      );
      setPlayers([]);
    }
  }, [currentTournament?.id, showError]); // Corrigido

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
      .integer('Placar deve ser um número inteiro'),
    player2_name: Yup.string()
      .required('Jogador 2 é obrigatório')
      .notOneOf([Yup.ref('player1_name')], 'Jogadores não podem ser iguais'),
    score2: Yup.number()
      .required('Placar do Jogador 2 é obrigatório')
      .min(0, 'Placar não pode ser negativo')
      .integer('Placar deve ser um número inteiro'),
      // Removidos testes customizados 'scores-cannot-be-equal-if-max' e 'one-player-must-win'
      // A lógica de validação de vitória/formato da partida pode ser mais complexa
      // e talvez melhor tratada no backend ou com base no tipo de torneio/partida.
    round: Yup.string().required('Rodada é obrigatória'),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    if (!currentTournament?.id) {
      showError('Nenhum torneio selecionado.'); // Corrigido
      setSubmitting(false);
      return;
    }

    // TODO CRÍTICO: Obter matchId e stateMatchKey dinamicamente.
    // Esta é uma implementação de placeholder e NÃO FUNCIONARÁ corretamente.
    // A página deve ser acessada com um ID de partida, por exemplo.
    const matchIdPlaceholder = 'placeholder_match_id'; // Exemplo: viria de useParams()
    const stateMatchKeyPlaceholder = 'R1M1'; // Exemplo: viria dos dados da partida

    if (!matchIdPlaceholder || !stateMatchKeyPlaceholder) {
      showError('Informações da partida ausentes. Não é possível salvar o placar.'); // Corrigido
      setSubmitting(false);
      return;
    }

    // TODO: Mapear player_name para player_id.
    // O backend espera player1Id e player2Id.
    // Esta lógica precisa buscar os IDs correspondentes aos nomes selecionados.
    const player1 = players.find(p => p.name === values.player1_name);
    const player2 = players.find(p => p.name === values.player2_name);

    if (!player1 || !player2) {
      showError("Jogador selecionado inválido."); // Corrigido
      setSubmitting(false);
      return;
    }

    // TODO: Determinar winnerId com base nos placares ou adicionar um seletor.
    let winnerId = null;
    if (Number(values.score1) > Number(values.score2)) {
      winnerId = player1.id;
    } else if (Number(values.score2) > Number(values.score1)) {
      winnerId = player2.id;
    } else {
      // Empates podem não ser permitidos dependendo das regras do torneio.
      // O backend pode ter validação para isso.
      showError("Empates podem não ser permitidos ou o vencedor precisa ser explicitamente definido."); // Corrigido
      setSubmitting(false);
      return;
    }


    const payload = {
      tournamentId: currentTournament.id,
      matchId: matchIdPlaceholder, // Usar o ID da partida real
      player1Id: player1.id, // Usar ID do jogador
      player2Id: player2.id, // Usar ID do jogador
      player1Score: Number(values.score1),
      player2Score: Number(values.score2),
      winnerId: winnerId, // Enviar winnerId
      stateMatchKey: stateMatchKeyPlaceholder, // Usar a chave real
      round: values.round, // O backend pode usar isso para validação ou informação adicional
    };

    try {
      await saveScore(payload);
      showSuccess('Placar adicionado com sucesso!'); // Corrigido
      resetForm();
      if (refreshCurrentTournament) {
        refreshCurrentTournament();
      }
      // navigate(`/scores?tournament=${currentTournament.id}`);
    } catch (error) {
      console.error('Erro ao adicionar placar:', error);
      showError( // Corrigido
        `Erro ao adicionar placar: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
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
                    // max="2" // Removido max para maior flexibilidade
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
                    // max="2" // Removido max para maior flexibilidade
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
