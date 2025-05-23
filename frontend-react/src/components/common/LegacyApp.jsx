import React, { Suspense, useContext, useEffect, useState } from 'react';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from 'react-router-dom';
import MessageContainer from './MessageContainer';
import AdminSecurityLayout from '../layout/AdminSecurityLayout';
import Footer from '../layout/Footer'; // Import Footer
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { MessageProvider } from '../../context/MessageContext';
import { NotificationProvider } from '../../context/NotificationContext';
import ThemeContext from '../../context/ThemeContext';
import { TournamentProvider } from '../../context/TournamentContext';
import AddScoreLandingPage from '../../pages/AddScoreLandingPage'; // Import AddScoreLandingPage
import AddScorePage from '../../pages/AddScorePage';
import Home from '../../pages/Home';
import Login from '../../pages/Login';
import NotFoundPage from '../../pages/NotFound';
import PlayerProfilePage from '../../pages/PlayerProfilePage'; // Import PlayerProfilePage
import ProfilePage from '../../pages/ProfilePage';
import RegisterPage from '../../pages/RegisterPage'; // Import RegisterPage
import ScoresPage from '../../pages/ScoresPage';
import StatsPage from '../../pages/StatsPage';
import TournamentDetailPage from '../../pages/TournamentDetailPage';
import TournamentsPage from '../../pages/TournamentsPage';
import AdminActivityLogPage from '../../pages/admin/AdminActivityLogPage';
import AdminMatchSchedulePage from '../../pages/admin/AdminMatchSchedulePage';
import AdminReportsPage from '../../pages/admin/AdminReportsPage';
import AdminSecurityPage from '../../pages/admin/AdminSecurityPage';
import CreatePlayerPage from '../../pages/admin/CreatePlayerPage';
import EditPlayerPage from '../../pages/admin/EditPlayerPage'; // Import EditPlayerPage
import EditTournamentPage from '../../pages/admin/EditTournamentPage';
import ManageTournamentPage from '../../pages/admin/ManageTournamentPage';
import PlayersPage from '../../pages/admin/PlayersPage'; // Already imported
import SettingsPage from '../../pages/admin/SettingsPage';
import AdminTournamentDetailPage from '../../pages/admin/AdminTournamentDetailPage';
import SecurityBlockedIPs from '../../pages/admin/security/SecurityBlockedIPs';
import SecurityHoneypots from '../../pages/admin/security/SecurityHoneypots';
import SecurityOverview from '../../pages/admin/security/SecurityOverview';
import SecurityThreatAnalytics from '../../pages/admin/security/SecurityThreatAnalytics';

// Lazy loaded pages
const BracketPage = React.lazy(() => import('../../pages/BracketPage'));
const AdminDashboardPage = React.lazy(() => import('../../pages/admin/Dashboard'));
const CreateTournamentPage = React.lazy(
  () => import('../../pages/admin/CreateTournamentPage')
);
const AdminTournamentListPage = React.lazy(
  () => import('../../pages/admin/AdminTournamentListPage')
);
const AdminSchedulePage = React.lazy(
  () => import('../../pages/admin/AdminSchedulePage')
);
const AdminUserManagementPage = React.lazy(
  () => import('../../pages/admin/AdminUserManagementPage')
);

// Loading fallback component for Suspense
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
  </div>
);

// Componente wrapper para lidar com o evento de não autorizado
const AppContentWrapper = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      if (window.location.pathname !== '/login') {
        console.log('Unauthorized event received, navigating to login.');
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  return null;
};

// Layout principal
const MainLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { theme, toggleTheme } = useContext(ThemeContext);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  };

  // Monitor window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Automatically close sidebar on mobile when resizing
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (isSidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed-app');
    } else {
      document.body.classList.remove('sidebar-collapsed-app');
    }
  }, [isSidebarCollapsed]);

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebarCollapse={toggleSidebarCollapse}
        toggleMobileSidebar={toggleMobileSidebar}
        isMobile={isMobile}
        currentTheme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Overlay for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300"
          onClick={toggleMobileSidebar}
        />
      )}

      <div className="flex flex-col md:flex-row flex-1 min-h-[calc(100vh-4rem)] pt-16">
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out' : 'relative flex-shrink-0'}
          ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          ${isMobile ? 'mt-16' : ''}
        `}>
          <Sidebar isSidebarCollapsed={isMobile ? false : isSidebarCollapsed} />
        </div>

          <main className="flex-1 w-full" id="main-content" tabIndex="-1">
            {/* Adjusted padding to match the new fixed header */}
            <div className="pt-4 pb-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto transition-all duration-200">
              <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
            </div>
          </main>
      </div>
      <Footer />
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
        <NotificationProvider>
          <TournamentProvider>
            <Router>
              <AppContentWrapper />
              <MessageContainer />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Home />
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
                  path="/match/:matchId/add-score"
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
                        <TournamentsPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/players/:playerId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PlayerProfilePage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/players/create"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <CreatePlayerPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/players/edit/:playerId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <EditPlayerPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tournaments/:tournamentId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <TournamentDetailPage />
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
                  path="/admin/tournaments/:tournamentId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <AdminTournamentDetailPage />
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
                        <AdminMatchSchedulePage />
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
                  path="/admin/players"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PlayersPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <AdminReportsPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/activity-log"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <AdminActivityLogPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-score"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <AddScoreLandingPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tournaments/edit/:tournamentId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <EditTournamentPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tournaments/manage/:tournamentId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ManageTournamentPage />
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
                          <AdminSecurityPage />
                        </Suspense>
                      </AdminSecurityLayout>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<SecurityOverview />} />
                  <Route path="overview" element={<SecurityOverview />} />
                  <Route path="honeypots" element={<SecurityHoneypots />} />
                  <Route
                    path="threat-analytics"
                    element={<SecurityThreatAnalytics />}
                  />
                  <Route path="blocked-ips" element={<SecurityBlockedIPs />} />
                </Route>
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ProfilePage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
          </TournamentProvider>
        </NotificationProvider>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App;
