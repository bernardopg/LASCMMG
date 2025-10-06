import { useCallback, useEffect, useState } from 'react';
import { FaCalendarAlt, FaSave, FaSearch, FaSpinner } from 'react-icons/fa';
import { useMessage } from '../../context/MessageContext';
import api, { getTournamentState } from '../../services/api';
import LoadingSpinner from '../../components/ui/loading/LoadingSpinner'; // Import LoadingSpinner
import PageHeader from '../../components/ui/page/PageHeader'; // For consistent page titles

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

  const cardBaseClasses = 'bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700';
  const inputBaseClasses =
    'block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 text-slate-100';
  const labelClasses = 'block text-sm font-medium text-slate-300 mb-1';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;
  const successButtonClasses = `${buttonBaseClasses} bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500`;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Agendamento de Partidas" icon={FaCalendarAlt} iconColor="text-lime-400" />

      <div className={`${cardBaseClasses} mb-6`}>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="tournament-id" className={labelClasses}>
              ID do Torneio
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                id="tournament-id"
                type="text"
                className={`${inputBaseClasses} pl-10`}
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                placeholder="Digite o ID do torneio"
              />
            </div>
          </div>
          <button
            className={`${primaryButtonClasses} w-full md:w-auto`}
            onClick={fetchMatches}
            disabled={loading || !tournamentId.trim()}
          >
            {loading && !saving ? ( // Show loading only if not also saving
              <>
                <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                Carregando...
              </>
            ) : (
              <>
                <FaSearch className="mr-2 h-4 w-4" />
                Buscar Partidas
              </>
            )}
          </button>
        </div>
      </div>

      {loading &&
        !saving && ( // Show main loading only if not saving individual items
          <div className={`${cardBaseClasses} p-8 text-center`}>
            <LoadingSpinner size="lg" message="Carregando partidas do torneio..." />
          </div>
        )}

      {!loading && matches.length > 0 && (
        <div className={`${cardBaseClasses} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Partida ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Jogadores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Rodada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Agendamento (Data e Hora)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {matches.map((match) => (
                  <tr key={match.matchId} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                      {match.matchId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {(match.players || []).map((p) => p?.name || 'A definir').join(' vs ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {match.roundName || match.round || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="datetime-local"
                        className={`${inputBaseClasses} max-w-xs`}
                        value={match.schedule || ''}
                        onChange={(e) => handleScheduleChange(match.matchId, e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className={`${successButtonClasses} text-xs py-1.5 px-3`}
                        disabled={saving || !match.schedule}
                        onClick={() => saveSchedule(match.matchId, match.schedule)}
                      >
                        {saving ? (
                          <>
                            <FaSpinner className="animate-spin mr-1 h-3 w-3" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <FaSave className="mr-1 h-3 w-3" />
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
        <div className={`${cardBaseClasses} p-8 text-center`}>
          <p className="text-slate-400 text-lg">
            Nenhuma partida encontrada para o torneio &ldquo;{tournamentId}&rdquo;.
          </p>
          <p className="text-slate-500 mt-2">
            Verifique se o ID do torneio está correto e se as partidas foram geradas.
          </p>
        </div>
      )}

      {!loading && !tournamentId.trim() && (
        <div className={`${cardBaseClasses} p-8 text-center`}>
          <FaCalendarAlt className="mx-auto text-6xl text-slate-500 mb-4" />
          <p className="text-slate-400 text-lg">
            Digite o ID de um torneio para visualizar e agendar suas partidas.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminMatchSchedulePage;
