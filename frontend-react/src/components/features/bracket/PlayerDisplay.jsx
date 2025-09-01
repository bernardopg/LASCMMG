import React from 'react';

const PlayerDisplay = ({ player, score, isWinner, isChampion, isBye, seed }) => {
  const playerName = player?.name || (isBye ? 'BYE' : 'A definir');
  const playerScore = score ?? (isBye ? '' : '-'); // No score for BYE

  let playerContainerClasses = 'flex justify-between items-center py-1 px-2'; // bracket-team equivalent
  let playerNameClasses = 'text-sm truncate flex-grow'; // bracket-team-name
  let playerScoreClasses =
    'text-sm font-semibold ml-2 px-2 py-0.5 rounded-sm min-w-[24px] text-center'; // bracket-team-score

  if (isBye) {
    playerNameClasses += ' text-gray-500 italic';
    playerScoreClasses += ' text-gray-500';
  } else if (isWinner) {
    // .bracket-team-winner .bracket-team-score { background-color: var(--success-color); color: white; }
    // .bracket-team-winner for the player name part
    playerNameClasses += ' text-green-300 font-semibold'; // Winner name highlighted
    playerScoreClasses += ' bg-green-500 text-white';
    if (isChampion) {
      // Could add more specific champion styles, e.g. gold border or background
      playerContainerClasses += ' border-2 border-yellow-400';
      playerNameClasses += ' text-yellow-300';
    }
  } else if (score !== undefined && score !== null) {
    // Player has played but is not the winner
    playerNameClasses += ' text-gray-400'; // Loser or TBD if score is present
    playerScoreClasses += ' text-gray-300 bg-gray-600';
  } else {
    // Player has not played yet or score not set
    playerNameClasses += ' text-gray-300';
    playerScoreClasses += ' text-gray-500';
  }

  // From .bracket-team:last-child { border-bottom: none; } - handled by parent spacing typically

  return (
    <div className={playerContainerClasses}>
      {seed && !isBye && (
        <span className="text-xs text-gray-500 font-bold mr-2 w-5 text-center">({seed})</span>
      )}
      {isBye && <span className="w-5 mr-2"></span>} {/* Placeholder for seed alignment */}
      <span className={playerNameClasses} title={playerName}>
        {playerName}
      </span>
      {!isBye && <span className={playerScoreClasses}>{playerScore}</span>}
    </div>
  );
};

export default PlayerDisplay;
