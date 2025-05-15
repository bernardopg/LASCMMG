import * as ui from '../uiUtils.js';
import * as state from '../state.js';

const elements = {
  bracketContainer: document.getElementById('bracket'),
};

export function renderBracket() {
  if (!elements.bracketContainer) {
    console.error('Bracket container element not found.');
    return;
  }
  elements.bracketContainer.innerHTML = '';

  const tournamentState = state.getTournamentState();
  const bracketType = tournamentState?.bracket_type || 'single-elimination';

  if (
    !tournamentState?.matches ||
    Object.keys(tournamentState.matches).length === 0
  ) {
    elements.bracketContainer.innerHTML =
      '<div class="no-data"><p>Nenhum chaveamento disponível para este torneio.</p></div>';
    return;
  }

  const displayContainer = document.createElement('div');
  displayContainer.classList.add('bracket-display-container');
  elements.bracketContainer.appendChild(displayContainer);

  const matchesByBracket = { WB: [], LB: [], GF: [] };
  Object.entries(tournamentState.matches).forEach(([id, match]) => {
    const bracketKey = match.bracket?.toUpperCase() || 'WB';
    if (matchesByBracket[bracketKey]) {
      matchesByBracket[bracketKey].push({ id, ...match });
    } else {
      matchesByBracket.WB.push({ id, ...match });
    }
  });

  if (matchesByBracket.WB.length > 0) {
    const wbContainer = document.createElement('div');
    wbContainer.classList.add('bracket-section', 'winners-bracket');
    const wbTitle = document.createElement('h3');
    wbTitle.textContent = 'Chave Superior (Winners)';
    wbTitle.classList.add('bracket-section-title');
    wbContainer.appendChild(wbTitle);
    renderPublicBracketSection(
      wbContainer,
      matchesByBracket.WB,
      bracketType === 'double-elimination' ? 'WB ' : ''
    );
    displayContainer.appendChild(wbContainer);
  }

  if (bracketType === 'double-elimination' && matchesByBracket.LB.length > 0) {
    const lbContainer = document.createElement('div');
    lbContainer.classList.add('bracket-section', 'losers-bracket');
    const lbTitle = document.createElement('h3');
    lbTitle.textContent = 'Chave Inferior (Losers)';
    lbTitle.classList.add('bracket-section-title');
    lbContainer.appendChild(lbTitle);
    renderPublicBracketSection(lbContainer, matchesByBracket.LB, 'LB ');
    displayContainer.appendChild(lbContainer);
  }

  if (matchesByBracket.GF.length > 0) {
    const gfContainer = document.createElement('div');
    gfContainer.classList.add('bracket-section', 'grand-final');
    const gfTitle = document.createElement('h3');
    gfTitle.textContent = 'Grande Final';
    gfTitle.classList.add('bracket-section-title');
    gfContainer.appendChild(gfTitle);
    renderPublicBracketSection(gfContainer, matchesByBracket.GF, '');
    displayContainer.appendChild(gfContainer);
  }

  addMatchClickListener();
}

