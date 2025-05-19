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
      // API_REFERENCE.md indica: { success: true, tournaments: [...], totalPages, currentPage, totalTournaments }
      const fetchedTournaments = response.data.tournaments || [];
      setTournaments(fetchedTournaments);

      // Se houver um torneio ativo no localStorage, selecionar ele
      const savedTournamentId = localStorage.getItem('currentTournamentId');
      if (savedTournamentId) {
        const saved = fetchedTournaments.find(
          (t) => t.id.toString() === savedTournamentId
        );
        if (saved) {
          setCurrentTournament(saved);
        } else if (fetchedTournaments.length > 0) {
          // Se o torneio salvo não existir mais, usar o primeiro da lista
          setCurrentTournament(fetchedTournaments[0]);
          localStorage.setItem(
            'currentTournamentId',
            fetchedTournaments[0].id.toString()
          );
        }
      } else if (fetchedTournaments.length > 0) {
        // Se não houver torneio salvo, usar o primeiro da lista
        setCurrentTournament(fetchedTournaments[0]);
        localStorage.setItem(
          'currentTournamentId',
          fetchedTournaments[0].id.toString()
        );
      }

      return fetchedTournaments; // Retornar a lista de torneios
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

      const response = await axios.post('/api/tournaments/create', tournamentData); // Corrigido endpoint

      // Adicionar o novo torneio à lista
      setTournaments((prev) => [...prev, response.data.tournament]); // API retorna { success, tournamentId, tournament }

      // Selecionar o novo torneio como atual
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

  // Atualizar um torneio
  const updateTournament = async (tournamentId, tournamentData) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Verificar e alinhar com o backend. API_REFERENCE.md sugere PATCH para propriedades específicas.
      // Se um PUT /api/tournaments/:id para atualização completa não existir, esta função falhará ou terá comportamento inesperado.
      // Por ora, mantendo a lógica PUT, mas com este aviso.
      // Uma abordagem mais granular com PATCH para cada propriedade editável seria mais alinhada com a API_REFERENCE.md.
      const response = await axios.put(
        `/api/tournaments/${tournamentId}`,
        tournamentData
      );

      // Assumindo que a API, se existir, retorna { success: true, tournament: updatedTournament }
      const updatedTournamentData = response.data.tournament;

      if (updatedTournamentData) {
        // Atualizar o torneio na lista
        setTournaments((prev) =>
          prev.map((t) =>
            t.id.toString() === tournamentId.toString() ? updatedTournamentData : t
          )
        );

        // Se for o torneio atual, atualizá-lo também
        if (
          currentTournament &&
          currentTournament.id.toString() === tournamentId.toString()
        ) {
          setCurrentTournament(updatedTournamentData);
        }
        return updatedTournamentData;
      } else {
        // Se a API não retornar o torneio atualizado no formato esperado
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

  // Excluir um torneio
  const deleteTournament = async (tournamentId) => {
    try {
      setLoading(true);
      setError(null);

      // API_REFERENCE.md não lista DELETE /api/tournaments/:tournamentId.
      // A exclusão pode ser uma atualização de status para 'Cancelado' ou via /api/admin/trash.
      // Por ora, vamos assumir que é uma atualização de status para 'Cancelado'.
      // Se for exclusão permanente, a API precisaria ser diferente.
      // Esta é uma simplificação; uma implementação real poderia chamar uma rota PATCH para status.
      // Ou, se a intenção é mover para a lixeira (soft delete), a API seria diferente.
      // Para fins de correção do contexto, vamos simular uma atualização de status.
      // Idealmente, o backend teria uma rota específica para "cancelar" ou "arquivar".
      // await axios.delete(`/api/tournaments/${tournamentId}`); // Comentado - endpoint incerto
      await axios.patch(`/api/tournaments/${tournamentId}/status`, { status: 'Cancelado' });


      // Remover o torneio da lista ou apenas atualizar seu status
      const updatedTournamentsAfterDelete = tournaments.map(t =>
        t.id.toString() === tournamentId.toString() ? { ...t, status: 'Cancelado' } : t
      ).filter(t => t.status !== 'Cancelado'); // Ou apenas atualizar e manter na lista se preferir

      setTournaments(updatedTournamentsAfterDelete);

      // Se for o torneio atual, selecionar outro
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
        `/api/tournaments/${tournamentId}/state` // Corrigido endpoint
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
  // TODO: Implementar endpoint /api/tournaments/:tournamentId/export no backend
  // const exportTournament = async (tournamentId, format) => {
  //   try {
  //     setLoading(true);
  //     setError(null);

  //     const response = await axios.get(
  //       `/api/tournaments/${tournamentId}/export?format=${format}`,
  //       { responseType: 'blob' }
  //     );

  //     // Criar URL e baixar o arquivo
  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.setAttribute('download', `torneio-${tournamentId}.${format}`);
  //     document.body.appendChild(link);
  //     link.click();
  //     link.parentNode.removeChild(link);

  //     return true;
  //   } catch (err) {
  //     console.error('Erro ao exportar torneio:', err);
  //     setError(err.response?.data?.message || 'Falha ao exportar torneio');
  //     throw err;
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
      // A API GET /api/tournaments/:id retorna { success: true, tournament: tournamentDetails }
      if (response.data.success && response.data.tournament) {
        setCurrentTournament(response.data.tournament); // Atualiza o torneio atual com os dados mais recentes
        // Atualizar também na lista geral de torneios, caso algo tenha mudado lá
        setTournaments(prev =>
          prev.map(t => t.id === currentTournament.id ? response.data.tournament : t)
        );
        setError(null);
      } else {
        // Tratar caso onde response.data.success é false ou tournament não existe
        throw new Error(response.data.message || 'Falha ao buscar detalhes do torneio para atualização.');
      }
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
    // exportTournament, // Comentado até o backend ser implementado
    refreshCurrentTournament, // Adicionar a nova função ao contexto
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export default TournamentContext;
