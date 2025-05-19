const { logger } = require('../logger/logger');

function isValidTournamentId(id) {
  if (!id || typeof id !== 'string') return false;
  // Basic check for path traversal or overly long IDs
  if (id.includes('..') || id.includes('/') || id.length > 255) {
    logger.warn(
      'ValidationUtils',
      'Tentativa de usar ID de torneio potencialmente malicioso ou inválido.',
      { id }
    );
    return false;
  }
  // Add more specific validation if tournament IDs have a known format, e.g., regex
  return true;
}

function isValidPlayerId(id) {
  // Assuming player IDs are integers
  const numId = parseInt(id, 10);
  return Number.isInteger(numId) && numId > 0;
}

function isValidScoreId(id) {
  // Assuming score IDs are integers
  const numId = parseInt(id, 10);
  return Number.isInteger(numId) && numId > 0;
}

// Add other validation functions as needed

module.exports = {
  isValidTournamentId,
  isValidPlayerId,
  isValidScoreId,
};
