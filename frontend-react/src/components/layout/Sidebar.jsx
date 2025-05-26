import { useEffect, useRef, useState } from 'react';
import {
  FaBars,
  FaCalendarAlt,
  FaChartBar,
  FaChevronDown,
  FaCog,
  FaEye,
  FaFileAlt,
  FaGamepad,
  FaHistory,
  FaHome,
  FaList,
  FaPlus,
  FaPlusCircle,
  FaShieldAlt,
  FaSitemap,
  FaTrash,
  FaTrophy,
  FaUserPlus,
  FaUsers,
  FaUsersCog,
  FaUserShield,
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({
  isCollapsed,
  isMobileOpen,
  isMobile,
  /* onMobileClose */
}) => {
  // Manter compatibilidade com nome antigo
  const isSidebarCollapsed = isCollapsed;
  const [openDropdowns, setOpenDropdowns] = useState(new Set());
  const location = useLocation();
  const { hasPermission } = useAuth();
  const sidebarRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleDropdown = (sectionKey) => {
    if (isSidebarCollapsed) return;

    setOpenDropdowns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  // Estrutura organizada do menu
  const menuSections = {
    dashboard: {
      name: 'Dashboard',
      icon: <FaHome className="w-5 h-5" />,
      path: '/',
      permission: null,
    },
    tournaments: {
      name: 'Torneios',
      icon: <FaTrophy className="w-5 h-5" />,
      isDropdown: true,
      permission: null,
      items: [
        {
          name: 'Ver Torneios',
          path: '/tournaments',
          icon: <FaEye className="w-4 h-4" />,
        },
        {
          name: 'Chaveamentos',
          path: '/brackets',
          icon: <FaSitemap className="w-4 h-4" />,
        },
        {
          name: 'Estatísticas',
          path: '/stats',
          icon: <FaChartBar className="w-4 h-4" />,
        },
      ],
    },
    players: {
      name: 'Jogadores',
      icon: <FaUsers className="w-5 h-5" />,
      path: '/players',
      permission: null,
    },
    scores: {
      name: 'Placares',
      icon: <FaGamepad className="w-5 h-5" />,
      isDropdown: true,
      permission: null,
      items: [
        {
          name: 'Histórico',
          path: '/scores',
          icon: <FaHistory className="w-4 h-4" />,
        },
        {
          name: 'Adicionar',
          path: '/add-score',
          icon: <FaPlusCircle className="w-4 h-4" />,
        },
      ],
    },
    admin: {
      name: 'Administração',
      icon: <FaUserShield className="w-5 h-5" />,
      isDropdown: true,
      permission: 'admin',
      items: [
        {
          name: 'Painel Admin',
          path: '/admin',
          icon: <FaBars className="w-4 h-4" />,
        },
        {
          name: 'Ger. Torneios',
          path: '/admin/tournaments',
          icon: <FaTrophy className="w-4 h-4" />,
          submenu: [
            { name: 'Listar', path: '/admin/tournaments', icon: <FaList className="w-3 h-3" /> },
            {
              name: 'Criar',
              path: '/admin/tournaments/create',
              icon: <FaPlus className="w-3 h-3" />,
            },
          ],
        },
        {
          name: 'Ger. Jogadores',
          path: '/admin/players',
          icon: <FaUsers className="w-4 h-4" />,
          submenu: [
            { name: 'Listar', path: '/admin/players', icon: <FaList className="w-3 h-3" /> },
            {
              name: 'Criar',
              path: '/admin/players/create',
              icon: <FaUserPlus className="w-3 h-3" />,
            },
          ],
        },
        {
          name: 'Agendamento',
          path: '/admin/schedule',
          icon: <FaCalendarAlt className="w-4 h-4" />,
          submenu: [
            { name: 'Geral', path: '/admin/schedule', icon: <FaCalendarAlt className="w-3 h-3" /> },
            {
              name: 'Partidas',
              path: '/admin/match-schedule',
              icon: <FaGamepad className="w-3 h-3" />,
            },
          ],
        },
        {
          name: 'Relatórios',
          path: '/admin/reports',
          icon: <FaFileAlt className="w-4 h-4" />,
        },
        {
          name: 'Log Atividades',
          path: '/admin/activity-log',
          icon: <FaHistory className="w-4 h-4" />,
        },
        {
          name: 'Usuários',
          path: '/admin/users',
          icon: <FaUsersCog className="w-4 h-4" />,
        },
        {
          name: 'Segurança',
          path: '/admin/security',
          icon: <FaShieldAlt className="w-4 h-4" />,
        },
        {
          name: 'Lixeira',
          path: '/admin/trash',
          icon: <FaTrash className="w-4 h-4" />,
        },
      ],
    },
    settings: {
      name: 'Configurações',
      icon: <FaCog className="w-5 h-5" />,
      path: '/settings',
      permission: null,
    },
  };

  // Auto-open dropdown se a página atual está nessa seção
  useEffect(() => {
    const _path = location.pathname;
    const newOpenDropdowns = new Set();

    Object.entries(menuSections).forEach(([sectionKey, section]) => {
      if (section.items && section.items.some((item) => isActive(item.path))) {
        newOpenDropdowns.add(sectionKey);
      }
    });

    setOpenDropdowns(newOpenDropdowns);
  }, [location.pathname]); // Removida dependência menuSections que causava infinite loop

  // Verifica permissão para uma seção
  const hasPermissionForSection = (section) => {
    if (!section.permission) return true;
    return hasPermission(section.permission);
  };

  // Renderiza botão dropdown toggle
  const renderDropdownToggle = (sectionKey, section) => {
    const isOpen = openDropdowns.has(sectionKey);
    const hasActiveItem = section.items?.some((item) => isActive(item.path));

    return (
      <button
        onClick={() => toggleDropdown(sectionKey)}
        className={`w-full flex items-center p-3 text-sm font-medium rounded-lg group transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
          hasActiveItem
            ? 'bg-primary text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
        } ${isSidebarCollapsed ? 'justify-center px-3 py-3' : 'justify-start'}`}
        aria-expanded={isOpen}
        title={isSidebarCollapsed ? section.name : ''}
      >
        <div
          className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'flex-1'}`}
        >
          <div
            className={`flex items-center justify-center ${isSidebarCollapsed ? '' : 'mr-3'} ${hasActiveItem ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'} transition-colors duration-200`}
          >
            {section.icon}
          </div>
          {!isSidebarCollapsed && (
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">{section.name}</span>
          )}
        </div>
        {!isSidebarCollapsed && (
          <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <FaChevronDown className="w-3 h-3" />
          </div>
        )}
      </button>
    );
  };

  // Renderiza item de menu regular
  const renderMenuItem = (item, isSubmenuItem = false) => {
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const active = isActive(item.path);
    const baseClasses = `flex items-center p-2 text-sm font-medium rounded-lg group transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
      isSubmenuItem ? 'ml-6 text-xs py-1.5' : ''
    }`;
    const activeClasses = 'bg-primary text-white shadow-sm';
    const inactiveClasses =
      'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white';

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${isSidebarCollapsed && !isSubmenuItem ? 'justify-center px-3 py-3' : 'justify-start'}`}
        title={isSidebarCollapsed ? item.name : ''}
        aria-current={active ? 'page' : undefined}
      >
        <div
          className={`flex items-center justify-center ${isSidebarCollapsed && !isSubmenuItem ? '' : 'mr-3'} ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'} transition-colors duration-200`}
        >
          {item.icon}
        </div>
        {(!isSidebarCollapsed || isSubmenuItem) && (
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
        )}
      </Link>
    );
  };

  // Renderiza conteúdo do dropdown
  const renderDropdownContent = (sectionKey, section) => {
    const isOpen = openDropdowns.has(sectionKey);

    if (!isOpen || isSidebarCollapsed) return null;

    return (
      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-slate-600 pl-4">
        {section.items?.map((item) => {
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }

          return (
            <div key={item.path}>
              {renderMenuItem(item)}
              {item.submenu && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.submenu.map((subItem) => renderMenuItem(subItem, true))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Renderiza seção (link regular ou dropdown)
  const renderSection = (sectionKey, section) => {
    if (!hasPermissionForSection(section)) {
      return null;
    }

    return (
      <div key={sectionKey} className="mb-2">
        {section.isDropdown ? (
          <div>
            {renderDropdownToggle(sectionKey, section)}
            {renderDropdownContent(sectionKey, section)}
          </div>
        ) : (
          <Link
            to={section.path}
            className={`flex items-center p-3 text-sm font-medium rounded-lg group transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
              isActive(section.path)
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
            } ${isSidebarCollapsed ? 'justify-center px-3 py-3' : 'justify-start'}`}
            title={isSidebarCollapsed ? section.name : ''}
            aria-current={isActive(section.path) ? 'page' : undefined}
          >
            <div
              className={`flex items-center justify-center ${isSidebarCollapsed ? '' : 'mr-3'} ${isActive(section.path) ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'} transition-colors duration-200`}
            >
              {section.icon}
            </div>
            {!isSidebarCollapsed && (
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                {section.name}
              </span>
            )}
          </Link>
        )}
      </div>
    );
  };

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out z-sidebar ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      } ${isMobile ? (isMobileOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`}
      aria-label="Barra lateral de navegação"
      role="navigation"
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 h-full shadow-sidebar rounded-tr-lg transition-colors duration-300">
          {/* Cabeçalho da Sidebar */}
          <div
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-4'} mb-6 h-12`}
          >
            {!isSidebarCollapsed ? (
              <Link to="/" className="flex items-center group" aria-label="Ir para página inicial">
                <img
                  className="h-10 w-auto transition-transform duration-200 group-hover:scale-110"
                  src="/assets/logo-lascmmg.png"
                  alt="LASCMMG Logo"
                  width="40"
                  height="40"
                />
                <div className="ml-3">
                  <span className="text-xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
                    LASCMMG
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sistema de Torneios
                  </div>
                </div>
              </Link>
            ) : (
              <Link to="/" aria-label="Ir para página inicial" className="group">
                <img
                  className="h-8 w-auto transition-transform duration-200 group-hover:scale-110"
                  src="/assets/logo-lascmmg.png"
                  alt="LASCMMG"
                  width="32"
                  height="32"
                />
              </Link>
            )}
          </div>

          {/* Menu de Navegação */}
          <div className={`flex flex-col flex-grow ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            <nav className="flex-1 space-y-1" aria-label="Menu principal">
              {Object.entries(menuSections).map(([key, section]) => renderSection(key, section))}
            </nav>

            {/* Rodapé da Sidebar */}
            <div
              className={`flex-shrink-0 block w-full mt-auto ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}
            >
              {!isSidebarCollapsed && (
                <div className="p-3 bg-gradient-to-r from-primary/10 to-primary-dark/10 dark:from-primary/20 dark:to-primary-dark/20 rounded-lg border border-primary/20 dark:border-primary/30">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-primary dark:text-primary-light mb-1">
                      LASCMMG v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Liga Acadêmica de Sinuca
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      © {new Date().getFullYear()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
