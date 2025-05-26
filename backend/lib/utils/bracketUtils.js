const { logger } = require('../logger/logger');

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getRoundNames(state) {
  if (!state || !state.matches) return [];
  const roundNameSet = new Set();
  const matchOrder = Object.keys(state.matches).sort((a, b) => parseInt(a) - parseInt(b));
  matchOrder.forEach((matchId) => {
    if (state.matches[matchId] && state.matches[matchId].roundName) {
      roundNameSet.add(state.matches[matchId].roundName);
    }
  });
  return Array.from(roundNameSet);
}

function generateSingleEliminationBracket(players, baseState) {
  const numPlayers = players.length;
  let bracketSize = 2;
  while (bracketSize < numPlayers) bracketSize *= 2;
  const numByes = bracketSize - numPlayers;
  const numFirstRoundMatches = bracketSize / 2;
  let shuffledPlayers = shuffleArray([...players]);
  const matchesPerRoundDefinition = [];
  const roundNames = [];
  let currentRoundMatches = numFirstRoundMatches;
  let roundCounter = 1;
  while (currentRoundMatches >= 1) {
    matchesPerRoundDefinition.push(currentRoundMatches);
    if (currentRoundMatches === 1) roundNames.push('Final');
    else if (currentRoundMatches === 2) roundNames.push('Semifinais');
    else if (currentRoundMatches === 4) roundNames.push('Quartas de Final');
    else if (currentRoundMatches === 8) roundNames.push('Oitavas de Final');
    else roundNames.push(`Rodada ${roundCounter}`);
    currentRoundMatches /= 2;
    roundCounter++;
  }
  const newState = { ...baseState, matches: {}, currentRound: roundNames[0] };
  let matchIdCounter = 1;
  let playerQueue = [...shuffledPlayers];
  let wbMatchIdsByRound = [];
  let currentRoundWbIds = [];
  for (let i = 0; i < numFirstRoundMatches; i++) {
    const matchId = matchIdCounter++;
    currentRoundWbIds.push(matchId);
    let p1 = { name: 'A definir', score: null, nickname: '' };
    let p2 = { name: 'A definir', score: null, nickname: '' };
    let winner = null;
    if (i < numByes) {
      const player = playerQueue.shift();
      if (player)
        p1 = {
          name: player.name,
          score: null,
          nickname: player.nickname,
          db_id: player.id,
        }; // Adicionado db_id
      p2 = { name: 'BYE', score: null, nickname: '', db_id: null }; // Adicionado db_id
      winner = 0;
    } else {
      const player1 = playerQueue.shift();
      if (player1)
        p1 = {
          name: player1.name,
          score: null,
          nickname: player1.nickname,
          db_id: player1.id,
        }; // Adicionado db_id
      const player2 = playerQueue.shift();
      if (player2)
        p2 = {
          name: player2.name,
          score: null,
          nickname: player2.nickname,
          db_id: player2.id,
        }; // Adicionado db_id
    }
    newState.matches[matchId] = {
      players: [p1, p2],
      winner: winner,
      roundName: roundNames[0],
      nextMatch: null,
      bracket: 'WB',
    };
  }
  wbMatchIdsByRound.push(currentRoundWbIds);
  for (let roundIdx = 1; roundIdx < matchesPerRoundDefinition.length; roundIdx++) {
    const numMatchesInThisRound = matchesPerRoundDefinition[roundIdx];
    currentRoundWbIds = [];
    for (let i = 0; i < numMatchesInThisRound; i++) {
      const matchId = matchIdCounter++;
      currentRoundWbIds.push(matchId);
      newState.matches[matchId] = {
        players: [
          { name: 'A definir', score: null, nickname: '', db_id: null }, // Adicionado db_id
          { name: 'A definir', score: null, nickname: '', db_id: null }, // Adicionado db_id
        ],
        winner: null,
        roundName: roundNames[roundIdx],
        nextMatch: null,
        bracket: 'WB',
      };
    }
    wbMatchIdsByRound.push(currentRoundWbIds);
  }
  for (let roundIdx = 0; roundIdx < wbMatchIdsByRound.length; roundIdx++) {
    const currentRoundIds = wbMatchIdsByRound[roundIdx];
    const nextRoundIds = wbMatchIdsByRound[roundIdx + 1];
    for (let i = 0; i < currentRoundIds.length; i++) {
      const matchId = currentRoundIds[i];
      const matchData = newState.matches[matchId];
      if (nextRoundIds) {
        matchData.nextMatch = nextRoundIds[Math.floor(i / 2)];
      } else {
        matchData.nextMatch = null;
      }
      // Lógica de avanço de jogadores para BYEs na primeira rodada
      if (matchData.winner !== null && matchData.nextMatch) {
        const winnerPlayerObject = matchData.players[matchData.winner];
        if (winnerPlayerObject.name !== 'BYE') {
          const nextMatchToUpdate = newState.matches[matchData.nextMatch];
          if (nextMatchToUpdate) {
            const positionInNextMatch = i % 2 === 0 ? 0 : 1;
            nextMatchToUpdate.players[positionInNextMatch] = {
              name: winnerPlayerObject.name,
              score: null,
              nickname: winnerPlayerObject.nickname,
              db_id: winnerPlayerObject.db_id, // Manter db_id
            };
          }
        }
      }
    }
  }
  return newState;
}

