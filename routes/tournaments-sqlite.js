const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../lib/authMiddleware');
const tournamentModel = require('../lib/models/tournamentModel');
const playerModel = require('../lib/models/playerModel');
const scoreModel = require('../lib/models/scoreModel');
const matchModel = require('../lib/models/matchModel');

function isValidTournamentId(id) {
  return (
    id &&
    typeof id === 'string' &&
    !id.includes('..') &&
    !id.startsWith('/') &&
    id.length < 256
  );
}

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
  const matchOrder = Object.keys(state.matches).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );
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
        p1 = { name: player.name, score: null, nickname: player.nickname };
      p2 = { name: 'BYE', score: null, nickname: '' };
      winner = 0;
    } else {
      const player1 = playerQueue.shift();
      if (player1)
        p1 = { name: player1.name, score: null, nickname: player1.nickname };
      const player2 = playerQueue.shift();
      if (player2)
        p2 = { name: player2.name, score: null, nickname: player2.nickname };
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
  for (
    let roundIdx = 1;
    roundIdx < matchesPerRoundDefinition.length;
    roundIdx++
  ) {
    const numMatchesInThisRound = matchesPerRoundDefinition[roundIdx];
    currentRoundWbIds = [];
    for (let i = 0; i < numMatchesInThisRound; i++) {
      const matchId = matchIdCounter++;
      currentRoundWbIds.push(matchId);
      newState.matches[matchId] = {
        players: [
          { name: 'A definir', score: null, nickname: '' },
          { name: 'A definir', score: null, nickname: '' },
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
    let p1 = { name: 'A definir', score: null, nickname: '' };
    let p2 = { name: 'A definir', score: null, nickname: '' };
    let winner = null;
    if (i < numByes) {
      const player = playerQueue.shift();
      if (player)
        p1 = { name: player.name, score: null, nickname: player.nickname };
      p2 = { name: 'BYE', score: null, nickname: '' };
      winner = 0;
    } else {
      const player1 = playerQueue.shift();
      if (player1)
        p1 = { name: player1.name, score: null, nickname: player1.nickname };
      const player2 = playerQueue.shift();
      if (player2)
        p2 = { name: player2.name, score: null, nickname: player2.nickname };
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
          { name: 'A definir', score: null, nickname: '' },
          { name: 'A definir', score: null, nickname: '' },
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
          { name: 'A definir', score: null, nickname: '' },
          { name: 'A definir', score: null, nickname: '' },
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
      { name: 'A definir', score: null, nickname: '' },
      { name: 'A definir', score: null, nickname: '' },
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
      matchData.nextMatch = nextRoundIds
        ? nextRoundIds[Math.floor(i / 2)]
        : null;
      matchData.nextLoserMatch = targetLbRoundIds ? targetLbRoundIds[i] : null;
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
      matchData.nextMatch = nextRoundIds
        ? nextRoundIds[targetMatchIndex]
        : null;
    }
  }
  newState.matches[lbFinalMatchId].nextMatch = null;
  const gfMatchId1 = matchIdCounter++;
  const wbFinalMatchId = wbMatchIdsByRound[wbMatchIdsByRound.length - 1][0];
  newState.matches[gfMatchId1] = {
    players: [
      { name: 'Vencedor WB', score: null, nickname: '' },
      { name: 'Vencedor LB', score: null, nickname: '' },
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

function advancePlayersInBracket(
  state,
  completedMatchId,
  winnerIndexOverride = null
) {
  if (!state || !state.matches || !state.matches[completedMatchId]) {
    console.warn(`[advancePlayers] Match ID ${completedMatchId} not found.`);
    return state;
  }
  const currentMatch = state.matches[completedMatchId];
  let winnerIdx;
  if (
    winnerIndexOverride !== null &&
    (winnerIndexOverride === 0 || winnerIndexOverride === 1)
  ) {
    currentMatch.winner = winnerIndexOverride;
    winnerIdx = winnerIndexOverride;
  } else if (
    currentMatch.players[0].score !== null &&
    currentMatch.players[1].score !== null
  ) {
    if (currentMatch.players[0].score > currentMatch.players[1].score)
      winnerIdx = 0;
    else if (currentMatch.players[1].score > currentMatch.players[0].score)
      winnerIdx = 1;
    else {
      console.warn(
        `[advancePlayers] Scores for match ${completedMatchId} are a draw.`
      );
      return state;
    }
    currentMatch.winner = winnerIdx;
  } else {
    console.warn(
      `[advancePlayers] Scores not set for match ${completedMatchId}.`
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
    const currentMatchNumericId = parseInt(
      String(completedMatchId).match(/\d+$/)[0] || completedMatchId
    );
    const positionInNextMatch = currentMatchNumericId % 2 !== 0 ? 0 : 1;
    if (
      nextMatch.players[positionInNextMatch] &&
      (nextMatch.players[positionInNextMatch].name === 'A definir' ||
        nextMatch.players[positionInNextMatch].name === winnerPlayerObject.name)
    ) {
      nextMatch.players[positionInNextMatch] = winnerPlayerObject;
    } else if (
      nextMatch.players[1 - positionInNextMatch] &&
      (nextMatch.players[1 - positionInNextMatch].name === 'A definir' ||
        nextMatch.players[1 - positionInNextMatch].name ===
          winnerPlayerObject.name)
    ) {
      nextMatch.players[1 - positionInNextMatch] = winnerPlayerObject;
    } else if (nextMatch.players[0].name === 'A definir') {
      nextMatch.players[0] = winnerPlayerObject;
    } else if (nextMatch.players[1].name === 'A definir') {
      nextMatch.players[1] = winnerPlayerObject;
    } else {
      console.warn(
        `[advancePlayers] Could not place winner ${winnerPlayerObject.name} into next match ${nextMatchId}.`
      );
    }
  } else if (nextMatchId) {
    console.warn(`[advancePlayers] Next match ID ${nextMatchId} not found.`);
  }
  if (currentMatch.bracket === 'WB' && currentMatch.nextLoserMatch) {
    const nextLoserMatchId = currentMatch.nextLoserMatch;
    if (nextLoserMatchId && state.matches[nextLoserMatchId]) {
      const nextLoserMatch = state.matches[nextLoserMatchId];
      if (loserPlayerObject.name !== 'BYE') {
        const loserPos = nextLoserMatch.players.findIndex(
          (p) => p.name === 'A definir'
        );
        if (loserPos !== -1) {
          nextLoserMatch.players[loserPos] = loserPlayerObject;
        } else {
          console.warn(
            `[advancePlayers] Could not place loser ${loserPlayerObject.name} into LB match ${nextLoserMatchId}.`
          );
        }
      }
    } else if (nextLoserMatchId) {
      console.warn(
        `[advancePlayers] Next loser match ID ${nextLoserMatchId} not found.`
      );
    }
  }
  return state;
}

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const activeTournaments = await tournamentModel.getAllTournaments({
      orderBy: 'date',
      order: 'DESC',
    });
    res.json(activeTournaments);
  } catch (error) {
    console.error(
      'Erro ao carregar lista de torneios do banco de dados:',
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar lista de torneios do banco de dados.',
    });
  }
});

router.get('/trash', authMiddleware, async (req, res) => {
  try {
    const trashedTournaments = await tournamentModel.getTournamentsByStatus([
      'Cancelado',
    ]);
    res.json(trashedTournaments);
  } catch (error) {
    console.error(
      'Erro ao listar torneios na lixeira do banco de dados:',
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro interno ao listar torneios na lixeira.',
    });
  }
});

router.post(
  '/create',
  authMiddleware,
  upload.single('playersFile'),
  // LOG DE AUDITORIA para criação de torneio
  // Precisa ser adicionado aqui ou no model, dependendo da granularidade desejada.
  // Por enquanto, o erro está no client-side (apiService.js) que tenta chamar auditLogger.log
  async (req, res) => {
    const tournamentName = req.body.name;
    const tournamentDate = req.body.date;
    const tournamentDescription = req.body.description || '';
    const tournamentNumPlayers =
      req.body.numPlayersExpected || req.body.numPlayers || 32;
    const tournamentType =
      req.body.bracket_type || req.body.type || 'single-elimination';
    // Novos campos
    const tournamentEntryFee = req.body.entry_fee;
    const tournamentPrizePool = req.body.prize_pool || '';
    const tournamentRules = req.body.rules || '';

    if (!tournamentName || !tournamentDate) {
      return res
        .status(400)
        .json({ success: false, message: 'Nome e data são obrigatórios.' });
    }

    // Validação simples para entry_fee (deve ser um número)
    if (
      tournamentEntryFee !== undefined &&
      typeof tournamentEntryFee !== 'number'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Taxa de entrada (entry_fee) deve ser um número.',
      });
    }

    const sanitizedName = tournamentName.trim();
    const tournamentId = `${Date.now()}-${sanitizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}`;

    try {
      const initialTournamentState = {
        tournamentName: sanitizedName,
        description: tournamentDescription.trim(),
        num_players_expected: parseInt(tournamentNumPlayers, 10),
        bracket_type: tournamentType,
        currentRound: null,
        matches: {},
        // Adicionando novos campos ao estado inicial, se fizer sentido para a lógica do bracket
        // entry_fee: tournamentEntryFee,
        // prize_pool: tournamentPrizePool.trim(),
        // rules: tournamentRules.trim(),
      };

      const newTournamentData = {
        id: tournamentId,
        name: sanitizedName,
        date: tournamentDate,
        description: initialTournamentState.description,
        num_players_expected: initialTournamentState.num_players_expected,
        bracket_type: initialTournamentState.bracket_type,
        status: 'Pendente',
        state_json: JSON.stringify(initialTournamentState),
        entry_fee: tournamentEntryFee, // Salvar no DB
        prize_pool: tournamentPrizePool.trim(), // Salvar no DB
        rules: tournamentRules.trim(), // Salvar no DB
      };

      const createdTournament =
        await tournamentModel.createTournament(newTournamentData);

      res.status(201).json({
        success: true,
        message: 'Torneio criado com sucesso no banco de dados!',
        tournamentId: createdTournament.id,
        tournament: createdTournament,
      });
    } catch (error) {
      console.error('Erro ao criar torneio no banco de dados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao criar torneio no banco de dados.',
      });
    }
  }
);

