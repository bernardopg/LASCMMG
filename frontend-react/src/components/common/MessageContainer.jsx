import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react'; // Import Lucide icons
import { useEffect } from 'react';
import { useMessage } from '../../context/MessageContext';

const MessageContainer = () => {
  const { messages, removeMessage } = useMessage();

  // Focusar no alerta quando adicionado, para acessibilidade
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessageContainer = document.querySelector('.message-item:last-child');
      if (latestMessageContainer) {
        // Try to focus the close button within the latest message
        const closeButton = latestMessageContainer.querySelector('button');
        if (closeButton) {
          closeButton.focus();
        } else {
          // Fallback to focusing the container if no button (should not happen with current structure)
          latestMessageContainer.focus();
        }
      }
    }
  }, [messages]);

  // Função para obter as classes CSS baseadas no tipo de mensagem
  const getMessageClasses = (type) => {
    const baseClasses =
      'message-item rounded-xl p-4 mb-3 flex items-start justify-between shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 backdrop-blur-md border'; // Removida a classe animate-fade-in

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-700/70 border-green-600/60 text-lime-200 focus:ring-lime-400 focus:ring-offset-transparent`;
      case 'error':
        return `${baseClasses} bg-red-700/70 border-red-600/60 text-red-200 focus:ring-red-400 focus:ring-offset-transparent`;
      case 'warning':
        return `${baseClasses} bg-amber-700/70 border-amber-600/60 text-amber-200 focus:ring-amber-400 focus:ring-offset-transparent`;
      case 'info':
      default:
        return `${baseClasses} bg-sky-700/70 border-sky-600/60 text-sky-200 focus:ring-sky-400 focus:ring-offset-transparent`;
    }
  };

  // Ícone para os diferentes tipos de mensagem
  const getMessageIcon = (type) => {
    const iconProps = { className: 'h-5 w-5', 'aria-hidden': 'true' };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className={`${iconProps.className} text-lime-300`} />;
      case 'error':
        return <XCircle {...iconProps} className={`${iconProps.className} text-red-300`} />;
      case 'warning':
        return <AlertTriangle {...iconProps} className={`${iconProps.className} text-amber-300`} />;
      case 'info':
      default:
        return <Info {...iconProps} className={`${iconProps.className} text-sky-300`} />;
    }
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {messages.map((message) => (
          <div
            key={message.id}
            className={getMessageClasses(message.type)}
            // tabIndex="0" removed to fix jsx-a11y/no-noninteractive-tabindex
            role="alert"
          >
            <div className="flex">
              <div className="flex-shrink-0">{getMessageIcon(message.type)}</div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => removeMessage(message.id)}
                  className="inline-flex rounded-md p-1.5 text-neutral-300 hover:bg-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-neutral-400"
                >
                  <span className="sr-only">Fechar</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageContainer;
