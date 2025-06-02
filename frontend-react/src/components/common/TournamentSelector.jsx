import React, { useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTournament } from '../../context/TournamentContext';
import { formatDateToLocale } from '../../utils/dateUtils'; // Import date utility

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
      <div className="select-wrapper relative">
        <label
          htmlFor="tournament-select-loading"
          className="select-label sr-only text-sm text-neutral-400"
        >
          Torneio Atual:
        </label>
        <select
          id="tournament-select-loading"
          className="appearance-none w-full max-w-xs text-sm pl-3 pr-10 py-2.5 rounded-xl bg-neutral-700/50 border-2 border-neutral-600/60 text-neutral-400 cursor-not-allowed shadow-inner"
          disabled
        >
          <option>Carregando...</option>
        </select>
        <FaChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
      </div>
    );
  }

  if (!safeTournaments || safeTournaments.length === 0) {
    return (
      <div className="select-wrapper relative">
        <label
          htmlFor="tournament-select-empty"
          className="select-label sr-only text-sm text-neutral-400"
        >
          Torneio Atual:
        </label>
        <select
          id="tournament-select-empty"
          className="appearance-none w-full max-w-xs text-sm pl-3 pr-10 py-2.5 rounded-xl bg-neutral-700/50 border-2 border-neutral-600/60 text-neutral-400 cursor-not-allowed shadow-inner"
          disabled
        >
          <option>Sem torneios</option>
        </select>
        <FaChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
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
    <div className="select-wrapper relative group">
      <label htmlFor="tournament-select" className="select-label sr-only">
        Torneio Atual:
      </label>
      <select
        id="tournament-select"
        value={currentTournament?.id || ''}
        onChange={handleTournamentChange}
        className="appearance-none block w-full max-w-xs text-sm pl-3 pr-10 py-2.5 rounded-xl bg-green-800/50 backdrop-blur-md border-2 border-green-600/60
                   text-neutral-100 shadow-inner transition-all duration-300
                   focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500/80
                   hover:border-lime-500/70 cursor-pointer"
        aria-label="Selecione um torneio"
      >
        {!currentTournament && (
          <option value="" disabled className="bg-green-900 text-neutral-400">
            Selecione um torneio
          </option>
        )}
        {sortedTournaments.map((tournament) => {
          const displayDateStr = tournament.date ? ` (${formatDateToLocale(tournament.date)})` : '';
          return (
            <option
              key={tournament.id}
              value={tournament.id}
              className="bg-green-900 text-neutral-100 hover:bg-green-700"
            >
              {tournament.name || 'Torneio Sem Nome'}
              {displayDateStr}
            </option>
          );
        })}
      </select>
      <FaChevronDown className="w-4 h-4 text-lime-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none group-hover:text-amber-400 transition-colors duration-200" />
    </div>
  );
};

export default TournamentSelector;
