import MatchCard from './MatchCard'; // Import the actual MatchCard component

const RoundColumn = ({
  roundName,
  matchesForRound,
  roundPrefix,
  selectedMatchId,
  onMatchClick,
}) => {
  const displayRoundName =
    roundName.startsWith(roundPrefix) && roundPrefix !== ''
      ? roundName.substring(roundPrefix.length)
      : roundName;

  return (
    <div className="flex flex-col items-center p-2 md:p-4 mr-1 md:mr-2 flex-shrink-0 w-56 sm:w-64 md:w-72">
      {' '}
      {/* Ajustado para melhor escala em telas menores */}
      <h4 className="text-base md:text-lg font-semibold text-gray-200 mb-2 md:mb-3 pb-2 border-b border-gray-600 w-full text-center truncate">
        {displayRoundName}
      </h4>
      <div className="space-y-2 md:space-y-3 w-full">
        {matchesForRound.map((match) => (
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