router.get('/:tournamentId/state', async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }
    const state = tournament.state_json
      ? JSON.parse(tournament.state_json)
      : {};
    res.json(state);
  } catch (error) {
    console.error(
      `Erro ao carregar estado para o torneio ${tournamentId} do banco de dados:`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar estado do banco de dados.',
    });
  }
});

router.post('/:tournamentId/state', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { state } = req.body;
  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  if (!state || typeof state !== 'object' || !state.matches) {
    return res
      .status(400)
      .json({ success: false, message: 'Dados de estado inválidos.' });
  }
  try {
    const success = await tournamentModel.updateTournamentState(
      tournamentId,
      JSON.stringify(state)
    );
    if (success) {
      res.json({
        success: true,
        message: 'Estado do torneio salvo com sucesso no banco de dados!',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Torneio não encontrado para atualizar o estado.',
      });
    }
  } catch (error) {
    console.error('Erro ao salvar estado do torneio no banco de dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar estado do torneio no banco de dados.',
    });
  }
});

router.get('/:tournamentId/players', async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  try {
    const playersFromDB =
      await playerModel.getPlayersByTournamentId(tournamentId);
    const players = playersFromDB.map((p) => ({
      PlayerName: p.name,
      Nickname: p.nickname,
      GamesPlayed: p.games_played,
      Wins: p.wins,
      Losses: p.losses,
      id: p.id,
    }));
    res.json(players);
  } catch (error) {
    console.error(
      `Erro ao carregar jogadores para o torneio ${tournamentId} do banco de dados:`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar jogadores do banco de dados.',
    });
  }
});

router.post('/:tournamentId/players', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { PlayerName, Nickname = '', gender, skill_level } = req.body; // Adicionado gender e skill_level
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  if (
    !PlayerName ||
    typeof PlayerName !== 'string' ||
    PlayerName.trim().length === 0 ||
    PlayerName.trim().length > 100
  ) {
    return res.status(400).json({ success: false, message: 'Nome inválido.' });
  }
  if (typeof Nickname !== 'string' || Nickname.trim().length > 50) {
    return res
      .status(400)
      .json({ success: false, message: 'Apelido inválido.' });
  }
  // Validação para gender e skill_level (opcional, mas bom ter)
  if (gender && (typeof gender !== 'string' || gender.trim().length > 50)) {
    return res
      .status(400)
      .json({ success: false, message: 'Gênero inválido.' });
  }
  if (
    skill_level &&
    (typeof skill_level !== 'string' || skill_level.trim().length > 50)
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Nível de habilidade inválido.' });
  }

  try {
    const sanitizedName = PlayerName.trim().substring(0, 100);
    const sanitizedNickname = Nickname.trim().substring(0, 50);
    const sanitizedGender = gender ? gender.trim().substring(0, 50) : null;
    const sanitizedSkillLevel = skill_level
      ? skill_level.trim().substring(0, 50)
      : null;

    const newPlayer = await playerModel.addPlayer({
      tournament_id: tournamentId,
      name: sanitizedName,
      nickname: sanitizedNickname,
      gender: sanitizedGender, // Passando gender
      skill_level: sanitizedSkillLevel, // Passando skill_level
    });

    const playerForFrontend = {
      PlayerName: newPlayer.name,
      Nickname: newPlayer.nickname,
      GamesPlayed: newPlayer.games_played,
      Wins: newPlayer.wins,
      Losses: newPlayer.losses,
      id: newPlayer.id,
      gender: newPlayer.gender, // Retornando gender
      skill_level: newPlayer.skill_level, // Retornando skill_level
    };

    res.status(201).json({
      success: true,
      message: `Jogador "${sanitizedName}" adicionado com sucesso ao banco de dados!`,
      player: playerForFrontend,
    });
  } catch (error) {
    console.error(
      `Erro ao salvar jogador para ${tournamentId} no banco de dados:`,
      error
    );
    if (error.message.includes('já existe neste torneio')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Erro interno ao salvar jogador no banco de dados.',
    });
  }
});

