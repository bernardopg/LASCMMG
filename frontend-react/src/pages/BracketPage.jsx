import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTournament } from '../context/TournamentContext';
import { getTournamentDetails } from '../services/api'; // Assuming this fetches matches and bracket_type
import { useMessage } from '../context/MessageContext';
import BracketSection from '../components/bracket/BracketSection'; // Import the new component


const BracketPage = () => {
  const { currentTournament } = useTournament();
  const { showMessage } = useMessage();
  const [tournamentState, setTournamentState] = useState(null); // Will hold matches, bracket_type etc.
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const handleMatchClick = useCallback((matchId) => {
    setSelectedMatchId(prev => (prev === matchId ? null : matchId)); // Toggle selection
  }, []);

  const fetchBracketData = useCallback(async () => {
    if (!currentTournament?.id) {
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
      showMessage(`Erro ao carregar chaveamento: ${error.message || 'Erro desconhecido'}`, 'error');
      setTournamentState(null);
    } finally {
      setLoading(false);
    }
  }, [currentTournament?.id, showMessage]);

  useEffect(() => {
    fetchBracketData();
  }, [fetchBracketData]);

  const matchesByBracket = useMemo(() => {
    if (!tournamentState?.matches) return { WB: [], LB: [], GF: [] };

    const grouped = { WB: [], LB: [], GF: [] };
    Object.entries(tournamentState.matches).forEach(([id, match]) => {
      const bracketKey = match.bracket?.toUpperCase() || 'WB'; // Default to Winners Bracket
      if (grouped[bracketKey]) {
        grouped[bracketKey].push({ id, ...match });
      } else {
        grouped.WB.push({ id, ...match }); // Fallback if bracketKey is unknown
      }
    });
    return grouped;
  }, [tournamentState?.matches]);

  const bracketType = tournamentState?.bracket_type || 'single-elimination';

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <h2 id="bracket-heading" className="text-2xl font-semibold mb-6">
        Chaveamento do Torneio {currentTournament ? `(${currentTournament.name})` : ''}
      </h2>
      <div id="bracket" className="bracket-container bg-[var(--panel-bg)] shadow-xl rounded-lg p-6 md:p-8 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-4 mt-4 text-gray-300">Carregando chaveamento...</span>
          </div>
        ) : !tournamentState?.matches || Object.keys(tournamentState.matches).length === 0 ? (
          <p className="text-center text-gray-400 py-10">
            Nenhum chaveamento disponível para este torneio.
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
