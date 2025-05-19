import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { FaUsers, FaListOl, FaTrophy, FaArrowRight } from 'react-icons/fa';

const Home = () => {
  const { tournaments, currentTournament, loading } = useTournament();
  const [stats, setStats] = useState({
    players: 0,
    matches: 0,
    tournaments: 0,
  });

  // Carregar estatísticas gerais (simulação)
  useEffect(() => {
    // Simulação de chamada à API para obter estatísticas
    const fetchStats = async () => {
      // Em um aplicativo real, faríamos uma chamada à API aqui
      setTimeout(() => {
        setStats({
          players: 128,
          matches: 210,
          tournaments: tournaments?.length || 0,
        });
      }, 1000);
    };

    fetchStats();
  }, [tournaments]);

  return (
    <div className="space-y-8">
      {/* Banner principal */}
      <section className="bg-primary-light rounded-lg p-8 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Liga Amadora Sul-Campista de Mari-Mari-Gomes
          </h1>
          <p className="text-gray-700 mb-6 max-w-xl">
            Bem-vindo ao sistema de gerenciamento de torneios da LASCMMG.
            Acompanhe resultados, estatísticas e chaveamentos dos torneios em
            andamento.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/chaveamento" className="btn btn-primary">
              Ver Chaveamentos
            </Link>
            <Link to="/estatisticas" className="btn btn-outline">
              Estatísticas
            </Link>
          </div>
        </div>

        {/* Elemento decorativo */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-primary opacity-10 transform rotate-6 translate-x-1/4"></div>
      </section>

      {/* Cards de estatísticas */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Estatísticas Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Jogadores</h3>
              <span className="bg-blue-100 text-blue-800 p-2 rounded-full">
                <FaUsers className="w-5 h-5" />
              </span>
            </div>
            {loading ? (
              <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">
                {stats.players}
              </p>
            )}
            <p className="text-gray-500 mt-1">Cadastrados no sistema</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Partidas</h3>
              <span className="bg-green-100 text-green-800 p-2 rounded-full">
                <FaListOl className="w-5 h-5" />
              </span>
            </div>
            {loading ? (
              <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">
                {stats.matches}
              </p>
            )}
            <p className="text-gray-500 mt-1">Disputadas até o momento</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Torneios</h3>
              <span className="bg-yellow-100 text-yellow-800 p-2 rounded-full">
                <FaTrophy className="w-5 h-5" />
              </span>
            </div>
            {loading ? (
              <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">
                {stats.tournaments}
              </p>
            )}
            <p className="text-gray-500 mt-1">Registrados na plataforma</p>
          </div>
        </div>
      </section>

      {/* Torneio atual em destaque */}
      {currentTournament && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Torneio em Destaque</h2>
          <div className="card overflow-hidden">
            <div className="p-6 pb-4 bg-primary bg-opacity-5 border-b border-primary border-opacity-20">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-primary">
                    {currentTournament.name}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {currentTournament.location}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`badge ${
                      currentTournament.status === 'active'
                        ? 'badge-success'
                        : currentTournament.status === 'upcoming'
                          ? 'badge-info'
                          : 'badge-warning'
                    }`}
                  >
                    {currentTournament.status === 'active'
                      ? 'Em andamento'
                      : currentTournament.status === 'upcoming'
                        ? 'Próximo'
                        : 'Concluído'}
                  </span>
                  <p className="text-sm text-gray-500 mt-2">
                    {currentTournament.startDate} até{' '}
                    {currentTournament.endDate}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700">{currentTournament.description}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-800">
                    {currentTournament.players}
                  </span>
                  <p className="text-sm text-gray-500">Jogadores</p>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-800">
                    {Math.ceil(currentTournament.players / 2)}
                  </span>
                  <p className="text-sm text-gray-500">Partidas</p>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-800">
                    {currentTournament.categories.length}
                  </span>
                  <p className="text-sm text-gray-500">Categorias</p>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-800">
                    {Math.floor(Math.log2(currentTournament.players))}
                  </span>
                  <p className="text-sm text-gray-500">Rodadas</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Link to="/chaveamento" className="btn btn-outline btn-sm">
                  Ver Chaveamento
                </Link>
                <Link to="/placares" className="btn btn-primary btn-sm">
                  Placares
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Lista de próximos torneios */}
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

        {loading ? (
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
                      {tournament.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {tournament.location}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {tournament.startDate} - {tournament.endDate}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`badge mr-3 ${
                        tournament.status === 'active'
                          ? 'badge-success'
                          : tournament.status === 'upcoming'
                            ? 'badge-info'
                            : 'badge-warning'
                      }`}
                    >
                      {tournament.status === 'active'
                        ? 'Em andamento'
                        : tournament.status === 'upcoming'
                          ? 'Próximo'
                          : 'Concluído'}
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
