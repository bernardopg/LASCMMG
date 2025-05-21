import React, { createContext, useContext, useState, useCallback } from 'react'; // Added useCallback

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

  const removeMessage = useCallback((id) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  }, [setMessages]); // setMessages is stable

  const addMessage = useCallback((text, type, timeout = 5000) => {
    const id = Date.now().toString();
    setMessages((prev) => [...prev, { id, text, type }]);
    const timerId = setTimeout(() => { // Store timerId to potentially clear it if needed
      removeMessage(id);
    }, timeout);
    return { id, timerId }; // Return id and timerId
  }, [setMessages, removeMessage]); // removeMessage is now a dependency

  const showInfo = useCallback((text, timeout) => addMessage(text, 'info', timeout), [addMessage]);
  const showSuccess = useCallback((text, timeout) => addMessage(text, 'success', timeout), [addMessage]);
  const showWarning = useCallback((text, timeout) => addMessage(text, 'warning', timeout), [addMessage]);
  const showError = useCallback((text, timeout) => addMessage(text, 'error', timeout), [addMessage]);

  const value = {
    messages,
    // addMessage, // Expose specific show* functions instead of generic addMessage if preferred
    // removeMessage, // removeMessage is mostly internal due to timeout
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
