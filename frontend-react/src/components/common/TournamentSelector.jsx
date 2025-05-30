import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTournament } from '../../context/TournamentContext';

const TournamentSelector = () => {
  const { tournaments, currentTournament, selectTournament, loading } = useTournament();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set initial tournament from URL query param if present
    const queryParams = new URLSearchParams(location.search);
    const urlTournamentId = queryParams.get('tournament');

    // Defensive: always treat tournaments as array
    const safeTournaments = Array.isArray(tournaments) ? tournaments : [];

    if (urlTournamentId && safeTournaments.find((t) => t.id.toString() === urlTournamentId)) {
      if (!currentTournament || currentTournament.id.toString() !== urlTournamentId) {
        selectTournament(urlTournamentId);
      }
    }
    // A lógica de seleção de torneio padrão/inicial (localStorage ou primeiro da lista)
    // já é tratada dentro do TournamentContext.jsx ao chamar loadTournaments.
    // Não é necessário duplicar ou conflitar com essa lógica aqui.
    // Este useEffect agora apenas sincroniza com o parâmetro da URL, se presente e válido.
  }, [
    tournaments,
    location.search,
    selectTournament, // Alterado de setCurrentTournamentId
    currentTournament,
    // navigate, // navigate não precisa estar aqui se não for usado no efeito
  ]);

  const handleTournamentChange = (event) => {
    const newTournamentId = event.target.value;
    if (newTournamentId) {
      selectTournament(newTournamentId); // Alterado de setCurrentTournamentId
      navigate(`?tournament=${newTournamentId}`, { replace: true });
      // Data loading for the new tournament will be handled by pages observing currentTournament
    }
  };

  const safeTournaments = Array.isArray(tournaments) ? tournaments : [];

  if (loading && safeTournaments.length === 0) {
    return (
      <div className="select-wrapper">
        <label htmlFor="tournament-select" className="select-label text-sm text-gray-400">
          Torneio Atual:
        </label>
        <select
          id="tournament-select"
          className="form-select w-full max-w-xs text-sm bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          disabled
        >
          <option>Carregando torneios...</option>
        </select>
      </div>
    );
  }

  if (!safeTournaments || safeTournaments.length === 0) {
    return (
      <div className="select-wrapper">
        <label htmlFor="tournament-select" className="select-label text-sm text-gray-400">
          Torneio Atual:
        </label>
        <select
          id="tournament-select"
          className="form-select w-full max-w-xs text-sm bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          disabled
        >
          <option>Nenhum torneio disponível</option>
        </select>
      </div>
    );
  }

  // Sort tournaments, newest first (assuming date is in a parsable format or sort by ID if date is not reliable)
  const sortedTournaments = [...safeTournaments].sort((a, b) => {
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
        className="form-select block w-full max-w-xs text-sm rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 pr-8" // Tailwind form classes
        aria-label="Selecione um torneio"
      >
        {!currentTournament && (
          <option value="" disabled>
            Selecione um torneio
          </option>
        )}
        {sortedTournaments.map((tournament) => {
          let displayDateStr = '';
          if (tournament.date) {
            try {
              const dateObj = new Date(tournament.date);
              if (!isNaN(dateObj.getTime())) {
                displayDateStr = ` (${dateObj.toLocaleDateString('pt-BR')})`;
              }
            } catch {
              /* ignore invalid date */
            }
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
