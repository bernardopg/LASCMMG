import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import api from '../services/api'; // Changed from axios to the configured api instance

const TournamentContext = createContext();

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error(
      'useTournament deve ser usado dentro de um TournamentProvider'
    );
  }
  return context;
};

export const TournamentProvider = ({ children }) => {
  const [tournaments, setTournaments] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [loading, setLoading] = useState(false); // Consider setting initial loading to true
  const [error, setError] = useState(null);
  const loadTournamentsAttempted = useRef(false); // Ref to prevent double fetch in StrictMode

  const loadTournaments = useCallback(async () => { // Wrap in useCallback
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/tournaments'); // Use api instance
      const fetchedTournaments = response.data.tournaments || [];
      setTournaments(fetchedTournaments);

      const savedTournamentId = localStorage.getItem('currentTournamentId');
      if (savedTournamentId) {
        const saved = fetchedTournaments.find(
          (t) => t.id.toString() === savedTournamentId
        );
        if (saved) {
          setCurrentTournament(saved);
        } else if (fetchedTournaments.length > 0) {
          setCurrentTournament(fetchedTournaments[0]);
          localStorage.setItem(
            'currentTournamentId',
            fetchedTournaments[0].id.toString()
          );
        }
      } else if (fetchedTournaments.length > 0) {
        setCurrentTournament(fetchedTournaments[0]);
        localStorage.setItem(
          'currentTournamentId',
          fetchedTournaments[0].id.toString()
        );
      }

      return fetchedTournaments;
    } catch (err) {
      console.error('Erro ao carregar torneios:', err);
      setError(err.response?.data?.message || 'Falha ao carregar torneios');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setTournaments, setCurrentTournament]); // Add dependencies for useCallback

  const selectTournament = (tournamentId) => {
    const tournament = tournaments.find(
      (t) => t.id.toString() === tournamentId.toString()
    );

    if (tournament) {
      setCurrentTournament(tournament);
      localStorage.setItem('currentTournamentId', tournament.id.toString());
      return tournament;
    }

    return null;
  };

  const createTournament = async (tournamentData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(
        '/api/tournaments/create',
        tournamentData
      ); // Use api instance

      setTournaments((prev) => [...prev, response.data.tournament]);
      setCurrentTournament(response.data.tournament);
      localStorage.setItem(
        'currentTournamentId',
        response.data.tournament.id.toString()
      );

      return response.data.tournament;
    } catch (err) {
      console.error('Erro ao criar torneio:', err);
      setError(err.response?.data?.message || 'Falha ao criar torneio');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTournament = async (tournamentId, tournamentData) => {
    try {
      setLoading(true);
      setError(null);

      // Assuming the backend has a PUT endpoint for full tournament update.
      // If only PATCH for specific fields is available, this needs adjustment or specific update functions.
      const response = await api.put(
        // Use api instance
        `/api/tournaments/${tournamentId}`,
        tournamentData
      );

      const updatedTournamentData = response.data.tournament;

      if (updatedTournamentData) {
        setTournaments((prev) =>
          prev.map((t) =>
            t.id.toString() === tournamentId.toString()
              ? updatedTournamentData
              : t
          )
        );

        if (
          currentTournament &&
          currentTournament.id.toString() === tournamentId.toString()
        ) {
          setCurrentTournament(updatedTournamentData);
        }
        return updatedTournamentData;
      } else {
        throw new Error(
          'Resposta da API de atualização de torneio inesperada.'
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar torneio:', err);
      setError(err.response?.data?.message || 'Falha ao atualizar torneio');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTournament = async (tournamentId) => {
    try {
      setLoading(true);
      setError(null);

      await api.patch(`/api/tournaments/${tournamentId}/status`, {
        status: 'Cancelado',
      }); // Use api instance

      const updatedTournamentsAfterDelete = tournaments
        .map((t) =>
          t.id.toString() === tournamentId.toString()
            ? { ...t, status: 'Cancelado' }
            : t
        )
        .filter((t) => t.status !== 'Cancelado');

      setTournaments(updatedTournamentsAfterDelete);

      if (
        currentTournament &&
        currentTournament.id.toString() === tournamentId.toString()
      ) {
        if (updatedTournamentsAfterDelete.length > 0) {
          setCurrentTournament(updatedTournamentsAfterDelete[0]);
          localStorage.setItem(
            'currentTournamentId',
            updatedTournamentsAfterDelete[0].id.toString()
          );
        } else {
          setCurrentTournament(null);
          localStorage.removeItem('currentTournamentId');
        }
      }

      return true;
    } catch (err) {
      console.error('Erro ao excluir torneio:', err);
      setError(err.response?.data?.message || 'Falha ao excluir torneio');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTournamentPlayers = async (tournamentId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        // Use api instance
        `/api/tournaments/${tournamentId}/players`
      );
      return response.data;
    } catch (err) {
      console.error('Erro ao carregar jogadores:', err);
      setError(err.response?.data?.message || 'Falha ao carregar jogadores');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTournamentBrackets = async (tournamentId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        // Use api instance
        `/api/tournaments/${tournamentId}/state`
      );
      return response.data;
    } catch (err) {
      console.error('Erro ao carregar brackets:', err);
      setError(err.response?.data?.message || 'Falha ao carregar brackets');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadTournamentsAttempted.current) {
      loadTournaments();
      loadTournamentsAttempted.current = true;
    }
  }, []); // Empty dependency array ensures it runs once on mount (or twice in StrictMode, handled by ref)

  const refreshCurrentTournament = async () => {
    if (!currentTournament?.id) {
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(
        `/api/tournaments/${currentTournament.id}`
      ); // Use api instance
      if (response.data.success && response.data.tournament) {
        setCurrentTournament(response.data.tournament);
        setTournaments((prev) =>
          prev.map((t) =>
            t.id === currentTournament.id ? response.data.tournament : t
          )
        );
        setError(null);
      } else {
        throw new Error(
          response.data.message ||
            'Falha ao buscar detalhes do torneio para atualização.'
        );
      }
    } catch (err) {
      console.error('Erro ao recarregar detalhes do torneio:', err);
      setError(
        err.response?.data?.message || 'Falha ao recarregar detalhes do torneio'
      );
    } finally {
      setLoading(false);
    }
  };

  const value = {
    tournaments,
    currentTournament,
    loading,
    error,
    loadTournaments,
    selectTournament,
    createTournament,
    updateTournament,
    deleteTournament,
    getTournamentPlayers,
    getTournamentBrackets,
    refreshCurrentTournament,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export default TournamentContext;
