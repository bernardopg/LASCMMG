import React, { Suspense, useContext, useEffect, useState } from 'react';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { TournamentProvider } from './context/TournamentContext';
import api from './services/api'; // Import the api instance

// Componentes comuns
import MessageContainer from './components/common/MessageContainer';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Páginas de autenticação
import Login from './pages/Login';

// Outras Páginas (eagerly loaded)
import AddScorePage from './pages/AddScorePage';
import ScoresPage from './pages/ScoresPage';
import StatsPage from './pages/StatsPage';
import AdminMatchSchedulePage from './pages/admin/AdminMatchSchedulePage';
import AdminSecurityPage from './pages/admin/AdminSecurityPage';
import PlayersPage from './pages/admin/PlayersPage';
import SettingsPage from './pages/admin/SettingsPage';

// Admin Security Sub-Pages (eagerly loaded as they are children of a layout)
import SecurityBlockedIPs from './pages/admin/security/SecurityBlockedIPs';
import SecurityHoneypots from './pages/admin/security/SecurityHoneypots';
import SecurityOverview from './pages/admin/security/SecurityOverview';
import SecurityThreatAnalytics from './pages/admin/security/SecurityThreatAnalytics';

// Layouts
import AdminSecurityLayout from './components/layout/AdminSecurityLayout';
import ThemeContext from './context/ThemeContext';

// Lazy loaded pages
const BracketPage = React.lazy(() => import('./pages/BracketPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const CreateTournamentPage = React.lazy(() => import('./pages/admin/CreateTournamentPage'));
const AdminTournamentListPage = React.lazy(() => import('./pages/admin/AdminTournamentListPage'));
const AdminSchedulePage = React.lazy(() => import('./pages/admin/AdminSchedulePage'));
const AdminUserManagementPage = React.lazy(() => import('./pages/admin/AdminUserManagementPage')); // Added

// Loading fallback component for Suspense
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
  </div>
);

// Layout principal
const MainLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  const { theme, toggleTheme } = useContext(ThemeContext);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  };

  useEffect(() => {
    if (isSidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed-app');
    } else {
      document.body.classList.remove('sidebar-collapsed-app');
    }
  }, [isSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] dark:bg-gray-900 dark:text-gray-100">
      <Header
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebarCollapse={toggleSidebarCollapse}
        currentTheme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="flex">
        <Sidebar isSidebarCollapsed={isSidebarCollapsed} />
        <main
          className={`flex-1 p-6 pt-8 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}
        >
          <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
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
  useEffect(() => {
    // Fetch CSRF token when the app loads to ensure the cookie is set
    api.get('/api/csrf-token')
      .then(response => {
        console.log('CSRF token endpoint contacted successfully. Cookie should be set by browser.');
        // If you need to use the token value directly from the response for some reason:
        // const tokenFromResponse = response.data.csrfToken;
        // console.log('CSRF Token from response body:', tokenFromResponse);
      })
      .catch(error => {
        console.error('Error fetching CSRF token on app load:', error);
        // Handle error appropriately, maybe show a message to the user
        // or retry, depending on how critical this is for app startup.
      });
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <AuthProvider>
      <MessageProvider>
        <TournamentProvider>
          <Router>
            <MessageContainer />
            <Routes>
              <Route path="/login" element={<Login />} />
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
              <Route
                path="/players"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PlayersPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
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
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
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
              {/* Admin Tournament List Page */}
              <Route
                path="/admin/tournaments"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AdminTournamentListPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AdminUserManagementPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/schedule"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AdminSchedulePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/match-schedule"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <React.Suspense fallback={<PageLoadingFallback />}>
                        <AdminMatchSchedulePage />
                      </React.Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
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
              <Route
                path="/admin/security"
                element={
                  <ProtectedRoute>
                    <AdminSecurityLayout>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <AdminSecurityPage /> {/* This renders an <Outlet /> */}
                      </Suspense>
                    </AdminSecurityLayout>
                  </ProtectedRoute>
                }
              >
                <Route index element={<SecurityOverview />} />
                <Route path="overview" element={<SecurityOverview />} />
                <Route path="honeypots" element={<SecurityHoneypots />} />
                <Route path="threat-analytics" element={<SecurityThreatAnalytics />} />
                <Route path="blocked-ips" element={<SecurityBlockedIPs />} />
              </Route>
              <Route
                path="*"
                element={
                  <div className="flex items-center justify-center min-h-screen bg-[var(--bg-color)]">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-[var(--color-primary)]">404</h1>
                      <p className="text-2xl text-gray-300 mt-4">Página não encontrada</p>
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
