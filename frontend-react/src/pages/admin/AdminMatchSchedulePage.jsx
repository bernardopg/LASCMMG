import { useCallback, useEffect, useState } from 'react';
import { FaCalendarAlt, FaSave, FaSearch, FaSpinner } from 'react-icons/fa';
import { useMessage } from '../../context/MessageContext';
import api, { getTournamentState } from '../../services/api';

/**
 * Página de Gerenciamento de Agendamento de Partidas (Admin)
 * Permite visualizar, editar e salvar datas/horários das partidas de um torneio.
 * Integração: PATCH /api/tournaments/:tournamentId/matches/:matchId/schedule
 */
const AdminMatchSchedulePage = () => {
  const [tournamentId, setTournamentId] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showError, showSuccess } = useMessage();

  // Busca partidas do torneio selecionado
  const fetchMatches = useCallback(async () => {
    if (!tournamentId.trim()) {
      setMatches([]);
      return;
    }
    setLoading(true);
    try {
      const state = await getTournamentState(tournamentId);
      const matchesArr = Object.entries(state?.matches || {}).map(
        ([matchIdFromKey, matchData]) => ({
          ...matchData,
          matchId: matchData.id || matchIdFromKey,
          schedule: matchData.dateTime || '',
        })
      );
      setMatches(matchesArr);
      if (matchesArr.length === 0) {
        showError('Nenhuma partida encontrada para este torneio.');
      }
    } catch (err) {
      showError(`Erro ao carregar partidas: ${err.response?.data?.message || err.message}`);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, showError]);

  // Handler para atualizar agendamento de uma partida
  const handleScheduleChange = (matchId, newSchedule) => {
    setMatches((prev) =>
      prev.map((m) => (m.matchId === matchId ? { ...m, schedule: newSchedule } : m))
    );
  };

  // Salva agendamento no backend
  const saveSchedule = async (matchId, schedule) => {
    if (!schedule) {
      showError('Por favor, selecione uma data e horário.');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/api/tournaments/${tournamentId}/matches/${matchId}/schedule`, { schedule });
      showSuccess('Agendamento salvo com sucesso!');
    } catch (err) {
      showError(`Erro ao salvar agendamento: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Busca partidas ao selecionar torneio
  useEffect(() => {
    if (tournamentId.trim()) {
      fetchMatches();
    } else {
      setMatches([]);
    }
  }, [tournamentId, fetchMatches]);

  return (
    <div className="px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
        <FaCalendarAlt className="mr-3 text-primary dark:text-primary-light" />
        Agendamento de Partidas
      </h1>

      <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="tournament-id" className="label">
              ID do Torneio
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="tournament-id"
                type="text"
                className="input pl-10 w-full"
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                placeholder="Digite o ID do torneio para buscar partidas"
              />
            </div>
          </div>
          <button
            className="btn btn-primary flex items-center"
            onClick={fetchMatches}
            disabled={loading || !tournamentId.trim()}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Carregando...
              </>
            ) : (
              <>
                <FaSearch className="mr-2" />
                Buscar Partidas
              </>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card bg-white dark:bg-slate-800 p-8 text-center">
          <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Carregando partidas do torneio...</p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <div className="card bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Partida
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Jogadores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rodada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agendamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {matches.map((match) => (
                  <tr key={match.matchId} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {match.matchId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {(match.players || []).map((p) => p?.name || 'A definir').join(' vs ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {match.roundName || match.round || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="datetime-local"
                        className="input w-full max-w-xs"
                        value={match.schedule || ''}
                        onChange={(e) => handleScheduleChange(match.matchId, e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="btn btn-success btn-sm flex items-center"
                        disabled={saving || !match.schedule}
                        onClick={() => saveSchedule(match.matchId, match.schedule)}
                      >
                        {saving ? (
                          <>
                            <FaSpinner className="animate-spin mr-1" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <FaSave className="mr-1" />
                            Salvar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && matches.length === 0 && tournamentId.trim() && (
        <div className="card bg-white dark:bg-slate-800 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Nenhuma partida encontrada para o torneio &ldquo;{tournamentId}&rdquo;.
          </p>
          <p className="text-gray-600 dark:text-gray-500 mt-2">
            Verifique se o ID do torneio está correto e se as partidas foram geradas.
          </p>
        </div>
      )}

      {!loading && !tournamentId.trim() && (
        <div className="card bg-white dark:bg-slate-800 p-8 text-center">
          <FaCalendarAlt className="mx-auto text-6xl text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Digite o ID de um torneio para visualizar e agendar suas partidas.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminMatchSchedulePage;
