import {
  FaChartBar,
  FaCrown,
  FaEdit,
  FaEye,
  FaGamepad,
  FaGem,
  FaMedal,
  FaStar,
  FaTrash,
  FaTrophy,
} from 'react-icons/fa';

const PlayerCard = ({ player, onView, onEdit, onDelete, isAdmin }) => {
  const getRankingBadge = (ranking) => {
    if (ranking === 1) {
      return {
        bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
        text: 'text-white',
        icon: FaCrown,
      };
    }
    if (ranking === 2) {
      return {
        bg: 'bg-gradient-to-br from-lime-500 to-lime-600',
        text: 'text-green-900',
        icon: FaMedal,
      };
    }
    if (ranking === 3) {
      return {
        bg: 'bg-gradient-to-br from-green-700 to-green-800',
        text: 'text-white',
        icon: FaMedal,
      };
    }
    return {
      bg: 'bg-gradient-to-br from-neutral-600 to-neutral-700',
      text: 'text-white',
      icon: FaStar,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-lime-500/20',
          text: 'text-lime-300',
          border: 'border-lime-400/50',
          dot: 'bg-lime-500',
        };
      case 'inactive':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-400/50',
          dot: 'bg-red-500',
        };
      default:
        return {
          bg: 'bg-neutral-500/20',
          text: 'text-neutral-300',
          border: 'border-neutral-400/50',
          dot: 'bg-neutral-500',
        };
    }
  };

  const rankingStyle = getRankingBadge(player.ranking);
  const statusStyle = getStatusColor(player.status);

  return (
    <div className="bg-gradient-to-br from-green-900/80 via-green-800/70 to-neutral-900/60 backdrop-blur-xl border border-green-700/30 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="h-2 bg-gradient-to-r from-amber-500/80 via-amber-400 to-amber-500/80" />

      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4 flex-1">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-2xl flex items-center justify-center text-amber-300 text-3xl font-black shadow-lg border-2 border-green-500/50">
                {player.name.charAt(0).toUpperCase()}
              </div>
              {/* Ranking Badge */}
              <div
                className={`absolute -top-2 -right-2 w-8 h-8 ${rankingStyle.bg} ${rankingStyle.text} rounded-xl flex items-center justify-center shadow-lg border-2 border-white/30`}
              >
                <rankingStyle.icon className="w-3 h-3" />
              </div>
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <button
                className="text-xl font-black text-white mb-1 leading-tight cursor-pointer hover:text-amber-400 transition-colors text-left w-full"
                onClick={() => onView(player)}
                type="button"
              >
                {player.name}
                {player.nickname && (
                  <span className="text-neutral-400 text-sm font-medium ml-2">
                    ({player.nickname})
                  </span>
                )}
              </button>

              <p className="text-neutral-300 text-sm mb-2">
                {player.email || 'Email não informado'}
              </p>

              {player.skill_level && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-lime-500/20 text-lime-300 border border-lime-400/40">
                  <FaGem className="w-3 h-3 mr-1.5 text-lime-400" />
                  {player.skill_level}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 ml-4">
            <button
              onClick={() => onView(player)}
              className="p-3 bg-green-700/80 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-green-600 transition-all duration-300"
              title="Ver perfil"
            >
              <FaEye className="w-4 h-4" />
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(player)}
                  className="p-3 bg-amber-500/80 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-amber-500 transition-all duration-300"
                  title="Editar"
                >
                  <FaEdit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDelete(player)}
                  className="p-3 bg-red-600/80 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-red-600 transition-all duration-300"
                  title="Excluir"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Ranking',
              value: `#${player.ranking}`,
              icon: FaTrophy,
              color: 'from-amber-500 to-amber-600',
              textColor: 'text-amber-300',
            },
            {
              label: 'Partidas',
              value: player.totalMatches,
              icon: FaGamepad,
              color: 'from-green-600 to-green-700',
              textColor: 'text-green-300',
            },
            {
              label: 'Vitórias',
              value: player.wins,
              icon: FaCrown,
              color: 'from-lime-500 to-lime-600',
              textColor: 'text-lime-300',
            },
            {
              label: 'Taxa de Vitória',
              value: `${player.winRate}%`,
              icon: FaChartBar,
              color: 'from-sky-500 to-sky-600',
              textColor: 'text-sky-300',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg mb-2`}
              >
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <div className={`text-lg font-black ${stat.textColor} mb-1`}>{stat.value}</div>
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase backdrop-blur-lg border shadow-md ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
          >
            <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
            {player.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
