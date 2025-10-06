import { Suspense } from 'react';
import { LoadingFallback } from './components/ui/loading';
import { useAuth } from './context';
import { useResponsiveLayout } from './hooks';
import AppRouter from './router/AppRouter';

/**
 * Main App Component
 */
function App() {
  // Contexts
  const { loading: authLoading } = useAuth();

  // Custom hooks
  const layoutState = useResponsiveLayout();

  // Show loading during authentication
  if (authLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="App dark min-h-screen relative bg-slate-900">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-max focus:bg-lime-500 focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
      >
        Pular para conteúdo principal
      </a>

      {/* Main App Content */}
      <Suspense fallback={<LoadingFallback />}>
        <AppRouter {...layoutState} />
      </Suspense>

      {/* Mobile Sidebar Overlay */}
      {layoutState.isMobile && layoutState.isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-overlay lg:hidden"
          onClick={layoutState.closeMobileSidebar}
        />
      )}

      {/* Development Tools */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
          <div className="bg-black/80 text-white text-xs p-2 rounded-lg font-mono">
            <div>Sidebar: {layoutState.isSidebarCollapsed ? 'Collapsed' : 'Expanded'}</div>
            <div>Mobile: {layoutState.isMobile ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
