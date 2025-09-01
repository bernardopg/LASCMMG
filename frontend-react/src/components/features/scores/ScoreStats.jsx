import { FaChartLine, FaGamepad, FaUsers } from 'react-icons/fa';

const ScoreStats = ({ scores }) => {
  const totalMatches = scores.length;
  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((acc, s) => acc + (s.player1_score || 0) + (s.player2_score || 0), 0) /
            (scores.length * 2)
        )
      : 0;
  const uniquePlayers = new Set([
    ...scores.map((s) => s.player1_name),
    ...scores.map((s) => s.player2_name),
  ]).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[
        {
          label: 'Total de Partidas',
          value: totalMatches,
          icon: FaGamepad,
          color: 'from-lime-600 to-green-600',
          bgColor: 'from-lime-700/20 to-green-700/20',
        },
        {
          label: 'Jogadores Únicos',
          value: uniquePlayers,
          icon: FaUsers,
          color: 'from-green-500 to-emerald-500',
          bgColor: 'from-green-700/20 to-emerald-700/20',
        },
        {
          label: 'Pontuação Média',
          value: averageScore,
          icon: FaChartLine,
          color: 'from-amber-500 to-orange-500',
          bgColor: 'from-amber-700/20 to-orange-700/20',
        },
      ].map((stat) => (
        <div key={stat.label} className="group relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
              <span className="text-3xl font-black text-slate-100">{stat.value}</span>
            </div>
            <div className={`p-4 bg-gradient-to-r ${stat.color} rounded-2xl shadow-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScoreStats;
