import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive layout management
 */
const useResponsiveLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive screen detection with debounce
  useEffect(() => {
    let timeoutId;

    const checkScreenSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const mobile = window.innerWidth < 1024;
        const wasMobile = isMobile;

        setIsMobile(mobile);

        // Auto-collapse sidebar on small screens
        if (mobile && !wasMobile) {
          setIsSidebarCollapsed(true);
          setIsMobileSidebarOpen(false);
        }
      }, 100);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      clearTimeout(timeoutId);
    };
  }, [isMobile]);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (isMobile && isMobileSidebarOpen) {
      const handleNavigation = () => {
        setIsMobileSidebarOpen(false);
      };

      window.addEventListener('popstate', handleNavigation);
      return () => window.removeEventListener('popstate', handleNavigation);
    }
  }, [isMobile, isMobileSidebarOpen]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    isMobile,
    toggleSidebarCollapse,
    toggleMobileSidebar,
    closeMobileSidebar,
  };
};

export default useResponsiveLayout;
