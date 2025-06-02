import { useState, useCallback } from 'react';

/**
 * Hook customizado para estados de loading
 * @param {boolean} initialState - Estado inicial do loading (default: false)
 * @returns {{loading: boolean, startLoading: Function, stopLoading: Function, toggleLoading: Function, setLoading: Function}}
 */
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);
  const toggleLoading = useCallback(() => setLoading((prev) => !prev), []);

  return {
    loading,
    startLoading,
    stopLoading,
    toggleLoading,
    setLoading, // Exposing setLoading directly for more flexibility if needed
  };
};

export default useLoading;