function generateDoubleEliminationBracket(players, baseState) {
  const numPlayers = players.length;
  let bracketSize = 2;
  while (bracketSize < numPlayers) bracketSize *= 2;
  const numByes = bracketSize - numPlayers;
  const numWBRound1Matches = bracketSize / 2;
  const numWBRounds = Math.log2(bracketSize);
  const numLBRounds = (numWBRounds - 1) * 2;
  let shuffledPlayers = shuffleArray([...players]);
  let playerQueue = [...shuffledPlayers];
  const newState = { ...baseState, matches: {} };
  let matchIdCounter = 1;
  let wbMatchIdsByRound = [];
  let lbMatchIdsByRound = [];
  let wbRoundNames = [];
  for (let i = 0; i < numWBRounds; i++) {
    const matchesInRound = numWBRound1Matches / Math.pow(2, i);
    if (matchesInRound === 1) wbRoundNames.push('WB Final');
    else if (matchesInRound === 2) wbRoundNames.push('WB Semifinais');
    else if (matchesInRound === 4) wbRoundNames.push('WB Quartas de Final');
    else if (matchesInRound === 8) wbRoundNames.push('WB Oitavas de Final');
    else wbRoundNames.push(`WB Rodada ${i + 1}`);
  }
  newState.currentRound = wbRoundNames[0];
  let currentRoundWbIds = [];
  for (let i = 0; i < numWBRound1Matches; i++) {
    const matchId = matchIdCounter++;
    currentRoundWbIds.push(matchId);
    let p1 = { name: 'A definir', score: null, nickname: '', db_id: null }; // Adicionado db_id
    let p2 = { name: 'A definir', score: null, nickname: '', db_id: null }; // Adicionado db_id
    let winner = null;
    if (i < numByes) {
      const player = playerQueue.shift();
      if (player)
        p1 = {
          name: player.name,
          score: null,
          nickname: player.nickname,
          db_id: player.id,
        }; // Adicionado db_id
      p2 = { name: 'BYE', score: null, nickname: '', db_id: null }; // Adicionado db_id
      winner = 0;
    } else {
      const player1 = playerQueue.shift();
      if (player1)
        p1 = {
          name: player1.name,
          score: null,
          nickname: player1.nickname,
          db_id: player1.id,
        }; // Adicionado db_id
      const player2 = playerQueue.shift();
      if (player2)
        p2 = {
          name: player2.name,
          score: null,
          nickname: player2.nickname,
          db_id: player2.id,
        }; // Adicionado db_id
    }
    newState.matches[matchId] = {
      players: [p1, p2],
      winner: winner,
      roundName: wbRoundNames[0],
      nextMatch: null,
      nextLoserMatch: null,
      bracket: 'WB',
    };
  }
  wbMatchIdsByRound.push(currentRoundWbIds);
  for (let roundIdx = 1; roundIdx < wbRoundNames.length; roundIdx++) {
    const numMatches = numWBRound1Matches / Math.pow(2, roundIdx);
    currentRoundWbIds = [];
    for (let i = 0; i < numMatches; i++) {
      const matchId = matchIdCounter++;
      currentRoundWbIds.push(matchId);
      newState.matches[matchId] = {
        players: [
          { name: 'A definir', score: null, nickname: '', db_id: null }, // Adicionado db_id
          { name: 'A definir', score: null, nickname: '', db_id: null }, // Adicionado db_id
        ],
        winner: null,
        roundName: wbRoundNames[roundIdx],
        nextMatch: null,
        nextLoserMatch: null,
        bracket: 'WB',
      };
    }
    wbMatchIdsByRound.push(currentRoundWbIds);
  }
  let lbRoundNames = [];
  let numMatchesInCurrentLbRound = numWBRound1Matches / 2;
  for (let i = 1; i <= numLBRounds; i++) {
    lbRoundNames.push(`LB Rodada ${i}`);
    let currentRoundLbIds = [];
    for (let j = 0; j < numMatchesInCurrentLbRound; j++) {
      const matchId = matchIdCounter++;
      currentRoundLbIds.push(matchId);
      newState.matches[matchId] = {
        players: [
          { name: 'A definir', score: null, nickname: '', db_id: null }, // Adicionado db_id
          { name: 'A definir', score: null, nickname: '', db_id: null }, // Adicionado db_id
        ],
        winner: null,
        roundName: `LB Rodada ${i}`,
        nextMatch: null,
        bracket: 'LB',
      };
    }
    lbMatchIdsByRound.push(currentRoundLbIds);
    if (i % 2 !== 0) {
      /* No change */
    } else {
      numMatchesInCurrentLbRound /= 2;
    }
  }
  const lbFinalRoundName = 'LB Final';
  lbRoundNames.push(lbFinalRoundName);
  const lbFinalMatchId = matchIdCounter++;
  lbMatchIdsByRound.push([lbFinalMatchId]);
  newState.matches[lbFinalMatchId] = {
    players: [
      { name: 'A definir', score: null, nickname: '', db_id: null }, // Adicionado db_id
      { name: 'A definir', score: null, nickname: '', db_id: null }, // Adicionado db_id
    ],
    winner: null,
    roundName: lbFinalRoundName,
    nextMatch: null,
    bracket: 'LB',
  };
  for (let roundIdx = 0; roundIdx < wbMatchIdsByRound.length; roundIdx++) {
    const currentRoundIds = wbMatchIdsByRound[roundIdx];
    const nextRoundIds = wbMatchIdsByRound[roundIdx + 1];
    const targetLbRoundIdx = roundIdx * 2;
    const targetLbRoundIds = lbMatchIdsByRound[targetLbRoundIdx];
    for (let i = 0; i < currentRoundIds.length; i++) {
      const matchId = currentRoundIds[i];
      const matchData = newState.matches[matchId];
      matchData.nextMatch = nextRoundIds ? nextRoundIds[Math.floor(i / 2)] : null;
      matchData.nextLoserMatch = targetLbRoundIds ? targetLbRoundIds[i] : null;
      // Lógica de avanço de jogadores para BYEs na primeira rodada
      if (matchData.winner === 0 && matchData.nextMatch) {
        const winnerPlayer = matchData.players[0];
        if (winnerPlayer.name !== 'BYE') {
          const nextMatch = newState.matches[matchData.nextMatch];
          if (nextMatch) {
            const pos = i % 2 === 0 ? 0 : 1;
            nextMatch.players[pos] = { ...winnerPlayer, score: null };
          }
        }
      }
      if (matchData.winner === 0 && matchData.nextLoserMatch) {
        const loserPlayer = matchData.players[1];
        if (loserPlayer.name !== 'BYE') {
          const nextLoserMatch = newState.matches[matchData.nextLoserMatch];
          if (nextLoserMatch) {
            if (nextLoserMatch.players[0].name === 'A definir') {
              nextLoserMatch.players[0] = { ...loserPlayer, score: null };
            } else if (nextLoserMatch.players[1].name === 'A definir') {
              nextLoserMatch.players[1] = { ...loserPlayer, score: null };
            }
          }
        }
      }
    }
  }
  for (let roundIdx = 0; roundIdx < lbMatchIdsByRound.length - 1; roundIdx++) {
    const currentRoundIds = lbMatchIdsByRound[roundIdx];
    const nextRoundIds = lbMatchIdsByRound[roundIdx + 1];
    for (let i = 0; i < currentRoundIds.length; i++) {
      const matchId = currentRoundIds[i];
      const matchData = newState.matches[matchId];
      const targetMatchIndex = roundIdx % 2 === 0 ? i : Math.floor(i / 2);
      matchData.nextMatch = nextRoundIds ? nextRoundIds[targetMatchIndex] : null;
    }
  }
  newState.matches[lbFinalMatchId].nextMatch = null;
  const gfMatchId1 = matchIdCounter++;
  const wbFinalMatchId = wbMatchIdsByRound[wbMatchIdsByRound.length - 1][0];
  newState.matches[gfMatchId1] = {
    players: [
      { name: 'Vencedor WB', score: null, nickname: '', db_id: null }, // Adicionado db_id
      { name: 'Vencedor LB', score: null, nickname: '', db_id: null }, // Adicionado db_id
    ],
    winner: null,
    roundName: 'Grande Final',
    nextMatch: null,
    bracket: 'GF',
    needsReset: true,
  };
  newState.matches[wbFinalMatchId].nextMatch = gfMatchId1;
  newState.matches[lbFinalMatchId].nextMatch = gfMatchId1;
  return newState;
}

