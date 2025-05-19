import React from 'react';
import MatchCard from './MatchCard'; // Import the actual MatchCard component

const RoundColumn = ({ roundName, matchesForRound, roundPrefix, selectedMatchId, onMatchClick }) => {
  const displayRoundName = roundName.startsWith(roundPrefix) && roundPrefix !== ''
    ? roundName.substring(roundPrefix.length)
    : roundName;

  return (
    <div className="flex flex-col items-center p-2 md:p-4 mr-2 md:mr-4 flex-shrink-0 w-64 md:w-72"> {/* Added fixed width */}
      <h4 className="text-lg font-semibold text-gray-200 mb-3 pb-2 border-b border-gray-600 w-full text-center">
        {displayRoundName}
      </h4>
      <div className="space-y-3 w-full">
        {matchesForRound.map(match => (
          <MatchCard
            key={match.id}
            match={match}
            isSelected={selectedMatchId === match.id}
            onMatchClick={onMatchClick}
          />
        ))}
      </div>
    </div>
  );
};

export default RoundColumn;
