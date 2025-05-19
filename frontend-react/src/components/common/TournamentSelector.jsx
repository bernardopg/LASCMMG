import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTournament } from '../../context/TournamentContext';

const TournamentSelector = () => {
  const { tournaments, currentTournament, setCurrentTournamentId, loading } = useTournament();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set initial tournament from URL query param if present
    const queryParams = new URLSearchParams(location.search);
    const urlTournamentId = queryParams.get('tournament');

    if (urlTournamentId && tournaments.find(t => t.id === urlTournamentId)) {
      if (!currentTournament || currentTournament.id !== urlTournamentId) {
        setCurrentTournamentId(urlTournamentId);
      }
    } else if (tournaments.length > 0 && !currentTournament) {
      // Default to the first tournament if none selected and no valid URL param
      // Or, if a currentTournament is already set by context, respect that.
      // This logic might need refinement based on desired default behavior.
      // For now, if no currentTournament and tournaments exist, pick the first.
      // setCurrentTournamentId(tournaments[0].id);
      // navigate(`?tournament=${tournaments[0].id}`, { replace: true });
    }
  }, [tournaments, location.search, setCurrentTournamentId, currentTournament, navigate]);


  const handleTournamentChange = (event) => {
    const newTournamentId = event.target.value;
    if (newTournamentId) {
      setCurrentTournamentId(newTournamentId);
      navigate(`?tournament=${newTournamentId}`, { replace: true });
      // Data loading for the new tournament will be handled by pages observing currentTournament
    }
  };

  if (loading && tournaments.length === 0) {
    return (
      <div className="select-wrapper">
        <label htmlFor="tournament-select" className="select-label text-sm text-gray-400">Torneio Atual:</label>
        <select
          id="tournament-select"
          className="form-select input w-full max-w-xs text-sm bg-[var(--input-bg)] border-[var(--input-border-color)] text-gray-400"
          disabled
        >
          <option>Carregando torneios...</option>
        </select>
      </div>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="select-wrapper">
        <label htmlFor="tournament-select" className="select-label text-sm text-gray-400">Torneio Atual:</label>
        <select
          id="tournament-select"
          className="form-select input w-full max-w-xs text-sm bg-[var(--input-bg)] border-[var(--input-border-color)] text-gray-400"
          disabled
        >
          <option>Nenhum torneio disponível</option>
        </select>
      </div>
    );
  }

  // Sort tournaments, newest first (assuming date is in a parsable format or sort by ID if date is not reliable)
  const sortedTournaments = [...tournaments].sort((a, b) => {
    // Assuming IDs are sortable in a meaningful way (e.g., sequential or timestamp-based)
    // Or use a date field if available and reliable
    if (a.date && b.date) {
      return new Date(b.date) - new Date(a.date);
    }
    return (b.id || 0) - (a.id || 0); // Fallback to ID or some other field
  });


  return (
    <div className="select-wrapper relative">
      <label htmlFor="tournament-select" className="select-label sr-only">
        Torneio Atual:
      </label>
      <select
        id="tournament-select"
        value={currentTournament?.id || ''}
        onChange={handleTournamentChange}
        className="form-select input w-full max-w-xs text-sm pr-8" // pr-8 for arrow space
        aria-label="Selecione um torneio"
      >
        {!currentTournament && <option value="" disabled>Selecione um torneio</option>}
        {sortedTournaments.map((tournament) => {
          let displayDateStr = '';
          if (tournament.date) {
            try {
              const dateObj = new Date(tournament.date);
              if (!isNaN(dateObj.getTime())) {
                displayDateStr = ` (${dateObj.toLocaleDateString('pt-BR')})`;
              }
            } catch { /* ignore invalid date */ }
          }
          return (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name || 'Torneio Sem Nome'}
              {displayDateStr}
            </option>
          );
        })}
      </select>
      {/* Custom arrow is handled by global CSS for select.input */}
    </div>
  );
};

export default TournamentSelector;
