import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  FaBars,
  FaChevronLeft,
  FaChevronRight,
  FaMoon,
  FaSun,
  FaTimes,
} from 'react-icons/fa';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TournamentSelector from '../common/TournamentSelector';

const Header = ({
  isSidebarCollapsed,
  toggleSidebarCollapse,
  currentTheme,
  toggleTheme,
}) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };


  return (
    <Disclosure
      as="nav"
      className="bg-white dark:bg-slate-800 shadow-md border-b border-gray-200 dark:border-slate-700" // Use Tailwind classes for theme
    >
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {' '}
                {/* Ensure items-center for the button */}
                {/* Desktop Sidebar Toggle Button */}
                <div className="hidden md:flex items-center mr-4">
                  <button
                    onClick={toggleSidebarCollapse}
                    className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-dark"
                    aria-label={
                      isSidebarCollapsed
                        ? 'Expandir menu lateral'
                        : 'Recolher menu lateral'
                    }
                  >
                    {isSidebarCollapsed ? (
                      <FaChevronRight className="h-5 w-5" />
                    ) : (
                      <FaChevronLeft className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="flex-shrink-0 flex items-center">
                  <Link to="/">
                    <img
                      className="block h-10 w-auto"
                      src="/assets/logo-removebg.png"
                      alt="LASCMMG"
                    />
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      isActive
                        ? 'border-primary text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/tournaments"
                    className={({ isActive }) =>
                      isActive
                        ? 'border-primary text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                    }
                  >
                    Torneios
                  </NavLink>
                  <NavLink
                    to="/players"
                    className={({ isActive }) =>
                      isActive
                        ? 'border-primary text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                    }
                  >
                    Jogadores
                  </NavLink>
                  <NavLink
                    to="/brackets"
                    className={({ isActive }) =>
                      isActive
                        ? 'border-primary text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                    }
                  >
                    Chaves
                  </NavLink>
                  <NavLink
                    to="/stats"
                    className={({ isActive }) =>
                      isActive
                        ? 'border-primary text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                    }
                  >
                    Estatísticas
                  </NavLink>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {/* Seletor de torneio */}
                <div className="mr-4">
                  <TournamentSelector />
                </div>

                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-dark mr-3"
                  aria-label={
                    currentTheme === 'dark'
                      ? 'Ativar modo claro'
                      : 'Ativar modo escuro'
                  }
                >
                  {currentTheme === 'dark' ? (
                    <FaSun className="h-5 w-5" />
                  ) : (
                    <FaMoon className="h-5 w-5" />
                  )}
                </button>

                {/* Menu do perfil */}
                <Menu as="div" className="relative">
                  {' '}
                  {/* Removed ml-3 as theme toggle has mr-3 */}
                  <div>
                    <Menu.Button className="bg-white dark:bg-slate-800 rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-secondary">
                      <span className="sr-only">Abrir menu do usuário</span>
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white uppercase font-bold">
                        {currentUser?.name?.charAt(0) || 'U'}
                      </div>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-slate-700 ring-1 ring-black dark:ring-slate-600 ring-opacity-5 focus:outline-none z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={`${active
                                ? 'bg-primary-dark text-white'
                                : 'text-gray-700 dark:text-gray-200'
                              } block px-4 py-2 text-sm hover:bg-primary-dark hover:text-white rounded-md`}
                          >
                            Meu Perfil
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/settings"
                            className={`${active
                                ? 'bg-primary-dark text-white'
                                : 'text-gray-700 dark:text-gray-200'
                              } block px-4 py-2 text-sm hover:bg-primary-dark hover:text-white rounded-md`}
                          >
                            Configurações
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${active
                                ? 'bg-primary-dark text-white'
                                : 'text-gray-700 dark:text-gray-200'
                              } block w-full text-left px-4 py-2 text-sm hover:bg-primary-dark hover:text-white rounded-md`}
                          >
                            Sair
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>

              {/* Menu mobile */}
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-dark">
                  <span className="sr-only">Abrir menu principal</span>
                  {open ? (
                    <FaTimes className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <FaBars className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Painel mobile */}
          <Disclosure.Panel className="sm:hidden border-t border-gray-200 dark:border-slate-700">
            <div className="pt-2 pb-3 space-y-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-primary-light dark:bg-primary-dark border-primary text-primary-contrast dark:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                }
              >
                {({ isActive }) => ( // NavLink can take a function as children to access isActive
                  <Disclosure.Button as="span">Dashboard</Disclosure.Button>
                )}
              </NavLink>
              <NavLink
                to="/tournaments"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-primary-light dark:bg-primary-dark border-primary text-primary-contrast dark:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                }
              >
                {({ isActive }) => (
                  <Disclosure.Button as="span">Torneios</Disclosure.Button>
                )}
              </NavLink>
              <NavLink
                to="/players"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-primary-light dark:bg-primary-dark border-primary text-primary-contrast dark:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                }
              >
                {({ isActive }) => (
                  <Disclosure.Button as="span">Jogadores</Disclosure.Button>
                )}
              </NavLink>
              <NavLink
                to="/brackets"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-primary-light dark:bg-primary-dark border-primary text-primary-contrast dark:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                }
              >
                {({ isActive }) => (
                  <Disclosure.Button as="span">Chaves</Disclosure.Button>
                )}
              </NavLink>
              <NavLink
                to="/stats"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-primary-light dark:bg-primary-dark border-primary text-primary-contrast dark:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-700 dark:hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                }
              >
                {({ isActive }) => (
                  <Disclosure.Button as="span">Estatísticas</Disclosure.Button>
                )}
              </NavLink>
            </div>

            {/* Torneios no mobile */}
            <div className="pt-2 px-3 pb-3">
              <TournamentSelector />
            </div>

            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white uppercase font-bold">
                    {currentUser?.name?.charAt(0) || 'U'}
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
              <div className="mt-3 space-y-1">
                <Disclosure.Button
                  as={Link}
                  to="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-white rounded-md"
                >
                  Meu Perfil
                </Disclosure.Button>
                <Disclosure.Button
                  as={Link}
                  to="/settings"
                  className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-white rounded-md"
                >
                  Configurações
                </Disclosure.Button>
                <Disclosure.Button
                  as="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-white rounded-md"
                >
                  Sair
                </Disclosure.Button>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Header;
