import { SearchX, ServerCrash } from 'lucide-react'; // Icons for error/empty states
import EmptyState from '../ui/display/EmptyState'; // Import EmptyState
import LoadingSpinner from '../ui/loading/LoadingSpinner';

/**
 * Componente de Tabela Genérica com Paginação
 * - Recebe colunas, dados, loading, erro, paginação e ações via props
 * - Reutilizável para qualquer entidade (jogadores, placares, torneios, etc)
 */
const PaginatedTable = ({
  columns,
  data,
  loading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  actions,
  emptyMessage = 'Nenhum registro encontrado.',
  tableClassName = '',
  headerClassName = '',
  rowClassName = '',
  cellClassName = 'text-gray-300', // Default cell text color
  actionButtonBaseClass = 'p-1.5 rounded-md hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800',
}) => {
  if (loading) {
    return <LoadingSpinner message="Carregando dados da tabela..." />;
  }

  if (error) {
    return (
      <EmptyState
        iconName={ServerCrash}
        title="Erro ao carregar dados"
        message={
          typeof error === 'string'
            ? error
            : 'Ocorreu um problema ao buscar os dados. Tente novamente mais tarde.'
        }
        iconClassName="w-16 h-16 text-red-500"
      />
    );
  }

  const defaultActionButtonClasses = {
    view: `${actionButtonBaseClass} text-sky-400 focus:ring-sky-500`,
    edit: `${actionButtonBaseClass} text-amber-400 focus:ring-amber-500`,
    delete: `${actionButtonBaseClass} text-red-400 focus:ring-red-500`,
  };

  return (
    <div className="flex flex-col">
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 ${tableClassName}`}>
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow-xl overflow-hidden border-b border-gray-700 sm:rounded-lg bg-slate-800">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className={`bg-slate-700/50 ${headerClassName}`}>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      style={col.style}
                    >
                      {col.label}
                    </th>
                  ))}
                  {actions && actions.length > 0 && (
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[100px] sm:min-w-[120px]"
                    >
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className={`bg-slate-800 divide-y divide-gray-700 ${rowClassName}`}>
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (actions && actions.length > 0 ? 1 : 0)}
                      className="px-6 py-10"
                    >
                      <EmptyState
                        iconName={SearchX}
                        title={emptyMessage}
                        message="Verifique os filtros aplicados ou tente novamente mais tarde."
                        iconClassName="w-12 h-12 text-gray-500"
                      />
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-slate-700/50 transition-colors duration-150"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${cellClassName} ${col.cellClassName || ''}`}
                        >
                          {col.render ? col.render(row) : row[col.key]}
                        </td>
                      ))}
                      {actions && actions.length > 0 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {actions.map((action, i) => (
                            <button
                              key={i}
                              onClick={() => action.onClick(row)}
                              className={
                                action.className ||
                                defaultActionButtonClasses[action.type] ||
                                actionButtonBaseClass
                              }
                              title={action.title}
                              aria-label={action.title || action.label}
                            >
                              {action.icon}
                            </button>
                          ))}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400 px-2 sm:px-0">
          <span className="mb-2 sm:mb-0">
            Página {currentPage} de {totalPages}
          </span>
          <div className="space-x-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginatedTable;
