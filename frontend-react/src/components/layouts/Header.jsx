import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TournamentSelector } from '../ui/forms';
import { NotificationBell } from '../ui/feedback';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Main Application Header Component
 */
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Main navigation items
  const navItems = [
    { label: 'Início', path: '/' },
    { label: 'Torneios', path: '/tournaments' },
    { label: 'Jogadores', path: '/players' },
    { label: 'Placares', path: '/scores' },
    { label: 'Estatísticas', path: '/stats' },
  ];

  const isActive = (path) => {
    // Handle exact match for home
    if (path === '/' && location.pathname === '/') return true;
    // Handle other paths (startsWith to match sub-paths)
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-header border-b border-slate-800/80">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 mr-3">
                <span className="text-sm font-bold text-lime-400">L</span>
              </div>
              <span className="text-lg font-semibold text-white">LASCMMG</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  isActive(item.path)
                    ? 'bg-green-900/50 text-white'
                    : 'text-gray-300 hover:bg-green-900/30 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section: Tournament Selector and User Controls */}
          <div className="flex items-center space-x-4">
            <TournamentSelector />
            <NotificationBell />

            {/* User Menu (simplified, can be expanded to UserMenu component) */}
            <Link
              to="/profile"
              className="text-gray-300 hover:text-white transition-colors duration-150"
              aria-label="Perfil do usuário"
            >
              <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-sm font-semibold text-white">
                U
              </div>
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden text-gray-400 hover:text-white focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-green-900/50 text-white'
                    : 'text-gray-300 hover:bg-green-900/30 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
