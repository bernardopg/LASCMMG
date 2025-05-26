import React from 'react'; // Removed unused useMemo
import RoundColumn from './RoundColumn';

const BracketSection = ({ title, matches, roundPrefix, selectedMatchId, onMatchClick }) => {
  if (!matches || matches.length === 0) {
    return <p className="text-gray-500 my-4">Nenhuma partida nesta seção.</p>;
  }

  const matchesByRound = {};
  matches.forEach((match) => {
    const roundNameKey = match.roundName || 'Desconhecida'; // Use roundName as key
    if (!matchesByRound[roundNameKey]) {
      matchesByRound[roundNameKey] = [];
    }
    matchesByRound[roundNameKey].push(match);
  });

  // Sorting logic from bracketRenderer.js
  const roundOrder = [
    `${roundPrefix}Rodada 1`,
    `${roundPrefix}Rodada 2`,
    `${roundPrefix}Rodada 3`,
    `${roundPrefix}Rodada 4`,
    `${roundPrefix}Rodada 5`,
    `${roundPrefix}Rodada 6`,
    `${roundPrefix}Rodada 7`,
    `${roundPrefix}Rodada 8`,
    `${roundPrefix}Oitavas de Final`,
    `${roundPrefix}Quartas de Final`,
    `${roundPrefix}Semifinais`,
    `${roundPrefix}Final`,
    'Grande Final',
    'Grande Final Reset',
  ].filter((r) => r); // Filter out empty prefix if roundPrefix is empty

  const sortedRoundNames = Object.keys(matchesByRound).sort((a, b) => {
    const indexA = roundOrder.indexOf(a);
    const indexB = roundOrder.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1; // a is in order, b is not
    if (indexB !== -1) return 1; // b is in order, a is not

    // Fallback for rounds not in predefined order (e.g. custom names or more rounds than listed)
    const numA = parseInt(a.replace(roundPrefix, '').split(' ').pop());
    const numB = parseInt(b.replace(roundPrefix, '').split(' ').pop());
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

    return a.localeCompare(b);
  });
  // End of sorting logic

  return (
    <div className="mb-6 md:mb-8 p-3 md:p-4 border border-gray-700 rounded-lg bg-gray-800 bg-opacity-50">
      <h3 className="text-lg md:text-xl font-semibold text-[var(--color-secondary)] mb-3 md:mb-4 pb-2 border-b border-gray-600">
        {title}
      </h3>
      <div className="bracket-display flex flex-row overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 relative">
        {' '}
        {/* Added scrollbar classes for better mobile UX */}
        {sortedRoundNames.map((roundName, roundIndex) => {
          const matchesForRound = matchesByRound[roundName].sort(
            (a, b) => parseInt(a.id) - parseInt(b.id)
          );
          return (
            <React.Fragment key={roundName}>
              <RoundColumn
                roundName={roundName}
                matchesForRound={matchesForRound}
                roundPrefix={roundPrefix}
                selectedMatchId={selectedMatchId}
                onMatchClick={onMatchClick}
              />
              {/* Add a visual spacer/connector area between rounds, except for the last one */}
              {roundIndex < sortedRoundNames.length - 1 && (
                <div
                  className="flex-shrink-0 w-6 md:w-10 lg:w-16 flex items-center justify-center"
                  aria-hidden="true"
                >
                  {/* This is where more complex connector lines would originate or pass through */}
                  {/* For now, it's just a spacer. Lines from MatchCard will point into this space. */}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BracketSection;