router.post(
  '/:tournamentId/players/import',
  authMiddleware,
  upload.single('jsonFile'),
  async (req, res) => {
    const { tournamentId } = req.params;
    if (!isValidTournamentId(tournamentId)) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'Nenhum arquivo JSON.' });
    }

    try {
      const uploadedData = JSON.parse(req.file.buffer.toString());
      if (!Array.isArray(uploadedData)) {
        return res
          .status(400)
          .json({ success: false, message: 'JSON deve ser um array.' });
      }

      const validationErrors = [];
      const playersToImport = uploadedData
        .map((p, index) => {
          if (!p || typeof p !== 'object') {
            validationErrors.push(
              `Entrada ${index + 1}: Não é um objeto válido.`
            );
            return null;
          }
          const playerName = p.PlayerName || p.name;
          if (
            !playerName ||
            typeof playerName !== 'string' ||
            playerName.trim().length === 0 ||
            playerName.trim().length > 100
          ) {
            validationErrors.push(
              `Entrada ${index + 1}: PlayerName inválido ou ausente.`
            );
            return null;
          }
          const nickname = p.Nickname || p.nickname;
          if (
            nickname &&
            (typeof nickname !== 'string' || nickname.trim().length > 50)
          ) {
            validationErrors.push(
              `Entrada ${index + 1} (Jogador ${playerName}): Nickname inválido.`
            );
          }
          const gender = p.gender;
          if (
            gender &&
            (typeof gender !== 'string' || gender.trim().length > 50)
          ) {
            validationErrors.push(
              `Entrada ${index + 1} (Jogador ${playerName}): Gênero inválido.`
            );
          }
          const skill_level = p.skill_level;
          if (
            skill_level &&
            (typeof skill_level !== 'string' || skill_level.trim().length > 50)
          ) {
            validationErrors.push(
              `Entrada ${index + 1} (Jogador ${playerName}): Nível de habilidade inválido.`
            );
          }

          return {
            name: String(playerName).trim().substring(0, 100),
            nickname:
              nickname && typeof nickname === 'string'
                ? String(nickname).trim().substring(0, 50)
                : '',
            gender:
              gender && typeof gender === 'string'
                ? String(gender).trim().substring(0, 50)
                : null,
            skill_level:
              skill_level && typeof skill_level === 'string'
                ? String(skill_level).trim().substring(0, 50)
                : null,
          };
        })
        .filter((p) => p !== null);

      if (validationErrors.length > 0 && playersToImport.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Erros de validação nos dados dos jogadores.',
          errors: validationErrors,
        });
      }
      if (playersToImport.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum jogador válido para importar no JSON.',
        });
      }

      const importResult = await playerModel.importPlayers(
        tournamentId,
        playersToImport
      );

      let message = `${importResult.count} jogadores importados com sucesso para o torneio ${tournamentId}.`;
      if (importResult.errors && importResult.errors.length > 0) {
        message += ` ${importResult.errors.length} jogadores não puderam ser importados devido a erros ou duplicatas.`;
      }
      if (validationErrors.length > 0) {
        message += ` Problemas de validação encontrados: ${validationErrors.join('; ')}`;
      }

      res.json({
        success: true,
        message: message,
        importedCount: importResult.count,
        errors: importResult.errors,
        validationIssues: validationErrors,
      });
    } catch (error) {
      console.error(
        `Erro ao importar jogadores para o torneio ${tournamentId} (DB):`,
        error
      );
      if (error instanceof SyntaxError) {
        res
          .status(400)
          .json({ success: false, message: 'Arquivo JSON inválido.' });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno ao importar jogadores.',
        });
      }
    }
  }
);

