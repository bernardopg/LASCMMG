import { useEffect, useState } from 'react';
import {
  FaArrowRight,
  FaAward,
  FaCalendarAlt,
  FaChartBar,
  FaEye,
  FaGamepad,
  FaGem,
  FaPlay,
  FaSitemap,
  FaTrophy,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useMessage } from '../context/MessageContext';
import { useTournament } from '../context/TournamentContext';
import api from '../services/api';

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

const StatCard = ({ title, value, icon, color = 'primary', description, loading = false }) => {
  const IconComponent = icon;
  const colorClasses = {
    primary: 'bg-gradient-to-r from-green-600 to-green-700',
    secondary: 'bg-gradient-to-r from-lime-500 to-lime-600',
    accent: 'bg-gradient-to-r from-amber-500 to-amber-600',
    warning: 'bg-gradient-to-r from-orange-500 to-orange-600',
    default: 'bg-gradient-to-r from-gray-500 to-gray-600',
  };
  const selectedColor = colorClasses[color] || colorClasses.default;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${selectedColor} shadow-lg`}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">
          <div className="h-8 bg-slate-700 animate-pulse rounded-xl" />
          <div className="h-5 bg-slate-600 animate-pulse rounded-lg w-3/4" />
        </div>
      ) : (
        <>
          <h3 className="text-lg font-bold text-slate-300 mb-2">{title}</h3>
          <div className="mb-3">
            <span className="text-3xl font-black text-green-400 block leading-none">
              {formatNumber(value)}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-400">{description}</p>
        </>
      )}
    </div>
  );
};

const HeroSection = ({ generalStats }) => {
  return (
    <section className="relative rounded-3xl mb-12 bg-gradient-to-br from-green-900 via-green-800 to-amber-900 p-8 text-white">
      <div className="text-center">
        <div className="inline-flex items-center bg-white/15 rounded-full px-6 py-3 mb-8 border border-white/20">
          <span className="text-lg font-bold">Sistema LASCMMG v2.1</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
          <span className="block">Liga Acadêmica</span>
          <span className="block text-amber-300">SINUCA CMMG</span>
        </h1>

        <p className="text-xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
          Plataforma completa de gerenciamento de torneios com{' '}
          <span className="text-amber-300 font-bold">chaveamentos automáticos</span>,{' '}
          <span className="text-green-300 font-bold">estatísticas em tempo real</span> e{' '}
          <span className="text-lime-300 font-bold">controle total</span> de competições.
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-16">
          <Link
            to="/brackets"
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-3"
          >
            <FaPlay className="w-5 h-5" />
            <span>Ver Chaveamentos</span>
            <FaArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/stats"
            className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold text-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300 flex items-center space-x-3"
          >
            <FaChartBar className="w-5 h-5" />
            <span>Estatísticas</span>
          </Link>

          <Link
            to="/tournaments"
            className="px-8 py-4 bg-transparent text-white rounded-2xl font-bold text-lg border-2 border-green-400/50 hover:bg-green-500/20 transition-all duration-300 flex items-center space-x-3"
          >
            <FaTrophy className="w-5 h-5" />
            <span>Torneios</span>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {[
            {
              label: 'Torneios',
              value: formatNumber(generalStats.tournaments || 0),
              icon: FaTrophy,
            },
            { label: 'Jogadores', value: formatNumber(generalStats.players || 0), icon: FaUsers },
            { label: 'Partidas', value: formatNumber(generalStats.matches || 0), icon: FaGamepad },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="p-4 rounded-2xl bg-white/10 border border-white/20 mb-3">
                <stat.icon className="w-8 h-8 mx-auto text-amber-300" />
              </div>
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/70 font-medium uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CurrentTournament = ({ currentTournament }) => {
  if (!currentTournament) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-black text-green-400 flex items-center">
          <FaTrophy className="text-amber-500 mr-4" />
          Torneio em Destaque
        </h2>
        <Link
          to={`/tournaments/${currentTournament.id}`}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
        >
          <span>Ver Detalhes</span>
          <FaArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white/80 rounded-2xl border border-white/30 shadow-2xl">
        <div className="p-8 bg-gradient-to-br from-green-500/10 via-amber-500/5 to-lime-500/10 border-b border-white/20">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-black text-green-800 mb-4">{currentTournament.name}</h3>
              <p className="text-lg text-neutral-600 leading-relaxed">
                {currentTournament.description ||
                  'Competição oficial da Liga Acadêmica de Sinuca da CMMG'}
              </p>
            </div>

            <div className="flex flex-col items-end space-y-4">
              <span
                className={`inline-flex items-center gap-1.5 px-6 py-3 rounded-full text-base font-bold uppercase border shadow-lg ${
                  currentTournament.status === 'Em Andamento'
                    ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
                    : currentTournament.status === 'Pendente'
                      ? 'bg-orange-100/80 text-orange-800 border-orange-200'
                      : 'bg-green-100/80 text-green-800 border-green-200'
                }`}
              >
                {currentTournament.status || 'Ativo'}
              </span>

              <div className="flex items-center space-x-3 text-neutral-500">
                <FaCalendarAlt className="w-5 h-5" />
                <span className="font-medium">
                  {currentTournament.date
                    ? new Date(currentTournament.date).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Data a definir'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                label: 'Participantes',
                value: currentTournament.num_players_expected || 'N/A',
                icon: FaUsers,
                color: 'from-green-600 to-green-700',
              },
              {
                label: 'Formato',
                value:
                  currentTournament.bracket_type?.replace('-', ' ').toUpperCase() || 'ELIMINATÓRIA',
                icon: FaSitemap,
                color: 'from-lime-500 to-lime-600',
              },
              {
                label: 'Inscrição',
                value:
                  currentTournament.entry_fee !== null && currentTournament.entry_fee !== undefined
                    ? `R$ ${currentTournament.entry_fee.toFixed(2)}`
                    : 'GRÁTIS',
                icon: FaGem,
                color: 'from-emerald-500 to-emerald-600',
              },
              {
                label: 'Premiação',
                value: currentTournament.prize_pool || 'A definir',
                icon: FaAward,
                color: 'from-orange-500 to-orange-600',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-white/50 to-white/30 border border-white/40"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg mb-4`}
                >
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-2xl font-black text-neutral-700 mb-2">{stat.value}</div>
                <div className="text-sm font-bold text-neutral-500 uppercase">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to={`/tournaments/${currentTournament.id}/bracket`}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-3"
            >
              <FaEye className="w-5 h-5" />
              <span>Ver Chaveamento</span>
              <FaArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={`/tournaments/${currentTournament.id}/register`}
              className="px-6 py-3 bg-gradient-to-r from-lime-500 to-lime-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-3"
            >
              <FaUserPlus className="w-5 h-5" />
              <span>Inscrever-se</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const GeneralStatsSection = ({ generalStats, statsLoading }) => {
  const statsData = [
    {
      title: 'Jogadores Ativos',
      value: generalStats.players || 0,
      icon: FaUsers,
      color: 'primary',
      description: 'Total de atletas competindo na liga.',
      loading: statsLoading,
    },
    {
      title: 'Partidas Realizadas',
      value: generalStats.matches || 0,
      icon: FaGamepad,
      color: 'secondary',
      description: 'Confrontos emocionantes já disputados.',
      loading: statsLoading,
    },
    {
      title: 'Torneios Organizados',
      value: generalStats.tournaments || 0,
      icon: FaTrophy,
      color: 'accent',
      description: 'Eventos que marcaram nossa história.',
      loading: statsLoading,
    },
  ];

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-green-400 flex items-center">
          <FaChartBar className="text-amber-400 mr-4" />
          Estatísticas Gerais
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {statsData.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </section>
  );
};

const Home = () => {
  const { currentTournament } = useTournament();
  const { showError } = useMessage();
  const [generalStats, setGeneralStats] = useState({
    players: 0,
    matches: 0,
    tournaments: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchGeneralStats = async () => {
      setStatsLoading(true);
      try {
        const response = await api.get('/api/system/stats');
        if (response.data && response.data.success) {
          const stats = response.data.stats;
          setGeneralStats({
            players: stats.entities?.players || 0,
            matches: stats.entities?.matches || 0,
            tournaments: stats.tournaments?.total || 0,
          });
        } else {
          setGeneralStats({
            players: 0,
            matches: 0,
            tournaments: 0,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar estatísticas gerais:', err);
        showError('Erro ao carregar estatísticas');
        setGeneralStats({
          players: 0,
          matches: 0,
          tournaments: 0,
        });
      }
      setStatsLoading(false);
    };

    fetchGeneralStats();
  }, [showError]);

  return (
    <div className="container mx-auto px-4 py-8">
      <HeroSection generalStats={generalStats} />
      <CurrentTournament currentTournament={currentTournament} />
      <GeneralStatsSection generalStats={generalStats} statsLoading={statsLoading} />
    </div>
  );
};

export default Home;
