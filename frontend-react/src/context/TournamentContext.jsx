import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { TOURNAMENT_STATUS } from '../config/tournamentConfig';
import api from '../services/api';
import { controlRequest as manageRequest } from '../utils/requestUtils'; // Renamed for clarity
import { useNotification } from './NotificationContext';

const TournamentContext = createContext();

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament deve ser usado dentro de um TournamentProvider');
  }
  return context;
};

export const TournamentProvider = ({ children }) => {
  const [tournaments, setTournaments] = useState([]);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterCriteria, setFilterCriteria] = useState({ status: null, search: '' });

  const playersCache = useRef(new Map());
  const bracketsCache = useRef(new Map());
  const loadTournamentsAttempted = useRef(false);
  const pendingRequests = useRef(new Map());

  const { subscribeTournament, unsubscribeTournament } = useNotification();

  const loadTournaments = useCallback(
    async (forceRefresh = false) => {
      return manageRequest(pendingRequests, 'loadTournaments', async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await api.get('/api/tournaments');
          const fetchedTournaments = response.data.tournaments || [];
          setTournaments(fetchedTournaments);
          applyFilters(fetchedTournaments, filterCriteria);
          const savedTournamentId = localStorage.getItem('currentTournamentId');
          if (savedTournamentId) {
            const saved = fetchedTournaments.find((t) => t.id.toString() === savedTournamentId);
            if (saved) {
              setCurrentTournament(saved);
            } else if (fetchedTournaments.length > 0) {
              setCurrentTournament(fetchedTournaments[0]);
              localStorage.setItem('currentTournamentId', fetchedTournaments[0].id.toString());
            }
          } else if (fetchedTournaments.length > 0) {
            setCurrentTournament(fetchedTournaments[0]);
            localStorage.setItem('currentTournamentId', fetchedTournaments[0].id.toString());
          }
          return fetchedTournaments;
        } catch (err) {
          console.error('Erro ao carregar torneios:', err);
          const errorMessage = err.response?.data?.message || 'Falha ao carregar torneios';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    },
    [filterCriteria, pendingRequests]
  );

  useEffect(() => {
    if (currentTournament) {
      subscribeTournament(currentTournament.id.toString());
    }
    return () => {
      if (currentTournament) {
        unsubscribeTournament(currentTournament.id.toString());
      }
    };
  }, [currentTournament, subscribeTournament, unsubscribeTournament]);

  const applyFilters = useCallback((tournamentsList, criteria) => {
    let filtered = [...tournamentsList];
    if (criteria.status) {
      filtered = filtered.filter((t) => t.status === criteria.status);
    }
    if (criteria.search) {
      const searchLower = criteria.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          (t.description && t.description.toLowerCase().includes(searchLower))
      );
    }
    setFilteredTournaments(filtered);
  }, []);

  useEffect(() => {
    applyFilters(tournaments, filterCriteria);
  }, [tournaments, filterCriteria, applyFilters]);

  const setFilters = useCallback((newCriteria) => {
    setFilterCriteria((prev) => ({ ...prev, ...newCriteria }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterCriteria({ status: null, search: '' });
  }, []);

  const selectTournament = useCallback(
    (tournamentId) => {
      const tournament = tournaments.find((t) => t.id.toString() === tournamentId.toString());
      if (tournament) {
        setCurrentTournament(tournament);
        localStorage.setItem('currentTournamentId', tournament.id.toString());
        subscribeTournament(tournament.id.toString());
        return tournament;
      }
      return null;
    },
    [tournaments, subscribeTournament]
  );

  const createTournament = useCallback(
    async (tournamentData) => {
      return manageRequest(pendingRequests, 'createTournament', async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await api.post('/api/tournaments/create', tournamentData);
          playersCache.current.clear();
          bracketsCache.current.clear();
          const newTournament = response.data.tournament;
          setTournaments((prev) => [...prev, newTournament]);
          setCurrentTournament(newTournament);
          localStorage.setItem('currentTournamentId', newTournament.id.toString());
          return newTournament;
        } catch (err) {
          console.error('Erro ao criar torneio:', err);
          const errorMessage = err.response?.data?.message || 'Falha ao criar torneio';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    },
    [pendingRequests]
  );

  const updateTournament = useCallback(
    async (tournamentId, tournamentData) => {
      return manageRequest(pendingRequests, `updateTournament-${tournamentId}`, async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await api.updateTournamentAdmin(tournamentId, tournamentData);
          if (!response.success) {
            const errorMessages = response.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
            throw new Error(errorMessages || 'Falha parcial ou total ao atualizar torneio.');
          }
          const updatedTournamentData = response.tournament;
          if (updatedTournamentData) {
            setTournaments((prev) =>
              prev.map((t) =>
                t.id.toString() === tournamentId.toString() ? updatedTournamentData : t
              )
            );
            playersCache.current.delete(tournamentId.toString());
            bracketsCache.current.delete(tournamentId.toString());
            if (currentTournament && currentTournament.id.toString() === tournamentId.toString()) {
              setCurrentTournament(updatedTournamentData);
            }
            return updatedTournamentData;
          } else {
            throw new Error('Resposta da API de atualização de torneio inesperada.');
          }
        } catch (err) {
          console.error('Erro ao atualizar torneio:', err);
          const errorMessage = err.response?.data?.message || 'Falha ao atualizar torneio';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    },
    [currentTournament, pendingRequests]
  );

  const deleteTournament = useCallback(
    async (tournamentId) => {
      return manageRequest(pendingRequests, `deleteTournament-${tournamentId}`, async () => {
        try {
          setLoading(true);
          setError(null);
          await api.patch(`/api/tournaments/${tournamentId}/status`, {
            status: TOURNAMENT_STATUS.CANCELED,
          });
          playersCache.current.delete(tournamentId.toString());
          bracketsCache.current.delete(tournamentId.toString());
          const updatedTournamentsAfterDelete = tournaments
            .map((t) =>
              t.id.toString() === tournamentId.toString()
                ? { ...t, status: TOURNAMENT_STATUS.CANCELED }
                : t
            )
            .filter((t) => t.status !== TOURNAMENT_STATUS.CANCELED);
          setTournaments(updatedTournamentsAfterDelete);
          if (currentTournament && currentTournament.id.toString() === tournamentId.toString()) {
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
          const errorMessage = err.response?.data?.message || 'Falha ao excluir torneio';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    },
    [currentTournament, tournaments, pendingRequests]
  );

  const getTournamentPlayers = useCallback(
    async (tournamentId, forceRefresh = false) => {
      if (!tournamentId || tournamentId === 'undefined') {
        console.warn('getTournamentPlayers: tournamentId inválido:', tournamentId);
        return { players: [] };
      }
      return manageRequest(pendingRequests, `getTournamentPlayers-${tournamentId}`, async () => {
        const cacheKey = tournamentId.toString();
        if (!forceRefresh && playersCache.current.has(cacheKey)) {
          return playersCache.current.get(cacheKey);
        }
        try {
          setLoading(true);
          setError(null);
          const response = await api.get(`/api/tournaments/${tournamentId}/players`);
          playersCache.current.set(cacheKey, response.data);
          return response.data;
        } catch (err) {
          console.error('Erro ao carregar jogadores:', err);
          const errorMessage = err.response?.data?.message || 'Falha ao carregar jogadores';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    },
    [pendingRequests]
  );

  const getTournamentBrackets = useCallback(
    async (tournamentId, forceRefresh = false) => {
      if (!tournamentId || tournamentId === 'undefined') {
        console.warn('getTournamentBrackets: tournamentId inválido:', tournamentId);
        return { matches: {}, rounds: [] };
      }
      return manageRequest(pendingRequests, `getTournamentBrackets-${tournamentId}`, async () => {
        const cacheKey = tournamentId.toString();
        if (!forceRefresh && bracketsCache.current.has(cacheKey)) {
          return bracketsCache.current.get(cacheKey);
        }
        try {
          setLoading(true);
          setError(null);
          const response = await api.get(`/api/tournaments/${tournamentId}/state`);
          bracketsCache.current.set(cacheKey, response.data);
          return response.data;
        } catch (err) {
          console.error('Erro ao carregar brackets:', err);
          const errorMessage = err.response?.data?.message || 'Falha ao carregar brackets';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    },
    [pendingRequests]
  );

  useEffect(() => {
    if (!loadTournamentsAttempted.current) {
      loadTournaments();
      loadTournamentsAttempted.current = true;
    }
  }, [loadTournaments]);

  const refreshCurrentTournament = useCallback(async () => {
    if (!currentTournament?.id || currentTournament.id === 'undefined') {
      return null;
    }
    return manageRequest(
      pendingRequests,
      `refreshCurrentTournament-${currentTournament.id}`,
      async () => {
        try {
          setLoading(true);
          const response = await api.get(`/api/tournaments/${currentTournament.id}`);
          if (response.data.success && response.data.tournament) {
            const refreshedTournament = response.data.tournament;
            setCurrentTournament(refreshedTournament);
            setTournaments((prev) =>
              prev.map((t) => (t.id === currentTournament.id ? refreshedTournament : t))
            );
            playersCache.current.delete(currentTournament.id.toString());
            bracketsCache.current.delete(currentTournament.id.toString());
            setError(null);
            return refreshedTournament;
          } else {
            throw new Error(
              response.data.message || 'Falha ao buscar detalhes do torneio para atualização.'
            );
          }
        } catch (err) {
          console.error('Erro ao recarregar detalhes do torneio:', err);
          const errorMessage =
            err.response?.data?.message || 'Falha ao recarregar detalhes do torneio';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      }
    );
  }, [currentTournament, pendingRequests]);

  const addPlayerToTournament = useCallback(
    async (tournamentId, playerData) => {
      return manageRequest(pendingRequests, `addPlayerToTournament-${tournamentId}`, async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await api.post(`/api/tournaments/${tournamentId}/players`, playerData);
          playersCache.current.delete(tournamentId.toString());
          return response.data;
        } catch (err) {
          console.error('Erro ao adicionar jogador ao torneio:', err);
          const errorMessage = err.response?.data?.message || 'Falha ao adicionar jogador';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    },
    [pendingRequests]
  );

  const removePlayerFromTournament = useCallback(
    async (tournamentId, playerId) => {
      return manageRequest(
        pendingRequests,
        `removePlayerFromTournament-${tournamentId}-${playerId}`,
        async () => {
          try {
            setLoading(true);
            setError(null);
            const response = await api.deletePlayerAdmin(playerId, false);
            playersCache.current.delete(tournamentId.toString());
            return response;
          } catch (err) {
            console.error('Erro ao remover jogador do torneio:', err);
            const errorMessage = err.response?.data?.message || 'Falha ao remover jogador';
            setError(errorMessage);
            throw new Error(errorMessage);
          } finally {
            setLoading(false);
          }
        }
      );
    },
    [pendingRequests]
  );

  const startTournament = useCallback(
    async (tournamentId) => {
      return manageRequest(pendingRequests, `startTournament-${tournamentId}`, async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await api.post(`/api/tournaments/${tournamentId}/generate-bracket`);
          playersCache.current.delete(tournamentId.toString());
          bracketsCache.current.delete(tournamentId.toString());
          const updatedTournament = response.data.tournament;
          if (updatedTournament) {
            setTournaments((prev) =>
              prev.map((t) => (t.id.toString() === tournamentId.toString() ? updatedTournament : t))
            );
            if (currentTournament && currentTournament.id.toString() === tournamentId.toString()) {
              setCurrentTournament(updatedTournament);
            }
          }
          return response.data;
        } catch (err) {
          console.error('Erro ao iniciar torneio:', err);
          const errorMessage = err.response?.data?.message || 'Falha ao iniciar torneio';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    },
    [currentTournament, pendingRequests]
  );

  const availableTournaments = useMemo(() => {
    return filteredTournaments.length > 0 ? filteredTournaments : tournaments;
  }, [filteredTournaments, tournaments]);

  const value = {
    tournaments,
    filteredTournaments: availableTournaments,
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
    addPlayerToTournament,
    removePlayerFromTournament,
    startTournament,
    setFilters,
    clearFilters,
    filterCriteria,
    TOURNAMENT_STATUS,
  };

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
};

export default TournamentContext;
