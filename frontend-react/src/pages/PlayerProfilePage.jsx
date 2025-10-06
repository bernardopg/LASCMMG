import { useCallback, useEffect, useState } from 'react';
import {
  FaEnvelope,
  FaGamepad,
  FaPercentage,
  FaStar,
  FaTrophy,
  FaUserCircle,
  FaVenusMars,
} from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/ui/loading/LoadingSpinner'; // Import LoadingSpinner
import PageHeader from '../components/ui/page/PageHeader'; // For consistent page titles
import { useMessage } from '../context/MessageContext';
import { getPlayerDetails } from '../services/api';

const PlayerProfilePage = () => {
  const { id: playerId } = useParams();
  const { showError } = useMessage();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPlayerData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPlayerDetails(playerId);
      if (data.success && data.player) {
        setPlayer(data.player);
      } else {
        setError('Jogador não encontrado ou dados inválidos.');
        showError(data.message || 'Jogador não encontrado.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Erro desconhecido';
      setError(`Erro ao carregar dados do jogador: ${errMsg}`);
      showError(`Erro ao carregar dados do jogador: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  }, [playerId, showError]);

  useEffect(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size="lg" />
        <p className="ml-4 text-lg text-slate-300 mt-4">Carregando perfil do jogador...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold text-red-400 mb-2">Erro ao Carregar Perfil</h1>
        <p className="text-slate-400">{error || 'Jogador não encontrado.'}</p>
        <Link
          to="/players"
          className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-lime-600 hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 focus:ring-offset-slate-900"
        >
          Voltar para Lista de Jogadores
        </Link>
      </div>
    );
  }

  const winRate =
    player.games_played > 0 ? ((player.wins / player.games_played) * 100).toFixed(1) : '0.0';

  const statCardClasses =
    'p-4 sm:p-5 bg-slate-700/50 rounded-xl shadow-lg border border-slate-600/70';
  const statIconClasses = 'text-2xl text-lime-400 mb-2';
  const statLabelClasses = 'font-semibold text-slate-200 text-sm sm:text-base';
  const statValueClasses = 'text-xs sm:text-sm text-slate-400';

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={player.name}
        subtitle={player.nickname ? `"${player.nickname}"` : 'Perfil do Jogador'}
      />

      <div className="bg-slate-800 shadow-2xl rounded-xl p-6 md:p-8 border border-slate-700">
        <div className="flex flex-col md:flex-row items-center md:items-start mb-8 pb-8 border-b border-slate-700">
          <FaUserCircle className="text-7xl md:text-8xl text-lime-400 mb-4 md:mb-0 md:mr-8" />
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-100">{player.name}</h1>
            {player.nickname && (
              <p className="text-xl text-slate-400 mb-1">&ldquo;{player.nickname}&rdquo;</p>
            )}
            {player.email && (
              <p className="text-md text-slate-300 flex items-center justify-center md:justify-start mb-1">
                <FaEnvelope className="mr-2 h-4 w-4" /> {player.email}
              </p>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-100 mb-6">Estatísticas do Jogador</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {player.gender && (
            <div className={statCardClasses}>
              <FaVenusMars className={statIconClasses} />
              <h3 className={statLabelClasses}>Gênero</h3>
              <p className={statValueClasses}>{player.gender}</p>
            </div>
          )}
          {player.skill_level && (
            <div className={statCardClasses}>
              <FaStar className={statIconClasses} />
              <h3 className={statLabelClasses}>Nível de Habilidade</h3>
              <p className={statValueClasses}>{player.skill_level}</p>
            </div>
          )}
          <div className={statCardClasses}>
            <FaGamepad className={statIconClasses} />
            <h3 className={statLabelClasses}>Partidas Jogadas</h3>
            <p className={statValueClasses}>{player.games_played || 0}</p>
          </div>
          <div className={statCardClasses}>
            <FaTrophy className={statIconClasses} />
            <h3 className={statLabelClasses}>Vitórias</h3>
            <p className={statValueClasses}>{player.wins || 0}</p>
          </div>
          <div className={statCardClasses}>
            <FaPercentage className={statIconClasses} />
            <h3 className={statLabelClasses}>Taxa de Vitória</h3>
            <p className={statValueClasses}>{winRate}%</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-700">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">Histórico em Torneios</h2>
          <div className="p-6 bg-slate-700/30 rounded-lg text-center">
            <p className="text-slate-400">
              (Visualização de participação e desempenho em torneios individuais será implementada
              aqui em breve.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
