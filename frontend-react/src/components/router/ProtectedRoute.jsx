import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../ui/feedback/ErrorBoundary';
import LoadingSpinner from '../ui/loading/LoadingSpinner';

/**
 * Componente de loading otimizado para rotas
 */
const RouteLoader = ({ minHeight = '200px' }) => (
  <div className="flex items-center justify-center w-full" style={{ minHeight }}>
    {/* Using the standard LoadingSpinner for consistency */}
    <LoadingSpinner message="Carregando página..." />
  </div>
);

/**
 * Componente para rotas protegidas com Error Boundary
 */
const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { loading, isAuthenticated, hasRole, hasPermission } = useAuth();

  if (loading) {
    return <RouteLoader minHeight="100vh" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar papel necessário
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar permissão necessária
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
};

/**
 * Componente para rotas públicas (login/register)
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <RouteLoader minHeight="100vh" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

/**
 * Componente para rotas administrativas
 */
const AdminRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
};

// Removed unused HOC
export { AdminRoute, ProtectedRoute, PublicRoute, RouteLoader };
export default ProtectedRoute;
