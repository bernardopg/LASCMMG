// Serviço de Notificações
const { logger } = require('../logger/logger');

let io;

/**
 * Inicializa o serviço de notificações com a instância do Socket.IO
 * @param {Object} socketIO - Instância do Socket.IO
 */
function init(socketIO) {
  if (!socketIO) {
    throw new Error('Socket.IO é necessário para o serviço de notificações');
  }

  io = socketIO;
  logger.info('Serviço de notificações inicializado');

  // Configuração básica do Socket.IO
  io.on('connection', (socket) => {
    logger.info(`Nova conexão Socket.IO: ${socket.id}`);

    // Quando um cliente se inscreve em um torneio específico
    socket.on('subscribe', (tournamentId) => {
      if (!tournamentId) return;

      const room = `tournament:${tournamentId}`;
      socket.join(room);
      logger.info(`Cliente ${socket.id} inscrito no torneio: ${tournamentId}`);
    });

    // Quando um cliente cancela a inscrição em um torneio
    socket.on('unsubscribe', (tournamentId) => {
      if (!tournamentId) return;

      const room = `tournament:${tournamentId}`;
      socket.leave(room);
      logger.info(`Cliente ${socket.id} cancelou inscrição no torneio: ${tournamentId}`);
    });

    // Manipula desconexão
    socket.on('disconnect', () => {
      logger.info(`Cliente desconectado: ${socket.id}`);
    });
  });
}

/**
 * Envia uma notificação para todos os clientes inscritos em um torneio específico
 * @param {number|string} tournamentId - ID do torneio
 * @param {string} eventType - Tipo de evento (por exemplo: 'update', 'score_added', 'bracket_updated')
 * @param {Object} data - Dados relacionados ao evento
 */
function sendTournamentNotification(tournamentId, eventType, data) {
  if (!io) {
    logger.error('Tentativa de enviar notificação antes de inicializar o serviço');
    return;
  }

  if (!tournamentId) {
    logger.error('tournamentId é obrigatório para enviar notificações');
    return;
  }

  const room = `tournament:${tournamentId}`;
  const notification = {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  };

  io.to(room).emit('tournament_notification', notification);
  logger.info(`Notificação enviada para o torneio ${tournamentId}: ${eventType}`);
}

/**
 * Envia uma notificação para todos os clientes
 * @param {string} eventType - Tipo de evento (por exemplo: 'system_update', 'new_tournament')
 * @param {Object} data - Dados relacionados ao evento
 */
function sendGlobalNotification(eventType, data) {
  if (!io) {
    logger.error('Tentativa de enviar notificação global antes de inicializar o serviço');
    return;
  }

  const notification = {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  };

  io.emit('global_notification', notification);
  logger.info(`Notificação global enviada: ${eventType}`);
}

module.exports = {
  init,
  sendTournamentNotification,
  sendGlobalNotification,
};
