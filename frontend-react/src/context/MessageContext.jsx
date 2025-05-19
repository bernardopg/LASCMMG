import { createContext, useContext, useState } from 'react';

// Criar o context
const MessageContext = createContext();

// Hook personalizado para usar o context
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage deve ser usado dentro de um MessageProvider');
  }
  return context;
};

// Provider component
export const MessageProvider = ({ children }) => {
  // Estado para gerenciar as mensagens
  const [messages, setMessages] = useState([]);

  // Função para adicionar uma nova mensagem
  const addMessage = (text, type, timeout = 5000) => {
    const id = Date.now().toString();

    // Adicionar mensagem ao estado
    setMessages((prev) => [...prev, { id, text, type }]);

    // Remover mensagem após o timeout
    setTimeout(() => {
      removeMessage(id);
    }, timeout);

    return id;
  };

  // Função para remover uma mensagem por id
  const removeMessage = (id) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  };

  // Funções de conveniência para diferentes tipos de mensagens
  const showInfo = (text, timeout) => addMessage(text, 'info', timeout);
  const showSuccess = (text, timeout) => addMessage(text, 'success', timeout);
  const showWarning = (text, timeout) => addMessage(text, 'warning', timeout);
  const showError = (text, timeout) => addMessage(text, 'error', timeout);

  // Valor fornecido pelo context
  const value = {
    messages,
    addMessage,
    removeMessage,
    showInfo,
    showSuccess,
    showWarning,
    showError,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext;
