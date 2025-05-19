import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { TournamentProvider } from './context/TournamentContext';

// Componentes comuns
import MessageContainer from './components/common/MessageContainer';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Páginas de autenticação
import Login from './pages/Login';

// Outras Páginas
import ScoresPage from './pages/ScoresPage';
import AddScorePage from './pages/AddScorePage';
import StatsPage from './pages/StatsPage';
import BracketPage from './pages/BracketPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSecurityPage from './pages/admin/AdminSecurityPage';

// Admin Security Sub-Pages
import SecurityOverview from './pages/admin/security/SecurityOverview';
import SecurityHoneypots from './pages/admin/security/SecurityHoneypots';
import SecurityThreatAnalytics from './pages/admin/security/SecurityThreatAnalytics';
import SecurityBlockedIPs from './pages/admin/security/SecurityBlockedIPs';
import CreateTournamentPage from './pages/admin/CreateTournamentPage'; // Import new page

// Layouts
import AdminSecurityLayout from './components/layout/AdminSecurityLayout';
import { useState, useEffect, useContext } from 'react'; // Added useContext
import ThemeContext from './context/ThemeContext'; // Import ThemeContext

// Layout principal
const MainLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  // Consume ThemeContext
  const { theme, toggleTheme } = useContext(ThemeContext);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  };

  // Removed local theme state, toggleTheme, and useEffect for theme
  // as they are now handled by ThemeContext and ThemeProvider

  useEffect(() => {
    if (isSidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed-app');
    } else {
      document.body.classList.remove('sidebar-collapsed-app');
    }
  }, [isSidebarCollapsed]);

  return (
    // The 'dark' class on <html> is handled by ThemeProvider.
    // bg- and text- colors here should use Tailwind's dark: prefix for variations.
    // For now, assuming CSS variables handle dark mode theming.
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] dark:bg-gray-900 dark:text-gray-100">
      <Header
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebarCollapse={toggleSidebarCollapse}
        currentTheme={theme} // from context
        toggleTheme={toggleTheme} // from context
      />
      <div className="flex">
        <Sidebar isSidebarCollapsed={isSidebarCollapsed} />
        <main
          className={`flex-1 p-6 pt-8 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

// Placeholder para páginas ainda não implementadas
const PagePlaceholder = ({ title }) => {
  return (
    <div className="text-center py-16">
      <h1 className="text-3xl font-bold text-primary-light mb-4">{title}</h1>
      <p className="text-gray-300">Esta página será implementada em breve.</p>
    </div>
  );
};

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <TournamentProvider>
          <Router>
            <MessageContainer />
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />

              {/* Rotas protegidas - Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PagePlaceholder title="Dashboard" />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Histórico de Placares */}
              <Route
                path="/scores"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ScoresPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Adicionar Placar */}
              <Route
                path="/add-score"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AddScorePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Torneios */}
              <Route
                path="/tournaments"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PagePlaceholder title="Gerenciamento de Torneios" />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Jogadores */}
              <Route
                path="/players"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PagePlaceholder title="Gerenciamento de Jogadores" />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Brackets */}
              <Route
                path="/brackets"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <BracketPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Estatísticas */}
              <Route
                path="/stats"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <StatsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Configurações */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PagePlaceholder title="Configurações" />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AdminDashboardPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Create Tournament Page */}
              <Route
                path="/admin/tournaments/create"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CreateTournamentPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Security Section with Nested Routes */}
              <Route
                path="/admin/security"
                element={
                  <ProtectedRoute>
                    <AdminSecurityLayout>
                      <AdminSecurityPage />{' '}
                      {/* This now renders an <Outlet /> */}
                    </AdminSecurityLayout>
                  </ProtectedRoute>
                }
              >
                <Route index element={<SecurityOverview />} />{' '}
                {/* Default for /admin/security */}
                <Route path="overview" element={<SecurityOverview />} />
                <Route path="honeypots" element={<SecurityHoneypots />} />
                <Route
                  path="threat-analytics"
                  element={<SecurityThreatAnalytics />}
                />
                <Route path="blocked-ips" element={<SecurityBlockedIPs />} />
              </Route>

              {/* Página 404 */}
              <Route
                path="*"
                element={
                  <div className="flex items-center justify-center min-h-screen bg-[var(--bg-color)]">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-[var(--color-primary)]">
                        404
                      </h1>
                      <p className="text-2xl text-gray-300 mt-4">
                        Página não encontrada
                      </p>
                      <a
                        href="/"
                        className="mt-6 inline-block px-6 py-3 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-dark)] transition-colors"
                      >
                        Voltar para o início
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </Router>
        </TournamentProvider>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App;
