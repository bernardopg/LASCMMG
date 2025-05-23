import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTournamentDetails } from '../../services/api';
import { FaTrophy, FaArrowLeft, FaSpinner } from 'react-icons/fa';

const AdminTournamentDetailPage = () => {
  const { id: tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTournament = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getTournamentDetails(tournamentId);
        if (data.success && data.tournament) {
          setTournament(data.tournament);
        } else {
          setError('Torneio não encontrado ou dados inválidos.');
        }
      } catch (err) {
        setError('Erro ao carregar dados do torneio.');
      } finally {
        setLoading(false);
      }
    };
    fetchTournament();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <FaSpinner className="animate-spin text-4xl text-primary" />
        <p className="ml-4 text-lg">Carregando torneio...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-2">Erro ao Carregar Torneio</h1>
        <p className="text-gray-600 dark:text-gray-300">{error || 'Torneio não encontrado.'}</p>
        <Link to="/admin/tournaments" className="btn btn-primary mt-6">
          <FaArrowLeft className="mr-2" /> Voltar para Lista de Torneios
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="card bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex items-center mb-6">
          <FaTrophy className="text-3xl text-primary dark:text-primary-light mr-4" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {tournament.name}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {tournament.description || 'Sem descrição detalhada.'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Data</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {tournament.date
                ? new Date(tournament.date).toLocaleDateString('pt-BR')
                : 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Status</h3>
            <p className="text-gray-500 dark:text-gray-400">{tournament.status || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Jogadores Esperados</h3>
            <p className="text-gray-500 dark:text-gray-400">{tournament.num_players_expected || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Tipo de Chave</h3>
            <p className="text-gray-500 dark:text-gray-400">{tournament.bracket_type || 'N/A'}</p>
          </div>
        </div>
        <div className="mt-8">
          <Link to="/admin/tournaments" className="btn btn-outline">
            <FaArrowLeft className="mr-2" /> Voltar para Lista de Torneios
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminTournamentDetailPage;
