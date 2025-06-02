import { Disclosure, Menu, Transition } from '@headlessui/react';
import { useCallback, useRef, useState, Fragment, memo } from 'react';
import {
  FaBars,
  FaSearch,
  FaTimes,
  FaChevronRight,
  FaUser,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useLocation, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import TournamentSelector from '../common/TournamentSelector';
import { navigationItems } from '../../config/navigationConfig';

const UserAvatar = memo(({ userName, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-lg',
    lg: 'h-12 w-12 text-xl',
  };

  const userInitial = userName?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative">
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-green-600 via-green-700 to-green-800
                   flex items-center justify-center text-amber-300 font-bold shadow-lg border-2 border-green-500/70
                   transition-transform duration-200 hover:scale-105`}
        role="img"
        aria-label={`Avatar do usuário ${userName || 'Usuário'}`}
      >
        <span className="relative z-10 font-black">{userInitial}</span>
      </div>
      <div
        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-lime-400 rounded-full border-2 border-green-800 shadow-md"
        aria-label="Status online"
      />
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

const DesktopUserMenu = memo(({ currentUser, handleLogout }) => (
  <Menu as="div" className="relative">
    <Menu.Button
      className="flex items-center p-1.5 rounded-xl bg-green-800/40 backdrop-blur-md border border-green-700/50
                 hover:bg-green-700/60 hover:border-lime-500/60 transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-green-900"
      aria-label="Menu do usuário"
    >
      <UserAvatar userName={currentUser?.name} />
    </Menu.Button>

    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items
        className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl bg-green-900/90 backdrop-blur-lg
                             border border-green-700/60 shadow-2xl z-50 overflow-hidden focus:outline-none"
      >
        <div className="px-5 py-4 border-b border-green-700/40">
          <div className="flex items-center gap-3">
            <UserAvatar userName={currentUser?.name} />
            <div>
              <p className="text-sm font-semibold text-white">{currentUser?.name || 'Usuário'}</p>
              <p className="text-xs text-neutral-300">{currentUser?.email || ''}</p>
            </div>
          </div>
        </div>

        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <Link
                to="/profile"
                className={`flex items-center gap-3 mx-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                           ${active ? 'bg-lime-500 text-green-900' : 'text-neutral-200 hover:bg-green-700/50'}`}
              >
                <FaUser className="h-4 w-4" />
                <span>Meu Perfil</span>
              </Link>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <Link
                to="/settings"
                className={`flex items-center gap-3 mx-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                           ${active ? 'bg-amber-500 text-white' : 'text-neutral-200 hover:bg-green-700/50'}`}
              >
                <FaCog className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            )}
          </Menu.Item>

          <hr className="my-1 border-green-700/40" />

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleLogout}
                className={`w-[calc(100%-1rem)] flex items-center gap-3 mx-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                           ${active ? 'bg-red-600 text-white' : 'text-neutral-200 hover:bg-red-700/50'}`}
              >
                <FaSignOutAlt className="h-4 w-4" />
                <span>Sair</span>
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Transition>
  </Menu>
));

DesktopUserMenu.displayName = 'DesktopUserMenu';

const SearchBar = memo(({ isSearchOpen, searchQuery, setSearchQuery, searchInputRef }) => {
  if (!isSearchOpen) return null;

  return (
    <div className="hidden md:flex items-center mr-3">
      <div className="relative w-72">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 pl-10 pr-8 rounded-xl bg-green-800/50 backdrop-blur-md border-2 border-green-600/60
                     text-neutral-100 placeholder-neutral-400 text-sm
                     focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-amber-500/80
                     hover:border-green-500/80 transition-all duration-200"
          aria-label="Campo de busca"
        />
        <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-lime-400 pointer-events-none" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-green-700/50 transition-colors duration-200"
            title="Limpar busca"
            aria-label="Limpar busca"
          >
            <FaTimes className="h-3.5 w-3.5 text-neutral-400 hover:text-amber-400" />
          </button>
        )}
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

const DesktopNavigation = memo(({ isPathActive }) => (
  <nav
    className="hidden lg:ml-8 lg:flex lg:space-x-1"
    role="navigation"
    aria-label="Navegação principal"
  >
    {navigationItems.map((item) => {
      const IconComponent = item.icon;
      const isActive = isPathActive(item.path);

      return (
        <NavLink
          key={item.path}
          to={item.path}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold
                     transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-amber-400
                     ${
                       isActive
                         ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400/70 shadow-lg'
                         : 'bg-green-800/40 text-neutral-300 border-green-700/50 hover:bg-green-700/60 hover:border-lime-500/60 hover:text-lime-300'
                     }`}
          title={item.description}
          aria-label={`Ir para ${item.name}: ${item.description}`}
        >
          <IconComponent
            className={`h-4 w-4 ${isActive ? 'text-white' : 'text-lime-400'}`}
            aria-hidden="true"
          />
          <span>{item.name}</span>
        </NavLink>
      );
    })}
  </nav>
));

