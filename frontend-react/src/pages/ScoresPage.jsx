import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';
import { useMessage } from '../context/MessageContext';
import { useTournament } from '../context/TournamentContext';
import { getPlayers, getScores } from '../services/api'; // Import actual API functions

const ScoresPage = () => {
  const { currentTournament } = useTournament();
  const { showError } = useMessage(); // Corrigido para showError
  const [scores, setScores] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]); // For filter dropdown
  const [loading, setLoading] = useState(true);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'descending',
  });

  const fetchScoresAndPlayers = useCallback(async () => {
    // Verificação mais rigorosa para evitar requisições com ID undefined
    if (!currentTournament?.id || currentTournament.id === 'undefined') {
      setScores([]);
      setAllPlayers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [fetchedScores, fetchedPlayers] = await Promise.all([
        getScores(currentTournament.id),
        getPlayers(currentTournament.id), // Or a general getPlayers() if not tournament specific for filters
      ]);
      setScores(fetchedScores?.scores || []); // Correctly extract the scores array
      setAllPlayers(fetchedPlayers?.players || []); // Assuming players API also returns { players: [] }
    } catch (error) {
      console.error('Erro ao carregar placares ou jogadores:', error);
      showError(
        // Corrigido para showError
        `Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`
      );
      setScores([]);
      setAllPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [currentTournament?.id, showError]); // Corrigido para showError

  useEffect(() => {
    fetchScoresAndPlayers();
  }, [fetchScoresAndPlayers]);

  const handleFilterChange = (filterName, value) => {
    setActiveFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const applyFilters = () => {
    // Implement filter logic here based on activeFilters
    console.log('Applying filters:', activeFilters);
    // Refetch or filter scores - this will be handled by useMemo re-calculating
    console.log('Applying filters:', activeFilters);
  };

  const resetFilters = () => {
    setActiveFilters({});
    // Scores will re-render via useMemo
    console.log('Filters reset');
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      // Optional: third click could remove sort or cycle to default
      direction = 'ascending'; // Simple toggle for now
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredScores = useMemo(() => {
    let sortableScores = [...scores];

    // Filtering
    if (Object.keys(activeFilters).length > 0) {
      sortableScores = sortableScores.filter((score) => {
        if (activeFilters.player) {
          const playerName = activeFilters.player.toLowerCase();
          const p1 = (score.player1_name || score.player1 || '').toLowerCase();
          const p2 = (score.player2_name || score.player2 || '').toLowerCase();
          const winner = (score.winner_name || score.winner || '').toLowerCase();
          if (
            !(p1.includes(playerName) || p2.includes(playerName) || winner.includes(playerName))
          ) {
            return false;
          }
        }
        if (activeFilters.round && score.round !== activeFilters.round) {
          return false;
        }
        if (activeFilters.dateAfter) {
          if (!score.completed_at) return false; // Use completed_at
          try {
            const filterDate = new Date(activeFilters.dateAfter);
            const scoreDate = new Date(score.completed_at); // Use completed_at
            scoreDate.setHours(0, 0, 0, 0);
            filterDate.setHours(0, 0, 0, 0);
            if (scoreDate < filterDate) return false;
          } catch (e) {
            console.warn('Invalid date for filtering', e);
            return false; // Or handle error appropriately
          }
        }
        if (activeFilters.result && activeFilters.player) {
          const playerFilter = activeFilters.player;
          if (activeFilters.result === 'vitoria') {
            if ((score.winner_name || score.winner) !== playerFilter) return false;
          } else if (activeFilters.result === 'derrota') {
            if (
              !(
                (score.player1_name || score.player1) === playerFilter ||
                (score.player2_name || score.player2) === playerFilter
              ) ||
              (score.winner_name || score.winner) === playerFilter
            ) {
              return false;
            }
          }
        } else if (activeFilters.result && !activeFilters.player) {
          // If 'vitoria' or 'derrota' is selected without a player, it's ambiguous.
          // For now, we'll ignore this specific filter combination or you can decide how to handle it.
          // console.warn("Resultado filter selected without a player filter.");
        }
        return true;
      });
    }

    // Sorting
    if (sortConfig.key !== null) {
      sortableScores.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Handle specific data types for sorting
        if (sortConfig.key === 'date') {
          valA = new Date(a.completed_at || 0).getTime(); // Use completed_at
          valB = new Date(b.completed_at || 0).getTime(); // Use completed_at
        } else if (sortConfig.key === 'score') {
          valA = (a.player1_score ?? 0) + (a.player2_score ?? 0); // Use player1_score, player2_score
          valB = (b.player1_score ?? 0) + (b.player2_score ?? 0); // Use player1_score, player2_score
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableScores;
  }, [scores, activeFilters, sortConfig]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort className="inline ml-1 opacity-50" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <FaSortUp className="inline ml-1" />;
    }
    return <FaSortDown className="inline ml-1" />;
  };

  return (
    <div className="p-4 md:p-6 dark:bg-slate-900">
      {' '}
      {/* Added dark bg for page container if not covered by MainLayout */}
      <h2
        id="scores-heading"
        className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6"
      >
        Histórico de Placares
      </h2>
      {/* Componente de Filtro e Pesquisa */}
      <div className="filters-container bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 mb-6">
        <div className="filters-header flex justify-between items-center mb-4">
          <h3 className="filters-title text-lg font-semibold text-gray-700 dark:text-gray-200">
            Filtros e Pesquisa
          </h3>
          <button
            className="filters-toggle text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300" // Adjusted hover for dark
            id="scores-filters-toggle"
            aria-expanded={filtersVisible}
            aria-controls="scores-filters-body"
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <svg className="icon w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"></path>
            </svg>
          </button>
        </div>
        {filtersVisible && (
          <div className="filters-body" id="scores-filters-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="filter-group">
                <label
                  htmlFor="filter-player"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Jogador:
                </label>
                <input
                  type="text"
                  id="filter-player"
                  placeholder="Buscar por jogador"
                  className="filter-input mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  onChange={(e) => handleFilterChange('player', e.target.value)}
                  value={activeFilters.player || ''}
                />
              </div>
              <div className="filter-group">
                <label
                  htmlFor="filter-round"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Rodada:
                </label>
                <select
                  id="filter-round"
                  aria-label="Filtrar por rodada"
                  className="filter-select mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  onChange={(e) => handleFilterChange('round', e.target.value)}
                  value={activeFilters.round || ''}
                >
                  <option value="">Todas as rodadas</option>
                  <option value="Round 1">Round 1</option>
                  <option value="Round 2">Round 2</option>
                  <option value="Quartas de Final">Quartas de Final</option>
                  <option value="Semifinais">Semifinais</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <div className="filter-group">
                <label
                  htmlFor="filter-winner"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Resultado:
                </label>
                <select
                  id="filter-winner"
                  className="filter-select mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  onChange={(e) => handleFilterChange('result', e.target.value)}
                  value={activeFilters.result || ''}
                >
                  <option value="">Todos os resultados</option>
                  <option value="vitoria">Apenas vitórias</option>
                  <option value="derrota">Apenas derrotas</option>
                </select>
              </div>
              <div className="filter-group">
                <label
                  htmlFor="filter-date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Data (após):
                </label>
                <input
                  type="date"
                  id="filter-date"
                  className="filter-input mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  onChange={(e) => handleFilterChange('dateAfter', e.target.value)}
                  value={activeFilters.dateAfter || ''}
                />
              </div>
            </div>
            <div className="filter-actions flex justify-end space-x-3">
              <button
                id="btn-filter-reset"
                className="btn-filter btn-filter-reset px-4 py-2 border border-gray-300 dark:border-slate-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800"
                onClick={resetFilters}
              >
                Limpar Filtros
              </button>
              <button
                id="btn-filter-apply"
                className="btn-filter btn-filter-apply px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={applyFilters}
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}
        <div className="active-filters mt-4" id="active-filters">
          {/* Filtros ativos são mostrados aqui como badges */}
          {Object.entries(activeFilters).map(([key, value]) =>
            value ? (
              <span
                key={key}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-700 dark:text-primary-100 mr-2 mb-2"
              >
                {`${key}: ${value}`}
              </span>
            ) : null
          )}
        </div>
      </div>
      <div className="table-container overflow-x-auto bg-white dark:bg-slate-800 shadow-md rounded-lg">
        <table
          id="scores-table"
          aria-label="Histórico de placares"
          className="min-w-full divide-y divide-gray-200 dark:divide-slate-700"
        >
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              {/* Updated headers to be sortable */}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('date')}
              >
                Data {getSortIcon('date')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('player1_name')}
              >
                Jogador 1 {getSortIcon('player1_name')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('player2_name')}
              >
                Jogador 2 {getSortIcon('player2_name')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('score')}
              >
                Placar {getSortIcon('score')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('winner_name')}
              >
                Vencedor {getSortIcon('winner_name')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('round')}
              >
                Rodada {getSortIcon('round')}
              </th>
            </tr>
          </thead>
          <tbody
            id="scores-body"
            className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700"
          >
            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-4 px-6 text-sm text-gray-500 dark:text-gray-400"
                >
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
                    <span className="ml-3">Carregando placares...</span>
                  </div>
                </td>
              </tr>
            ) : sortedAndFilteredScores.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-4 px-6 text-sm text-gray-500 dark:text-gray-400"
                >
                  Nenhum placar encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              sortedAndFilteredScores.map((score) => (
                <tr key={score.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {score.completed_at
                      ? new Date(score.completed_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {score.player1_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {score.player2_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{`${score.player1_score ?? 0} - ${score.player2_score ?? 0}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400">
                    {score.winner_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {score.round || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoresPage;
