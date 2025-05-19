import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MessageContainer from '../common/MessageContainer';
import { useMessage } from '../../context/MessageContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { messages } = useMessage();

  // Fechar sidebar ao navegar para uma nova rota
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Função para alternar a visibilidade do sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header principal */}
      <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar com navegação */}
        <Sidebar isOpen={sidebarOpen} />

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-auto p-4 md:p-6 transition-all">
          {/* Container de mensagens para notificações */}
          <MessageContainer messages={messages} />

          {/* Conteúdo da página atual */}
          <div className="py-4">{children}</div>
        </main>
      </div>

      {/* Overlay para quando o sidebar estiver aberto em dispositivos móveis */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;
