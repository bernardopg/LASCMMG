import { useCallback, useEffect, useState } from 'react';
import {
  FaCalendarAlt,
  FaEdit,
  FaInfoCircle,
  FaListOl,
  FaMoneyBillWave,
  FaSitemap,
  FaUsers,
} from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner'; // Import LoadingSpinner
import { useAuth } from '../context/AuthContext'; // To show admin buttons
import { useMessage } from '../context/MessageContext';
import { getPlayers, getTournamentDetails } from '../services/api'; // Assuming getPlayers can fetch by tournamentId

const TournamentDetailPage = () => {
  const { id: tournamentId } = useParams();
  const { showError } = useMessage();
  const { isAuthenticated, hasPermission } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTournamentData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const detailsData = await getTournamentDetails(tournamentId);
      setTournament(detailsData.tournament);

      // Fetch players for this tournament
      // The getPlayers function in api.js already supports fetching by tournamentId
      const playersData = await getPlayers(tournamentId);
      setPlayers(playersData.players || []);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Erro desconhecido';
      setError(`Erro ao carregar dados do torneio: ${errMsg}`);
      showError(`Erro ao carregar dados do torneio: ${errMsg}`);
      setTournament(null);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, showError]);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatStatus = (status) => {
    if (!status) return 'Indefinido';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 shadow-md hover:shadow-lg';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;
  const outlineButtonClasses = `${buttonBaseClasses} border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500`;
  const infoCardClasses =
    'p-4 sm:p-5 bg-slate-700/50 rounded-xl shadow-lg border border-slate-600/70';
  const infoCardIconClasses = 'text-xl text-lime-400 mb-2';
  const infoCardLabelClasses = 'font-semibold text-slate-200 text-sm';
  const infoCardValueClasses = 'text-sm text-slate-400';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size="lg" />
        <p className="ml-4 text-lg text-slate-300 mt-4">Carregando detalhes do torneio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <FaInfoCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-semibold text-red-400 mb-2">Erro ao Carregar Torneio</h1>
        <p className="text-slate-400">{error}</p>
        <Link to="/tournaments" className={`${primaryButtonClasses} mt-6`}>
          Voltar para Lista de Torneios
        </Link>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <FaInfoCircle size={48} className="mx-auto text-slate-600 mb-4" />
        <h1 className="text-2xl font-semibold text-slate-100 mb-2">Torneio Não Encontrado</h1>
        <p className="text-slate-400">
          O torneio que você está procurando não foi encontrado ou não está mais disponível.
        </p>
        <Link to="/tournaments" className={`${primaryButtonClasses} mt-6`}>
          Voltar para Lista de Torneios
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-slate-800 shadow-2xl rounded-xl p-6 md:p-8 border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 pb-6 border-b border-slate-700">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-lime-300 mb-2">{tournament.name}</h1>
            <p className="text-slate-400 text-lg">
              {tournament.description || 'Sem descrição adicional.'}
            </p>
          </div>
          {isAuthenticated && hasPermission && hasPermission('admin') && (
            <Link
              to={`/admin/tournaments/${tournament.id}`} // Points to AdminTournamentDetailPage
              className={`${outlineButtonClasses} mt-4 md:mt-0`}
            >
              <FaEdit className="mr-2 h-4 w-4" /> Editar Torneio
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className={infoCardClasses}>
            <FaCalendarAlt className={infoCardIconClasses} />
            <h3 className={infoCardLabelClasses}>Datas</h3>
            <p className={infoCardValueClasses}>Início: {formatDate(tournament.date)}</p>
            <p className={infoCardValueClasses}>
              Fim: {tournament.endDate ? formatDate(tournament.endDate) : 'A definir'}
            </p>
          </div>
          <div className={infoCardClasses}>
            <FaInfoCircle className={infoCardIconClasses} />
            <h3 className={infoCardLabelClasses}>Status</h3>
            <p
              className={`text-sm font-bold ${
                tournament.status === 'Em Andamento'
                  ? 'text-green-300'
                  : tournament.status === 'Pendente'
                    ? 'text-yellow-300'
                    : tournament.status === 'Concluído'
                      ? 'text-sky-300'
                      : 'text-slate-500'
              }`}
            >
              {formatStatus(tournament.status)}
            </p>
          </div>
          <div className={infoCardClasses}>
            <FaSitemap className={infoCardIconClasses} />
            <h3 className={infoCardLabelClasses}>Tipo de Chaveamento</h3>
            <p className={infoCardValueClasses}>
              {tournament.bracket_type?.replace('-', ' ') || 'Não definido'}
            </p>
          </div>
          <div className={infoCardClasses}>
            <FaUsers className={infoCardIconClasses} />
            <h3 className={infoCardLabelClasses}>Jogadores</h3>
            <p className={infoCardValueClasses}>Inscritos: {players.length}</p>
            <p className={infoCardValueClasses}>
              Esperados: {tournament.num_players_expected || 'N/A'}
            </p>
          </div>
          <div className={infoCardClasses}>
            <FaMoneyBillWave className={infoCardIconClasses} />
            <h3 className={infoCardLabelClasses}>Financeiro</h3>
            <p className={infoCardValueClasses}>
              Taxa: {tournament.entry_fee ? `R$ ${tournament.entry_fee}` : 'Grátis'}
            </p>
            <p className={infoCardValueClasses}>
              Prêmios: {tournament.prize_pool || 'Não definido'}
            </p>
          </div>
          <div className={infoCardClasses}>
            <FaListOl className={infoCardIconClasses} />
            <h3 className={infoCardLabelClasses}>Regras</h3>
            <p className={`${infoCardValueClasses} whitespace-pre-wrap`}>
              {tournament.rules || 'Não definidas.'}
            </p>
          </div>
        </div>

        <div className="mb-8 text-center">
          <Link
            to={`/brackets?tournament=${tournamentId}`} // Consider using /brackets/:tournamentId if that's the route
            className={`${primaryButtonClasses} w-full md:w-auto`}
          >
            <FaSitemap className="mr-2 h-5 w-5" /> Ver Chaveamento Completo
          </Link>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">
            Jogadores Inscritos ({players.length})
          </h2>
          {players.length > 0 ? (
            <ul className="divide-y divide-slate-700 max-h-96 overflow-y-auto bg-slate-700/30 p-4 rounded-lg">
              {players.map((player) => (
                <li key={player.id} className="py-3 px-1">
                  <span className="font-medium text-slate-100">{player.name}</span>
                  {player.nickname && (
                    <span className="text-sm text-slate-400 ml-2">({player.nickname})</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 p-4 bg-slate-700/30 rounded-lg text-center">
              Nenhum jogador inscrito neste torneio ainda.
            </p>
          )}
        </div>

        {/* TODO: Add sections for Matches/Scores for this specific tournament */}
        <div className="mt-10 pt-6 border-t border-slate-700">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">Partidas Recentes</h2>
          <div className="p-6 bg-slate-700/30 rounded-lg text-center">
            <p className="text-slate-400">
              (Visualização de partidas e placares deste torneio será implementada aqui.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailPage;
