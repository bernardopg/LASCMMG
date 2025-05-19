import { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useMessage } from '../context/MessageContext';
import { getScores } from '../services/api';

const Scores = () => {
  const { currentTournament, loading: tournamentLoading } = useTournament();
  const { showError } = useMessage();

  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'recent', 'top'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc',
  });

  // Buscar dados dos placares
  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        if (currentTournament?.id) {
          const apiScores = await getScores(currentTournament.id);
          setScores(apiScores);
        } else {
          setScores([]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de placares:', error);
        showError(
          'Falha ao carregar placares',
          'Verifique sua conexão e tente novamente.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [currentTournament, showError]);

  // Ordenar resultados
  const sortScores = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
  };

  // Filtrar por pesquisa e filtros
  const filteredScores = scores.filter((score) => {
    const matchesSearch =
      searchTerm === '' ||
      score.player1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.player2.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.phase.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'recent') {
      // Filtrar os últimos 5 dias
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      return matchesSearch && new Date(score.date) >= fiveDaysAgo;
    }
    if (filter === 'top') {
      // Filtrar apenas semifinais e finais
      return (
        matchesSearch &&
        (score.phase === 'Semifinal' || score.phase === 'Final')
      );
    }

    return matchesSearch;
  });

  // Ordenar resultados com base na configuração atual
  const sortedScores = [...filteredScores].sort((a, b) => {
    let comparison = 0;

    if (sortConfig.key === 'date') {
      comparison = new Date(a.date) - new Date(b.date);
    } else if (sortConfig.key === 'player') {
      comparison = a.player1.name.localeCompare(b.player1.name);
    } else if (sortConfig.key === 'phase') {
      comparison = a.phase.localeCompare(b.phase);
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  // Formatar data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Classe CSS para o cabeçalho da tabela com base na ordenação
  const getHeaderClass = (key) => {
    return `cursor-pointer hover:bg-gray-100 px-4 py-3 ${
      sortConfig.key === key ? 'text-primary font-semibold' : ''
    }`;
  };

  // Determinar o ícone de seta para a ordenação
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;

    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 inline-block ml-1" viewBox="0 0 24 24">
        <path fill="currentColor" d="M7,15L12,10L17,15H7Z"></path>
      </svg>
    ) : (
      <svg className="w-4 h-4 inline-block ml-1" viewBox="0 0 24 24">
        <path fill="currentColor" d="M7,10L12,15L17,10H7Z"></path>
      </svg>
    );
  };

  // Construir classe de resultado com base nos scores
  const getResultClass = (score1, score2) => {
    if (score1 > score2) return 'text-green-600 font-medium';
    if (score1 < score2) return 'text-red-600 font-medium';
    return 'text-gray-600';
  };

  return (
    <div className="page-scores pt-4">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Histórico de Placares
          {currentTournament && (
            <span className="text-primary"> {currentTournament.name}</span>
          )}
        </h1>

        {/* Filtros e Pesquisa */}
        <div className="filters-search bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="filters-group flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`filter-btn px-4 py-2 rounded-md ${
                  filter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('recent')}
                className={`filter-btn px-4 py-2 rounded-md ${
                  filter === 'recent'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Recentes
              </button>
              <button
                onClick={() => setFilter('top')}
                className={`filter-btn px-4 py-2 rounded-md ${
                  filter === 'top'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Semifinais/Finais
              </button>
            </div>

            <div className="search-group relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por jogadores, fases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10 pr-4 py-2 w-full md:w-64 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="scores-table bg-white rounded-lg shadow-sm overflow-hidden">
          {loading || tournamentLoading ? (
            <div className="loading-spinner flex justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : sortedScores.length === 0 ? (
            <div className="empty-state text-center p-8">
              <p className="text-gray-500 mb-4">Nenhum resultado encontrado.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="px-4 py-2 bg-primary text-white rounded-md"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className={getHeaderClass('date')}
                      onClick={() => sortScores('date')}
                    >
                      <div className="flex items-center">
                        Data
                        {getSortIcon('date')}
                      </div>
                    </th>
                    <th
                      className={getHeaderClass('phase')}
                      onClick={() => sortScores('phase')}
                    >
                      <div className="flex items-center">
                        Fase
                        {getSortIcon('phase')}
                      </div>
                    </th>
                    <th
                      className={getHeaderClass('player')}
                      onClick={() => sortScores('player')}
                    >
                      <div className="flex items-center">
                        Jogadores
                        {getSortIcon('player')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center">Placar</th>
                    <th className="px-4 py-3">Local</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedScores.map((score) => (
                    <tr key={score.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(score.date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                          {score.phase}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {score.player1.name}
                          </span>
                          <span className="font-medium">
                            {score.player2.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-col">
                          <span
                            className={getResultClass(
                              score.score1,
                              score.score2
                            )}
                          >
                            {score.score1}
                          </span>
                          <span
                            className={getResultClass(
                              score.score2,
                              score.score1
                            )}
                          >
                            {score.score2}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {score.location}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scores;
