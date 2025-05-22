import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import api, { getTournamentState } from '../../services/api'; // Import getTournamentState
import { useMessage } from '../../context/MessageContext'; // For error/success messages

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { showError, showSuccess } = useMessage(); // Initialize useMessage

  // Busca partidas do torneio selecionado
  const fetchMatches = useCallback(async () => { // Wrapped in useCallback
    if (!tournamentId) {
      setMatches([]); // Clear matches if no tournamentId
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
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
    } catch (err) {
      showError(`Erro ao carregar partidas: ${err.response?.data?.message || err.message}`);
      setMatches([]); // Clear matches on error
    } finally {
      setLoading(false);
    }
  }, [tournamentId, showError]); // Added dependencies

  // Handler para atualizar agendamento de uma partida
  const handleScheduleChange = (matchId, newSchedule) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.matchId === matchId ? { ...m, schedule: newSchedule } : m
      )
    );
  };

  // Salva agendamento no backend
  const saveSchedule = async (matchId, schedule) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch( // Assuming api default export is the axios instance
        `/api/tournaments/${tournamentId}/matches/${matchId}/schedule`,
        { schedule }
      );
      showSuccess('Agendamento salvo com sucesso!');
    } catch (err) {
      showError(`Erro ao salvar agendamento: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Busca partidas ao selecionar torneio
  useEffect(() => {
    if (tournamentId) { // Only fetch if tournamentId is present
        fetchMatches();
    } else {
        setMatches([]); // Clear matches if no tournamentId
    }
  }, [tournamentId, fetchMatches]); // Added fetchMatches to dependency array

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-4 text-primary">
        Agendamento de Partidas (Admin)
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <label className="block mb-4">
          <span className="text-gray-700 dark:text-gray-200">
            ID do Torneio:
          </span>
          <input
            type="text"
            className="input mt-1 block w-full"
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
            placeholder="Digite o ID do torneio"
          />
        </label>
        <button
          className="btn btn-primary mb-6"
          onClick={fetchMatches}
          disabled={loading || !tournamentId}
        >
          Carregar Partidas
        </button>
        {loading && <p className="text-gray-500">Carregando partidas...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
        {matches.length > 0 && (
          <table className="min-w-full mt-4">
            <thead>
              <tr>
                <th className="px-2 py-1">Partida</th>
                <th className="px-2 py-1">Jogadores</th>
                <th className="px-2 py-1">Rodada</th>
                <th className="px-2 py-1">Agendamento</th>
                <th className="px-2 py-1">Ação</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.matchId}>
                  <td className="border px-2 py-1">{match.matchId}</td>
                  <td className="border px-2 py-1">
                    {(match.players || [])
                      .map((p) => p?.name || 'A definir')
                      .join(' vs ')}
                  </td>
                  <td className="border px-2 py-1">
                    {match.roundName || match.round}
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="datetime-local"
                      className="input"
                      value={match.schedule || ''}
                      onChange={(e) =>
                        handleScheduleChange(match.matchId, e.target.value)
                      }
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      className="btn btn-success"
                      disabled={saving}
                      onClick={() =>
                        saveSchedule(match.matchId, match.schedule)
                      }
                    >
                      Salvar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {matches.length === 0 && !loading && (
          <p className="text-gray-500">
            Nenhuma partida encontrada para o torneio.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminMatchSchedulePage;