router.post(
  '/:tournamentId/players/update',
  authMiddleware,
  async (req, res) => {
    const { tournamentId } = req.params;
    const { players } = req.body;
    if (!isValidTournamentId(tournamentId)) {
      return res
        .status(400)
        .json({ success: false, message: 'ID de torneio inválido.' });
    }
    if (!Array.isArray(players)) {
      return res.status(400).json({
        success: false,
        message: "Esperado um array 'players' no corpo da requisição.",
      });
    }

    const validationErrors = [];
    const sanitizedPlayers = players
      .map((p, index) => {
        const playerName = p.PlayerName || p.name;
        if (
          !p ||
          typeof p !== 'object' ||
          !playerName ||
          typeof playerName !== 'string' ||
          playerName.trim().length === 0 ||
          playerName.trim().length > 100
        ) {
          validationErrors.push(
            `Entrada ${index + 1}: Dados do jogador inválidos ou nome ausente/inválido.`
          );
          return null;
        }
        const nickname = p.Nickname || p.nickname;
        if (
          nickname &&
          (typeof nickname !== 'string' || nickname.trim().length > 50)
        ) {
          validationErrors.push(
            `Entrada ${index + 1} (Jogador ${playerName}): Nickname inválido.`
          );
        }
        const gender = p.gender;
        if (
          gender &&
          (typeof gender !== 'string' || gender.trim().length > 50)
        ) {
          validationErrors.push(
            `Entrada ${index + 1} (Jogador ${playerName}): Gênero inválido.`
          );
        }
        const skill_level = p.skill_level;
        if (
          skill_level &&
          (typeof skill_level !== 'string' || skill_level.trim().length > 50)
        ) {
          validationErrors.push(
            `Entrada ${index + 1} (Jogador ${playerName}): Nível de habilidade inválido.`
          );
        }

        return {
          name: String(playerName).trim().substring(0, 100),
          nickname:
            nickname && typeof nickname === 'string'
              ? String(nickname).trim().substring(0, 50)
              : '',
          games_played:
            typeof p.GamesPlayed === 'number' && p.GamesPlayed >= 0
              ? p.GamesPlayed
              : typeof p.games_played === 'number' && p.games_played >= 0
                ? p.games_played
                : 0,
          wins:
            typeof p.Wins === 'number' && p.Wins >= 0
              ? p.Wins
              : typeof p.wins === 'number' && p.wins >= 0
                ? p.wins
                : 0,
          losses:
            typeof p.Losses === 'number' && p.Losses >= 0
              ? p.Losses
              : typeof p.losses === 'number' && p.losses >= 0
                ? p.losses
                : 0,
          gender:
            gender && typeof gender === 'string'
              ? String(gender).trim().substring(0, 50)
              : null,
          skill_level:
            skill_level && typeof skill_level === 'string'
              ? String(skill_level).trim().substring(0, 50)
              : null,
        };
      })
      .filter((p) => p !== null);

    if (validationErrors.length > 0 && sanitizedPlayers.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Erros de validação nos dados dos jogadores. Nenhum jogador válido para atualizar.',
        errors: validationErrors,
      });
    }
    if (sanitizedPlayers.length === 0 && players.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum jogador válido fornecido para atualização.',
      });
    }

    try {
      const result = await playerModel.replacePlayerListForTournament(
        tournamentId,
        sanitizedPlayers
      );

      let message = `${result.count} jogadores atualizados/adicionados ao torneio ${tournamentId}.`;
      if (result.errors && result.errors.length > 0) {
        message += ` ${result.errors.length} erros durante a operação.`;
      }
      if (validationErrors.length > 0) {
        message += ` Problemas de validação encontrados: ${validationErrors.join('; ')}`;
      }

      res.json({
        success: true,
        message: message,
        updatedCount: result.count,
        errors: result.errors,
        validationIssues: validationErrors,
      });
    } catch (error) {
      console.error(
        `Erro ao atualizar lista de jogadores para o torneio ${tournamentId} (DB):`,
        error
      );
      res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar lista de jogadores.',
      });
    }
  }
);

router.get('/:tournamentId/scores', async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  try {
    const scoresFromDB = await scoreModel.getScoresByTournamentId(tournamentId);
    res.json(scoresFromDB);
  } catch (error) {
    console.error(
      `Erro ao carregar placares para o torneio ${tournamentId} (DB):`,
      error
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao carregar placares (DB).' });
  }
});

router.post('/scores', authMiddleware, async (req, res) => {
  const {
    tournament_id: tournamentId,
    matchId,
    player1_id,
    player2_id,
    score1: player1_score,
    score2: player2_score,
  } = req.body;

  if (!tournamentId || !isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }
  if (
    matchId === undefined ||
    player1_score === undefined ||
    player2_score === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: 'matchId, score1 e score2 são obrigatórios.',
    });
  }
  if (player1_id === undefined || player2_id === undefined) {
    return res.status(400).json({
      success: false,
      message: 'player1_id e player2_id são obrigatórios.',
    });
  }

  const s1 = parseInt(player1_score, 10);
  const s2 = parseInt(player2_score, 10);
  if (
    isNaN(s1) ||
    isNaN(s2) ||
    s1 < 0 ||
    s1 > 2 ||
    s2 < 0 ||
    s2 > 2 ||
    (s1 !== 2 && s2 !== 2) ||
    (s1 === 2 && s2 === 2)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Placar inválido. Deve ser uma vitória por 2-0 ou 2-1.',
    });
  }

  try {
    const matchExists = await matchModel.getMatchById(parseInt(matchId, 10));
    if (!matchExists || matchExists.tournament_id !== tournamentId) {
      return res.status(404).json({
        success: false,
        message:
          'Partida não encontrada ou não pertence ao torneio especificado.',
      });
    }
    if (
      (matchExists.player1_id !== parseInt(player1_id, 10) ||
        matchExists.player2_id !== parseInt(player2_id, 10)) &&
      (matchExists.player1_id !== parseInt(player2_id, 10) ||
        matchExists.player2_id !== parseInt(player1_id, 10))
    ) {
      return res.status(400).json({
        success: false,
        message: 'IDs dos jogadores não correspondem aos da partida.',
      });
    }

    let winner_id = null;
    if (s1 > s2) {
      winner_id = parseInt(player1_id, 10);
    } else if (s2 > s1) {
      winner_id = parseInt(player2_id, 10);
    }

    const scoreEntry = {
      match_id: parseInt(matchId, 10),
      player1_score: s1,
      player2_score: s2,
      winner_id: winner_id,
    };

    const savedScore = await scoreModel.addScore(scoreEntry);

    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament || !tournament.state_json) {
      console.warn(
        `Torneio ${tournamentId} ou seu estado não encontrado após salvar score. O chaveamento pode não ser atualizado.`
      );
      return res.json({
        success: true,
        message:
          'Placar salvo, mas estado do chaveamento não pôde ser atualizado.',
        score: savedScore,
      });
    }

    let state = JSON.parse(tournament.state_json);
    const stateMatchKey = String(matchExists.match_number);

    if (state && state.matches && state.matches[stateMatchKey]) {
      const currentMatchInState = state.matches[stateMatchKey];

      const p1StateIndex = currentMatchInState.players.findIndex(
        (p) => p.db_id === parseInt(player1_id, 10)
      );
      const p2StateIndex = currentMatchInState.players.findIndex(
        (p) => p.db_id === parseInt(player2_id, 10)
      );

      if (p1StateIndex !== -1)
        currentMatchInState.players[p1StateIndex].score = s1;
      if (p2StateIndex !== -1)
        currentMatchInState.players[p2StateIndex].score = s2;

      if (
        currentMatchInState.players[0].db_id === parseInt(player1_id, 10) &&
        currentMatchInState.players[1].db_id === parseInt(player2_id, 10)
      ) {
        currentMatchInState.players[0].score = s1;
        currentMatchInState.players[1].score = s2;
      } else if (
        currentMatchInState.players[0].db_id === parseInt(player2_id, 10) &&
        currentMatchInState.players[1].db_id === parseInt(player1_id, 10)
      ) {
        currentMatchInState.players[0].score = s2;
        currentMatchInState.players[1].score = s1;
      } else {
        console.warn(
          `Não foi possível mapear os scores para os jogadores no state_json para a partida ${stateMatchKey}.`
        );
      }

      state = advancePlayersInBracket(state, stateMatchKey);
      await tournamentModel.updateTournamentState(
        tournamentId,
        JSON.stringify(state)
      );
      res.json({
        success: true,
        message: 'Placar salvo e chaveamento atualizado!',
        score: savedScore,
        newState: state,
      });
    } else {
      console.warn(
        `Partida ${stateMatchKey} (match_id DB: ${matchId}) não encontrada no state_json do torneio ${tournamentId}. Chaveamento não atualizado.`
      );
      res.json({
        success: true,
        message:
          'Placar salvo, mas partida não encontrada no estado do chaveamento para atualização.',
        score: savedScore,
      });
    }
  } catch (error) {
    console.error('Erro ao salvar placar e atualizar chaveamento (DB):', error);
    res
      .status(500)
      .json({ success: false, message: 'Erro interno ao salvar placar.' });
  }
});

