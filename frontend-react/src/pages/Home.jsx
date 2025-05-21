import { useEffect, useState, useRef } from 'react';
import { FaArrowRight, FaListOl, FaTrophy, FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import api from '../services/api';

const Home = () => {
  const {
    tournaments,
    currentTournament,
    loading: tournamentsLoading,
  } = useTournament();
  const [generalStats, setGeneralStats] = useState({
    players: 0,
    matches: 0,
    tournaments: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const fetchStatsAttempted = useRef(false);

  useEffect(() => {
    const fetchGeneralStats = async () => {
      if (fetchStatsAttempted.current) return;
      fetchStatsAttempted.current = true;

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
            tournaments: tournaments?.length || 0,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar estatísticas gerais:', err);
        setGeneralStats({
          players: 0,
          matches: 0,
          tournaments: tournaments?.length || 0,
        });
      }
      setStatsLoading(false);
    };

    fetchGeneralStats();
  }, []);

  return (
    <div className="space-y-8">
      <section className="bg-primary-banner-light dark:bg-primary-banner-dark rounded-lg p-8 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Bem-vindo ao Sistema de gerenciamento de torneios da Liga Acadêmica
            de Sinuca da CMMG
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-xl">
            Bem-vindo ao sistema de gerenciamento de torneios da LASCMMG.
            Acompanhe resultados, estatísticas e chaveamentos dos torneios em
            andamento.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/brackets" className="btn btn-primary">
              Ver Chaveamentos
            </Link>
            <Link to="/stats" className="btn btn-outline">
              Estatísticas
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-primary opacity-10 transform rotate-6 translate-x-1/4"></div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Estatísticas Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Jogadores</h3>
              <span className="bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-100 p-2 rounded-full">
                <FaUsers className="w-5 h-5" />
              </span>
            </div>
            {statsLoading ? (
              <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {generalStats.players}
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 mt-1">Cadastrados</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Partidas</h3>
              <span className="bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100 p-2 rounded-full">
                <FaListOl className="w-5 h-5" />
              </span>
            </div>
            {statsLoading ? (
              <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {generalStats.matches}
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 mt-1">Disputadas</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Torneios</h3>
              <span className="bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100 p-2 rounded-full">
                <FaTrophy className="w-5 h-5" />
              </span>
            </div>
            {tournamentsLoading ? ( // Use tournamentsLoading for this specific stat
              <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {generalStats.tournaments}
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Registrados na plataforma
            </p>
          </div>
        </div>
      </section>

      {/* Torneio atual em destaque */}
      {currentTournament && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Torneio em Destaque</h2>
          <div className="card overflow-hidden">
            <div className="p-6 pb-4 bg-primary-50 dark:bg-slate-700 border-b border-primary-200 dark:border-slate-600">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-primary dark:text-primary-light">
                    {currentTournament.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {currentTournament.description?.substring(0, 100) ||
                      'Sem descrição detalhada.'}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`badge ${
                      currentTournament.status === 'Em Andamento'
                        ? 'badge-success'
                        : currentTournament.status === 'Pendente'
                          ? 'badge-info'
                          : 'badge-warning'
                    }`}
                  >
                    {currentTournament.status || 'N/A'}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Data:{' '}
                    {currentTournament.date
                      ? new Date(currentTournament.date).toLocaleDateString(
                          'pt-BR'
                        )
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {currentTournament.rules || 'Regras não especificadas.'}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {currentTournament.num_players_expected || 'N/A'}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Jogadores Esperados
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {currentTournament.bracket_type?.replace('-', ' ') || 'N/A'}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tipo de Chave
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {currentTournament.entry_fee !== null &&
                    currentTournament.entry_fee !== undefined
                      ? `R$ ${currentTournament.entry_fee.toFixed(2)}`
                      : 'Grátis'}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Taxa de Inscrição
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Link to="/brackets" className="btn btn-outline btn-sm">
                  {' '}
                  {/* Corrected link */}
                  Ver Chaveamento
                </Link>
                <Link to="/scores" className="btn btn-primary btn-sm">
                  {' '}
                  {/* Corrected link */}
                  Placares
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Todos os Torneios</h2>
          <Link
            to="/tournaments"
            className="text-primary hover:text-primary-dark text-sm inline-flex items-center"
          >
            Ver todos <FaArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        {tournamentsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium mb-1">
                      {tournament.name || 'Torneio Sem Nome'}
                    </h3>
                    <p className="text-gray-600 text-sm truncate max-w-xs">
                      {tournament.description?.substring(0, 70) ||
                        'Sem descrição.'}
                      {tournament.description &&
                      tournament.description.length > 70
                        ? '...'
                        : ''}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Data:{' '}
                      {tournament.date
                        ? new Date(tournament.date).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`badge mr-3 ${
                        tournament.status === 'Em Andamento'
                          ? 'badge-success'
                          : tournament.status === 'Pendente'
                            ? 'badge-info'
                            : 'badge-warning'
                      }`}
                    >
                      {tournament.status || 'N/A'}
                    </span>
                    <Link
                      to={`/tournaments/${tournament.id}`}
                      className="text-primary hover:text-primary-dark"
                    >
                      <FaArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
