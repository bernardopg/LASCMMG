import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  Settings,
  Trophy,
  Users,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

/**
 * Main Sidebar Navigation Component
 */
const Sidebar = ({
  isCollapsed = false,
  isMobileOpen = false,
  isMobile = false,
  onMobileClose,
  toggleSidebarCollapse,
  className = '',
}) => {
  const location = useLocation(); // Navigation items with icons
  const navItems = [
    {
      label: 'Início',
      icon: Home,
      path: '/',
      exact: true,
    },
    {
      label: 'Torneios',
      icon: Trophy,
      path: '/tournaments',
      exact: false,
    },
    {
      label: 'Jogadores',
      icon: Users,
      path: '/players',
      exact: false,
    },
    {
      label: 'Placares',
      icon: Clock,
      path: '/scores',
      exact: false,
    },
    {
      label: 'Estatísticas',
      icon: BarChart2,
      path: '/stats',
      exact: false,
    },
  ];

  // Admin items (these could be conditionally rendered based on user role)
  const adminItems = [
    {
      label: 'Configurações',
      icon: Settings,
      path: '/admin/settings',
      exact: false,
    },
  ];

  const isActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        bg-slate-900/90 backdrop-blur-sm border-r border-slate-800/80
        transition-all duration-300 ease-in-out z-sidebar
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobile ? 'fixed inset-y-0 left-0' : 'sticky top-16 h-[calc(100vh-4rem)]'}
        ${className}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebarCollapse}
          className="absolute right-0 top-3 transform translate-x-1/2 bg-slate-800 p-1.5 rounded-full
                     border border-slate-700 text-slate-400 hover:text-lime-400 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2
                     focus:ring-offset-slate-900"
          aria-label={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 pt-4 pb-4 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-green-900/50 text-white'
                        : 'text-gray-300 hover:bg-green-900/30 hover:text-white'
                    }
                  `}
                  aria-current={isActive(item.path, item.exact) ? 'page' : undefined}
                >
                  <item.icon className="flex-shrink-0 w-5 h-5 mr-3" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}

            {/* Divider before admin links */}
            {adminItems.length > 0 && (
              <li className="pt-2 pb-1">
                <div
                  className={`${isCollapsed ? 'mx-auto w-3/4' : 'mx-2'} h-px bg-slate-800`}
                ></div>
                {!isCollapsed && (
                  <p className="px-3 mt-3 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Admin
                  </p>
                )}
              </li>
            )}

            {/* Admin Links */}
            {adminItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-amber-800/30 text-amber-400'
                        : 'text-gray-400 hover:bg-amber-900/20 hover:text-amber-300'
                    }
                  `}
                  aria-current={isActive(item.path, item.exact) ? 'page' : undefined}
                >
                  <item.icon className="flex-shrink-0 w-5 h-5 mr-3" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Optional Bottom Section (Profile, Logout, etc.) */}
        <div
          className={`
          border-t border-slate-800 py-3 px-2.5
          ${isCollapsed ? 'items-center justify-center' : ''}
          flex ${isCollapsed ? 'flex-col' : 'items-center space-x-3'}
        `}
        >
          <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-sm font-semibold text-white">
            U
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-300 truncate">Usuário</p>
              <p className="text-xs text-gray-500 truncate">usuario@lascmmg.org</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
