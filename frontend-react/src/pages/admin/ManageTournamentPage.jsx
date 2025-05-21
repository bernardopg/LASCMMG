import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getTournamentDetails,
  getPlayers, // This fetches players for a specific tournament
  getAdminPlayers, // This fetches all players, can be filtered
  assignPlayerToTournamentAPI, // Newly added API function
  generateTournamentBracket,
  getTournamentState, // Added getTournamentState
} from '../../services/api';
import { useMessage } from '../../context/MessageContext';
import { FaCog, FaUsers, FaSitemap, FaSpinner, FaEdit, FaListOl, FaPlus } from 'react-icons/fa';
// import BracketDisplay from '../../components/bracket/BracketDisplay'; // A component to render the bracket

const ManageTournamentPage = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useMessage();

  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]); // Players in this tournament
  const [globalPlayers, setGlobalPlayers] = useState([]); // Players not in any tournament
  const [selectedGlobalPlayerId, setSelectedGlobalPlayerId] = useState('');
  const [bracketState, setBracketState] = useState(null); // To store parsed state_json
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchTournamentData = useCallback(async () => {
    setLoading(true);
    try {
      const detailsData = await getTournamentDetails(tournamentId);
      setTournament(detailsData.tournament);
      if (detailsData.tournament?.state_json) {
        try {
          setBracketState(JSON.parse(detailsData.tournament.state_json));
        } catch (e) {
          console.error("Error parsing tournament state_json:", e);
          showError("Erro ao processar dados do chaveamento.");
          setBracketState({ matches: {}, rounds: [] }); // Default empty state
        }
      } else {
         // If state_json is null or undefined, try fetching from /state endpoint
        const stateData = await getTournamentState(tournamentId); // Use service function
        setBracketState(stateData || { matches: {}, rounds: [] }); // Assuming stateData is the direct state object
      }

      const playersData = await getPlayers(tournamentId);
      setPlayers(playersData.players || []);

      // Fetch global players (not assigned to any tournament)
      // We assume getAdminPlayers can take a filter like { tournament_id: null }
      // This might require an adjustment in getAdminPlayers if it doesn't support null filter directly
      // or a specific backend endpoint for unassigned players.
      // For now, let's assume a filter for `tournament_id: 'NULL'` or similar works.
      // A more robust way would be a dedicated endpoint or ensuring the filter works as expected.
      const adminPlayersData = await getAdminPlayers({ filters: { tournament_id: 'NULL' } });
      setGlobalPlayers(adminPlayersData.players || []);

    } catch (err) {
      showError(`Erro ao carregar dados do torneio: ${err.response?.data?.message || err.message}`);
      setTournament(null);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, showError]);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  const handleAssignPlayer = async () => {
    if (!selectedGlobalPlayerId) {
      showError('Por favor, selecione um jogador para adicionar.');
      return;
    }
    setAssignLoading(true);
    try {
      await assignPlayerToTournamentAPI(tournamentId, selectedGlobalPlayerId);
      showSuccess('Jogador adicionado ao torneio com sucesso!');
      setSelectedGlobalPlayerId(''); // Reset selection
      fetchTournamentData(); // Refresh both tournament players and global players list
    } catch (err) {
      showError(`Erro ao adicionar jogador: ${err.response?.data?.message || err.message}`);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleGenerateBracket = async () => {
    if (!tournament || tournament.status !== 'Pendente') {
      showError('O chaveamento só pode ser gerado para torneios pendentes.');
      return;
    }
    setActionLoading(true);
    try {
      const result = await generateTournamentBracket(tournamentId);
      showSuccess(result.message || 'Chaveamento gerado com sucesso!');
      fetchTournamentData(); // Refresh all data
    } catch (err) {
      showError(`Erro ao gerar chaveamento: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Placeholder for other actions like updating match scores, advancing players etc.

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-primary" />
        <p className="ml-3 text-lg">Carregando gerenciamento do torneio...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="px-4 py-8 text-center"> {/* Removed container mx-auto */}
        <h2 className="text-2xl font-semibold text-red-600">Torneio não encontrado.</h2>
        <button onClick={() => navigate('/admin/tournaments')} className="btn btn-primary mt-4">
          Voltar para Lista de Torneios
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-8"> {/* Removed container mx-auto */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Gerenciar Torneio: <span className="text-primary dark:text-primary-light">{tournament.name}</span>
        </h1>
        <Link to={`/admin/tournaments/edit/${tournamentId}`} className="btn btn-outline btn-sm flex items-center">
          <FaEdit className="mr-2" /> Editar Detalhes
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-white dark:bg-slate-800 p-4">
          <h3 className="font-semibold text-lg mb-2">Status</h3>
          <p className={`font-bold ${
              tournament.status === 'Em Andamento' ? 'text-green-500' :
              tournament.status === 'Pendente' ? 'text-yellow-500' :
              tournament.status === 'Concluído' ? 'text-blue-500' : 'text-gray-500'
            }`}>{tournament.status}</p>
        </div>
        <div className="card bg-white dark:bg-slate-800 p-4">
          <h3 className="font-semibold text-lg mb-2">Jogadores</h3>
          <p>{players.length} / {tournament.num_players_expected || 'N/A'}</p>
        </div>
        <div className="card bg-white dark:bg-slate-800 p-4">
          <h3 className="font-semibold text-lg mb-2">Tipo</h3>
          <p>{tournament.bracket_type?.replace('-', ' ')}</p>
        </div>
      </div>

      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:space-x-4">
        {tournament.status === 'Pendente' && (
          <button
            onClick={handleGenerateBracket}
            className="btn btn-success flex items-center"
            disabled={actionLoading || players.length < 2}
          >
            {actionLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaSitemap className="mr-2" />}
            {actionLoading ? 'Gerando...' : 'Gerar Chaveamento'}
          </button>
        )}
         <Link
            to={`/brackets?tournament=${tournamentId}`}
            className="btn btn-primary flex items-center"
          >
            <FaSitemap className="mr-2" /> Ver Chaveamento Público
          </Link>
        {/* Add more action buttons here: e.g., Finalizar Torneio, Resetar Chaveamento */}
      </div>

      {/* Section to display players */}
      <div className="card bg-white dark:bg-slate-800 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Adicionar Jogador Existente ao Torneio</h2>
        {globalPlayers.length > 0 ? (
          <div className="flex items-center space-x-2">
            <select
              value={selectedGlobalPlayerId}
              onChange={(e) => setSelectedGlobalPlayerId(e.target.value)}
              className="select select-bordered flex-grow"
              disabled={assignLoading}
            >
              <option value="">Selecione um jogador global</option>
              {globalPlayers.map(gp => (
                <option key={gp.id} value={gp.id}>
                  {gp.name} ({gp.nickname || 'N/A'}) - ID: {gp.id}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignPlayer}
              className="btn btn-primary flex items-center"
              disabled={assignLoading || !selectedGlobalPlayerId}
            >
              {assignLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaPlus className="mr-2" />}
              Adicionar ao Torneio
            </button>
          </div>
        ) : (
          <p>Nenhum jogador global disponível para adicionar. Crie jogadores na <Link to="/admin/players/create" className="link link-primary">página de criação de jogadores</Link> sem vinculá-los a um torneio.</p>
        )}
      </div>

      {/* Section to display players */}
      <div className="card bg-white dark:bg-slate-800 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Jogadores Inscritos ({players.length})</h2>
        {players.length > 0 ? (
          <ul className="list-disc pl-5">
            {players.map(p => <li key={p.id}>{p.PlayerName || p.name}</li>)}
          </ul>
        ) : <p>Nenhum jogador inscrito.</p>}
      </div>

      {/* Section to display bracket/matches - This would be complex */}
      <div className="card bg-white dark:bg-slate-800 p-6">
        <h2 className="text-xl font-semibold mb-4">Partidas e Resultados</h2>
        {bracketState && bracketState.matches && Object.keys(bracketState.matches).length > 0 ? (
          <p>Chaveamento gerado. (Visualização detalhada e gerenciamento de partidas aqui - Em desenvolvimento)</p>
          // Here you could map through bracketState.rounds and bracketState.matches
          // to display match information and provide options to update scores.
          // Example: <BracketDisplay bracket={bracketState} tournamentId={tournamentId} isAdmin={true} />
        ) : tournament.status !== 'Pendente' ? (
          <p>Chaveamento ainda não gerado ou não disponível.</p>
        ) : (
           <p>Gere o chaveamento para visualizar as partidas.</p>
        )}
      </div>
    </div>
  );
};

export default ManageTournamentPage;
