import { useCallback, useEffect, useMemo, useState } from 'react';
import { BracketSection } from '../components/features/bracket';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useMessage } from '../context/MessageContext';
import { useTournament } from '../context/TournamentContext';
import { getTournamentDetails } from '../services/api';

const BracketPage = () => {
  const { currentTournament } = useTournament();
  const { showError } = useMessage();
  const [tournamentState, setTournamentState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const handleMatchClick = useCallback((matchId) => {
    setSelectedMatchId((prev) => (prev === matchId ? null : matchId));
  }, []);

  const fetchBracketData = useCallback(async () => {
    if (!currentTournament?.id || currentTournament.id === 'undefined') {
      setTournamentState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getTournamentDetails(currentTournament.id);
      setTournamentState(data);
    } catch (error) {
      console.error('Erro ao carregar dados do chaveamento:', error);
      showError(
        `Erro ao carregar chaveamento: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`
      );
      setTournamentState(null);
    } finally {
      setLoading(false);
    }
  }, [currentTournament?.id, showError]);

  useEffect(() => {
    fetchBracketData();
  }, [fetchBracketData]);

  const matchesByBracket = useMemo(() => {
    if (!tournamentState?.tournament?.matches) return { WB: [], LB: [], GF: [] };

    const grouped = { WB: [], LB: [], GF: [] };
    Object.entries(tournamentState.tournament.matches).forEach(([id, match]) => {
      const bracketKey = match.bracket?.toUpperCase() || 'WB';
      if (grouped[bracketKey]) {
        grouped[bracketKey].push({ id: parseInt(id, 10), ...match });
      } else {
        grouped.WB.push({ id, ...match });
      }
    });
    return grouped;
  }, [tournamentState?.tournament?.matches]);

  const bracketType = tournamentState?.tournament?.bracket_type || 'single-elimination';

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-white mb-6">
        Chaveamento do Torneio {currentTournament ? `(${currentTournament.name})` : ''}
      </h2>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-10 min-h-[300px]">
            <LoadingSpinner size="lg" />
            <span className="mt-4 text-slate-400">Carregando chaveamento...</span>
          </div>
        ) : !tournamentState?.tournament?.matches ||
          Object.keys(tournamentState.tournament.matches).length === 0 ? (
          <div className="flex flex-col justify-center items-center py-10 text-center">
            <p className="text-slate-400 text-lg">
              Nenhum chaveamento disponível para este torneio ou o torneio ainda não foi iniciado.
            </p>
            {!currentTournament && (
              <p className="text-slate-500 text-sm mt-2">
                Selecione um torneio para visualizar seu chaveamento.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {matchesByBracket.WB.length > 0 && (
              <BracketSection
                title="Chave Superior (Winners)"
                matches={matchesByBracket.WB}
                roundPrefix={bracketType === 'double-elimination' ? 'WB ' : ''}
                selectedMatchId={selectedMatchId}
                onMatchClick={handleMatchClick}
              />
            )}

            {bracketType === 'double-elimination' && matchesByBracket.LB.length > 0 && (
              <BracketSection
                title="Chave Inferior (Losers)"
                matches={matchesByBracket.LB}
                roundPrefix="LB "
                selectedMatchId={selectedMatchId}
                onMatchClick={handleMatchClick}
              />
            )}

            {matchesByBracket.GF.length > 0 && (
              <BracketSection
                title="Grande Final"
                matches={matchesByBracket.GF}
                roundPrefix=""
                selectedMatchId={selectedMatchId}
                onMatchClick={handleMatchClick}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BracketPage;
