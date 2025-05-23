import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Layout Components
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

// Public Pages
import Login from '../pages/Login';
import RegisterPage from '../pages/RegisterPage';
import NotFound from '../pages/NotFound';

// Protected Pages
import Home from '../pages/Home';
import TournamentsPage from '../pages/TournamentsPage';
import TournamentDetailPage from '../pages/TournamentDetailPage';
import BracketPage from '../pages/BracketPage';
import ScoresPage from '../pages/ScoresPage';
import StatsPage from '../pages/StatsPage';
import ProfilePage from '../pages/ProfilePage';
import PlayerProfilePage from '../pages/PlayerProfilePage';
import AddScoreLandingPage from '../pages/AddScoreLandingPage';
import AddScorePage from '../pages/AddScorePage';

// Admin Pages
import AdminDashboardPage from '../pages/AdminDashboardPage';
import Dashboard from '../pages/admin/Dashboard';
import PlayersPage from '../pages/admin/PlayersPage';
import CreatePlayerPage from '../pages/admin/CreatePlayerPage';
import EditPlayerPage from '../pages/admin/EditPlayerPage';
import CreateTournamentPage from '../pages/admin/CreateTournamentPage';
import EditTournamentPage from '../pages/admin/EditTournamentPage';
import ManageTournamentPage from '../pages/admin/ManageTournamentPage';
import AdminTournamentListPage from '../pages/admin/AdminTournamentListPage';
import AdminTournamentDetailPage from '../pages/admin/AdminTournamentDetailPage';
import AdminUserManagementPage from '../pages/admin/AdminUserManagementPage';
import AdminSecurityPage from '../pages/admin/AdminSecurityPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminActivityLogPage from '../pages/admin/AdminActivityLogPage';
import AdminMatchSchedulePage from '../pages/admin/AdminMatchSchedulePage';
import AdminSchedulePage from '../pages/admin/AdminSchedulePage';
import TrashPage from '../pages/admin/TrashPage';
import SettingsPage from '../pages/admin/SettingsPage';
import AdminPlaceholderPage from '../pages/admin/AdminPlaceholderPage';

// Admin Security Pages
import SecurityOverview from '../pages/admin/security/SecurityOverview';
import SecurityBlockedIPs from '../pages/admin/security/SecurityBlockedIPs';
import SecurityHoneypots from '../pages/admin/security/SecurityHoneypots';
import SecurityThreatAnalytics from '../pages/admin/security/SecurityThreatAnalytics';

// Route Protection Components
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
};

// Main Layout Component
const AppLayout = ({ children, layoutProps }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return children; // No layout for login/register pages
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <Header
        toggleSidebarCollapse={layoutProps?.toggleSidebarCollapse}
        toggleMobileSidebar={layoutProps?.toggleMobileSidebar}
        isMobile={layoutProps?.isMobile}
      />
      <div className="flex flex-1 pt-16"> {/* pt-16 for fixed header */}
        <Sidebar
          isCollapsed={layoutProps?.isSidebarCollapsed}
          isMobileOpen={layoutProps?.isMobileSidebarOpen}
          isMobile={layoutProps?.isMobile}
          onMobileClose={layoutProps?.closeMobileSidebar}
        />
        <main
          id="main-content"
          className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
            layoutProps?.isSidebarCollapsed ? 'ml-20' : 'ml-64'
          } ${layoutProps?.isMobile ? 'ml-0' : ''}`}
          role="main"
        >
          {children}
        </main>
      </div>
      <div
        className={`transition-all duration-300 ${
          layoutProps?.isSidebarCollapsed ? 'ml-20' : 'ml-64'
        } ${layoutProps?.isMobile ? 'ml-0' : ''}`}
      >
        <Footer />
      </div>
    </div>
  );
};

const AppRouter = ({
  isSidebarCollapsed,
  isMobileSidebarOpen,
  isMobile,
  currentTheme,
  toggleSidebarCollapse,
  toggleMobileSidebar,
  closeMobileSidebar
}) => {
  // Props do layout para passar para todos os componentes AppLayout
  const layoutProps = {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    isMobile,
    currentTheme,
    toggleSidebarCollapse,
    toggleMobileSidebar,
    closeMobileSidebar
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes with Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <Home />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Tournament Routes */}
        <Route
          path="/tournaments"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <TournamentsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:id"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <TournamentDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/brackets"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <BracketPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/brackets/:tournamentId"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <BracketPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Scores Routes */}
        <Route
          path="/scores"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <ScoresPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-score"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <AddScoreLandingPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-score/:matchId"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <AddScorePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Stats and Players */}
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <StatsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/players/:id"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <PlayerProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Profile Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout layoutProps={layoutProps}>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <AdminDashboardPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <Dashboard />
              </AppLayout>
            </AdminRoute>
          }
        />

        {/* Admin Player Management */}
        <Route
          path="/admin/players"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <PlayersPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/players/create"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <CreatePlayerPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/players/:id/edit"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <EditPlayerPage />
              </AppLayout>
            </AdminRoute>
          }
        />

        {/* Admin Tournament Management */}
        <Route
          path="/admin/tournaments"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <AdminTournamentListPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tournaments/create"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <CreateTournamentPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tournaments/:id"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <AdminTournamentDetailPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tournaments/:id/edit"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <EditTournamentPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tournaments/:id/manage"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <ManageTournamentPage />
              </AppLayout>
            </AdminRoute>
          }
        />

        {/* Admin System Management */}
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <AdminUserManagementPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/security"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <AdminSecurityPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/security/overview"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <SecurityOverview />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/security/blocked-ips"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <SecurityBlockedIPs />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/security/honeypots"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <SecurityHoneypots />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/security/threat-analytics"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <SecurityThreatAnalytics />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <AdminReportsPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/activity-log"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <AdminActivityLogPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/schedule"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <AdminSchedulePage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/match-schedule"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <AdminMatchSchedulePage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/trash"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <TrashPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <SettingsPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AppLayout layoutProps={layoutProps}>
                <AdminPlaceholderPage />
              </AppLayout>
            </AdminRoute>
          }
        />

        {/* Error and Fallback Routes */}
        <Route
          path="/unauthorized"
          element={
            <AppLayout layoutProps={layoutProps}>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
                <p className="mt-2 text-gray-600">Você não tem permissão para acessar esta página.</p>
              </div>
            </AppLayout>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