router.post(
  '/:tournamentId/scores/update',
  authMiddleware,
  async (req, res) => {
    const { tournamentId } = req.params;
    const { scores } = req.body;
    if (!isValidTournamentId(tournamentId)) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }
    if (!Array.isArray(scores)) {
      return res
        .status(400)
        .json({ success: false, message: "Esperado array 'scores'." });
    }

    try {
      await scoreModel.deleteScoresByTournamentId(tournamentId);

      const validationErrors = [];
      const addedScores = [];
      const playerCache = new Map();
      const matchCache = new Map();

      for (const s of scores) {
        if (
          !s ||
          typeof s !== 'object' ||
          s.matchId === undefined ||
          s.score1 === undefined ||
          s.score2 === undefined ||
          !s.player1 ||
          !s.player2
        ) {
          validationErrors.push(
            `Entrada de score inválida (faltando campos obrigatórios): ${JSON.stringify(s)}`
          );
          continue;
        }

        const s1 = parseInt(s.score1, 10);
        const s2 = parseInt(s.score2, 10);
        if (
          isNaN(s1) ||
          isNaN(s2) ||
          s1 < 0 ||
          s1 > 2 ||
          s2 < 0 ||
          s2 > 2 ||
          (s1 !== 2 && s2 !== 2) ||
          (s1 === 2 && s2 === 2)
        ) {
          validationErrors.push(
            `Placar inválido para ${s.player1} vs ${s.player2}: ${s.score1}-${s.score2}. Deve ser uma vitória por 2-0 ou 2-1.`
          );
          continue;
        }

        let matchDbId = matchCache.get(s.matchId);
        if (matchDbId === undefined) {
          const matchesInDb =
            await matchModel.getMatchesByTournamentId(tournamentId);
          const foundMatch = matchesInDb.find(
            (m) => m.match_number === s.matchId
          );
          if (foundMatch) {
            matchDbId = foundMatch.id;
            matchCache.set(s.matchId, matchDbId);
          } else {
            validationErrors.push(
              `Partida com match_number ${s.matchId} não encontrada para o torneio ${tournamentId}. Score ignorado.`
            );
            continue;
          }
        }

        let p1Id = playerCache.get(s.player1);
        if (p1Id === undefined) {
          const p1 = await playerModel.getPlayerByNameInTournament(
            tournamentId,
            s.player1
          );
          if (p1) {
            p1Id = p1.id;
            playerCache.set(s.player1, p1Id);
          } else {
            validationErrors.push(`Jogador ${s.player1} não encontrado.`);
            continue;
          }
        }

        let p2Id = playerCache.get(s.player2);
        if (p2Id === undefined) {
          const p2 = await playerModel.getPlayerByNameInTournament(
            tournamentId,
            s.player2
          );
          if (p2) {
            p2Id = p2.id;
            playerCache.set(s.player2, p2Id);
          } else {
            validationErrors.push(`Jogador ${s.player2} não encontrado.`);
            continue;
          }
        }

        let winnerId = null;
        if (s.winner) {
          if (s.winner === s.player1) winnerId = p1Id;
          else if (s.winner === s.player2) winnerId = p2Id;
          else {
            let winnerInDb = playerCache.get(s.winner);
            if (winnerInDb === undefined) {
              const w = await playerModel.getPlayerByNameInTournament(
                tournamentId,
                s.winner
              );
              if (w) {
                winnerInDb = w.id;
                playerCache.set(s.winner, winnerInDb);
              }
            }
            if (winnerInDb) winnerId = winnerInDb;
            else
              validationErrors.push(
                `Jogador vencedor ${s.winner} não encontrado.`
              );
          }
        } else {
          if (s1 > s2) winnerId = p1Id;
          else if (s2 > s1) winnerId = p2Id;
        }

        const scoreData = {
          match_id: matchDbId,
          player1_score: s1,
          player2_score: s2,
          winner_id: winnerId,
        };

        try {
          const newScore = await scoreModel.addScore(scoreData);
          addedScores.push(newScore);
        } catch (addError) {
          validationErrors.push(
            `Erro ao adicionar score para partida ${s.matchId} (DB ID: ${matchDbId}): ${addError.message}`
          );
        }
      }

      if (validationErrors.length > 0) {
        const message =
          addedScores.length > 0
            ? `${addedScores.length} placares adicionados. Erros em outros: ${validationErrors.join('; ')}`
            : `Nenhum placar adicionado devido a erros: ${validationErrors.join('; ')}`;

        return res.status(addedScores.length > 0 ? 207 : 400).json({
          success: addedScores.length > 0,
          message: message,
          errors: validationErrors,
          addedCount: addedScores.length,
        });
      }

      res.json({
        success: true,
        message: `Histórico de placares atualizado! ${addedScores.length} placares processados.`,
      });
    } catch (error) {
      console.error(
        `Erro ao atualizar placares para ${tournamentId} (DB):`,
        error
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao atualizar placares (DB).' });
    }
  }
);

