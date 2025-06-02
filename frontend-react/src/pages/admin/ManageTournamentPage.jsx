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
import {
  FaCog,
  FaUsers,
  FaSitemap,
  FaSpinner,
  FaEdit,
  FaListOl,
  FaPlus,
  FaExclamationTriangle,
} from 'react-icons/fa'; // Added FaExclamationTriangle
import { LoadingSpinner } from '../../components/common/LoadingSpinner'; // Import LoadingSpinner
import PageHeader from '../../components/common/PageHeader'; // For consistent page titles
// import BracketDisplay from '../../components/bracket/BracketDisplay'; // A component to render the bracket

const ManageTournamentPage = () => {
  const { id: tournamentId } = useParams();
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
          console.error('Error parsing tournament state_json:', e);
          showError('Erro ao processar dados do chaveamento.');
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
      // Updated to pass null instead of 'NULL'
      const adminPlayersData = await getAdminPlayers({ filters: { tournament_id: null } });
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

  const cardBaseClasses = 'bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;
  const outlineButtonClasses = `${buttonBaseClasses} border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500`;
  const successButtonClasses = `${buttonBaseClasses} bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500`;
  const selectClasses =
    'form-select flex-grow mt-1 block w-full py-2 px-3 border border-slate-600 bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-lime-500 focus:border-lime-500 sm:text-sm text-slate-100';

  const getStatusTextClass = (status) => {
    switch (status) {
      case 'Em Andamento':
        return 'text-green-400';
      case 'Pendente':
        return 'text-yellow-400';
      case 'Concluído':
        return 'text-sky-400';
      default:
        return 'text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size="lg" message="Carregando gerenciamento do torneio..." />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <FaExclamationTriangle className="mx-auto text-5xl text-red-400 mb-4" />
        <h2 className="text-2xl font-semibold text-red-300">Torneio não encontrado.</h2>
        <button
          onClick={() => navigate('/admin/tournaments')}
          className={`${primaryButtonClasses} mt-6`}
        >
          Voltar para Lista de Torneios
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <PageHeader
          title={`Gerenciar: ${tournament.name}`}
          icon={FaCog}
          iconColor="text-lime-400"
        />
        <Link
          to={`/admin/tournaments/edit/${tournamentId}`}
          className={`${outlineButtonClasses} text-xs py-1.5 px-3 mt-4 md:mt-0`}
        >
          <FaEdit className="mr-2 h-3.5 w-3.5" /> Editar Detalhes
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`${cardBaseClasses} p-4`}>
          <h3 className="font-semibold text-lg mb-2 text-slate-200">Status</h3>
          <p className={`font-bold text-xl ${getStatusTextClass(tournament.status)}`}>
            {tournament.status}
          </p>
        </div>
        <div className={`${cardBaseClasses} p-4`}>
          <h3 className="font-semibold text-lg mb-2 text-slate-200">Jogadores</h3>
          <p className="text-slate-100 text-xl">
            {players.length} / {tournament.num_players_expected || 'N/A'}
          </p>
        </div>
        <div className={`${cardBaseClasses} p-4`}>
          <h3 className="font-semibold text-lg mb-2 text-slate-200">Tipo</h3>
          <p className="text-slate-100 text-xl">
            {tournament.bracket_type?.replace('-', ' ') || 'N/A'}
          </p>
        </div>
      </div>

      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:space-x-4">
        {tournament.status === 'Pendente' && (
          <button
            onClick={handleGenerateBracket}
            className={`${successButtonClasses} text-sm`}
            disabled={actionLoading || players.length < 2}
          >
            {actionLoading ? (
              <FaSpinner className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <FaSitemap className="mr-2 h-4 w-4" />
            )}
            {actionLoading ? 'Gerando...' : 'Gerar Chaveamento'}
          </button>
        )}
        <Link
          to={`/brackets?tournament=${tournamentId}`}
          className={`${primaryButtonClasses} text-sm`}
        >
          <FaSitemap className="mr-2 h-4 w-4" /> Ver Chaveamento Público
        </Link>
        {/* Add more action buttons here: e.g., Finalizar Torneio, Resetar Chaveamento */}
      </div>

      <div className={`${cardBaseClasses} mb-8`}>
        <h2 className="text-xl font-semibold mb-4 text-slate-100">
          Adicionar Jogador Existente ao Torneio
        </h2>
        {globalPlayers.length > 0 ? (
          <div className="flex items-center space-x-3">
            <select
              value={selectedGlobalPlayerId}
              onChange={(e) => setSelectedGlobalPlayerId(e.target.value)}
              className={selectClasses}
              disabled={assignLoading}
            >
              <option value="" className="bg-slate-700 text-slate-400">
                Selecione um jogador global
              </option>
              {globalPlayers.map((gp) => (
                <option key={gp.id} value={gp.id} className="bg-slate-700 text-slate-100">
                  {gp.name} ({gp.nickname || 'N/A'}) - ID: {gp.id}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignPlayer}
              className={`${primaryButtonClasses} text-sm`}
              disabled={assignLoading || !selectedGlobalPlayerId}
            >
              {assignLoading ? (
                <FaSpinner className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <FaPlus className="mr-2 h-4 w-4" />
              )}
              Adicionar
            </button>
          </div>
        ) : (
          <p className="text-slate-400">
            Nenhum jogador global disponível. Crie jogadores na{' '}
            <Link
              to="/admin/players/create"
              className="text-lime-400 hover:text-lime-300 underline"
            >
              página de criação de jogadores
            </Link>
            .
          </p>
        )}
      </div>

      <div className={`${cardBaseClasses} mb-8`}>
        <h2 className="text-xl font-semibold mb-4 text-slate-100">
          Jogadores Inscritos ({players.length})
        </h2>
        {players.length > 0 ? (
          <ul className="list-disc list-inside pl-5 space-y-1 text-slate-300">
            {players.map((p) => (
              <li key={p.id} className="text-sm">
                {p.name} {p.nickname ? `(${p.nickname})` : ''} - ID: {p.id}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400">Nenhum jogador inscrito.</p>
        )}
      </div>

      <div className={cardBaseClasses}>
        <h2 className="text-xl font-semibold mb-4 text-slate-100">Partidas e Resultados</h2>
        {bracketState && bracketState.matches && Object.keys(bracketState.matches).length > 0 ? (
          <p className="text-slate-300">
            Chaveamento gerado. (Visualização detalhada e gerenciamento de partidas aqui - Em
            desenvolvimento)
          </p>
        ) : tournament.status !== 'Pendente' ? (
          <p className="text-slate-400">
            Chaveamento ainda não gerado ou não disponível para este status.
          </p>
        ) : (
          <p className="text-slate-400">Gere o chaveamento para visualizar as partidas.</p>
        )}
      </div>
    </div>
  );
};

export default ManageTournamentPage;
