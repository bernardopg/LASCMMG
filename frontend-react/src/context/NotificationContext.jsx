import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useMessage } from './MessageContext';
import { getServerUrl } from '../utils/urlUtils';
import { notificationMessages } from '../config/notificationMessages';

// Criar o contexto de notificações
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, currentUser } = useAuth();
  const { showMessage } = useMessage();

  // Inicializar a conexão do Socket.IO
  useEffect(() => {
    // Só conectar se o usuário estiver autenticado
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(getServerUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    // Configurar listeners de eventos
    socketInstance.on('connect', () => {
      console.log('Socket.IO conectado');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`Socket.IO desconectado: ${reason}`);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Erro de conexão Socket.IO:', error);
      setIsConnected(false);
    });

    // Ouvir notificações globais (para todos os usuários)
    socketInstance.on('global_notification', (notification) => {
      console.log('Notificação global recebida:', notification);
      handleNewNotification(notification);
    });

    // Ouvir notificações específicas de torneio
    socketInstance.on('tournament_notification', (notification) => {
      console.log('Notificação de torneio recebida:', notification);
      handleNewNotification(notification);
    });

    setSocket(socketInstance);

    // Limpar ao desmontar
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, currentUser]);

  // Função para manipular novas notificações recebidas
  const handleNewNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Manter apenas as últimas 50 notificações
    setUnreadCount((prev) => prev + 1);

    // Se tivermos uma mensagem para este tipo de notificação
    if (notificationMessages[notification.type]) {
      showMessage({
        type: 'info',
        content: notificationMessages[notification.type],
        duration: 5000,
      });
    }
  };

  // Assinar em um torneio específico
  const subscribeTournament = (tournamentId) => {
    if (socket && tournamentId) {
      socket.emit('subscribe', tournamentId);
      console.log(`Inscrito no torneio: ${tournamentId}`);
    }
  };

  // Cancelar inscrição em um torneio específico
  const unsubscribeTournament = (tournamentId) => {
    if (socket && tournamentId) {
      socket.emit('unsubscribe', tournamentId);
      console.log(`Inscrição cancelada no torneio: ${tournamentId}`);
    }
  };

  // Marcar todas as notificações como lidas
  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  // Limpar todas as notificações
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Contexto que será fornecido para componentes filhos
  const contextValue = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    subscribeTournament,
    unsubscribeTournament,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>
  );
};

// Hook para usar o contexto de notificações
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};
