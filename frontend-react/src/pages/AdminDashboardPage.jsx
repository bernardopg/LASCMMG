import { Link } from 'react-router-dom';
import AdminPlayersTable from '../components/admin/AdminPlayersTable';
import AdminScoresTable from '../components/admin/AdminScoresTable';
import AdminTrashTable from '../components/admin/AdminTrashTable';
// ImportPlayersModal removed as it requires a tournamentId context not available here

const AdminDashboardPage = () => {
  // State and handlers for ImportPlayersModal removed

  return (
    <div className="p-4 md:p-6">
      <div className="admin-header mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Painel Administrativo
        </h1>
      </div>

      {/* Placeholder for Login Form if not authenticated via a global context/route guard */}
      {/* This might be handled by the ProtectedRoute component or a specific /admin/login route */}

      <div className="space-y-8">
        <div className="admin-card bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              Gerenciamento de Jogadores
            </h3>
            {/* Import button removed, should be in a tournament-specific context */}
          </div>
          <AdminPlayersTable />
        </div>

        {/* ImportPlayersModal instance removed */}

        <div className="admin-card bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Gerenciamento de Placares
          </h3>
          <AdminScoresTable />
        </div>

        <div className="admin-card bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Gerenciamento da Lixeira
          </h3>
          <AdminTrashTable />
        </div>

        <div className="admin-card bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Segurança</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Monitoramento e configurações de segurança do sistema.
          </p>
          <Link
            to="/admin/security"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Acessar Painel de Segurança
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
