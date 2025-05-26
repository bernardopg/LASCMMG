import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { BsBell, BsBellFill } from 'react-icons/bs';
import { useNotification } from '../../context/NotificationContext';

const NotificationItem = ({ notification /* onClose */ }) => {
  // Formatar a data relativa
  const timeAgo = notification.timestamp
    ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: ptBR })
    : '';

  // Títulos personalizados com base no tipo de notificação
  const getTitleForType = (type) => {
    const titles = {
      tournament_created: 'Novo torneio criado',
      tournament_updated: 'Torneio atualizado',
      tournament_cancelled: 'Torneio cancelado',
      tournament_deleted: 'Torneio excluído',
      tournament_started: 'Torneio iniciado',
      tournament_completed: 'Torneio concluído',
      player_added: 'Novo jogador adicionado',
      player_updated: 'Jogador atualizado',
      player_removed: 'Jogador removido',
      player_deactivated: 'Jogador desativado',
      score_added: 'Novo placar registrado',
      score_updated: 'Placar atualizado',
      score_deleted: 'Placar removido',
      bracket_updated: 'Chaveamento atualizado',
    };
    return titles[type] || 'Notificação';
  };

  // Conteúdo personalizado com base no tipo e dados
  const getContentForNotification = (notification) => {
    const { type, data } = notification;

    switch (type) {
      case 'tournament_created':
        return `O torneio "${data.name}" foi criado.`;

      case 'tournament_updated':
        return `O torneio "${data.tournament?.name || 'ID: ' + data.tournamentId}" foi atualizado.`;

      case 'tournament_cancelled':
        return `O torneio "${data.name}" foi cancelado.`;

      case 'tournament_deleted':
        return `O torneio "${data.name}" foi excluído permanentemente.`;

      case 'tournament_started':
        return `O torneio "${data.name}" começou!`;

      case 'tournament_completed':
        return `O torneio "${data.name}" foi concluído.`;

      case 'player_added':
        return `${data.playerName}${data.playerNickname ? ` (${data.playerNickname})` : ''} foi adicionado ao torneio.`;

      case 'player_updated':
        return `As informações de ${data.playerName} foram atualizadas.`;

      case 'player_removed':
        return `${data.playerName} foi removido do torneio.`;

      case 'player_deactivated':
        return `${data.playerName} foi desativado no torneio.`;

      case 'score_added':
        return `Um novo placar foi registrado: ${data.player1Score} x ${data.player2Score}`;

      case 'score_updated':
        return 'Um placar foi atualizado.';

      case 'score_deleted':
        return 'Um placar foi removido.';

      case 'bracket_updated':
        return 'O chaveamento do torneio foi atualizado.';

      default:
        return 'Nova notificação recebida.';
    }
  };

  return (
    <div className="border-b border-gray-200 last:border-b-0 p-3 hover:bg-gray-50">
      <div className="font-semibold text-sm text-indigo-700">
        {getTitleForType(notification.type)}
      </div>
      <div className="text-sm mt-1">{getContentForNotification(notification)}</div>
      <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
    </div>
  );
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotification();

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 text-gray-600 hover:text-indigo-600 focus:outline-none"
        onClick={toggleNotifications}
        aria-label="Notificações"
      >
        {unreadCount > 0 ? (
          <>
            <BsBellFill className="h-6 w-6" />
            <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <BsBell className="h-6 w-6" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg overflow-hidden z-50 max-h-96 flex flex-col">
          <div className="py-2 px-3 bg-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium">Notificações</h3>
            <button
              onClick={clearNotifications}
              className="text-xs text-gray-600 hover:text-red-600"
            >
              Limpar
            </button>
          </div>

          <div className="overflow-y-auto flex-grow">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <NotificationItem
                  key={`${notification.type}-${index}`}
                  notification={notification}
                  onClose={() => setIsOpen(false)}
                />
              ))
            ) : (
              <div className="p-4 text-sm text-center text-gray-500">
                Nenhuma notificação recente
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
