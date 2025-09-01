import { useCallback, useEffect, useState } from 'react';
import { FaHistory } from 'react-icons/fa';
import { useTournament } from '../../../context/TournamentContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { getScores } from '../../../services/api';
import ScoreCard from './ScoreCard';
import ScoreLoadingSkeleton from './ScoreLoadingSkeleton';
import ScoreStats from './ScoreStats';

const ScoreList = () => {
  const { currentTournament } = useTournament();
  const { withErrorHandling } = useErrorHandler();

  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScoresAndPlayers = useCallback(
    async () => {
      if (!currentTournament?.id || currentTournament.id === 'undefined') {
        setScores([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const result = await withErrorHandling(
        async () => {
          const [fetchedScores] = await Promise.all([getScores(currentTournament.id)]);
          return { scores: fetchedScores };
        },
        { defaultMessage: 'Erro ao carregar dados' }
      );

      if (result && !result.handled) {
        if (result.success) {
          setScores(result.scores?.scores || []);
        } else {
          setScores([]);
        }
      }

      setLoading(false);
    },
    [currentTournament?.id, withErrorHandling]
  );

  useEffect(() => {
    fetchScoresAndPlayers();
  }, [fetchScoresAndPlayers]);


  const currentScores = scores;

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="fixed inset-0 pointer-events-none z-0"></div>
      <section className="relative z-10 mb-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 bg-white/15 backdrop-blur-xl rounded-full px-6 py-3 mb-8 border border-white/20">
            <FaHistory className="w-6 h-6 text-amber-600" />
            <span className="text-lg font-bold text-lime-300 tracking-wide">
              Histórico de Placares
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            <span className="block text-slate-100">Histórico de</span>
            <span className="block bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-clip-text text-transparent">
              PLACARES
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Acompanhe todos os resultados das partidas da liga e veja o desempenho dos jogadores ao
            longo do tempo.
          </p>
        </div>

        <ScoreStats scores={scores} />

        {/* Controles, filtros e paginação podem ser implementados aqui, sem animações */}
      </section>
      <main className="relative z-10">
        {loading && <ScoreLoadingSkeleton count={9} />}
        {!loading && currentScores.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                <FaHistory className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-100 mb-4">
                Nenhuma partida encontrada
              </h3>
              <p className="text-slate-400 mb-6">
                Ainda não há placares registrados para este torneio.
              </p>
            </div>
          </div>
        )}
        {!loading && currentScores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {currentScores.map((score, index) => (
              <ScoreCard
                key={score.id || `${score.player1_name}-${score.player2_name}-${index}`}
                score={score}
              />
            ))}
          </div>
        )}
        {/* Paginação e sumário podem ser mantidos, removendo animações */}
      </main>
    </div>
  );
};

export default ScoreList;
