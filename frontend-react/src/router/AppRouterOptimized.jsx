import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Layout Components - Load immediately as they're used everywhere
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

// Public Pages - Load immediately as they're entry points
import Login from '../pages/Login';
import RegisterPage from '../pages/RegisterPage';
import NotFound from '../pages/NotFound';

// Lazy load protected pages to improve initial load time
const Home = lazy(() => import('../pages/Home'));
const TournamentsPage = lazy(() => import('../pages/TournamentsPage'));
const TournamentDetailPage = lazy(() => import('../pages/TournamentDetailPage'));
const BracketPage = lazy(() => import('../pages/BracketPage'));
const ScoresPage = lazy(() => import('../pages/ScoresPage'));
const StatsPage = lazy(() => import('../pages/StatsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const PlayerProfilePage = lazy(() => import('../pages/PlayerProfilePage'));
const AddScoreLandingPage = lazy(() => import('../pages/AddScoreLandingPage'));
const AddScorePage = lazy(() => import('../pages/AddScorePage'));

// Lazy load admin pages
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const PlayersPage = lazy(() => import('../pages/admin/PlayersPage'));
const CreatePlayerPage = lazy(() => import('../pages/admin/CreatePlayerPage'));
const EditPlayerPage = lazy(() => import('../pages/admin/EditPlayerPage'));
const CreateTournamentPage = lazy(() => import('../pages/admin/CreateTournamentPage'));
const EditTournamentPage = lazy(() => import('../pages/admin/EditTournamentPage'));
const ManageTournamentPage = lazy(() => import('../pages/admin/ManageTournamentPage'));
const AdminTournamentListPage = lazy(() => import('../pages/admin/AdminTournamentListPage'));
const AdminTournamentDetailPage = lazy(() => import('../pages/admin/AdminTournamentDetailPage'));
const AdminUserManagementPage = lazy(() => import('../pages/admin/AdminUserManagementPage'));
const AdminSecurityPage = lazy(() => import('../pages/admin/AdminSecurityPage'));
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'));
const AdminActivityLogPage = lazy(() => import('../pages/admin/AdminActivityLogPage'));
const AdminMatchSchedulePage = lazy(() => import('../pages/admin/AdminMatchSchedulePage'));
const AdminSchedulePage = lazy(() => import('../pages/admin/AdminSchedulePage'));
const TrashPage = lazy(() => import('../pages/admin/TrashPage'));
const SettingsPage = lazy(() => import('../pages/admin/SettingsPage'));
const AdminPlaceholderPage = lazy(() => import('../pages/admin/AdminPlaceholderPage'));

// Lazy load admin security pages
const SecurityOverview = lazy(() => import('../pages/admin/security/SecurityOverview'));
const SecurityBlockedIPs = lazy(() => import('../pages/admin/security/SecurityBlockedIPs'));
const SecurityHoneypots = lazy(() => import('../pages/admin/security/SecurityHoneypots'));
const SecurityThreatAnalytics = lazy(() => import('../pages/admin/security/SecurityThreatAnalytics'));

// Componente de loading otimizado para páginas lazy
const PageLoader = ({ minHeight = '200px' }) => (
  <div
    className="flex items-center justify-center w-full"
    style={{ minHeight }}
  >
    <LoadingSpinner />
  </div>
);

// Route Protection Components com Error Boundaries
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <PageLoader minHeight="100vh" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <PageLoader minHeight="100vh" />;
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
};

// Main Layout Component com Error Boundary
const AppLayout = React.memo(({ children, layoutProps }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return children; // No layout for login/register pages
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
});

AppLayout.displayName = 'AppLayout';

const AppRouterOptimized = ({
  isSidebarCollapsed,
  isMobileSidebarOpen,
  isMobile,
  currentTheme,
  toggleSidebarCollapse,
  toggleMobileSidebar,
  closeMobileSidebar
}) => {
  // Props do layout para passar para todos os componentes AppLayout
  const layoutProps = React.useMemo(() => ({
    isSidebarCollapsed,
    isMobileSidebarOpen,
    isMobile,
    currentTheme,
    toggleSidebarCollapse,
    toggleMobileSidebar,
    closeMobileSidebar
  }), [
    isSidebarCollapsed,
    isMobileSidebarOpen,
    isMobile,
    currentTheme,
    toggleSidebarCollapse,
    toggleMobileSidebar,
    closeMobileSidebar
  ]);

  return (
    <BrowserRouter>
      <ErrorBoundary>
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
                <ErrorBoundary>
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
                    <p className="mt-2 text-gray-600">Você não tem permissão para acessar esta página.</p>
                  </div>
                </ErrorBoundary>
              </AppLayout>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default AppRouterOptimized;