router.post(
  '/:tournamentId/generate-bracket',
  authMiddleware,
  async (req, res) => {
    const { tournamentId } = req.params;
    if (!isValidTournamentId(tournamentId)) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    try {
      const playersFromDB =
        await playerModel.getPlayersByTournamentId(tournamentId);
      if (!playersFromDB || playersFromDB.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum jogador registrado para este torneio.',
        });
      }

      // Mapear para o formato esperado pela função de geração de chaveamento
      const registeredPlayers = playersFromDB.map((p) => ({
        name: p.name,
        nickname: p.nickname,
        id: p.id,
      }));

      if (registeredPlayers.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Mínimo 2 jogadores para gerar chaveamento.',
        });
      }

      const tournamentInfo =
        await tournamentModel.getTournamentById(tournamentId);
      if (!tournamentInfo) {
        return res
          .status(404)
          .json({ success: false, message: 'Torneio não encontrado no DB.' });
      }

      let tournamentBaseState = {
        tournamentName: tournamentInfo.name,
        bracket_type: tournamentInfo.bracket_type || 'single-elimination',
        description: tournamentInfo.description || '',
        num_players_expected:
          tournamentInfo.num_players_expected || registeredPlayers.length,
        currentRound: null,
        matches: {},
      };

      let finalStateObject;
      if (tournamentBaseState.bracket_type === 'double-elimination') {
        finalStateObject = generateDoubleEliminationBracket(
          registeredPlayers,
          tournamentBaseState
        );
      } else if (tournamentBaseState.bracket_type === 'group-stage') {
        return res.status(501).json({
          success: false,
          message:
            'Fase de Grupos não implementada para persistência em DB ainda.',
        });
      } else {
        finalStateObject = generateSingleEliminationBracket(
          registeredPlayers,
          tournamentBaseState
        );
      }

      await tournamentModel.updateTournamentState(
        tournamentId,
        JSON.stringify(finalStateObject)
      );

      await tournamentModel.updateTournamentStatus(
        tournamentId,
        'Em Andamento'
      );

      res.json({
        success: true,
        message: 'Chaveamento gerado e salvo no banco de dados!',
      });
    } catch (error) {
      console.error(
        `Erro ao gerar chaveamento para ${tournamentId} (DB):`,
        error
      );
      if (error.message.includes('não implementada')) {
        res.status(501).json({ success: false, message: error.message });
      } else {
        res
          .status(500)
          .json({ success: false, message: 'Erro ao gerar chaveamento (DB).' });
      }
    }
  }
);

router.post('/:tournamentId/reset', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }

  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    const resetState = {
      tournamentName: tournament.name,
      description: tournament.description || '',
      num_players_expected: tournament.num_players_expected || 0,
      bracket_type: tournament.bracket_type || 'single-elimination',
      currentRound: null,
      matches: {},
    };

    await tournamentModel.updateTournamentState(
      tournamentId,
      JSON.stringify(resetState)
    );

    await tournamentModel.updateTournamentStatus(tournamentId, 'Pendente');

    res.json({
      success: true,
      message: 'Torneio resetado (estado e status atualizados no DB).',
    });
  } catch (error) {
    console.error(`Erro ao resetar torneio ${tournamentId} (DB):`, error);
    res
      .status(500)
      .json({ success: false, message: 'Erro ao resetar torneio (DB).' });
  }
});

