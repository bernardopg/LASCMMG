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
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isSidebarCollapsed }) => {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <FaHome className="w-5 h-5" />,
      permission: null,
    },
    {
      name: 'Torneios',
      path: '/tournaments',
      icon: <FaTrophy className="w-5 h-5" />,
      permission: null,
    },
    {
      name: 'Jogadores',
      path: '/players',
      icon: <FaUsers className="w-5 h-5" />,
      permission: null,
    },
    {
      name: 'Chaves',
      path: '/brackets',
      icon: <FaSitemap className="w-5 h-5" />,
      permission: null,
    },
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
      permission: 'admin', // Assuming admin only
    },
    {
      name: 'Usuários Admin',
      path: '/admin/users',
      icon: <FaUsersCog className="w-5 h-5" />,
      permission: 'admin', // Assuming admin only
    },
  ];

  // Renderizar link do menu
  const renderMenuItem = (item) => {
    // Verificar permissão se necessário
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const active = isActive(item.path);
    const baseClasses =
      'flex items-center p-2 my-1 text-sm font-medium rounded-md group';
    const activeClasses = 'bg-primary-dark text-white'; // Usando cor Tailwind
    const inactiveClasses =
      'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white';

    return (
      <Link
        key={item.name}
        to={item.path}
        className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${isSidebarCollapsed ? 'justify-center' : ''}`}
        title={isSidebarCollapsed ? item.name : ''} // Show full name on hover when collapsed
      >
        <div
          className={`${isSidebarCollapsed ? 'mr-0' : 'mr-3'} ${active ? 'text-white' : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} // Ajuste de cores para ícones inativos
        >
          {item.icon}
        </div>
        {!isSidebarCollapsed && item.name}
      </Link>
    );
  };

  return (
    <div
      className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-56'}`}
    >
      <div className="flex flex-col w-full">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700">
          {' '}
          {/* Tailwind classes for theme */}
          {/* Sidebar Header */}
          <div
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-4'} mb-4 h-10`}
          >
            {!isSidebarCollapsed && (
              <Link to="/" className="flex items-center">
                <img
                  className="h-10 w-auto"
                  src="/assets/logo-removebg.png"
                  alt="LASCMMG Logo"
                />
                <span className="ml-3 text-xl font-semibold text-gray-800 dark:text-white">
                  LASCMMG
                </span>
              </Link>
            )}
            {isSidebarCollapsed && (
              <Link to="/">
                <img
                  className="h-8 w-auto"
                  src="/assets/logo-removebg.png"
                  alt="LASCMMG"
                />
              </Link>
            )}
          </div>
          <div
            className={`flex flex-col flex-grow ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}
          >
            <nav className="flex-1 space-y-1">
              {' '}
              {/* Removed redundant bg class */}
              {menuItems.map(renderMenuItem)}
            </nav>

            <div
              className={`flex-shrink-0 block w-full mt-auto ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}
            >
              <div
                className={`p-4 bg-gray-100 dark:bg-slate-700 rounded-lg ${isSidebarCollapsed ? 'hidden' : ''}`} // Adjusted dark bg
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
