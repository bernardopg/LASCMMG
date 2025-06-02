import React from 'react';
import { FaSpinner } from 'react-icons/fa';

/**
 * Simple Loading Spinner Component
 */
const LoadingSpinner = ({ message = 'Carregando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <FaSpinner className="h-8 w-8 text-lime-500 animate-spin" />
      {message && <p className="mt-3 text-slate-400 text-sm text-center">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
