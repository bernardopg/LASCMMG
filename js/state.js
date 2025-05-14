let _tournamentsList = [];
let _currentTournamentId = null;
let _tournamentState = {};
let _playersList = [];
let _currentScores = [];
let _adminScoreSortColumn = null;
let _adminScoreSortDirection = 'asc';
let _trashedTournamentsList = [];

export function getTournamentsList() {
  return [..._tournamentsList];
}

export function getCurrentTournamentId() {
  return _currentTournamentId;
}

export function getTournamentState() {
  return { ..._tournamentState };
}

export function getPlayersList() {
  return [..._playersList];
}

export function getCurrentScores() {
  return [..._currentScores];
}

export function getAdminScoreSortColumn() {
  return _adminScoreSortColumn;
}

export function getAdminScoreSortDirection() {
  return _adminScoreSortDirection;
}

export function getTrashedTournamentsList() {
  return [..._trashedTournamentsList];
}

export function setTournamentsList(list) {
  if (Array.isArray(list)) {
    _tournamentsList = list;
  } else {
    console.error('Attempted to set tournamentsList with non-array:', list);
    _tournamentsList = [];
  }
}

export function setCurrentTournamentId(id) {
  _currentTournamentId = id;
  if (!id) {
    _tournamentState = {};
    _playersList = [];
    _currentScores = [];
  }
}

export function setTournamentState(state) {
  if (typeof state === 'object' && state !== null) {
    _tournamentState = state;
    if (!_tournamentState.matches) {
      _tournamentState.matches = {};
    }
  } else {
    console.error('Attempted to set tournamentState with non-object:', state);
    _tournamentState = { matches: {} };
  }
}

export function setPlayersList(list) {
  if (Array.isArray(list)) {
    _playersList = list
      .map((player, index) => ({
        name: player.PlayerName?.trim(),
        nickname: player.Nickname?.trim() || '',
        originalIndex: index,
        serverData: player,
      }))
      .filter((p) => p.name);
  } else {
    console.error('Attempted to set playersList with non-array:', list);
    _playersList = [];
  }
}

export function setCurrentScores(scores) {
  if (Array.isArray(scores)) {
    _currentScores = scores;
  } else {
    console.error('Attempted to set currentScores with non-array:', scores);
    _currentScores = [];
  }
}

export function setAdminScoreSort(column, direction) {
  _adminScoreSortColumn = column;
  _adminScoreSortDirection =
    direction === 'asc' || direction === 'desc' ? direction : 'asc';
}

export function setTrashedTournamentsList(list) {
  if (Array.isArray(list)) {
    _trashedTournamentsList = list;
  } else {
    console.error(
      'Attempted to set trashedTournamentsList with non-array:',
      list
    );
    _trashedTournamentsList = [];
  }
}

export function findTournamentById(id) {
  return _tournamentsList.find((t) => t.id === id);
}

export function findPlayersListEntryByName(name) {
  if (!name) return undefined;
  const lowerCaseName = name.toLowerCase();
  return _playersList.find((p) => p.name.toLowerCase() === lowerCaseName);
}
