import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { useNotification } from './NotificationContext';

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

// Estados de torneio
const TOURNAMENT_STATUS = {
  DRAFT: 'Rascunho',
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
};

export const TournamentProvider = ({ children }) => {
  const [tournaments, setTournaments] = useState([]);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterCriteria, setFilterCriteria] = useState({ status: null, search: '' });

  // Cache para dados de jogadores e brackets por torneio
  const playersCache = useRef(new Map());
  const bracketsCache = useRef(new Map());

  // Controle para evitar carregamentos duplicados
  const loadTournamentsAttempted = useRef(false);
  const pendingRequests = useRef(new Map());

  // Sistema de notificações
  const { subscribeTournament, unsubscribeTournament } = useNotification();

  // Função para controlar solicitações concorrentes
  const controlRequest = useCallback(async (key, requestFn) => {
    // Se já existe uma solicitação pendente com a mesma chave, retorna a promessa existente
    if (pendingRequests.current.has(key)) {
      return pendingRequests.current.get(key);
    }

    // Cria nova promessa
    const request = (async () => {
      try {
        const result = await requestFn();
        return result;
      } finally {
        // Remove da lista de solicitações pendentes após conclusão
        pendingRequests.current.delete(key);
      }
    })();

    // Adiciona à lista de solicitações pendentes
    pendingRequests.current.set(key, request);

    return request;
  }, []);

  const loadTournaments = useCallback(async (forceRefresh = false) => {
    return controlRequest('loadTournaments', async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/api/tournaments');
        const fetchedTournaments = response.data.tournaments || [];
        setTournaments(fetchedTournaments);

        // Aplica filtros aos torneios carregados
        applyFilters(fetchedTournaments, filterCriteria);

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
        const errorMessage = err.response?.data?.message || 'Falha ao carregar torneios';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    });
  }, [controlRequest, filterCriteria]);

  // Observar mudanças no torneio atual para se inscrever nas notificações
  useEffect(() => {
    // Quando o torneio atual muda, inscrever-se nas notificações desse torneio
    if (currentTournament) {
      subscribeTournament(currentTournament.id.toString());
    }

    // Limpar inscrição quando o componente for desmontado ou o torneio mudar
    return () => {
      if (currentTournament) {
        unsubscribeTournament(currentTournament.id.toString());
      }
    };
  }, [currentTournament, subscribeTournament, unsubscribeTournament]);

  // Função para aplicar filtros
  const applyFilters = useCallback((tournamentsList, criteria) => {
    let filtered = [...tournamentsList];

    // Filtrar por status
    if (criteria.status) {
      filtered = filtered.filter(t => t.status === criteria.status);
    }

    // Filtrar por texto de pesquisa
    if (criteria.search) {
      const searchLower = criteria.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        (t.description && t.description.toLowerCase().includes(searchLower))
      );
    }

    setFilteredTournaments(filtered);
  }, []);

  // Atualizar filtros quando os critérios mudarem
  useEffect(() => {
    applyFilters(tournaments, filterCriteria);
  }, [tournaments, filterCriteria, applyFilters]);

  // Define filtros para os torneios
  const setFilters = useCallback((newCriteria) => {
    setFilterCriteria(prev => ({
      ...prev,
      ...newCriteria
    }));
  }, []);

  // Limpa todos os filtros
  const clearFilters = useCallback(() => {
    setFilterCriteria({ status: null, search: '' });
  }, []);

  const selectTournament = useCallback((tournamentId) => {
    const tournament = tournaments.find(
      (t) => t.id.toString() === tournamentId.toString()
    );

    if (tournament) {
      setCurrentTournament(tournament);
      localStorage.setItem('currentTournamentId', tournament.id.toString());

      // Inscrever-se nas notificações deste torneio
      subscribeTournament(tournament.id.toString());

      return tournament;
    }

    return null;
  }, [tournaments, subscribeTournament]);

  const createTournament = useCallback(async (tournamentData) => {
    return controlRequest('createTournament', async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.post(
          '/api/tournaments/create',
          tournamentData
        );

        // Limpar caches ao criar novo torneio
        playersCache.current.clear();
        bracketsCache.current.clear();

        const newTournament = response.data.tournament;
        setTournaments((prev) => [...prev, newTournament]);
        setCurrentTournament(newTournament);
        localStorage.setItem(
          'currentTournamentId',
          newTournament.id.toString()
        );

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
  }, [controlRequest]);

  const updateTournament = useCallback(async (tournamentId, tournamentData) => {
    return controlRequest(`updateTournament-${tournamentId}`, async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the refactored api.updateTournamentAdmin which handles multiple PATCH calls
        const response = await api.updateTournamentAdmin(tournamentId, tournamentData);
        // updateTournamentAdmin in api.js now returns { success, tournament, errors }

        if (!response.success) {
          // Handle case where one or more PATCH calls failed within updateTournamentAdmin
          const errorMessages = response.errors.map(e => `${e.field}: ${e.message}`).join('; ');
          throw new Error(errorMessages || 'Falha parcial ou total ao atualizar torneio.');
        }

        const updatedTournamentData = response.tournament;

        if (updatedTournamentData) {
          // Atualiza torneio na lista
          setTournaments((prev) =>
            prev.map((t) =>
              t.id.toString() === tournamentId.toString()
                ? updatedTournamentData
                : t
            )
          );

          // Limpar caches relacionados a este torneio
          playersCache.current.delete(tournamentId.toString());
          bracketsCache.current.delete(tournamentId.toString());

          // Atualiza o torneio atual se for o mesmo
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
        const errorMessage = err.response?.data?.message || 'Falha ao atualizar torneio';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    });
  }, [controlRequest, currentTournament]);

  const deleteTournament = useCallback(async (tournamentId) => {
    return controlRequest(`deleteTournament-${tournamentId}`, async () => {
      try {
        setLoading(true);
        setError(null);

        await api.patch(`/api/tournaments/${tournamentId}/status`, {
          status: TOURNAMENT_STATUS.CANCELED,
        });

        // Limpar caches relacionados a este torneio
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
        const errorMessage = err.response?.data?.message || 'Falha ao excluir torneio';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    });
  }, [controlRequest, currentTournament, tournaments]);

  const getTournamentPlayers = useCallback(async (tournamentId, forceRefresh = false) => {
    // Verificação mais rigorosa para evitar requisições com ID undefined
    if (!tournamentId || tournamentId === 'undefined') {
      console.warn('getTournamentPlayers: tournamentId inválido:', tournamentId);
      return { players: [] };
    }

    return controlRequest(`getTournamentPlayers-${tournamentId}`, async () => {
      const cacheKey = tournamentId.toString();

      // Verificar se os dados estão em cache e não forçar atualização
      if (!forceRefresh && playersCache.current.has(cacheKey)) {
        return playersCache.current.get(cacheKey);
      }

      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/api/tournaments/${tournamentId}/players`);

        // Armazenar no cache
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
  }, [controlRequest]);

  const getTournamentBrackets = useCallback(async (tournamentId, forceRefresh = false) => {
    // Verificação mais rigorosa para evitar requisições com ID undefined
    if (!tournamentId || tournamentId === 'undefined') {
      console.warn('getTournamentBrackets: tournamentId inválido:', tournamentId);
      return { matches: {}, rounds: [] };
    }

    return controlRequest(`getTournamentBrackets-${tournamentId}`, async () => {
      const cacheKey = tournamentId.toString();

      // Verificar se os dados estão em cache e não forçar atualização
      if (!forceRefresh && bracketsCache.current.has(cacheKey)) {
        return bracketsCache.current.get(cacheKey);
      }

      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/api/tournaments/${tournamentId}/state`);

        // Armazenar no cache
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
  }, [controlRequest]);

  // Carrega torneios ao montar o componente (apenas uma vez)
  useEffect(() => {
    if (!loadTournamentsAttempted.current) {
      loadTournaments();
      loadTournamentsAttempted.current = true;
    }
  }, [loadTournaments]);

  const refreshCurrentTournament = useCallback(async () => {
    // Verificação mais rigorosa para evitar requisições com ID undefined
    if (!currentTournament?.id || currentTournament.id === 'undefined') {
      return null;
    }

    return controlRequest(`refreshCurrentTournament-${currentTournament.id}`, async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/tournaments/${currentTournament.id}`);

        if (response.data.success && response.data.tournament) {
          const refreshedTournament = response.data.tournament;

          setCurrentTournament(refreshedTournament);
          setTournaments((prev) =>
            prev.map((t) =>
              t.id === currentTournament.id ? refreshedTournament : t
            )
          );

          // Limpar caches relacionados a este torneio
          playersCache.current.delete(currentTournament.id.toString());
          bracketsCache.current.delete(currentTournament.id.toString());

          setError(null);
          return refreshedTournament;
        } else {
          throw new Error(
            response.data.message ||
            'Falha ao buscar detalhes do torneio para atualização.'
          );
        }
      } catch (err) {
        console.error('Erro ao recarregar detalhes do torneio:', err);
        const errorMessage = err.response?.data?.message || 'Falha ao recarregar detalhes do torneio';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    });
  }, [controlRequest, currentTournament]);

  // Função para adicionar um jogador a um torneio
  const addPlayerToTournament = useCallback(async (tournamentId, playerData) => {
    return controlRequest(`addPlayerToTournament-${tournamentId}`, async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.post(
          `/api/tournaments/${tournamentId}/players`,
          playerData
        );

        // Limpar cache de jogadores para este torneio
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
  }, [controlRequest]);

  // Função para remover um jogador de um torneio
  const removePlayerFromTournament = useCallback(async (tournamentId, playerId) => {
    // Assuming this is a soft delete. The API for this is via admin player deletion.
    // Requires importing deletePlayerAdmin from api.js
    // import { deletePlayerAdmin } from '../services/api'; // Would need this import
    return controlRequest(`removePlayerFromTournament-${tournamentId}-${playerId}`, async () => {
      try {
        setLoading(true);
        setError(null);

        // This should call the admin endpoint for deleting a player,
        // which handles soft/permanent deletion. Assuming soft delete here.
        // The backend route is DELETE /api/admin/players/:playerId
        // The api.js function is deletePlayerAdmin(playerId, permanent)
        const response = await api.deletePlayerAdmin(playerId, false); // Assuming api.js is updated or deletePlayerAdmin is imported

        // Limpar cache de jogadores para este torneio
        playersCache.current.delete(tournamentId.toString());

        return response.data;
      } catch (err) {
        console.error('Erro ao remover jogador do torneio:', err);
        const errorMessage = err.response?.data?.message || 'Falha ao remover jogador';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    });
  }, [controlRequest]);

  // Função para iniciar um torneio
  const startTournament = useCallback(async (tournamentId) => {
    // This should call the endpoint for generating bracket, which also starts the tournament.
    // Backend route: POST /api/tournaments/:tournamentId/generate-bracket
    // api.js function: generateTournamentBracket(tournamentId)
    return controlRequest(`startTournament-${tournamentId}`, async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.generateTournamentBracket(tournamentId); // Assuming api.js has this function

        // Limpar caches para este torneio
        playersCache.current.delete(tournamentId.toString());
        bracketsCache.current.delete(tournamentId.toString());

        // Atualizar status do torneio na lista
        const updatedTournament = response.data.tournament;

        if (updatedTournament) {
          setTournaments(prev =>
            prev.map(t => t.id.toString() === tournamentId.toString() ? updatedTournament : t)
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
  }, [controlRequest, currentTournament]);

  // Memoize os torneios filtrados disponíveis
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
    TOURNAMENT_STATUS, // Exporta constantes de status para uso em componentes
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export default TournamentContext;
