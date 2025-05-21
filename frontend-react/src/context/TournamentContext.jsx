import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/tournaments');
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
  };

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

      const response = await axios.post('/api/tournaments/create', tournamentData);

      setTournaments((prev) => [...prev, response.data.tournament]);
      setCurrentTournament(response.data.tournament);
      localStorage.setItem('currentTournamentId', response.data.tournament.id.toString());

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

      const response = await axios.put(
        `/api/tournaments/${tournamentId}`,
        tournamentData
      );

      const updatedTournamentData = response.data.tournament;

      if (updatedTournamentData) {
        setTournaments((prev) =>
          prev.map((t) =>
            t.id.toString() === tournamentId.toString() ? updatedTournamentData : t
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
        throw new Error("Resposta da API de atualização de torneio inesperada.");
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

      await axios.patch(`/api/tournaments/${tournamentId}/status`, { status: 'Cancelado' });

      const updatedTournamentsAfterDelete = tournaments.map(t =>
        t.id.toString() === tournamentId.toString() ? { ...t, status: 'Cancelado' } : t
      ).filter(t => t.status !== 'Cancelado');

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

      const response = await axios.get(
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

      const response = await axios.get(
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
    loadTournaments();
  }, []);

  const refreshCurrentTournament = async () => {
    if (!currentTournament?.id) {
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`/api/tournaments/${currentTournament.id}`);
      if (response.data.success && response.data.tournament) {
        setCurrentTournament(response.data.tournament);
        setTournaments(prev =>
          prev.map(t => t.id === currentTournament.id ? response.data.tournament : t)
        );
        setError(null);
      } else {
        throw new Error(response.data.message || 'Falha ao buscar detalhes do torneio para atualização.');
      }
    } catch (err) {
      console.error('Erro ao recarregar detalhes do torneio:', err);
      setError(err.response?.data?.message || 'Falha ao recarregar detalhes do torneio');
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
