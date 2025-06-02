import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaFilter, FaListUl, FaSpinner } from 'react-icons/fa';
import { useMessage } from '../../context/MessageContext';
import { getUnscheduledMatchesAdmin } from '../../services/api'; // Import new API function
import PageHeader from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const AdminSchedulePage = () => {
  const [viewMode, setViewMode] = useState('list'); // 'calendar' or 'list'
  const { showInfo, showError } = useMessage();
  const [unscheduledMatches, setUnscheduledMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUnscheduled = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUnscheduledMatchesAdmin();
      if (data.success) {
        setUnscheduledMatches(data.matches || []);
      } else {
        showError(data.message || 'Falha ao buscar partidas não agendadas.');
        setUnscheduledMatches([]);
      }
    } catch (err) {
      showError(`Erro ao conectar com o servidor: ${err.message}`);
      setUnscheduledMatches([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUnscheduled();
  }, [fetchUnscheduled]);

  const cardBaseClasses = 'bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700';
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const outlineButtonClasses = `${buttonBaseClasses} border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500`;
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;
  const tabButtonBase =
    'flex-1 py-2 px-4 text-sm font-medium rounded-md flex items-center justify-center transition-colors duration-150 ease-in-out';
  const activeTabClasses = 'bg-lime-600 text-white shadow-md';
  const inactiveTabClasses = 'text-slate-300 hover:bg-slate-600/50';

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Gerenciar Agendamento" icon={FaCalendarAlt} iconColor="text-lime-400" />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div /> {/* Placeholder for potential future filters or actions on the left */}
        <div className="flex items-center space-x-2">
          <button
            className={`${outlineButtonClasses} text-xs py-1.5 px-3`}
            onClick={() => showInfo('Funcionalidade de filtro de torneio em desenvolvimento.')}
          >
            <FaFilter className="mr-2 h-3.5 w-3.5" /> Filtrar Torneio
          </button>
          <div className="flex border border-slate-600 rounded-md p-0.5 bg-slate-700/50">
            <button
              className={`${tabButtonBase} ${viewMode === 'calendar' ? activeTabClasses : inactiveTabClasses}`}
              onClick={() => setViewMode('calendar')}
            >
              <FaCalendarAlt className="mr-2 h-4 w-4" /> Calendário
            </button>
            <button
              className={`${tabButtonBase} ${viewMode === 'list' ? activeTabClasses : inactiveTabClasses}`}
              onClick={() => setViewMode('list')}
            >
              <FaListUl className="mr-2 h-4 w-4" /> Lista
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className={`${cardBaseClasses} p-8 text-center`}>
          <LoadingSpinner size="lg" message="Carregando agendamentos..." />
        </div>
      )}

      {!loading && viewMode === 'calendar' && (
        <div className={`${cardBaseClasses} p-6 md:p-8`}>
          <div className="text-center py-10">
            <FaCalendarAlt size={48} className="mx-auto text-slate-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-200 mb-2">
              Visualização de Calendário (Em Desenvolvimento)
            </h2>
            <p className="text-slate-400">
              Um calendário interativo para arrastar e soltar partidas será implementado aqui.
            </p>
          </div>
        </div>
      )}

      {!loading && viewMode === 'list' && (
        <div className="space-y-6">
          <div className={cardBaseClasses}>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">
              Partidas Não Agendadas ({unscheduledMatches.length})
            </h3>
            {unscheduledMatches.length > 0 ? (
              <ul className="divide-y divide-slate-700">
                {unscheduledMatches.map((match) => (
                  <li
                    key={match.id || match.matchId}
                    className="py-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {match.player1_name || 'Jogador 1'} vs {match.player2_name || 'Jogador 2'} (
                        {match.round || 'Rodada Desconhecida'})
                      </p>
                      <p className="text-xs text-slate-400">
                        Torneio: {match.tournament_name || match.tournament_id || 'N/A'}
                      </p>
                    </div>
                    <button
                      className={`${primaryButtonClasses} text-xs py-1.5 px-3`}
                      onClick={() =>
                        showInfo(
                          `Agendar partida ${match.id || match.matchId} (em desenvolvimento).`
                        )
                      }
                    >
                      Agendar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-sm">Nenhuma partida não agendada no momento.</p>
            )}
          </div>
          {/* Placeholder for Scheduled Matches List */}
          <div className={cardBaseClasses}>
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Partidas Agendadas</h3>
            <p className="text-slate-400 text-sm">
              Lista de partidas já agendadas aparecerá aqui... (Em desenvolvimento)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedulePage;