function advancePlayersInBracket(state, completedMatchId, winnerIndexOverride = null) {
  if (!state || !state.matches || !state.matches[completedMatchId]) {
    logger.warn(
      {
        component: 'BracketUtils',
        completedMatchId,
        stateExists: !!state,
        matchesExists: !!state?.matches,
        matchExists: !!state?.matches?.[completedMatchId],
      },
      `[advancePlayers] Match ID ${completedMatchId} not found.`
    );
    return state;
  }
  const currentMatch = state.matches[completedMatchId];
  let winnerIdx;
  if (winnerIndexOverride !== null && (winnerIndexOverride === 0 || winnerIndexOverride === 1)) {
    currentMatch.winner = winnerIndexOverride;
    winnerIdx = winnerIndexOverride;
  } else if (currentMatch.players[0].score !== null && currentMatch.players[1].score !== null) {
    if (currentMatch.players[0].score > currentMatch.players[1].score) winnerIdx = 0;
    else if (currentMatch.players[1].score > currentMatch.players[0].score) winnerIdx = 1;
    else {
      logger.warn(
        {
          component: 'BracketUtils',
          matchId: completedMatchId,
          scores: currentMatch.players.map((p) => p.score),
        },
        `[advancePlayers] Scores for match ${completedMatchId} are a draw. Cannot advance.`
      );
      return state;
    }
    currentMatch.winner = winnerIdx;
  } else {
    logger.warn(
      { component: 'BracketUtils', matchId: completedMatchId },
      `[advancePlayers] Scores not set for match ${completedMatchId}. Cannot advance.`
    );
    return state;
  }
  const loserIdx = 1 - winnerIdx;
  const winnerPlayerObject = {
    ...currentMatch.players[winnerIdx],
    score: null,
  };
  const loserPlayerObject = { ...currentMatch.players[loserIdx], score: null };
  const nextMatchId = currentMatch.nextMatch;
  if (nextMatchId && state.matches[nextMatchId]) {
    const nextMatch = state.matches[nextMatchId];
    // Lógica para determinar a posição no próximo match
    // Isso pode ser complexo dependendo do tipo de chaveamento (SE vs DE)
    // e de qual match (WB ou LB) está avançando.
    // A lógica atual tenta encontrar uma posição 'A definir' ou que já contenha o jogador.
    // Pode ser necessário refinar isso para chaveamentos DE.

    let placed = false;
    if (nextMatch.players[0].name === 'A definir') {
      nextMatch.players[0] = winnerPlayerObject;
      placed = true;
    } else if (nextMatch.players[1].name === 'A definir') {
      nextMatch.players[1] = winnerPlayerObject;
      placed = true;
    } else {
      // Se ambas as posições estiverem preenchidas, verificar se o jogador já está lá (ex: BYE)
      if (nextMatch.players[0].name === winnerPlayerObject.name) {
        nextMatch.players[0] = winnerPlayerObject; // Atualiza o objeto jogador (ex: score)
        placed = true;
      } else if (nextMatch.players[1].name === winnerPlayerObject.name) {
        nextMatch.players[1] = winnerPlayerObject; // Atualiza o objeto jogador
        placed = true;
      } else {
        logger.warn(
          {
            component: 'BracketUtils',
            winnerName: winnerPlayerObject.name,
            nextMatchId,
            nextMatchPlayers: nextMatch.players,
          },
          `[advancePlayers] Could not place winner ${winnerPlayerObject.name} into next match ${nextMatchId}. Both slots are taken by other players.`
        );
      }
    }

    if (placed) {
      // Se o próximo match for a Grande Final e precisar de reset (para DE),
      // marcar o vencedor como "Vencedor WB" ou "Vencedor LB"
      if (nextMatch.bracket === 'GF' && nextMatch.needsReset) {
        if (currentMatch.bracket === 'WB') {
          nextMatch.players[0] = {
            name: 'Vencedor WB',
            score: null,
            nickname: '',
            db_id: null,
          };
        } else if (currentMatch.bracket === 'LB') {
          nextMatch.players[1] = {
            name: 'Vencedor LB',
            score: null,
            nickname: '',
            db_id: null,
          };
        }
        // O jogador real será colocado na Grande Final após o reset, se necessário.
        // A lógica de reset da Grande Final precisa ser tratada separadamente.
      }
    }
  } else if (nextMatchId) {
    logger.warn(
      { component: 'BracketUtils', nextMatchId },
      `[advancePlayers] Next match ID ${nextMatchId} not found in state.matches.`
    );
  }
  if (currentMatch.bracket === 'WB' && currentMatch.nextLoserMatch) {
    const nextLoserMatchId = currentMatch.nextLoserMatch;
    if (nextLoserMatchId && state.matches[nextLoserMatchId]) {
      const nextLoserMatch = state.matches[nextLoserMatchId];
      if (loserPlayerObject.name !== 'BYE') {
        const loserPos = nextLoserMatch.players.findIndex((p) => p.name === 'A definir');
        if (loserPos !== -1) {
          nextLoserMatch.players[loserPos] = loserPlayerObject;
        } else {
          logger.warn(
            {
              component: 'BracketUtils',
              loserName: loserPlayerObject.name,
              nextLoserMatchId,
              nextLoserMatchPlayers: nextLoserMatch.players,
            },
            `[advancePlayers] Could not place loser ${loserPlayerObject.name} into LB match ${nextLoserMatchId}. Both slots are taken.`
          );
        }
      }
    } else if (nextLoserMatchId) {
      logger.warn(
        { component: 'BracketUtils', nextLoserMatchId },
        `[advancePlayers] Next loser match ID ${nextLoserMatchId} not found in state.matches.`
      );
    }
  }
  return state;
}

module.exports = {
  shuffleArray,
  getRoundNames,
  generateSingleEliminationBracket,
  generateDoubleEliminationBracket,
  advancePlayersInBracket,
};
