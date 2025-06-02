import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PropTypes from 'prop-types';
// Consider importing specific icons from lucide-react if needed for titles, or pass them as props.

const NotificationItem = ({ notification }) => {
  const timeAgo = notification.timestamp
    ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: ptBR })
    : '';

  const getTitleForType = (type) => {
    const titles = {
      tournament_created: 'Novo Torneio Criado',
      tournament_updated: 'Torneio Atualizado',
      tournament_cancelled: 'Torneio Cancelado',
      tournament_deleted: 'Torneio Excluído',
      tournament_started: 'Torneio Iniciado',
      tournament_completed: 'Torneio Concluído',
      player_added: 'Novo Jogador Adicionado',
      player_updated: 'Jogador Atualizado',
      player_removed: 'Jogador Removido',
      player_deactivated: 'Jogador Desativado',
      score_added: 'Novo Placar Registrado',
      score_updated: 'Placar Atualizado',
      score_deleted: 'Placar Removido',
      bracket_updated: 'Chaveamento Atualizado',
      // System / Admin notifications
      system_maintenance: 'Manutenção Programada',
      security_alert: 'Alerta de Segurança',
      backup_success: 'Backup Concluído',
      backup_failed: 'Falha no Backup',
      new_user_registered: 'Novo Usuário Registrado',
      user_role_changed: 'Permissões de Usuário Alteradas',
      settings_updated: 'Configurações Atualizadas',
      default: 'Nova Notificação',
    };
    return titles[type] || titles.default;
  };

  const getContentForNotification = (notificationData) => {
    const { type, data } = notificationData;

    switch (type) {
      case 'tournament_created':
        return `O torneio "${data?.name || 'Novo Torneio'}" foi criado.`;
      case 'tournament_updated':
        return `O torneio "${data?.tournament?.name || 'ID: ' + data?.tournamentId}" foi atualizado.`;
      case 'tournament_cancelled':
        return `O torneio "${data?.name || 'Um torneio'}" foi cancelado.`;
      case 'tournament_deleted':
        return `O torneio "${data?.name || 'Um torneio'}" foi excluído permanentemente.`;
      case 'tournament_started':
        return `O torneio "${data?.name || 'Um torneio'}" começou!`;
      case 'tournament_completed':
        return `O torneio "${data?.name || 'Um torneio'}" foi concluído.`;
      case 'player_added':
        return `${data?.playerName || 'Um jogador'}${data?.playerNickname ? ` (${data.playerNickname})` : ''} foi adicionado ao torneio "${data?.tournamentName || ''}".`;
      case 'player_updated':
        return `As informações de ${data?.playerName || 'um jogador'} foram atualizadas.`;
      case 'player_removed':
        return `${data?.playerName || 'Um jogador'} foi removido do torneio "${data?.tournamentName || ''}".`;
      case 'player_deactivated':
        return `${data?.playerName || 'Um jogador'} foi desativado no torneio "${data?.tournamentName || ''}".`;
      case 'score_added':
        return `Novo placar: ${data?.player1Name || 'Jogador 1'} ${data?.player1Score} x ${data?.player2Score} ${data?.player2Name || 'Jogador 2'} (Torneio: ${data?.tournamentName || 'N/A'}).`;
      case 'score_updated':
        return `Placar atualizado: ${data?.player1Name || 'Jogador 1'} ${data?.player1Score} x ${data?.player2Score} ${data?.player2Name || 'Jogador 2'} (Torneio: ${data?.tournamentName || 'N/A'}).`;
      case 'score_deleted':
        return `Um placar foi removido do torneio "${data?.tournamentName || 'N/A'}".`;
      case 'bracket_updated':
        return `O chaveamento do torneio "${data?.tournamentName || 'N/A'}" foi atualizado.`;
      case 'system_maintenance':
        return `Manutenção do sistema agendada para ${data?.time || 'em breve'}. ${data?.details || ''}`;
      case 'security_alert':
        return `Alerta de segurança: ${data?.alertType || 'Atividade suspeita detectada'}. ${data?.details || ''}`;
      case 'backup_success':
        return `Backup do sistema concluído com sucesso em ${data?.timestamp || ''}.`;
      case 'backup_failed':
        return `Falha ao realizar backup do sistema. Motivo: ${data?.reason || 'Desconhecido'}.`;
      case 'new_user_registered':
        return `Novo usuário registrado: ${data?.username || 'Usuário'}.`;
      case 'user_role_changed':
        return `As permissões do usuário ${data?.username || 'Usuário'} foram alteradas para ${data?.newRole || 'nova role'}.`;
      case 'settings_updated':
        return `As configurações de "${data?.settingName || 'Sistema'}" foram atualizadas.`;
      default:
        return data?.message || 'Nova notificação recebida.';
    }
  };

  return (
    <div
      className="border-b border-green-700/50 last:border-b-0 p-3 hover:bg-green-700/40 transition-colors duration-150 cursor-pointer"
      onClick={() => notification.onClick?.()} // Optional onClick handler for the notification itself
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          notification.onClick?.();
        }
      }}
      role="button"
      tabIndex={0} // Added tabIndex for keyboard accessibility
    >
      <div className="font-semibold text-sm text-amber-400">
        {getTitleForType(notification.type)}
      </div>
      {/* Using line-clamp-2 for longer messages */}
      <div className="text-sm mt-1 text-neutral-200 line-clamp-2">
        {getContentForNotification(notification)}
      </div>
      <div className="text-xs text-neutral-400 mt-1.5">{timeAgo}</div>
    </div>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    type: PropTypes.string.isRequired,
    timestamp: PropTypes.string,
    data: PropTypes.object,
    onClick: PropTypes.func,
  }).isRequired,
};

export default NotificationItem;
