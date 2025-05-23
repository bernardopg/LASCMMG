import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayerDetails } from '../services/api';
import { useMessage } from '../context/MessageContext';
import { FaUserCircle, FaEnvelope, FaVenusMars, FaStar, FaGamepad, FaTrophy, FaPercentage, FaListOl, FaSpinner } from 'react-icons/fa';

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
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <FaSpinner className="animate-spin text-4xl text-primary" />
        <p className="ml-4 text-lg">Carregando perfil do jogador...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="px-4 py-8 text-center"> {/* Removed container mx-auto */}
        <h1 className="text-2xl font-semibold text-red-600 mb-2">Erro ao Carregar Perfil</h1>
        <p className="text-gray-600 dark:text-gray-300">{error || 'Jogador não encontrado.'}</p>
        <Link to="/players" className="btn btn-primary mt-6">
          Voltar para Lista de Jogadores
        </Link>
      </div>
    );
  }

  // Placeholder for more detailed stats - e.g., win rate, tournament history
  const winRate = player.games_played > 0 ? ((player.wins / player.games_played) * 100).toFixed(1) : 0;

  return (
    <div className="px-4 py-8"> {/* Removed container mx-auto */}
      <div className="card bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <FaUserCircle className="text-8xl md:text-9xl text-primary dark:text-primary-light mb-4 md:mb-0 md:mr-8" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
              {player.name}
            </h1>
            {player.nickname && (
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-1">
                "{player.nickname}"
              </p>
            )}
            {player.email && (
              <p className="text-md text-gray-500 dark:text-gray-300 flex items-center mb-1">
                <FaEnvelope className="mr-2" /> {player.email}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {player.gender && (
            <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
              <FaVenusMars className="text-xl text-primary dark:text-primary-light mb-2" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">Gênero</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{player.gender}</p>
            </div>
          )}
          {player.skill_level && (
            <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
              <FaStar className="text-xl text-primary dark:text-primary-light mb-2" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">Nível</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{player.skill_level}</p>
            </div>
          )}
          <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
            <FaGamepad className="text-xl text-primary dark:text-primary-light mb-2" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Partidas Jogadas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{player.games_played || 0}</p>
          </div>
          <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
            <FaTrophy className="text-xl text-primary dark:text-primary-light mb-2" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Vitórias</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{player.wins || 0}</p>
          </div>
          <div className="info-card p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
            <FaPercentage className="text-xl text-primary dark:text-primary-light mb-2" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Taxa de Vitória</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{winRate}%</p>
          </div>
        </div>

        {/* TODO: Add section for Tournament History / Detailed Stats per Tournament */}
        <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Histórico em Torneios</h2>
            <p className="text-gray-500 dark:text-gray-400">
                (Visualização de participação e desempenho em torneios individuais será implementada aqui.)
            </p>
        </div>

      </div>
    </div>
  );
};

export default PlayerProfilePage;
