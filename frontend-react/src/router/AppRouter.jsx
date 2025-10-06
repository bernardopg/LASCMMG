import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/router/ProtectedRoute';
import ErrorBoundary from '../components/ui/feedback/ErrorBoundary';
import { LoadingSpinner } from '../components/ui/loading';
import { useAuth } from '../context';

// Layout Components - Load immediately as they're used everywhere
import { Footer, Header, Sidebar } from '../components/layouts';

// Public Pages - Load immediately as they're entry points
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import RegisterPage from '../pages/RegisterPage';

// === LAZY LOADED PAGES ===
// User Pages
const Home = lazy(() => import('../pages/Home'));
const TournamentsPage = lazy(() => import('../pages/TournamentsPage'));
const TournamentDetailPage = lazy(() => import('../pages/TournamentDetailPage'));
const BracketPage = lazy(() => import('../pages/BracketPage'));
const ScoresPage = lazy(() => import('../pages/ScoresPage'));
const StatsPage = lazy(() => import('../pages/StatsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const PlayerProfilePage = lazy(() => import('../pages/PlayerProfilePage'));
const PlayersPage = lazy(() => import('../pages/PlayersPage'));
const AddScoreLandingPage = lazy(() => import('../pages/AddScoreLandingPage'));
const AddScorePage = lazy(() => import('../pages/AddScorePage'));

// Settings Page
const SettingsPage = lazy(() => import('../pages/admin/SettingsPage'));

// Admin Pages
const AdminTournamentListPage = lazy(() => import('../pages/admin/AdminTournamentListPage'));
const AdminTournamentDetailPage = lazy(() => import('../pages/admin/AdminTournamentDetailPage'));
const AdminUserManagementPage = lazy(() => import('../pages/admin/AdminUserManagementPage'));
const AdminSecurityPage = lazy(() => import('../pages/admin/AdminSecurityPage'));
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'));
const AdminActivityLogPage = lazy(() => import('../pages/admin/AdminActivityLogPage'));
const AdminMatchSchedulePage = lazy(() => import('../pages/admin/AdminMatchSchedulePage'));
const AdminSchedulePage = lazy(() => import('../pages/admin/AdminSchedulePage'));
const CreatePlayerPage = lazy(() => import('../pages/admin/CreatePlayerPage'));
const CreateTournamentPage = lazy(() => import('../pages/admin/CreateTournamentPage'));
const AdminPlaceholderPage = lazy(() => import('../pages/admin/AdminPlaceholderPage'));
const AdminPlayersPage = lazy(() => import('../pages/admin/PlayersPage'));
const TrashPage = lazy(() => import('../pages/admin/TrashPage'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard')); // Added Dashboard import

/**
 * Optimized Page Loader with consistent styling
 */
const PageLoader = ({ minHeight = '200px' }) => (
  <div className="flex items-center justify-center w-full" style={{ minHeight }}>
    <LoadingSpinner />
  </div>
);

/**
 * Public Route component for unauthenticated pages
 */
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <PageLoader minHeight="100vh" />;
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

/**
 * Admin Route component for admin-only pages
 */
const AdminRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
};

/**
 * Main Application Layout with responsive design
 */
const AppLayout = React.memo(({ children, layoutProps }) => {
  const { currentUser } = useAuth();

  // No layout for public pages (login/register)
  if (!currentUser) {
    return children;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Header
          toggleSidebarCollapse={layoutProps?.toggleSidebarCollapse}
          toggleMobileSidebar={layoutProps?.toggleMobileSidebar}
          isMobile={layoutProps?.isMobile}
        />

        <div className="flex flex-1 pt-16">
          <Sidebar
            isCollapsed={layoutProps?.isSidebarCollapsed}
            isMobileOpen={layoutProps?.isMobileSidebarOpen}
            isMobile={layoutProps?.isMobile}
            onMobileClose={layoutProps?.closeMobileSidebar}
            toggleSidebarCollapse={layoutProps?.toggleSidebarCollapse}
          />

          <main
            id="main-content"
            className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
              !layoutProps?.isMobile && layoutProps?.isSidebarCollapsed
                ? 'md:ml-16'
                : !layoutProps?.isMobile
                  ? 'md:ml-64'
                  : ''
            }`}
            role="main"
          >
            <Suspense fallback={<PageLoader />}>{children}</Suspense>
          </main>
        </div>

        <div
          className={`transition-all duration-300 ${
            !layoutProps?.isMobile && layoutProps?.isSidebarCollapsed
              ? 'md:ml-16'
              : !layoutProps?.isMobile
                ? 'md:ml-64'
                : ''
          }`}
        >
          <Footer />
        </div>
      </div>
    </ErrorBoundary>
  );
});

AppLayout.displayName = 'AppLayout';

/**
 * Main Application Router with optimized route organization
 */
const AppRouter = ({
  isSidebarCollapsed,
  isMobileSidebarOpen,
  isMobile,
  toggleSidebarCollapse,
  toggleMobileSidebar,
  closeMobileSidebar,
}) => {
  // Memoize layout props to prevent unnecessary re-renders
  const layoutProps = React.useMemo(
    () => ({
      isSidebarCollapsed,
      isMobileSidebarOpen,
      isMobile,
      toggleSidebarCollapse,
      toggleMobileSidebar,
      closeMobileSidebar,
    }),
    [
      isSidebarCollapsed,
      isMobileSidebarOpen,
      isMobile,
      toggleSidebarCollapse,
      toggleMobileSidebar,
      closeMobileSidebar,
    ]
  );

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* ===== PUBLIC ROUTES ===== */}
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

          {/* ===== PROTECTED USER ROUTES ===== */}
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

          {/* Tournament Management */}
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

          {/* Bracket Management */}
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

          {/* Score Management */}
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
            path="/players"
            element={
              <ProtectedRoute>
                <AppLayout layoutProps={layoutProps}>
                  <PlayersPage />
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

          {/* User Profile */}
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

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout layoutProps={layoutProps}>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ===== ADMIN ROUTES ===== */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AppLayout layoutProps={layoutProps}>
                  <Dashboard />
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

          {/* Admin Player Management */}
          <Route
            path="/admin/players"
            element={
              <AdminRoute>
                <AppLayout layoutProps={layoutProps}>
                  <AdminPlayersPage />
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

          {/* Admin Trash Management */}
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

          {/* Admin Fallback */}
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

          {/* ===== ERROR ROUTES ===== */}
          <Route
            path="/unauthorized"
            element={
              <AppLayout layoutProps={layoutProps}>
                <ErrorBoundary>
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-red-400">Acesso Negado</h1>
                    <p className="mt-2 text-slate-400">
                      Você não tem permissão para acessar esta página.
                    </p>
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

export default AppRouter;
