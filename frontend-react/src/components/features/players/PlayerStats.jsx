import { FaChartBar, FaGamepad, FaTrophy, FaUser } from 'react-icons/fa';

const PlayerStats = ({ players }) => {
  const activePlayersCount = players.filter((p) => p.status === 'active').length;
  const totalMatches = players.reduce((acc, p) => acc + p.totalMatches, 0);
  const averageWinRate = Math.round(
    players.reduce((acc, p) => acc + p.winRate, 0) / players.length || 0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {[
        {
          label: 'Total de Jogadores',
          value: players.length,
          icon: FaUser,
          color: 'green',
        },
        {
          label: 'Jogadores Ativos',
          value: activePlayersCount,
          icon: FaUser,
          color: 'lime',
        },
        {
          label: 'Total de Partidas',
          value: totalMatches,
          icon: FaGamepad,
          color: 'sky',
        },
        {
          label: 'Taxa Média de Vitória',
          value: `${averageWinRate}%`,
          icon: FaTrophy,
          color: 'amber',
        },
      ].map((stat) => (
        <div
          key={stat.label}
          className="relative bg-gradient-to-br from-slate-800/70 via-slate-700/60 to-neutral-900/50 backdrop-blur-lg border border-slate-600/40 rounded-3xl p-6 shadow-xl hover:shadow-green-500/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-300 mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
            <div className="p-3.5 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerStats;
