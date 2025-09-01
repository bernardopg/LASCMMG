import { FaCrown, FaGamepad, FaTrophy } from 'react-icons/fa';

const ScoreCard = ({ score }) => {
  const getWinnerStyle = (winnerName, playerName) => {
    if (winnerName === playerName) {
      return {
        bg: 'bg-lime-500/10',
        text: 'text-lime-300',
        border: 'border-lime-500/30',
        icon: 'text-lime-400',
        scoreText: 'text-lime-400',
      };
    }
    return {
      bg: 'bg-slate-700/20',
      text: 'text-slate-400',
      border: 'border-slate-600/30',
      icon: 'text-slate-500',
      scoreText: 'text-slate-300',
    };
  };

  const player1Style = getWinnerStyle(score.winner_name, score.player1_name);
  const player2Style = getWinnerStyle(score.winner_name, score.player2_name);

  return (
    <div className="group relative">
      <div className="relative bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-lg">
        <div className="h-2 bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-lime-600 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaGamepad className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-lime-300">
                  {score.round || 'Partida Amistosa'}
                </p>
                <p className="text-sm text-slate-400">
                  {score.completed_at
                    ? new Date(score.completed_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Data não informada'}
                </p>
              </div>
            </div>
            {score.winner_name && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300 rounded-xl">
                <FaCrown className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-800">Vencedor</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div
              className={`flex items-center justify-between p-4 rounded-2xl border ${player1Style.bg} ${player1Style.border}`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-md">
                  {(score.player1_name || 'J1').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`text-md sm:text-lg font-black ${player1Style.text}`}>
                    {score.player1_name || 'Jogador 1'}
                  </p>
                  {score.winner_name === score.player1_name && (
                    <p
                      className={`text-xs sm:text-sm font-bold ${player1Style.icon} flex items-center gap-1`}
                    >
                      <FaTrophy className="w-3 h-3" />
                      Vitória
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl sm:text-3xl font-black ${player1Style.scoreText} mb-1`}>
                  {score.player1_score ?? 0}
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Pontos</p>
              </div>
            </div>
            <div className="flex items-center justify-center py-1 sm:py-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg border border-slate-500">
                <span className="text-white font-black text-sm sm:text-lg">VS</span>
              </div>
            </div>
            <div
              className={`flex items-center justify-between p-4 rounded-2xl border ${player2Style.bg} ${player2Style.border}`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-md">
                  {(score.player2_name || 'J2').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`text-md sm:text-lg font-black ${player2Style.text}`}>
                    {score.player2_name || 'Jogador 2'}
                  </p>
                  {score.winner_name === score.player2_name && (
                    <p
                      className={`text-xs sm:text-sm font-bold ${player2Style.icon} flex items-center gap-1`}
                    >
                      <FaTrophy className="w-3 h-3" />
                      Vitória
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl sm:text-3xl font-black ${player2Style.scoreText} mb-1`}>
                  {score.player2_score ?? 0}
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Pontos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