function renderPublicBracketSection(container, matches, roundPrefix) {
  const matchesByRound = {};
  matches.forEach((match) => {
    const roundName = match.roundName || 'Desconhecida';
    if (!matchesByRound[roundName]) matchesByRound[roundName] = [];
    matchesByRound[roundName].push(match);
  });

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
  ];

  const sortedRoundNames = Object.keys(matchesByRound).sort((a, b) => {
    const indexA = roundOrder.indexOf(a);
    const indexB = roundOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    const numA = parseInt(a.split(' ').pop());
    const numB = parseInt(b.split(' ').pop());
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  const display = document.createElement('div');
  display.classList.add('bracket-display');
  container.appendChild(display);

  sortedRoundNames.forEach((roundName) => {
    const roundDiv = document.createElement('div');
    roundDiv.classList.add('round');

    const roundTitle = document.createElement('h4');
    roundTitle.textContent = roundName.startsWith(roundPrefix)
      ? roundName.substring(roundPrefix.length)
      : roundName;
    roundTitle.classList.add('round-title');
    roundDiv.appendChild(roundTitle);

    matchesByRound[roundName].sort((a, b) => parseInt(a.id) - parseInt(b.id));

    matchesByRound[roundName].forEach((match) => {
      const matchDiv = createMatchElement(match);
      roundDiv.appendChild(matchDiv);
    });
    display.appendChild(roundDiv);
  });
}

function createMatchElement(match) {
  const matchDiv = document.createElement('div');
  matchDiv.classList.add('match');
  matchDiv.dataset.matchId = match.id;
  matchDiv.setAttribute('tabindex', '0');
  matchDiv.setAttribute('role', 'button');

  const p1Name = match.players?.[0]?.name || 'A definir';
  const p2Name = match.players?.[1]?.name || 'A definir';
  const dateTimeInfo = ui.formatMatchDateTime(match.dateTime);
  matchDiv.setAttribute(
    'aria-label',
    `Partida ${match.id}: ${p1Name} vs ${p2Name}. ${match.winner !== null ? 'Concluída.' : 'Pendente.'} Data: ${dateTimeInfo}`
  );

  const p1Div = createPlayerElement(match.players?.[0]);
  matchDiv.appendChild(p1Div);

  const vs = document.createElement('div');
  vs.className = 'vs';
  vs.textContent = 'vs';
  matchDiv.appendChild(vs);

  const p2Div = createPlayerElement(match.players?.[1]);
  matchDiv.appendChild(p2Div);

  const dateTimeDiv = document.createElement('div');
  dateTimeDiv.className = 'match-datetime';
  dateTimeDiv.textContent = dateTimeInfo;
  matchDiv.appendChild(dateTimeDiv);

  return matchDiv;
}

function createPlayerElement(playerData, match) {
  const pDiv = document.createElement('div');
  pDiv.classList.add('player');

  const playerName = playerData?.name || 'A definir';
  const playerScore = playerData?.score;

  if (playerName && playerName !== 'A definir' && playerName !== 'BYE') {
    pDiv.classList.add('active-player');
  }

  const nameSpan = document.createElement('span');
  nameSpan.className = 'name';
  nameSpan.textContent = playerName;
  pDiv.appendChild(nameSpan);

  const scoreSpan = document.createElement('span');
  scoreSpan.classList.add('score');
  if (playerScore !== null && playerScore !== undefined) {
    scoreSpan.textContent = playerScore;
  } else {
    scoreSpan.textContent = '-';
    scoreSpan.classList.add('not-played');
  }
  pDiv.appendChild(scoreSpan);

  // Adicionar classes de vencedor/perdedor/campeão diretamente
  if (match && match.winner !== null && match.winner !== undefined) {
    const winnerIndex = parseInt(match.winner);
    const isWinner = match.players?.[winnerIndex]?.name === playerName;
    const isLoser = match.players?.[1 - winnerIndex]?.name === playerName;

    if (isWinner) {
      pDiv.classList.add('winner');
      if (
        match.roundName === 'Final' ||
        match.roundName === 'Grande Final' ||
        match.roundName === 'Grande Final Reset'
      ) {
        pDiv.classList.add('champion');
      }
    } else if (isLoser) {
      pDiv.classList.add('loser');
    }
  }

  return pDiv;
}

function addMatchClickListener() {
  if (!elements.bracketContainer) return;
  elements.bracketContainer.removeEventListener('click', handleMatchActivation);
  elements.bracketContainer.removeEventListener(
    'keydown',
    handleMatchActivation
  );
  elements.bracketContainer.addEventListener('click', handleMatchActivation);
  elements.bracketContainer.addEventListener('keydown', handleMatchActivation);
}

function handleMatchActivation(event) {
  const activatedMatch = event.target.closest('.match');
  if (!activatedMatch) return;

  if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ')
    return;
  if (event.key === ' ') event.preventDefault();

  const bracketContainer = elements.bracketContainer;
  if (!bracketContainer) return;
  const previouslySelected = bracketContainer.querySelector('.match.selected');
  if (previouslySelected && previouslySelected !== activatedMatch) {
    previouslySelected.classList.remove('selected');
  }
  activatedMatch.classList.toggle('selected');
}
