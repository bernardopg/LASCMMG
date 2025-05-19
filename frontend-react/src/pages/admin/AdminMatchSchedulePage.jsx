import React, { useEffect, useState } from 'react';
import api from '../../services/api';

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

  // Busca partidas do torneio selecionado
  const fetchMatches = async () => {
    if (!tournamentId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.get(`/api/tournaments/${tournamentId}/state`);
      const state = res.data;
      // Extrai partidas do state.matches
      const matchesArr = Object.entries(state.matches || {}).map(([matchId, match]) => ({
        matchId,
        ...match,
      }));
      setMatches(matchesArr);
    } catch (err) {
      setError('Erro ao carregar partidas do torneio.');
    } finally {
      setLoading(false);
    }
  };

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
      await api.patch(
        `/api/tournaments/${tournamentId}/matches/${matchId}/schedule`,
        { schedule }
      );
      setSuccess('Agendamento salvo com sucesso!');
    } catch (err) {
      setError('Erro ao salvar agendamento.');
    } finally {
      setSaving(false);
    }
  };

  // Busca partidas ao selecionar torneio
  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line
  }, [tournamentId]);

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-4 text-primary">Agendamento de Partidas (Admin)</h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <label className="block mb-4">
          <span className="text-gray-700 dark:text-gray-200">ID do Torneio:</span>
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
                  <td className="border px-2 py-1">{match.roundName || match.round}</td>
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
                      onClick={() => saveSchedule(match.matchId, match.schedule)}
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
          <p className="text-gray-500">Nenhuma partida encontrada para o torneio.</p>
        )}
      </div>
    </div>
  );
};

export default AdminMatchSchedulePage;
