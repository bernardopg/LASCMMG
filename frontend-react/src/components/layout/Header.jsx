import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaChevronLeft, FaChevronRight, FaSun, FaMoon } from 'react-icons/fa'; // Added Theme icons
import { useAuth } from '../../context/AuthContext';
import TournamentSelector from '../common/TournamentSelector';

const Header = ({ isSidebarCollapsed, toggleSidebarCollapse, currentTheme, toggleTheme }) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // const handleChangeTournament = (e) => { // Logic moved to TournamentSelector
  //   const tournamentId = e.target.value;
  //   selectTournament(tournamentId);
  // };

  return (
    <Disclosure as="nav" className="bg-[var(--panel-bg)] shadow-md border-b border-[var(--card-border-color)]">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center"> {/* Ensure items-center for the button */}
                {/* Desktop Sidebar Toggle Button */}
                <div className="hidden md:flex items-center mr-4">
                  <button
                    onClick={toggleSidebarCollapse}
                    className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    aria-label={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
                  >
                    {isSidebarCollapsed ? <FaChevronRight className="h-5 w-5" /> : <FaChevronLeft className="h-5 w-5" />}
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
                  {/* Adjusted for dark theme */}
                  <Link
                    to="/"
                    className="border-[var(--color-primary)] text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/tournaments"
                    className="border-transparent text-gray-300 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Torneios
                  </Link>
                  <Link
                    to="/players"
                    className="border-transparent text-gray-300 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Jogadores
                  </Link>
                  <Link
                    to="/brackets"
                    className="border-transparent text-gray-300 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Chaves
                  </Link>
                  <Link
                    to="/stats"
                    className="border-transparent text-gray-300 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Estatísticas
                  </Link>
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
                  className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white mr-3"
                  aria-label={currentTheme === 'dark' ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {currentTheme === 'dark' ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
                </button>

                {/* Menu do perfil */}
                <Menu as="div" className="relative"> {/* Removed ml-3 as theme toggle has mr-3 */}
                  <div>
                    <Menu.Button className="bg-[var(--panel-bg)] rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--panel-bg)] focus:ring-[var(--color-secondary)]">
                      <span className="sr-only">Abrir menu do usuário</span>
                      <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white uppercase font-bold">
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
                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-[var(--input-bg)] ring-1 ring-[var(--card-border-color)] ring-opacity-50 focus:outline-none z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={`${
                              active ? 'bg-[var(--color-primary-dark)] text-white' : 'text-gray-200'
                            } block px-4 py-2 text-sm hover:bg-[var(--color-primary-dark)] hover:text-white rounded-md`}
                          >
                            Meu Perfil
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/settings"
                            className={`${
                              active ? 'bg-[var(--color-primary-dark)] text-white' : 'text-gray-200'
                            } block px-4 py-2 text-sm hover:bg-[var(--color-primary-dark)] hover:text-white rounded-md`}
                          >
                            Configurações
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-[var(--color-primary-dark)] text-white' : 'text-gray-200'
                            } block w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-primary-dark)] hover:text-white rounded-md`}
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
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Abrir menu principal</span>
                  {open ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Painel mobile */}
          <Disclosure.Panel className="sm:hidden border-t border-[var(--card-border-color)]">
            <div className="pt-2 pb-3 space-y-1">
              {/* Adjusted for dark theme */}
              <Link to="/" className="bg-[var(--color-primary-dark)] border-[var(--color-primary)] text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                Dashboard
              </Link>
              <Link to="/tournaments" className="border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                Torneios
              </Link>
              <Link to="/players" className="border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                Jogadores
              </Link>
              <Link to="/brackets" className="border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                Chaves
              </Link>
              <Link to="/stats" className="border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                Estatísticas
              </Link>
            </div>

            {/* Torneios no mobile */}
            <div className="pt-2 px-3 pb-3"> {/* Added pb-3 for spacing */}
              <TournamentSelector /> {/* Use the new selector here as well */}
            </div>

            <div className="pt-4 pb-3 border-t border-[var(--card-border-color)]">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white uppercase font-bold">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-200">{currentUser?.name || 'Usuário'}</div>
                  <div className="text-sm font-medium text-gray-400">{currentUser?.email || ''}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link to="/profile" className="block px-4 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
                  Meu Perfil
                </Link>
                <Link to="/settings" className="block px-4 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
                  Configurações
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                >
                  Sair
                </button>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Header;
