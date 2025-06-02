import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Simple Loading Fallback Component
 * Used for lazy-loaded components
 */
const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-center space-y-4">
      <LoadingSpinner message="Carregando componente..." />
    </div>
  </div>
);

export default LoadingFallback;
