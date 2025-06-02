import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { MESSAGE_TYPES, MESSAGE_POSITIONS, MESSAGE_BEHAVIORS } from '../config/messageConfig';

const MessageContext = createContext();

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage deve ser usado dentro de um MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [config, setConfig] = useState({
    position: MESSAGE_POSITIONS.TOP_RIGHT,
    behavior: MESSAGE_BEHAVIORS.STACK,
    maxVisible: 3, // Número máximo de mensagens visíveis simultaneamente
    defaultTimeout: 5000,
  });
  const timerIdsRef = useRef(new Map()); // Armazena IDs de timeout para limpeza
  const messageQueueRef = useRef([]); // Fila de mensagens para comportamento QUEUE

  // Remove uma mensagem pelo ID
  const removeMessage = useCallback(
    (id) => {
      setMessages((prev) => prev.filter((message) => message.id !== id));

      // Limpar o timeout associado
      if (timerIdsRef.current.has(id)) {
        clearTimeout(timerIdsRef.current.get(id));
        timerIdsRef.current.delete(id);
      }

      // Se estiver usando modo de fila, verifica se há mensagens pendentes
      if (config.behavior === MESSAGE_BEHAVIORS.QUEUE && messageQueueRef.current.length > 0) {
        const nextMessage = messageQueueRef.current.shift();
        addMessageInternal(
          nextMessage.text,
          nextMessage.type,
          nextMessage.timeout,
          nextMessage.options
        );
      }
    },
    [config.behavior]
  );

  // Função interna para adicionar mensagens (não exposta diretamente)
  const addMessageInternal = useCallback(
    (text, type, timeout = config.defaultTimeout, options = {}) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
      const newMessage = {
        id,
        text,
        type,
        position: options.position || config.position,
        timestamp: Date.now(),
        ...options,
      };

      setMessages((prev) => {
        let updatedMessages;

        // Comportamento dependendo da configuração
        switch (config.behavior) {
          case MESSAGE_BEHAVIORS.REPLACE:
            // Substitui mensagens do mesmo tipo
            updatedMessages = [...prev.filter((msg) => msg.type !== type), newMessage];
            break;
          case MESSAGE_BEHAVIORS.QUEUE:
            // Se já existirem mensagens visíveis no máximo permitido, adiciona à fila
            if (prev.length >= config.maxVisible) {
              messageQueueRef.current.push({ text, type, timeout, options });
              return prev;
            }
            updatedMessages = [...prev, newMessage];
            break;
          case MESSAGE_BEHAVIORS.STACK:
          default: {
            // Limita o número de mensagens visíveis
            const visibleMessages = [...prev, newMessage];
            if (visibleMessages.length > config.maxVisible) {
              // Remove as mensagens mais antigas
              return visibleMessages.slice(-config.maxVisible);
            }
            updatedMessages = visibleMessages;
          }
        }

        return updatedMessages;
      });

      // Configurar remoção automática após timeout, se não for 0 (permanente)
      if (timeout !== 0) {
        const timerId = setTimeout(() => {
          removeMessage(id);
        }, timeout);

        timerIdsRef.current.set(id, timerId);
      }

      return id;
    },
    [config.behavior, config.maxVisible, config.position, config.defaultTimeout, removeMessage]
  );

  // Funções específicas para cada tipo de mensagem
  const showInfo = useCallback(
    (text, timeout, options = {}) => {
      return addMessageInternal(text, MESSAGE_TYPES.INFO, timeout, options);
    },
    [addMessageInternal]
  );

  const showSuccess = useCallback(
    (text, timeout, options = {}) => {
      return addMessageInternal(text, MESSAGE_TYPES.SUCCESS, timeout, options);
    },
    [addMessageInternal]
  );

  const showWarning = useCallback(
    (text, timeout, options = {}) => {
      return addMessageInternal(text, MESSAGE_TYPES.WARNING, timeout, options);
    },
    [addMessageInternal]
  );

  const showError = useCallback(
    (text, timeout, options = {}) => {
      return addMessageInternal(text, MESSAGE_TYPES.ERROR, timeout, options);
    },
    [addMessageInternal]
  );

  // Método genérico para mostrar mensagem - aceita diferentes formatos
  const showMessage = useCallback(
    (input, type = MESSAGE_TYPES.INFO, timeout, options = {}) => {
      // Se o input for um objeto (formato: {content, type, duration})
      if (typeof input === 'object' && input !== null) {
        const messageObj = input;
        const text = messageObj.content || messageObj.text || messageObj.message || '';
        const msgType = messageObj.type || type;
        const msgTimeout = messageObj.duration || messageObj.timeout || timeout;
        const msgOptions = { ...options, ...messageObj };

        // Validar tipo
        if (!Object.values(MESSAGE_TYPES).includes(msgType)) {
          console.warn(`Tipo de mensagem inválido: ${msgType}. Usando 'info' como padrão.`);
          return addMessageInternal(text, MESSAGE_TYPES.INFO, msgTimeout, msgOptions);
        }

        return addMessageInternal(text, msgType, msgTimeout, msgOptions);
      }

      // Se o input for uma string (formato tradicional)
      const text = input;
      if (!Object.values(MESSAGE_TYPES).includes(type)) {
        console.warn(`Tipo de mensagem inválido: ${type}. Usando 'info' como padrão.`);
        type = MESSAGE_TYPES.INFO;
      }
      return addMessageInternal(text, type, timeout, options);
    },
    [addMessageInternal]
  );

  // Função para atualizar a configuração global de mensagens
  const updateConfig = useCallback((newConfig) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }));
  }, []);

  // Limpar todas as mensagens
  const clearAllMessages = useCallback(() => {
    // Limpar todos os timeouts pendentes
    timerIdsRef.current.forEach((timerId) => clearTimeout(timerId));
    timerIdsRef.current.clear();

    // Limpar a fila
    messageQueueRef.current = [];

    // Limpar mensagens visíveis
    setMessages([]);
  }, []);

  // Função para atualizar uma mensagem existente
  const updateMessage = useCallback((id, updates) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  const value = {
    messages,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showMessage,
    removeMessage,
    clearAllMessages,
    updateMessage,
    updateConfig,
    config,
    MESSAGE_TYPES,
    MESSAGE_POSITIONS,
    MESSAGE_BEHAVIORS,
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};

export default MessageContext;
