import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaHome,
  FaTrophy,
  FaUsers,
  FaSitemap,
  FaHistory,
  FaPlusCircle,
  FaChartBar,
  FaCog,
  FaUserShield,
  FaChevronLeft, // Icon for collapse
  FaChevronRight, // Icon for expand
} from 'react-icons/fa';

const Sidebar = ({ isSidebarCollapsed }) => { // Accept isSidebarCollapsed prop
  const location = useLocation();
  const { hasPermission } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Lista de links do menu
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
      permission: 'add_score', // Example permission, adjust as needed
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
    }
  ];

  // Renderizar link do menu
  const renderMenuItem = (item) => {
    // Verificar permissão se necessário
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const active = isActive(item.path);
    const baseClasses = "flex items-center p-2 my-1 text-sm font-medium rounded-md group";
    // Active classes are fine for dark theme
    const activeClasses = "bg-[var(--color-primary-dark)] text-white";
    // Inactive classes adjusted for dark theme
    const inactiveClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";

    return (
      <Link
        key={item.name}
        to={item.path}
        className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${isSidebarCollapsed ? 'justify-center' : ''}`}
        title={isSidebarCollapsed ? item.name : ''} // Show full name on hover when collapsed
      >
        <div className={`${isSidebarCollapsed ? 'mr-0' : 'mr-3'} ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
          {item.icon}
        </div>
        {!isSidebarCollapsed && item.name}
      </Link>
    );
  };

  return (
    <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Adjusted for dark theme: bg, border and collapse state */}
      <div className="flex flex-col w-full"> {/* w-full to take width from parent */}
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-[var(--panel-bg)] border-r border-[var(--card-border-color)]">
          {/* Sidebar Header - can add logo and collapse button here later if needed */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-4'} mb-4 h-10`}>
            {!isSidebarCollapsed && (
              <Link to="/" className="flex items-center">
                <img
                  className="h-10 w-auto" // Adjusted size
                  src="/assets/logo-removebg.png"
                  alt="LASCMMG Logo"
                />
                <span className="ml-3 text-xl font-semibold text-white">LASCMMG</span>
              </Link>
            )}
            {isSidebarCollapsed && (
               <Link to="/">
                <img
                  className="h-8 w-auto" // Smaller logo when collapsed
                  src="/assets/logo-removebg.png"
                  alt="LASCMMG"
                />
              </Link>
            )}
          </div>

          <div className={`flex flex-col flex-grow ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            <nav className="flex-1 space-y-1 bg-[var(--panel-bg)]">
              {menuItems.map(renderMenuItem)}
            </nav>

            <div className={`flex-shrink-0 block w-full mt-auto ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
              {/* Adjusted for dark theme: bg, text */}
              <div className={`p-4 bg-gray-800 rounded-lg ${isSidebarCollapsed ? 'hidden' : ''}`}>
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-gray-100">LASCMMG</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Sistema de gerenciamento de torneios da Liga Amadora Sul-Campista de Mari-Mari-Gomes
                  </p>
                  <div className="mt-3 text-xs text-gray-400">
                    <p>Versão: {process.env.REACT_APP_VERSION || '0.1.0'}</p>
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