DesktopNavigation.displayName = 'DesktopNavigation';

const SidebarToggle = memo(({ isSidebarCollapsed, toggleSidebarCollapse }) => (
  <button
    onClick={toggleSidebarCollapse}
    className="p-3 rounded-2xl bg-green-800/50 backdrop-blur-md border border-green-600/60
               hover:bg-green-700/70 hover:border-lime-500/70 transition-all duration-200
               focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-green-900"
    aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
    aria-expanded={!isSidebarCollapsed}
    type="button"
  >
    <FaChevronRight
      className={`h-4 w-4 text-lime-400 transition-transform duration-200 ${isSidebarCollapsed ? '' : 'rotate-180'}`}
      aria-hidden="true"
    />
  </button>
));

SidebarToggle.displayName = 'SidebarToggle';

const Logo = memo(() => (
  <div className="flex-shrink-0">
    <Link
      to="/"
      aria-label="Página inicial LASCMMG - Sistema de Torneios"
      className="flex items-center group p-2 rounded-2xl bg-green-800/30 backdrop-blur-md border border-green-700/40
                 hover:bg-green-700/50 hover:border-amber-500/60 transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-green-900"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-xl
                        flex items-center justify-center shadow-lg border-2 border-green-500/50
                        transition-transform duration-200 group-hover:scale-110"
        >
          <span className="text-amber-300 font-bold text-sm">L</span>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 bg-clip-text text-transparent">
            LASCMMG
          </h1>
          <p className="text-xs text-neutral-400 -mt-1">Torneios</p>
        </div>
      </div>
    </Link>
  </div>
));

Logo.displayName = 'Logo';

