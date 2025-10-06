import { useCallback, useEffect, useState } from 'react';
import { FaArrowLeft, FaInfoCircle, FaTrophy } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/loading/LoadingSpinner';
import PageHeader from '../../components/ui/page/PageHeader';
import { getTournamentDetails } from '../../services/api';

const AdminTournamentDetailPage = () => {
  const { id: tournamentIdFromParams } = useParams(); // Renamed for clarity
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTournament = useCallback(async (idToFetch) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTournamentDetails(idToFetch);
      if (data.success && data.tournament) {
        setTournament(data.tournament);
      } else {
        setError(data.message || 'Torneio não encontrado ou dados inválidos.');
      }
    } catch (err) {
      console.error('Erro ao carregar dados do torneio:', err);
      setError(`Erro ao carregar dados do torneio: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      !tournamentIdFromParams ||
      tournamentIdFromParams === 'undefined' ||
      tournamentIdFromParams === 'null' ||
      tournamentIdFromParams.trim() === ''
    ) {
      setError(`ID do torneio inválido na URL: &quot;${tournamentIdFromParams}&quot;.`);
      setLoading(false);
      return;
    }
    fetchTournament(tournamentIdFromParams);
  }, [tournamentIdFromParams, fetchTournament]);

  const cardBaseClasses = 'bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-700';
  const detailItemClasses = 'mb-4';
  const detailLabelClasses = 'font-semibold text-slate-300 block text-sm';
  const detailValueClasses = 'text-slate-100 text-base';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const outlineButtonClasses = `${buttonBaseClasses} border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size="lg" message="Carregando detalhes do torneio..." />
        {tournamentIdFromParams && (
          <p className="mt-2 text-sm text-slate-500">ID: {tournamentIdFromParams}</p>
        )}
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <FaInfoCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h1 className="text-2xl font-semibold text-red-400 mb-2">Erro ao Carregar Torneio</h1>
        <p className="text-slate-300 mb-2">{error || 'Torneio não encontrado.'}</p>
        {tournamentIdFromParams && (
          <p className="text-sm text-slate-500 mb-4">
            ID do torneio: &quot;{tournamentIdFromParams}&quot;
          </p>
        )}
        <Link to="/admin/tournaments" className={`${outlineButtonClasses} mt-6`}>
          <FaArrowLeft className="mr-2 h-4 w-4" /> Voltar para Lista de Torneios
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title={tournament.name} badge={{ text: 'Detalhes', icon: FaTrophy }} />

      <div className={cardBaseClasses}>
        <p className="text-slate-300 mb-6 text-lg">
          {tournament.description || 'Sem descrição detalhada.'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <div className={detailItemClasses}>
            <span className={detailLabelClasses}>Data de Início</span>
            <p className={detailValueClasses}>
              {tournament.date
                ? new Date(tournament.date).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
          <div className={detailItemClasses}>
            <span className={detailLabelClasses}>Status</span>
            <p className={detailValueClasses}>{tournament.status || 'N/A'}</p>
          </div>
          <div className={detailItemClasses}>
            <span className={detailLabelClasses}>Jogadores Esperados</span>
            <p className={detailValueClasses}>{tournament.num_players_expected || 'N/A'}</p>
          </div>
          <div className={detailItemClasses}>
            <span className={detailLabelClasses}>Tipo de Chaveamento</span>
            <p className={detailValueClasses}>
              {tournament.bracket_type?.replace('-', ' ') || 'N/A'}
            </p>
          </div>
          <div className={detailItemClasses}>
            <span className={detailLabelClasses}>Taxa de Inscrição</span>
            <p className={detailValueClasses}>
              {tournament.entry_fee ? `R$ ${tournament.entry_fee}` : 'Grátis'}
            </p>
          </div>
          <div className={detailItemClasses}>
            <span className={detailLabelClasses}>Premiação</span>
            <p className={detailValueClasses}>{tournament.prize_pool || 'Não definido'}</p>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <span className={detailLabelClasses}>Regras</span>
            <p className={`${detailValueClasses} whitespace-pre-wrap`}>
              {tournament.rules || 'Não definidas.'}
            </p>
          </div>
          <div className={detailItemClasses}>
            <span className={detailLabelClasses}>ID do Torneio</span>
            <p className={`${detailValueClasses} font-mono text-sm`}>{tournament.id}</p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end">
          <Link to="/admin/tournaments" className={outlineButtonClasses}>
            <FaArrowLeft className="mr-2 h-4 w-4" /> Voltar para Lista de Torneios
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminTournamentDetailPage;