router.patch('/:tournamentId/name', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { name } = req.body;
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  if (
    !name ||
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    name.trim().length > 100
  ) {
    return res.status(400).json({ success: false, message: 'Nome inválido.' });
  }
  const sanitizedName = name.trim();

  try {
    const updatedTournament = await tournamentModel.updateTournament(
      tournamentId,
      { name: sanitizedName }
    );

    if (!updatedTournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    if (updatedTournament.state_json) {
      try {
        let state = JSON.parse(updatedTournament.state_json);
        if (state && typeof state === 'object') {
          state.tournamentName = sanitizedName;
          await tournamentModel.updateTournamentState(
            tournamentId,
            JSON.stringify(state)
          );
          updatedTournament.state_json = JSON.stringify(state);
        }
      } catch (parseError) {
        console.warn(
          `Erro ao fazer parse do state_json para atualizar nome do torneio ${tournamentId}: ${parseError.message}`
        );
      }
    }
    res.json({
      success: true,
      message: 'Nome do torneio atualizado com sucesso no banco de dados!',
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error(
      `Erro ao atualizar nome para o torneio ${tournamentId} no banco de dados:`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar nome do torneio no banco de dados.',
    });
  }
});

router.patch('/:tournamentId/description', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { description } = req.body;
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  if (typeof description !== 'string' || description.length > 500) {
    return res
      .status(400)
      .json({ success: false, message: 'Descrição inválida.' });
  }
  const sanitizedDescription = description.trim();

  try {
    const updatedTournament = await tournamentModel.updateTournament(
      tournamentId,
      { description: sanitizedDescription }
    );

    if (!updatedTournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    if (updatedTournament.state_json) {
      try {
        let state = JSON.parse(updatedTournament.state_json);
        if (state && typeof state === 'object') {
          state.description = sanitizedDescription;
          await tournamentModel.updateTournamentState(
            tournamentId,
            JSON.stringify(state)
          );
          updatedTournament.state_json = JSON.stringify(state);
        }
      } catch (parseError) {
        console.warn(
          `Erro ao fazer parse do state_json para atualizar descrição do torneio ${tournamentId}: ${parseError.message}`
        );
      }
    }

    res.json({
      success: true,
      message: 'Descrição do torneio atualizada com sucesso no banco de dados!',
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error(
      `Erro ao atualizar descrição para o torneio ${tournamentId} no banco de dados:`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar descrição do torneio no banco de dados.',
    });
  }
});

// Rota PATCH para entry_fee (copiada de routes/tournaments.js)
router.patch('/:tournamentId/entry_fee', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { entry_fee } = req.body;

  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }

  const fee = parseFloat(entry_fee);
  if (isNaN(fee) || fee < 0) {
    return res.status(400).json({
      success: false,
      message: 'Taxa de entrada inválida. Deve ser um número não negativo.',
    });
  }

  try {
    const updatedTournament = await tournamentModel.updateTournament(
      tournamentId,
      { entry_fee: fee }
    );

    if (!updatedTournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }
    res.json({
      success: true,
      message: 'Taxa de entrada do torneio atualizada com sucesso!',
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error(
      `Erro ao atualizar taxa de entrada para o torneio ${tournamentId}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar taxa de entrada do torneio.',
    });
  }
});

// Rota PATCH para prize_pool (copiada de routes/tournaments.js)
router.patch('/:tournamentId/prize_pool', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { prize_pool } = req.body;

  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }

  if (typeof prize_pool !== 'string' && prize_pool !== null) {
    return res.status(400).json({
      success: false,
      message: 'Premiação inválida. Deve ser um texto ou nulo.',
    });
  }

  try {
    const updatedTournament = await tournamentModel.updateTournament(
      tournamentId,
      { prize_pool: prize_pool }
    );

    if (!updatedTournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }
    res.json({
      success: true,
      message: 'Premiação do torneio atualizada com sucesso!',
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error(
      `Erro ao atualizar premiação para o torneio ${tournamentId}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar premiação do torneio.',
    });
  }
});

// Rota PATCH para rules (copiada de routes/tournaments.js)
router.patch('/:tournamentId/rules', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { rules } = req.body;

  if (!isValidTournamentId(tournamentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'ID de torneio inválido.' });
  }

  if (typeof rules !== 'string' && rules !== null) {
    return res.status(400).json({
      success: false,
      message: 'Regras inválidas. Devem ser um texto ou nulo.',
    });
  }

  try {
    const updatedTournament = await tournamentModel.updateTournament(
      tournamentId,
      { rules: rules }
    );

    if (!updatedTournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }
    res.json({
      success: true,
      message: 'Regras do torneio atualizadas com sucesso!',
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error(
      `Erro ao atualizar regras para o torneio ${tournamentId}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar regras do torneio.',
    });
  }
});

router.patch('/:tournamentId/status', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  const { status } = req.body;
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  const validStatuses = ['Pendente', 'Em Andamento', 'Concluído', 'Cancelado'];
  if (
    !status ||
    typeof status !== 'string' ||
    !validStatuses.includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: `Status inválido. Use: ${validStatuses.join(', ')}.`,
    });
  }

  try {
    const success = await tournamentModel.updateTournamentStatus(
      tournamentId,
      status
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Torneio não encontrado para atualizar o status.',
      });
    }
    const updatedTournament =
      await tournamentModel.getTournamentById(tournamentId);
    res.json({
      success: true,
      message: 'Status do torneio atualizado com sucesso no banco de dados!',
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error(
      `Erro ao atualizar status para o torneio ${tournamentId} no banco de dados:`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status do torneio no banco de dados.',
    });
  }
});

router.patch(
  '/:tournamentId/matches/:matchId/schedule',
  authMiddleware,
  async (req, res) => {
    const { tournamentId, matchId: matchNumber } = req.params;
    const { dateTime } = req.body;

    if (!isValidTournamentId(tournamentId)) {
      return res
        .status(400)
        .json({ success: false, message: 'ID torneio inválido.' });
    }
    if (
      !matchNumber ||
      typeof matchNumber !== 'string' ||
      !/^\d+$/.test(matchNumber)
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Número da partida inválido.' });
    }

    let validDateTime = null;
    if (dateTime) {
      try {
        validDateTime = new Date(dateTime).toISOString();
      } catch {
        return res
          .status(400)
          .json({ success: false, message: 'Formato data/hora inválido.' });
      }
    }

    try {
      let tournament = await tournamentModel.getTournamentById(tournamentId);
      if (!tournament || !tournament.state_json) {
        return res.status(404).json({
          success: false,
          message: 'Torneio ou estado não encontrado.',
        });
      }
      let state = JSON.parse(tournament.state_json);
      if (!state.matches || !state.matches[matchNumber]) {
        return res.status(404).json({
          success: false,
          message: `Partida ${matchNumber} não encontrada no estado do torneio.`,
        });
      }
      state.matches[matchNumber].dateTime = validDateTime;
      await tournamentModel.updateTournamentState(
        tournamentId,
        JSON.stringify(state)
      );

      res.json({
        success: true,
        message: 'Agendamento da partida atualizado (no state_json).',
      });
    } catch (error) {
      console.error(
        `Erro ao atualizar agendamento para partida ${matchNumber} do torneio ${tournamentId} (DB):`,
        error
      );
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar agendamento da partida (DB).',
      });
    }
  }
);

router.patch(
  '/:tournamentId/matches/:matchId/winner',
  authMiddleware,
  async (req, res) => {
    const { tournamentId, matchId: matchNumber } = req.params;
    const { winnerIndex } = req.body;

    if (!isValidTournamentId(tournamentId)) {
      return res
        .status(400)
        .json({ success: false, message: 'ID torneio inválido.' });
    }
    if (
      !matchNumber ||
      typeof matchNumber !== 'string' ||
      !/^\d+$/.test(matchNumber)
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Número da partida inválido.' });
    }
    if (winnerIndex === undefined || (winnerIndex !== 0 && winnerIndex !== 1)) {
      return res.status(400).json({
        success: false,
        message: 'Índice do vencedor inválido (deve ser 0 ou 1).',
      });
    }

    try {
      let tournament = await tournamentModel.getTournamentById(tournamentId);
      if (!tournament || !tournament.state_json) {
        return res.status(404).json({
          success: false,
          message: 'Torneio ou estado não encontrado.',
        });
      }
      let state = JSON.parse(tournament.state_json);

      if (!state.matches || !state.matches[matchNumber]) {
        return res.status(404).json({
          success: false,
          message: `Partida ${matchNumber} não encontrada no estado.`,
        });
      }
      const currentMatch = state.matches[matchNumber];
      if (
        !currentMatch.players ||
        !currentMatch.players[0] ||
        !currentMatch.players[1] ||
        currentMatch.players[0].name === 'A definir' ||
        currentMatch.players[1].name === 'A definir'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Jogadores da partida ainda não definidos.',
        });
      }

      currentMatch.players[winnerIndex].score = 2;
      currentMatch.players[1 - winnerIndex].score = Math.floor(
        Math.random() * 2
      );

      state = advancePlayersInBracket(state, matchNumber, winnerIndex);
      await tournamentModel.updateTournamentState(
        tournamentId,
        JSON.stringify(state)
      );

      res.json({
        success: true,
        message: 'Vencedor definido e jogadores avançados (no state_json).',
      });
    } catch (error) {
      console.error(
        `Erro ao definir vencedor para partida ${matchNumber} do torneio ${tournamentId} (DB):`,
        error
      );
      res.status(500).json({
        success: false,
        message: 'Erro ao definir vencedor da partida (DB).',
      });
    }
  }
);

router.post(
  '/:tournamentId/advance-round',
  authMiddleware,
  async (req, res) => {
    const { tournamentId } = req.params;
    if (!isValidTournamentId(tournamentId)) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }
    try {
      let tournament = await tournamentModel.getTournamentById(tournamentId);
      if (!tournament || !tournament.state_json) {
        return res.status(404).json({
          success: false,
          message: 'Torneio ou estado não encontrado.',
        });
      }
      let state = JSON.parse(tournament.state_json);

      if (
        !state ||
        typeof state !== 'object' ||
        !state.matches ||
        typeof state.matches !== 'object' ||
        !state.currentRound
      ) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido ou sem rodada atual definida.',
        });
      }

      const currentRoundName = state.currentRound;
      const allRoundNames = getRoundNames(state);
      const currentRoundIndex = allRoundNames.indexOf(currentRoundName);

      if (currentRoundIndex === -1) {
        return res.status(400).json({
          success: false,
          message: 'Rodada atual configurada no estado é inválida.',
        });
      }
      if (currentRoundIndex >= allRoundNames.length - 1) {
        return res.status(400).json({
          success: false,
          message: 'O torneio já está na rodada final ou além.',
        });
      }

      const matchesInCurrentRound = Object.values(state.matches).filter(
        (m) => m.roundName === currentRoundName
      );
      const allMatchesComplete = matchesInCurrentRound.every(
        (m) => m.winner !== null
      );

      if (!allMatchesComplete) {
        return res.status(400).json({
          success: false,
          message: `A rodada "${currentRoundName}" ainda tem partidas incompletas.`,
        });
      }

      const nextRoundName = allRoundNames[currentRoundIndex + 1];
      state.currentRound = nextRoundName;
      await tournamentModel.updateTournamentState(
        tournamentId,
        JSON.stringify(state)
      );

      res.json({
        success: true,
        message: `Rodada avançada para: ${nextRoundName}. Estado atualizado no banco de dados.`,
        newState: state,
      });
    } catch (error) {
      console.error(
        `Erro ao avançar rodada para o torneio ${tournamentId} (DB):`,
        error
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao avançar rodada (DB).' });
    }
  }
);

router.post('/:tournamentId/trash', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }

  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    if (tournament.status === 'Cancelado') {
      return res.json({
        success: true,
        message: 'Torneio já estava marcado como cancelado (na lixeira).',
      });
    }

    await tournamentModel.updateTournamentStatus(tournamentId, 'Cancelado');
    res.json({
      success: true,
      message:
        'Torneio movido para a lixeira (status definido como Cancelado).',
    });
  } catch (error) {
    console.error(
      `Erro ao mover torneio ${tournamentId} para a lixeira (DB):`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao mover torneio para a lixeira (DB).',
    });
  }
});

router.post('/:tournamentId/restore', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }

  try {
    const tournament = await tournamentModel.getTournamentById(tournamentId);
    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, message: 'Torneio não encontrado.' });
    }

    if (tournament.status !== 'Cancelado') {
      return res.status(400).json({
        success: false,
        message: 'Torneio não está na lixeira (não está Cancelado).',
      });
    }

    await tournamentModel.updateTournamentStatus(tournamentId, 'Pendente');
    res.json({
      success: true,
      message: 'Torneio restaurado (status definido como Pendente).',
    });
  } catch (error) {
    console.error(
      `Erro ao restaurar torneio ${tournamentId} da lixeira (DB):`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao restaurar torneio da lixeira (DB).',
    });
  }
});

router.delete('/:tournamentId/permanent', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }

  try {
    const deleted = await tournamentModel.deleteTournament(tournamentId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Torneio não encontrado para exclusão.',
      });
    }

    res.json({
      success: true,
      message: 'Torneio excluído permanentemente do banco de dados.',
    });
  } catch (error) {
    console.error(
      `Erro ao excluir permanentemente o torneio ${tournamentId} (DB):`,
      error
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir permanentemente o torneio (DB).',
    });
  }
});

router.delete('/trash/empty', authMiddleware, async (req, res) => {
  try {
    const trashedTournaments = await tournamentModel.getTournamentsByStatus([
      'Cancelado',
    ]);

    if (trashedTournaments.length === 0) {
      return res.json({
        success: true,
        message: 'Lixeira (torneios Cancelados) já está vazia.',
      });
    }

    let deletionCount = 0;
    let deletionErrors = 0;

    for (const tournament of trashedTournaments) {
      try {
        const deleted = await tournamentModel.deleteTournament(tournament.id);
        if (deleted) {
          deletionCount++;
        }
      } catch (deleteErr) {
        deletionErrors++;
        console.error(
          `Erro ao excluir torneio ${tournament.id} ao esvaziar lixeira:`,
          deleteErr
        );
      }
    }

    let message = `Lixeira esvaziada. ${deletionCount} torneio(s) excluído(s) permanentemente.`;
    if (deletionErrors > 0) {
      message += ` (${deletionErrors} erro(s) durante a exclusão).`;
    }
    res.json({ success: true, message });
  } catch (error) {
    console.error('Erro ao esvaziar a lixeira (DB):', error);
    res
      .status(500)
      .json({ success: false, message: 'Erro ao esvaziar a lixeira (DB).' });
  }
});

router.get(
  '/:tournamentId/export/players',
  authMiddleware,
  async (req, res) => {
    const { tournamentId } = req.params;
    if (!isValidTournamentId(tournamentId)) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }
    try {
      const players = await playerModel.getPlayersByTournamentId(tournamentId);

      if (!Array.isArray(players)) {
        throw new Error('Formato de jogadores inválido do banco de dados.');
      }
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="players_${tournamentId}.json"`
      );
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(players, null, 2));
    } catch (error) {
      console.error(
        `Erro ao exportar jogadores para o torneio ${tournamentId} (DB):`,
        error
      );
      res
        .status(500)
        .json({ success: false, message: 'Erro ao exportar jogadores (DB).' });
    }
  }
);

