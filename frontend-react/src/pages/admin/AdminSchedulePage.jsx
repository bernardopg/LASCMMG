import React, { useState } from 'react';
import { FaCalendarAlt, FaListUl, FaFilter } from 'react-icons/fa';
import { useMessage } from '../../context/MessageContext'; // Import useMessage

const AdminSchedulePage = () => {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const { showInfo } = useMessage(); // Get showInfo from context
  // Placeholder data - replace with actual data fetching
  const unscheduledMatches = [
    {
      id: 'm101',
      round: 'Rodada 1',
      player1: 'Jogador A',
      player2: 'Jogador B',
      tournament: 'Torneio Principal',
    },
    {
      id: 'm102',
      round: 'Rodada 1',
      player1: 'Jogador C',
      player2: 'Jogador D',
      tournament: 'Torneio Principal',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Gerenciar Agendamento de Partidas
        </h1>
        <div className="flex items-center space-x-2">
          <button
            className="btn btn-outline btn-sm flex items-center" // Use global btn-outline style
            onClick={() => showInfo('Funcionalidade de filtro de torneio em desenvolvimento.')}
          >
            <FaFilter className="mr-2" /> Filtrar Torneio
          </button>
          {/* Refactored Tabs using Tailwind utilities */}
          <div className="flex border border-gray-300 dark:border-slate-600 rounded-md p-0.5 bg-gray-100 dark:bg-slate-700">
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md flex items-center justify-center transition-colors duration-150 ease-in-out
                ${viewMode === 'calendar'
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
              onClick={() => setViewMode('calendar')}
            >
              <FaCalendarAlt className="mr-2" /> Calendário
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md flex items-center justify-center transition-colors duration-150 ease-in-out
                ${viewMode === 'list'
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
              onClick={() => setViewMode('list')}
            >
              <FaListUl className="mr-2" /> Lista
            </button>
          </div>
        </div>
      </div> {/* This closing div was missing / misplaced in the corrupted version */}

      {viewMode === 'calendar' && (
        <div className="card bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6 md:p-8">
          <div className="text-center py-10">
            <FaCalendarAlt
              size={48}
              className="mx-auto text-gray-400 dark:text-gray-500 mb-4"
            />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Visualização de Calendário (Em Desenvolvimento)
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Um calendário interativo para arrastar e soltar partidas será
              implementado aqui.
            </p>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-6">
          <div className="card bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Partidas Não Agendadas
            </h3>
            {unscheduledMatches.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                {unscheduledMatches.map((match) => (
                  <li
                    key={match.id}
                    className="py-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {match.player1} vs {match.player2} ({match.round})
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {match.tournament}
                      </p>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => showInfo(`Agendar partida ${match.id} (em desenvolvimento).`)}
                    >
                      Agendar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhuma partida não agendada.
              </p>
            )}
          </div>
          {/* Placeholder for Scheduled Matches List */}
          <div className="card bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Partidas Agendadas
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Lista de partidas já agendadas aparecerá aqui...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedulePage;
