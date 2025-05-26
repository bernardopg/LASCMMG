import { useCallback, useEffect, useMemo, useState } from 'react';
import BracketSection from '../components/bracket/BracketSection'; // Import the new component
import { useMessage } from '../context/MessageContext';
import { useTournament } from '../context/TournamentContext';
import { getTournamentDetails } from '../services/api'; // Assuming this fetches matches and bracket_type

const BracketPage = () => {
  const { currentTournament } = useTournament();
  const { showError } = useMessage(); // Corrigido para showError
  const [tournamentState, setTournamentState] = useState(null); // Will hold matches, bracket_type etc.
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const handleMatchClick = useCallback((matchId) => {
    setSelectedMatchId((prev) => (prev === matchId ? null : matchId)); // Toggle selection
  }, []);

  const fetchBracketData = useCallback(async () => {
    // Verificação mais rigorosa para evitar requisições com ID undefined
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
    // Access matches from tournamentState.tournament.matches
    if (!tournamentState?.tournament?.matches) return { WB: [], LB: [], GF: [] };

    const grouped = { WB: [], LB: [], GF: [] };
    Object.entries(tournamentState.tournament.matches).forEach(([id, match]) => {
      const bracketKey = match.bracket?.toUpperCase() || 'WB'; // Default to Winners Bracket
      if (grouped[bracketKey]) {
        grouped[bracketKey].push({ id: parseInt(id, 10), ...match }); // Ensure id is number if it comes as string key
      } else {
        grouped.WB.push({ id, ...match }); // Fallback if bracketKey is unknown
      }
    });
    return grouped;
  }, [tournamentState?.tournament?.matches]);

  // Access bracket_type from tournamentState.tournament.bracket_type
  const bracketType = tournamentState?.tournament?.bracket_type || 'single-elimination';

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <h2 id="bracket-heading" className="text-2xl font-semibold mb-6">
        Chaveamento do Torneio {currentTournament ? `(${currentTournament.name})` : ''}
      </h2>
      <div
        id="bracket"
        className="bracket-container bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 md:p-8 min-h-[400px]" // Tailwind classes para tema
      >
        {loading ? (
          <div className="flex flex-col justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary-light"></div>
            <span className="ml-4 mt-4 text-gray-600 dark:text-gray-300">
              {' '}
              {/* Ajuste de cor do texto */}
              Carregando chaveamento...
            </span>
          </div>
        ) : !tournamentState?.tournament?.matches ||
          Object.keys(tournamentState.tournament.matches).length === 0 ? (
          <p className="text-center text-gray-400 py-10">
            Nenhum chaveamento disponível para este torneio ou o torneio ainda não foi iniciado.
          </p>
        ) : (
          <div className="bracket-display-container">
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