router.get('/:tournamentId/export/scores', authMiddleware, async (req, res) => {
  const { tournamentId } = req.params;
  if (!isValidTournamentId(tournamentId)) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  try {
    const scores = await scoreModel.getScoresByTournamentId(tournamentId);

    if (!Array.isArray(scores)) {
      throw new Error('Formato de scores inválido do banco de dados.');
    }
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="scores_${tournamentId}.json"`
    );
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(scores, null, 2));
  } catch (error) {
    console.error(
      `Erro ao exportar placares para o torneio ${tournamentId} (DB):`,
      error
    );
    res
      .status(500)
      .json({ success: false, message: 'Erro ao exportar placares (DB).' });
  }
});

router.get(
  '/:tournamentId/export/bracket',
  authMiddleware,
  async (req, res) => {
    const { tournamentId } = req.params;
    if (!isValidTournamentId(tournamentId)) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }
    try {
      const tournament = await tournamentModel.getTournamentById(tournamentId);
      if (!tournament || !tournament.state_json) {
        return res.status(404).json({
          success: false,
          message: 'Torneio ou estado (chaveamento) não encontrado no DB.',
        });
      }
      const state = JSON.parse(tournament.state_json);

      if (typeof state !== 'object' || state === null) {
        throw new Error(
          'Formato de estado (chaveamento) inválido do banco de dados.'
        );
      }
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="bracket_${tournamentId}.json"`
      );
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(state, null, 2));
    } catch (error) {
      console.error(
        `Erro ao exportar chaveamento para o torneio ${tournamentId} (DB):`,
        error
      );
      res.status(500).json({
        success: false,
        message: 'Erro ao exportar chaveamento (DB).',
      });
    }
  }
);

module.exports = router;