const MobileNavigation = memo(({ isPathActive }) => (
  <nav className="pt-4 pb-3 space-y-1.5 px-3" role="navigation" aria-label="Navegação mobile">
    {navigationItems.map((item) => {
      const IconComponent = item.icon;
      const isActive = isPathActive(item.path);

      return (
        <Disclosure.Button
          key={item.path}
          as={Link}
          to={item.path}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold
                     transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-amber-400
                     ${
                       isActive
                         ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400/60 shadow-md'
                         : 'bg-green-800/30 text-neutral-200 border-green-700/40 hover:bg-green-700/50 hover:border-lime-500/50 hover:text-lime-300'
                     }`}
          aria-label={`Ir para ${item.name}: ${item.description}`}
        >
          <div className={`p-2 rounded-lg ${isActive ? 'bg-white/15' : 'bg-lime-500/20'}`}>
            <IconComponent
              className={`h-4 w-4 ${isActive ? 'text-white' : 'text-lime-300'}`}
              aria-hidden="true"
            />
          </div>
          <span>{item.name}</span>
        </Disclosure.Button>
      );
    })}
  </nav>
));

MobileNavigation.displayName = 'MobileNavigation';

const MobileUserProfile = memo(({ currentUser, handleLogout }) => (
  <div className="pt-3 pb-3 border-t border-green-700/40 mx-3">
    <div className="flex items-center px-3 py-3 mb-3 rounded-xl bg-green-800/30 backdrop-blur-md border border-green-700/40">
      <UserAvatar userName={currentUser?.name} />
      <div className="ml-3">
        <div className="text-base font-semibold text-white">{currentUser?.name || 'Usuário'}</div>
        <div className="text-sm text-neutral-300">{currentUser?.email || ''}</div>
      </div>
    </div>

    <div className="space-y-1.5">
      <Disclosure.Button
        as={Link}
        to="/profile"
        className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-neutral-200
                   hover:bg-green-700/50 hover:text-white rounded-xl transition-colors duration-200
                   border border-green-700/40 hover:border-lime-500/50"
      >
        <div className="p-2 rounded-lg bg-lime-500/20">
          <FaUser className="h-4 w-4 text-lime-300" />
        </div>
        Meu Perfil
      </Disclosure.Button>

      <Disclosure.Button
        as={Link}
        to="/settings"
        className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-neutral-200
                   hover:bg-green-700/50 hover:text-white rounded-xl transition-colors duration-200
                   border border-green-700/40 hover:border-amber-500/50"
      >
        <div className="p-2 rounded-lg bg-amber-500/20">
          <FaCog className="h-4 w-4 text-amber-300" />
        </div>
        Configurações
      </Disclosure.Button>

      <Disclosure.Button
        as="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-neutral-200
                   hover:bg-red-700/40 hover:text-red-300 rounded-xl transition-colors duration-200
                   border border-green-700/40 hover:border-red-500/50"
      >
        <div className="p-2 rounded-lg bg-red-600/20">
          <FaSignOutAlt className="h-4 w-4 text-red-400" />
        </div>
        Sair
      </Disclosure.Button>
    </div>
  </div>
));

MobileUserProfile.displayName = 'MobileUserProfile';

const Header = ({ isSidebarCollapsed, toggleSidebarCollapse, toggleMobileSidebar, isMobile }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const searchInputRef = useRef(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isPathActive = useCallback(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    [location.pathname]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, [logout]);

  const handleSearchToggle = useCallback(() => {
    setIsSearchOpen((prev) => {
      const newState = !prev;
      if (newState) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return newState;
    });
  }, []);

  return (
    <Disclosure as="nav" className="fixed top-0 left-0 right-0 z-50">
      {({ open }) => (
        <>
          <div className="bg-green-900/95 backdrop-blur-xl border-b border-green-700/60 shadow-2xl">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative flex h-16 sm:h-20 items-center justify-between">
                {/* Left side */}
                <div className="flex items-center space-x-4">
                  {!isMobile && (
                    <SidebarToggle
                      isSidebarCollapsed={isSidebarCollapsed}
                      toggleSidebarCollapse={toggleSidebarCollapse}
                    />
                  )}
                  <Logo />
                  {!isMobile && <DesktopNavigation isPathActive={isPathActive} />}
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {!isMobile ? (
                    <>
                      <button
                        onClick={handleSearchToggle}
                        className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20
                                   hover:bg-white/20 transition-colors duration-200"
                        aria-label="Buscar"
                      >
                        <FaSearch className="h-4 w-4 text-lime-400" />
                      </button>

                      <SearchBar
                        isSearchOpen={isSearchOpen}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchInputRef={searchInputRef}
                      />

                      <TournamentSelector />
                      <NotificationBell />
                      <DesktopUserMenu currentUser={currentUser} handleLogout={handleLogout} />
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSearchToggle}
                        className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20
                                   hover:bg-white/20 transition-colors duration-200"
                        aria-label="Buscar"
                      >
                        <FaSearch className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-lime-400" />
                      </button>

                      <NotificationBell />

                      <Disclosure.Button
                        className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20
                                   hover:bg-white/20 transition-colors duration-200
                                   focus:outline-none focus:ring-2 focus:ring-amber-400"
                        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
                        onClick={toggleMobileSidebar}
                      >
                        {open ? (
                          <FaTimes className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-lime-400" />
                        ) : (
                          <FaBars className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-lime-400" />
                        )}
                      </Disclosure.Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {open && (
            <Disclosure.Panel
              static
              className="lg:hidden bg-green-900/95 backdrop-blur-xl border-t border-green-700/60 shadow-lg"
            >
              {isSearchOpen && (
                <div className="p-4">
                  <SearchBar
                    isSearchOpen={isSearchOpen}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchInputRef={searchInputRef}
                  />
                </div>
              )}
              <MobileNavigation isPathActive={isPathActive} />
              <MobileUserProfile currentUser={currentUser} handleLogout={handleLogout} />
            </Disclosure.Panel>
          )}
        </>
      )}
    </Disclosure>
  );
};

export default Header;
