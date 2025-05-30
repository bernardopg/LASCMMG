import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  FaBars,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaMoon,
  FaSignOutAlt,
  FaSun,
  FaTimes,
  FaUser,
} from 'react-icons/fa';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../common/NotificationBell';
import TournamentSelector from '../common/TournamentSelector';

const Header = ({ isSidebarCollapsed, toggleSidebarCollapse, toggleMobileSidebar, isMobile }) => {
  // Contextos e hooks
  const { currentUser, logout } = useAuth();
  const { theme: _theme, toggleTheme, isDarkTheme } = useTheme();
  const location = useLocation();

  // Referencias para navegação por teclado
  const menuButtonRef = useRef(null);
  const userMenuItems = useRef([]);

  // Estados locais
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [focusableNavItems, setFocusableNavItems] = useState([]);

  // Configuração de itens de navegação
  const navigationItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Torneios', path: '/tournaments' },
    { name: 'Jogadores', path: '/players' },
    { name: 'Chaves', path: '/brackets' },
    { name: 'Estatísticas', path: '/stats' },
  ];

  // Função para verificar se um caminho está ativo
  const isPathActive = (path) => {
    return location.pathname === path;
  };

  // Coleta itens de navegação na montagem do componente
  useEffect(() => {
    const navItems = document.querySelectorAll('nav a');
    setFocusableNavItems(Array.from(navItems));
  }, []);

  // Configuração de navegação por teclado para o menu do usuário
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!userMenuItems.current.length) return;

      // Só processa teclas se o menu estiver aberto
      const menuOpen = document.querySelector('[role="menu"]');
      if (!menuOpen) return;

      const currentIndex = userMenuItems.current.findIndex(
        (item) => item === document.activeElement
      );

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = currentIndex < userMenuItems.current.length - 1 ? currentIndex + 1 : 0;
          userMenuItems.current[nextIndex]?.focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : userMenuItems.current.length - 1;
          userMenuItems.current[prevIndex]?.focus();
          break;
        }
        case 'Escape':
          e.preventDefault();
          menuButtonRef.current?.focus();
          setIsMenuOpen(false);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fecha menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuButtonRef.current && !menuButtonRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Atualiza meta tag de cor do tema para melhor modo escuro
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = isDarkTheme ? '#1e293b' : '#ffffff';
      document.head.appendChild(meta);
    } else {
      metaThemeColor.content = isDarkTheme ? '#1e293b' : '#ffffff';
    }
  }, [isDarkTheme]);

  // Handlers
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  // Registra referência para cada item do menu do usuário
  const registerUserMenuItem = (el) => {
    if (el && !userMenuItems.current.includes(el)) {
      userMenuItems.current.push(el);
    }
  };

  // Renderiza botão de toggle do sidebar para desktop
  const renderDesktopSidebarToggle = () => (
    <div className="flex items-center mr-4">
      <button
        onClick={toggleSidebarCollapse}
        className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-dark transition-all duration-200"
        aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        aria-expanded={!isSidebarCollapsed}
      >
        {isSidebarCollapsed ? (
          <FaChevronRight className="h-5 w-5" />
        ) : (
          <FaChevronLeft className="h-5 w-5" />
        )}
      </button>
    </div>
  );

  // Renderiza botão de toggle do sidebar para mobile
  const renderMobileSidebarToggle = () => (
    <button
      onClick={toggleMobileSidebar}
      className="p-2 mr-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-dark transition-all duration-200"
      aria-label="Abrir menu lateral"
      aria-expanded="false"
    >
      <FaBars className="h-5 w-5" />
    </button>
  );

  // Renderiza logo da aplicação
  const renderLogo = () => (
    <div className="flex-shrink-0 flex items-center">
      <Link to="/" aria-label="Página inicial LASCMMG">
        <img
          className="block h-10 w-auto transition-transform duration-300 hover:scale-105"
          src="/assets/logo-lascmmg.png"
          alt="LASCMMG"
          width="40"
          height="40"
        />
      </Link>
    </div>
  );

  // Renderiza navegação principal para desktop
  const renderDesktopNavigation = () => (
    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
      {navigationItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            isActive
              ? 'border-primary text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200'
              : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200'
          }
        >
          {item.name}
        </NavLink>
      ))}
    </div>
  );

  // Renderiza botão de alternância de tema
  const renderThemeToggle = (additionalClasses = '') => (
    <button
      onClick={handleThemeToggle}
      className={`p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-dark transition-all duration-300 ${additionalClasses}`}
      aria-label={isDarkTheme ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDarkTheme ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
    >
      <div className="relative w-5 h-5">
        {isDarkTheme ? (
          <FaSun className="h-5 w-5 transition-all duration-300 transform rotate-0" />
        ) : (
          <FaMoon className="h-5 w-5 transition-all duration-300 transform rotate-0" />
        )}
      </div>
    </button>
  );

  // Renderiza avatar do usuário
  const renderUserAvatar = () => (
    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white uppercase font-bold shadow-sm relative overflow-hidden">
      <span className="relative z-10">{currentUser?.name?.charAt(0) || 'U'}</span>
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark opacity-70"></div>
    </div>
  );

  // Renderiza menu do usuário para desktop
  const renderDesktopUserMenu = () => (
    <Menu as="div" className="relative">
      <div>
        <Menu.Button
          ref={menuButtonRef}
          className="bg-white dark:bg-slate-800 rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-secondary transition-transform duration-200 hover:scale-105"
          aria-label="Menu do usuário"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="sr-only">Abrir menu do usuário</span>
          {renderUserAvatar()}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        afterEnter={() => setIsMenuOpen(true)}
        afterLeave={() => setIsMenuOpen(false)}
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-slate-700 ring-1 ring-black dark:ring-slate-600 ring-opacity-5 focus:outline-none z-10">
          <Menu.Item>
            {({ active }) => (
              <Link
                ref={registerUserMenuItem}
                to="/profile"
                className={`${
                  active ? 'bg-primary-dark text-white' : 'text-gray-700 dark:text-gray-200'
                } block px-4 py-2 text-sm hover:bg-primary-dark hover:text-white rounded-md transition-colors duration-150 flex items-center`}
              >
                <FaUser className="mr-2 h-4 w-4" aria-hidden="true" />
                Meu Perfil
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <Link
                ref={registerUserMenuItem}
                to="/settings"
                className={`${
                  active ? 'bg-primary-dark text-white' : 'text-gray-700 dark:text-gray-200'
                } block px-4 py-2 text-sm hover:bg-primary-dark hover:text-white rounded-md transition-colors duration-150 flex items-center`}
              >
                <FaCog className="mr-2 h-4 w-4" aria-hidden="true" />
                Configurações
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                ref={registerUserMenuItem}
                onClick={handleLogout}
                className={`${
                  active ? 'bg-primary-dark text-white' : 'text-gray-700 dark:text-gray-200'
                } block w-full text-left px-4 py-2 text-sm hover:bg-primary-dark hover:text-white rounded-md transition-colors duration-150 flex items-center`}
              >
                <FaSignOutAlt className="mr-2 h-4 w-4" aria-hidden="true" />
                Sair
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  // Renderiza barra de ferramentas para desktop
  const renderDesktopToolbar = () => (
    <div className="hidden sm:ml-6 sm:flex sm:items-center">
      {/* Seletor de torneio */}
      <div className="mr-4">
        <TournamentSelector />
      </div>

      {/* Sino de notificações */}
      <div className="mr-3 relative" aria-live="polite">
        <NotificationBell />
      </div>

      {/* Toggle de tema */}
      {renderThemeToggle('mr-3 transform hover:scale-105')}

      {/* Menu do perfil */}
      {renderDesktopUserMenu()}
    </div>
  );

  // Renderiza barra de ferramentas para mobile
  const renderMobileToolbar = ({ open }) => (
    <div className="-mr-2 flex items-center sm:hidden gap-2">
      {/* Sino de notificações para mobile */}
      <div className="relative">
        <NotificationBell />
      </div>

      {/* Toggle de tema para mobile */}
      {renderThemeToggle()}

      <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-dark transition-colors duration-200">
        <span className="sr-only">Abrir menu principal</span>
        {open ? (
          <FaTimes className="block h-6 w-6" aria-hidden="true" />
        ) : (
          <FaBars className="block h-6 w-6" aria-hidden="true" />
        )}
      </Disclosure.Button>
    </div>
  );

  // Renderiza navegação mobile
  const renderMobileNavigation = () => (
    <div className="pt-2 pb-3 space-y-1 animate-fadeIn">
      {navigationItems.map((item) => {
        const isActive = isPathActive(item.path);
        return (
          <Disclosure.Button
            key={item.path}
            as={Link}
            to={item.path}
            className={
              isActive
                ? 'bg-primary-light dark:bg-primary-dark border-primary text-primary-contrast dark:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200'
                : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200'
            }
          >
            {item.name}
          </Disclosure.Button>
        );
      })}
    </div>
  );

  // Renderiza seção de perfil do usuário no mobile
  const renderMobileUserProfile = () => (
    <div className="pt-4 pb-3 border-t border-gray-200 dark:border-slate-700">
      <div className="flex items-center px-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white uppercase font-bold shadow-sm relative overflow-hidden">
            <span className="relative z-10">{currentUser?.name?.charAt(0) || 'U'}</span>
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark opacity-70"></div>
          </div>
        </div>
        <div className="ml-3">
          <div className="text-base font-medium text-gray-800 dark:text-white">
            {currentUser?.name || 'Usuário'}
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {currentUser?.email || ''}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <Disclosure.Button
          as={Link}
          to="/profile"
          className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-white rounded-md transition-colors duration-200 flex items-center"
        >
          <FaUser className="mr-2 h-5 w-5" aria-hidden="true" />
          Meu Perfil
        </Disclosure.Button>
        <Disclosure.Button
          as={Link}
          to="/settings"
          className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-white rounded-md transition-colors duration-200 flex items-center"
        >
          <FaCog className="mr-2 h-5 w-5" aria-hidden="true" />
          Configurações
        </Disclosure.Button>
        <Disclosure.Button
          as="button"
          onClick={handleLogout}
          className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-white rounded-md transition-colors duration-200 flex items-center"
        >
          <FaSignOutAlt className="mr-2 h-5 w-5" aria-hidden="true" />
          Sair
        </Disclosure.Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Link de pular para conteúdo para acessibilidade */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Pular para o conteúdo
      </a>

      <Disclosure
        as="nav"
        className="bg-white dark:bg-slate-800 shadow-md border-b border-gray-200 dark:border-slate-700 fixed top-0 right-0 left-0 z-50 transition-all duration-300 ease-in-out print:hidden"
      >
        {({ open }) => (
          <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                {/* Seção esquerda - Logo e navegação */}
                <div className="flex items-center">
                  {/* Botão do Toggle do Sidebar */}
                  {isMobile ? renderMobileSidebarToggle() : renderDesktopSidebarToggle()}

                  {/* Logo */}
                  {renderLogo()}

                  {/* Navegação principal para desktop */}
                  {renderDesktopNavigation()}
                </div>

                {/* Seção direita - Ferramentas e menu do usuário */}
                {renderDesktopToolbar()}

                {/* Menu mobile */}
                {renderMobileToolbar({ open })}
              </div>
            </div>

            {/* Painel mobile */}
            <Disclosure.Panel className="sm:hidden border-t border-gray-200 dark:border-slate-700 shadow-lg">
              {/* Navegação principal mobile */}
              {renderMobileNavigation()}

              {/* Seletor de torneio no mobile */}
              <div className="pt-2 px-3 pb-3 border-t border-gray-200 dark:border-slate-700">
                <TournamentSelector />
              </div>

              {/* Perfil do usuário mobile */}
              {renderMobileUserProfile()}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  );
};

export default Header;
