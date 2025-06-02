import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Main Loading Screen Component
 * Used for initial app loading and major transitions
 */
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-6 text-center px-6">
      {/* Brand Logo */}
      <div className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
        <span className="text-2xl font-bold text-lime-400">L</span>
      </div>

      {/* Brand Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">LASCMMG</h1>
        <p className="text-slate-400 text-sm">Sistema de Gerenciamento de Torneios</p>
      </div>

      {/* Loading Spinner */}
      <LoadingSpinner message="Carregando..." />

      {/* Footer */}
      <div className="text-center space-y-1 mt-8">
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span>Sistema Online</span>
        </div>
        <p className="text-slate-600 text-xs">Versão 2.1 • LASCMMG © {new Date().getFullYear()}</p>
      </div>
    </div>
  </div>
);

export default LoadingScreen;
