import { createContext, useContext, useState } from 'react';

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

  const addMessage = (text, type, timeout = 5000) => {
    const id = Date.now().toString();
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      removeMessage(id);
    }, timeout);
    return id;
  };

  const removeMessage = (id) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  };

  const showInfo = (text, timeout) => addMessage(text, 'info', timeout);
  const showSuccess = (text, timeout) => addMessage(text, 'success', timeout);
  const showWarning = (text, timeout) => addMessage(text, 'warning', timeout);
  const showError = (text, timeout) => addMessage(text, 'error', timeout);

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
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
};

export default MessageContext;
