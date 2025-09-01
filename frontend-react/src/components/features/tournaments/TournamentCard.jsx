import {
  FaCalendarAlt,
  FaCrown,
  FaEdit,
  FaEye,
  FaGem,
  FaSitemap,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';

const TournamentCard = ({ tournament, onView, onEdit, onDelete, isAdmin }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'em andamento':
        return {
          bg: 'bg-lime-600/20',
          text: 'text-lime-300',
          border: 'border-lime-500/50',
          dot: 'bg-lime-400',
        };
      case 'pendente':
        return {
          bg: 'bg-amber-600/20',
          text: 'text-amber-300',
          border: 'border-amber-500/50',
          dot: 'bg-amber-400',
        };
      case 'concluído':
        return {
          bg: 'bg-green-700/20',
          text: 'text-green-300',
          border: 'border-green-600/50',
          dot: 'bg-green-400',
        };
      case 'cancelado':
        return {
          bg: 'bg-red-600/20',
          text: 'text-red-400',
          border: 'border-red-500/50',
          dot: 'bg-red-500',
        };
      default:
        return {
          bg: 'bg-neutral-700/30',
          text: 'text-neutral-300',
          border: 'border-neutral-600/50',
          dot: 'bg-neutral-500',
        };
    }
  };

  const statusStyle = getStatusColor(tournament.status);

  return (
    <div className="bg-gradient-to-br from-green-900/80 via-green-800/70 to-neutral-900/60 backdrop-blur-xl border border-green-700/30 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
      <div
        className={`h-2 bg-gradient-to-r ${statusStyle.dot === 'bg-amber-400' ? 'from-amber-500 to-amber-600' : statusStyle.dot === 'bg-lime-400' ? 'from-lime-500 to-lime-600' : 'from-green-600 to-green-700'}`}
      />

      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 pr-4">
            <button
              className="text-2xl font-black text-white mb-2 leading-tight cursor-pointer hover:text-amber-400 transition-colors line-clamp-2 text-left w-full"
              onClick={() => onView(tournament)}
              title={tournament.name}
              type="button"
            >
              {tournament.name}
            </button>

            <p className="text-neutral-400 text-sm leading-relaxed mb-3 line-clamp-3">
              {tournament.description || 'Competição oficial da Liga Acadêmica de Sinuca CMMG'}
            </p>

            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase backdrop-blur-md border shadow-md ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
              {tournament.status || 'Ativo'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onView(tournament)}
              className="p-3 bg-lime-600/70 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-lime-600 transition-all duration-300"
              title="Ver detalhes"
            >
              <FaEye className="w-4 h-4" />
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(tournament)}
                  className="p-3 bg-amber-500/70 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-amber-500 transition-all duration-300"
                  title="Editar"
                >
                  <FaEdit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDelete(tournament)}
                  className="p-3 bg-red-700/70 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-red-700 transition-all duration-300"
                  title="Excluir"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tournament Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              label: 'Participantes',
              value: tournament.num_players_expected || 'N/A',
              icon: FaUsers,
              color: 'from-green-600 to-green-700',
              textColor: 'text-green-300',
            },
            {
              label: 'Formato',
              value: tournament.bracket_type?.replace('-', ' ').toUpperCase() || 'ELIMINATÓRIA',
              icon: FaSitemap,
              color: 'from-lime-500 to-lime-600',
              textColor: 'text-lime-300',
            },
            {
              label: 'Taxa',
              value:
                tournament.entry_fee !== null && tournament.entry_fee !== undefined
                  ? `R$ ${tournament.entry_fee.toFixed(2)}`
                  : 'GRÁTIS',
              icon: FaGem,
              color: 'from-amber-500 to-amber-600',
              textColor: 'text-amber-300',
            },
            {
              label: 'Premiação',
              value: tournament.prize_pool || 'A definir',
              icon: FaCrown,
              color: 'from-sky-500 to-sky-600',
              textColor: 'text-sky-300',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} shadow-md mb-2`}
              >
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <div className={`text-sm font-black ${stat.textColor} mb-1`}>{stat.value}</div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tournament Date */}
        {tournament.date && (
          <div className="flex items-center justify-center space-x-2 text-neutral-300 bg-green-800/30 backdrop-blur-sm rounded-xl p-3 border border-green-700/40">
            <FaCalendarAlt className="w-4 h-4 text-green-400" />
            <span className="font-medium text-sm">
              {new Date(tournament.date).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'short',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentCard;
