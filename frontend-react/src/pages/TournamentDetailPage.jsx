import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTournamentDetails, getPlayers } from '../services/api'; // Assuming getPlayers can fetch by tournamentId
import { useMessage } from '../context/MessageContext';
import {
  FaCalendarAlt,
  FaUsers,
  FaInfoCircle,
  FaMoneyBillWave,
  FaListOl,
  FaSitemap,
  FaEdit,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; // To show admin buttons

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <p className="ml-4 text-lg text-gray-700 dark:text-gray-200">
          Carregando detalhes do torneio...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        {' '}
        {/* Removed container mx-auto */}
        <FaInfoCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-semibold text-red-700 dark:text-red-400 mb-2">
          Erro ao Carregar Torneio
        </h1>
        <p className="text-gray-600 dark:text-gray-300">{error}</p>
        <Link to="/tournaments" className="btn btn-primary mt-6">
          Voltar para Lista de Torneios
        </Link>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="px-4 py-8 text-center">
        {' '}
        {/* Removed container mx-auto */}
        <FaInfoCircle size={48} className="mx-auto text-gray-400 mb-4" />
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Torneio Não Encontrado
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          O torneio que você está procurando não foi encontrado ou não está mais disponível.
        </p>
        <Link to="/tournaments" className="btn btn-primary mt-6">
          Voltar para Lista de Torneios
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      {' '}
      {/* Removed container mx-auto */}
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-light mb-2">
              {tournament.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {tournament.description || 'Sem descrição adicional.'}
            </p>
          </div>
          {isAuthenticated && hasPermission && hasPermission('admin') && (
            <Link
              to={`/admin/tournaments/edit/${tournament.id}`}
              className="btn btn-outline btn-sm mt-4 md:mt-0 flex items-center"
            >
              <FaEdit className="mr-2" /> Editar Torneio
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
            <FaCalendarAlt className="text-xl text-primary dark:text-primary-light mb-2" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Datas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Início: {formatDate(tournament.date)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fim: {tournament.endDate ? formatDate(tournament.endDate) : 'A definir'}
            </p>
          </div>
          <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
            <FaInfoCircle className="text-xl text-primary dark:text-primary-light mb-2" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Status</h3>
            <p
              className={`text-sm font-bold ${
                tournament.status === 'Em Andamento'
                  ? 'text-green-500'
                  : tournament.status === 'Pendente'
                    ? 'text-yellow-500'
                    : tournament.status === 'Concluído'
                      ? 'text-blue-500'
                      : 'text-gray-500'
              }`}
            >
              {formatStatus(tournament.status)}
            </p>
          </div>
          <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
            <FaSitemap className="text-xl text-primary dark:text-primary-light mb-2" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Tipo de Chaveamento</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tournament.bracket_type?.replace('-', ' ') || 'Não definido'}
            </p>
          </div>
          <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
            <FaUsers className="text-xl text-primary dark:text-primary-light mb-2" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Jogadores</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Inscritos: {players.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esperados: {tournament.num_players_expected || 'N/A'}
            </p>
          </div>
          <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
            <FaMoneyBillWave className="text-xl text-primary dark:text-primary-light mb-2" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Financeiro</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Taxa: {tournament.entry_fee ? `R$ ${tournament.entry_fee}` : 'Grátis'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Prêmios: {tournament.prize_pool || 'Não definido'}
            </p>
          </div>
          <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
            <FaListOl className="text-xl text-primary dark:text-primary-light mb-2" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Regras</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {tournament.rules || 'Não definidas.'}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <Link
            to={`/brackets?tournament=${tournamentId}`}
            className="btn btn-primary flex items-center justify-center w-full md:w-auto"
          >
            <FaSitemap className="mr-2" /> Ver Chaveamento Completo
          </Link>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Jogadores Inscritos
          </h2>
          {players.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-slate-700">
              {players.map((player) => (
                <li key={player.id} className="py-3 px-1">
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {player.name}
                  </span>
                  {player.nickname && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      ({player.nickname})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum jogador inscrito neste torneio ainda.
            </p>
          )}
        </div>

        {/* TODO: Add sections for Matches/Scores */}
      </div>
    </div>
  );
};

export default TournamentDetailPage;
