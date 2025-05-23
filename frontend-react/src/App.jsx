import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { NotificationProvider } from './context/NotificationContext';
import { TournamentProvider } from './context/TournamentContext';
import AppRouter from './router/AppRouterOptimized';
import { useTheme } from './context/ThemeContext';

function App() {
  // Contextos principais
  const { loading: authLoading } = useAuth();
  const { theme, isDarkTheme } = useTheme();

  // Estados de layout
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Auto-colapsar sidebar em telas pequenas
      if (mobile) {
        setIsSidebarCollapsed(true);
        setIsMobileSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Aplicar classe do tema ao body
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Handlers para controle do sidebar
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  // Loading inicial da autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`App ${isDarkTheme ? 'dark' : ''}`}>
      <MessageProvider>
        <NotificationProvider>
          <TournamentProvider>
            <AppRouter
              isSidebarCollapsed={isSidebarCollapsed}
              isMobileSidebarOpen={isMobileSidebarOpen}
              isMobile={isMobile}
              currentTheme={theme}
              toggleSidebarCollapse={toggleSidebarCollapse}
              toggleMobileSidebar={toggleMobileSidebar}
              closeMobileSidebar={closeMobileSidebar}
            />
          </TournamentProvider>
        </NotificationProvider>
      </MessageProvider>
    </div>
  );
}

export default App;
