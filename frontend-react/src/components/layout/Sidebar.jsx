import { useEffect, useRef, useState } from 'react';
import {
  FaCalendarAlt,
  FaChartBar,
  FaCog,
  FaHistory,
  FaHome,
  FaPlusCircle,
  FaSitemap,
  FaTrophy,
  FaUsers,
  FaUsersCog,
  FaUserShield,
  FaTrash,
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isSidebarCollapsed }) => {
  const [activeSection, setActiveSection] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const location = useLocation();
  const { hasPermission } = useAuth();
  const sidebarRef = useRef(null);
  const firstMenuItemRef = useRef(null);

  // Track if sidebar has been mounted for animations
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keydown if sidebar has focus
      if (!sidebarRef.current?.contains(document.activeElement)) return;

      const focusableElements = Array.from(
        sidebarRef.current?.querySelectorAll('a[href], button') || []
      ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

      if (!focusableElements.length) return;

      const currentIndex = focusableElements.indexOf(document.activeElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
          focusableElements[nextIndex]?.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
          focusableElements[prevIndex]?.focus();
          break;
        case 'Home':
          e.preventDefault();
          focusableElements[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          focusableElements[focusableElements.length - 1]?.focus();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Group menu items by category
  const menuSections = {
    main: [
      {
        name: 'Dashboard',
        path: '/',
        icon: <FaHome className="w-5 h-5" />,
        permission: null,
      },
    ],
    tournaments: [
      {
        name: 'Torneios',
        path: '/tournaments',
        icon: <FaTrophy className="w-5 h-5" />,
        permission: null,
      },
      {
        name: 'Chaves',
        path: '/brackets',
        icon: <FaSitemap className="w-5 h-5" />,
        permission: null,
      },
    ],
    players: [
      {
        name: 'Jogadores',
        path: '/players',
        icon: <FaUsers className="w-5 h-5" />,
        permission: null,
      },
    ],
    scores: [
      {
        name: 'Histórico de Placares',
        path: '/scores',
        icon: <FaHistory className="w-5 h-5" />,
        permission: null,
      },
      {
        name: 'Adicionar Placar',
        path: '/add-score',
        icon: <FaPlusCircle className="w-5 h-5" />,
        permission: null,
      },
      {
        name: 'Estatísticas',
        path: '/stats',
        icon: <FaChartBar className="w-5 h-5" />,
        permission: null,
      },
    ],
    admin: [
      {
        name: 'Torneios',
        path: '/admin/tournaments',
        icon: <FaTrophy className="w-5 h-5" />,
        permission: 'admin',
      },
      {
        name: 'Jogadores',
        path: '/admin/players',
        icon: <FaUsers className="w-5 h-5" />,
        permission: 'admin',
      },
      {
        name: 'Relatórios',
        path: '/admin/reports',
        icon: <FaChartBar className="w-5 h-5" />,
        permission: 'admin',
      },
      {
        name: 'Lixeira',
        path: '/admin/trash',
        icon: <FaTrash className="w-5 h-5" />,
        permission: 'admin',
      },
      {
        name: 'Log de Atividades',
        path: '/admin/activity-log',
        icon: <FaHistory className="w-5 h-5" />,
        permission: 'admin',
      },
      {
        name: 'Agendamento de Partidas',
        path: '/admin/match-schedule',
        icon: <FaCalendarAlt className="w-5 h-5" />,
        permission: 'admin',
      },
      {
        name: 'Segurança',
        path: '/admin/security',
        icon: <FaUserShield className="w-5 h-5" />,
        permission: 'admin',
      },
      {
        name: 'Configurações',
        path: '/settings',
        icon: <FaCog className="w-5 h-5" />,
        permission: 'admin',
      },
      {
        name: 'Painel Admin',
        path: '/admin',
        icon: <FaUserShield className="w-5 h-5" />,
        permission: 'admin',
      },
      {
        name: 'Agendamentos',
        path: '/admin/schedule',
        icon: <FaCalendarAlt className="w-5 h-5" />,
        permission: 'admin',
      },
      {
        name: 'Usuários Admin',
        path: '/admin/users',
        icon: <FaUsersCog className="w-5 h-5" />,
        permission: 'admin',
      },
    ],
  };

  // Track which section is active
  useEffect(() => {
    const path = location.pathname;

    // Find which section contains the active path
    for (const [section, items] of Object.entries(menuSections)) {
      if (items.some(item => path === item.path || path.startsWith(item.path + '/'))) {
        setActiveSection(section);
        break;
      }
    }
  }, [location.pathname]);

  // Apply proper sidebar class to body and set focus management
  useEffect(() => {
    if (isSidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
      // When sidebar expands, focus the first menu item for better keyboard navigation
      if (firstMenuItemRef.current && document.activeElement === document.body) {
        setTimeout(() => firstMenuItemRef.current?.focus(), 100);
      }
    }

    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [isSidebarCollapsed]);

  // Helper function to check if a section is active
  const isSectionActive = (section) => {
    return activeSection === section;
  };

  // Render a menu section
  const renderMenuSection = (sectionKey, items, index) => {
    // Check if any item in this section requires admin permission
    const requiresAdmin = items.some(item => item.permission === 'admin');

    // If all items require admin permission and user doesn't have it, don't render the section
    if (requiresAdmin && items.every(item => item.permission === 'admin' && !hasPermission('admin'))) {
      return null;
    }

    // Count items that will actually be rendered (have permission)
    const visibleItems = items.filter(item => !item.permission || hasPermission(item.permission));
    if (visibleItems.length === 0) return null;

    const isActive = isSectionActive(sectionKey);

    return (
      <div
        key={sectionKey}
        className={`mb-2 ${!isSidebarCollapsed ? 'mx-1' : ''} ${isMounted ? 'animate-fadeIn' : ''}`}
        role="group"
        aria-labelledby={`nav-section-${sectionKey}`}
      >
        {!isSidebarCollapsed && sectionKey !== 'main' && (
          <div
            id={`nav-section-${sectionKey}`}
            className={`px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isActive ? 'text-primary dark:text-primary-light' : ''}`}
          >
            {sectionKey === 'tournaments' && 'Torneios'}
            {sectionKey === 'players' && 'Jogadores'}
            {sectionKey === 'scores' && 'Placares'}
            {sectionKey === 'admin' && 'Administração'}
          </div>
        )}
        <div className={`space-y-1 ${isSidebarCollapsed ? 'px-1' : ''}`}>
          {items.map((item, itemIndex) => renderMenuItem(item, index + itemIndex, sectionKey))}
        </div>
      </div>
    );
  };

  // Render an individual menu item
  const renderMenuItem = (item, index, sectionKey) => {
    // Verificar permissão se necessário
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const active = isActive(item.path);
    const baseClasses =
      'flex items-center p-2 my-1 text-sm font-medium rounded-md group transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800';
    const activeClasses = 'bg-primary-dark text-white shadow-md transform scale-[1.02]';
    const inactiveClasses =
      'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white';

    // Animation delay based on index
    const animationDelay = `${(index % 10) * 50}ms`;

    return (
      <Link
        key={item.name}
        ref={index === 0 ? firstMenuItemRef : null}
        to={item.path}
        className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${isSidebarCollapsed ? 'justify-center' : ''} ${isMounted ? 'animate-slideIn' : ''}`}
        style={{ animationDelay }}
        title={isSidebarCollapsed ? item.name : ''} // Show full name on hover when collapsed
        aria-current={active ? 'page' : undefined}
        aria-label={`${item.name}${active ? ' (página atual)' : ''}`}
      >
        <div
          className={`${isSidebarCollapsed ? 'mr-0' : 'mr-3'} ${active ? 'text-white' : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'} transition-colors duration-200`}
          aria-hidden="true"
        >
          {item.icon}
        </div>
        {!isSidebarCollapsed && (
          <span className="transition-opacity duration-200 whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
        )}
      </Link>
    );
  };

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] md:static transition-all duration-300 ease-in-out z-10 ${isSidebarCollapsed ? 'w-20' : 'w-64'
        } ${window.innerWidth < 768 ? 'transform -translate-x-full md:translate-x-0' : ''
        } backdrop-blur-sm ${isMounted ? 'animate-fadeIn' : ''}`}
      aria-label="Barra lateral de navegação"
      role="navigation"
      tabIndex="-1"
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 h-full shadow-lg rounded-tr-lg transition-colors duration-300">
          {/* Sidebar Header */}
          <div
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-4'} mb-6 h-10`}
          >
            {!isSidebarCollapsed && (
              <Link to="/" className="flex items-center" aria-label="Ir para página inicial">
                <img
                  className="h-10 w-auto transition-transform duration-200 hover:scale-110"
                  src="/assets/logo-lascmmg.png"
                  alt="LASCMMG Logo"
                  width="40"
                  height="40"
                />
                <span className="ml-3 text-xl font-semibold text-gray-800 dark:text-white transition-colors duration-200">
                  LASCMMG
                </span>
              </Link>
            )}
            {isSidebarCollapsed && (
              <Link to="/" aria-label="Ir para página inicial">
                <img
                  className="h-8 w-auto transition-transform duration-200 hover:scale-110"
                  src="/assets/logo-lascmmg.png"
                  alt="LASCMMG"
                  width="32"
                  height="32"
                />
              </Link>
            )}
          </div>
          <div
            className={`flex flex-col flex-grow ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}
          >
            <nav className="flex-1 space-y-0" aria-label="Menu principal">
              {Object.entries(menuSections).map(([key, items], index) =>
                renderMenuSection(key, items, index * 10)
              )}
            </nav>

            <div
              className={`flex-shrink-0 block w-full mt-auto ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}
            >
              <div
                className={`p-4 bg-gray-100 dark:bg-slate-700 rounded-lg shadow-inner ${isSidebarCollapsed ? 'hidden' : ''} transition-all duration-300`}
                aria-hidden={isSidebarCollapsed}
              >
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    LASCMMG
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Sistema de gerenciamento de torneios da Liga Acadêmica de
                    Sinuca da CMMG
                  </p>
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <p>Versão: {import.meta.env.VITE_APP_VERSION || '0.1.0'}</p>
                    <p className="mt-1 text-xs">© {new Date().getFullYear()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
