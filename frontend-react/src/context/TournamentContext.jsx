import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Criar context
const TournamentContext = createContext();

// Hook personalizado para usar o context
export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error(
      'useTournament deve ser usado dentro de um TournamentProvider'
    );
  }
  return context;
};

// Provider component
export const TournamentProvider = ({ children }) => {
  const [tournaments, setTournaments] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar todos os torneios
  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/tournaments');
      setTournaments(response.data);

      // Se houver um torneio ativo no localStorage, selecionar ele
      const savedTournamentId = localStorage.getItem('currentTournamentId');
      if (savedTournamentId) {
        const saved = response.data.find(
          (t) => t.id.toString() === savedTournamentId
        );
        if (saved) {
          setCurrentTournament(saved);
        } else if (response.data.length > 0) {
          // Se o torneio salvo não existir mais, usar o primeiro da lista
          setCurrentTournament(response.data[0]);
          localStorage.setItem(
            'currentTournamentId',
            response.data[0].id.toString()
          );
        }
      } else if (response.data.length > 0) {
        // Se não houver torneio salvo, usar o primeiro da lista
        setCurrentTournament(response.data[0]);
        localStorage.setItem(
          'currentTournamentId',
          response.data[0].id.toString()
        );
      }

      return response.data;
    } catch (err) {
      console.error('Erro ao carregar torneios:', err);
      setError(err.response?.data?.message || 'Falha ao carregar torneios');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Selecionar um torneio
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

  // Criar um novo torneio
  const createTournament = async (tournamentData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/tournaments', tournamentData);

      // Adicionar o novo torneio à lista
      setTournaments((prev) => [...prev, response.data]);

      // Selecionar o novo torneio como atual
      setCurrentTournament(response.data);
      localStorage.setItem('currentTournamentId', response.data.id.toString());

      return response.data;
    } catch (err) {
      console.error('Erro ao criar torneio:', err);
      setError(err.response?.data?.message || 'Falha ao criar torneio');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar um torneio
  const updateTournament = async (tournamentId, tournamentData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.put(
        `/api/tournaments/${tournamentId}`,
        tournamentData
      );

      // Atualizar o torneio na lista
      setTournaments((prev) =>
        prev.map((t) =>
          t.id.toString() === tournamentId.toString() ? response.data : t
        )
      );

      // Se for o torneio atual, atualizá-lo também
      if (
        currentTournament &&
        currentTournament.id.toString() === tournamentId.toString()
      ) {
        setCurrentTournament(response.data);
      }

      return response.data;
    } catch (err) {
      console.error('Erro ao atualizar torneio:', err);
      setError(err.response?.data?.message || 'Falha ao atualizar torneio');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir um torneio
  const deleteTournament = async (tournamentId) => {
    try {
      setLoading(true);
      setError(null);

      await axios.delete(`/api/tournaments/${tournamentId}`);

      // Remover o torneio da lista
      const updatedTournaments = tournaments.filter(
        (t) => t.id.toString() !== tournamentId.toString()
      );
      setTournaments(updatedTournaments);

      // Se for o torneio atual, selecionar outro
      if (
        currentTournament &&
        currentTournament.id.toString() === tournamentId.toString()
      ) {
        if (updatedTournaments.length > 0) {
          setCurrentTournament(updatedTournaments[0]);
          localStorage.setItem(
            'currentTournamentId',
            updatedTournaments[0].id.toString()
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

  // Carregar jogadores de um torneio
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

  // Carregar brackets de um torneio
  const getTournamentBrackets = async (tournamentId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `/api/tournaments/${tournamentId}/brackets`
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

  // Exportar torneio (PDF, Excel, etc)
  const exportTournament = async (tournamentId, format) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `/api/tournaments/${tournamentId}/export?format=${format}`,
        { responseType: 'blob' }
      );

      // Criar URL e baixar o arquivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `torneio-${tournamentId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      return true;
    } catch (err) {
      console.error('Erro ao exportar torneio:', err);
      setError(err.response?.data?.message || 'Falha ao exportar torneio');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carregar torneios no carregamento inicial
  useEffect(() => {
    loadTournaments();
  }, []);

  // Função para recarregar/atualizar os detalhes do torneio atual
  const refreshCurrentTournament = async () => {
    if (!currentTournament?.id) {
      return; // Nenhum torneio atual para recarregar
    }
    try {
      setLoading(true); // Pode usar um loading state específico se preferir
      const response = await axios.get(`/api/tournaments/${currentTournament.id}`);
      setCurrentTournament(response.data); // Atualiza o torneio atual com os dados mais recentes
      // Atualizar também na lista geral de torneios, caso algo tenha mudado lá
      setTournaments(prev =>
        prev.map(t => t.id === currentTournament.id ? response.data : t)
      );
      setError(null);
    } catch (err) {
      console.error('Erro ao recarregar detalhes do torneio:', err);
      setError(err.response?.data?.message || 'Falha ao recarregar detalhes do torneio');
      // Não limpar currentTournament aqui, pode ser um erro temporário
    } finally {
      setLoading(false);
    }
  };

  // Valor fornecido pelo context
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
    exportTournament,
    refreshCurrentTournament, // Adicionar a nova função ao contexto
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export default TournamentContext;
