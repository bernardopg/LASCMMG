import React from 'react';
import PlayerDisplay from './PlayerDisplay';

// Helper to format date/time, similar to old ui.formatMatchDateTime
const formatMatchDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'A definir';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Data inválida';
  }
};

const MatchCard = ({ match, isSelected, onMatchClick }) => {
  if (!match) return null;

  const p1 = match.players?.[0];
  const p2 = match.players?.[1];

  const p1Name = p1?.name || (p1?.is_bye ? 'BYE' : 'A definir');
  const p2Name = p2?.name || (p2?.is_bye ? 'BYE' : 'A definir');

  const p1IsBye = p1Name === 'BYE' || p1?.is_bye;
  const p2IsBye = p2Name === 'BYE' || p2?.is_bye;

  // Winner determination:
  // The old code used match.winner which was an index (0 or 1).
  // Assuming API provides match.winner_name or match.winner_id.
  // If match.winner is an index:
  const winnerPlayer =
    match.winner !== null && match.winner !== undefined && match.players
      ? match.players[match.winner]
      : null;
  const winnerName = winnerPlayer?.name || match.winner_name;

  const p1IsWinner = !p1IsBye && winnerName === p1Name;
  const p2IsWinner = !p2IsBye && winnerName === p2Name;

  const isFinalRound =
    match.roundName === 'Final' ||
    match.roundName === 'Grande Final' ||
    match.roundName === 'Grande Final Reset';
  const p1IsChampion = p1IsWinner && isFinalRound;
  const p2IsChampion = p2IsWinner && isFinalRound;

  // Base styles from .bracket-match-card
  let cardClasses = `
    relative group border rounded-md shadow-sm mb-3 min-w-[220px] md:min-w-[250px]
    transition-all duration-200 ease-in-out overflow-hidden
    ${
      isSelected
        ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] bg-gray-600 scale-105'
        : 'border-[var(--card-border-color)] bg-gray-750 hover:bg-gray-700 hover:border-gray-500'
    }
    ${p1IsBye || p2IsBye ? 'opacity-60 bg-gray-800' : ''}
  `;

  if (isFinalRound && (p1IsWinner || p2IsWinner)) {
    cardClasses += ' border-[var(--color-primary)] shadow-lg'; // .bracket-final .bracket-match-card
  }

  const matchStatus =
    match.status ||
    (winnerName ? 'Concluída' : match.dateTime ? 'Agendada' : 'Pendente');
  let statusBadgeClasses = 'text-xs font-medium px-2 py-0.5 rounded-full';
  if (matchStatus === 'Concluída')
    statusBadgeClasses += ' bg-green-700 text-green-100';
  else if (matchStatus === 'Em Andamento')
    statusBadgeClasses += ' bg-yellow-600 text-yellow-100 animate-pulse';
  else if (matchStatus === 'Agendada')
    statusBadgeClasses += ' bg-blue-700 text-blue-100';
  else statusBadgeClasses += ' bg-gray-600 text-gray-300';

  return (
    // .bracket-match
    <div
      key={match.id}
      className={cardClasses} // Applied .bracket-match-card styles
      tabIndex={0}
      role="button"
      aria-label={`Partida ${match.id}: ${p1Name} vs ${p2Name}. Status: ${matchStatus}`}
      onClick={() =>
        !(p1IsBye || p2IsBye) && onMatchClick && onMatchClick(match.id)
      } // Disable click for BYE matches
      onKeyDown={(e) => {
        if (
          (e.key === 'Enter' || e.key === ' ') &&
          !(p1IsBye || p2IsBye) &&
          onMatchClick
        ) {
          e.preventDefault();
          onMatchClick(match.id);
        }
      }}
    >
      {/* .bracket-match-header */}
      <div className="px-3 py-1.5 bg-gray-800 border-b border-gray-600 text-xs text-gray-400 flex justify-between items-center">
        <span className="font-semibold">Partida #{match.id}</span>
        <span className={statusBadgeClasses}>{matchStatus}</span>
      </div>

      {/* .bracket-match-teams */}
      <div className="py-1">
        <PlayerDisplay
          player={p1}
          score={p1?.score}
          isWinner={p1IsWinner}
          isChampion={p1IsChampion}
          isBye={p1IsBye}
          seed={p1?.seed}
        />

        {!(p1IsBye || p2IsBye) && (
          <div className="text-center text-xs text-gray-500 my-0.5">vs</div>
        )}

        <PlayerDisplay
          player={p2}
          score={p2?.score}
          isWinner={p2IsWinner}
          isChampion={p2IsChampion}
          isBye={p2IsBye}
          seed={p2?.seed}
        />
      </div>

      {/* .bracket-match-footer */}
      {(match.dateTime || winnerName) && !p1IsBye && !p2IsBye && (
        <div className="px-3 py-1 bg-gray-800 border-t border-gray-600 text-xs text-gray-400 text-center">
          {match.dateTime ? (
            formatMatchDateTime(match.dateTime)
          ) : (
            <span>&nbsp;</span>
          )}
          {/* Winner display is handled by PlayerDisplay's styling */}
        </div>
      )}
      {(p1IsBye || p2IsBye) && (
        <div className="px-3 py-1 bg-gray-800 border-t border-gray-600 text-xs text-gray-500 text-center italic">
          {p1IsBye ? `${p2Name} avança (BYE)` : `${p1Name} avança (BYE)`}
        </div>
      )}

      {/* Winner display can be part of PlayerDisplay's styling, or explicit here if needed */}
      {/* {winnerName && !p1IsBye && !p2IsBye && (
        <div className="text-center text-xs text-green-400 mt-1 font-semibold">
          Vencedor: {winnerName}
        </div>
      )} */}

      {/* Connector Line: Horizontal part from match card */}
      {match.next_match_id && !p1IsBye && !p2IsBye && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-[var(--card-border-color,theme(colors.gray.500))] flex items-center"
          // Extends further into the spacer area.
          // The spacer in BracketSection is w-10 (40px) or md:w-16 (64px).
          style={{ left: '100%', width: 'calc(50% + 10px)' }} // Try to extend roughly half into spacer + a bit
          aria-hidden="true"
        >
          {/* Small circle at the end of the line */}
          <div
            className="w-2 h-2 rounded-full bg-[var(--card-border-color,theme(colors.gray.500))]"
            style={{ position: 'absolute', right: '-4px' }} // Position circle at the end
          ></div>
          {/* Note: Full connector lines (vertical segments and turns) require more complex
              positioning logic, potentially using JS to measure elements or an SVG approach,
              and are not implemented in this simplified version. */}
        </div>
      )}
    </div>
  );
};

export default MatchCard;
