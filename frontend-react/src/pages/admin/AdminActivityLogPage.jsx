import React from 'react';
import { FaHistory, FaClipboardList } from 'react-icons/fa';

const AdminActivityLogPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
        <FaHistory className="mr-3 text-primary dark:text-primary-light" />
        Log de Atividades Administrativas
      </h1>
      <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          Esta página exibirá um registro detalhado de todas as ações administrativas importantes
          realizadas no sistema.
        </p>
        <p className="font-semibold text-gray-600 dark:text-gray-400">
          Funcionalidades planejadas:
        </p>
        <ul className="list-disc list-inside pl-5 mt-2 text-gray-600 dark:text-gray-400 space-y-1">
          <li>Visualização de logs de auditoria do backend.</li>
          <li>Filtros por tipo de ação, administrador, data, etc.</li>
          <li>Detalhes de cada ação registrada.</li>
          <li>Interface para busca e paginação dos logs.</li>
        </ul>
        <div className="mt-8 p-4 border border-blue-400 dark:border-blue-500/50 rounded-md bg-blue-50 dark:bg-blue-500/10">
          <p className="font-semibold text-blue-700 dark:text-blue-300">
            <FaClipboardList className="inline mr-2" />
            Em Desenvolvimento
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            A visualização completa do log de atividades está sendo desenvolvida e estará disponível
            em breve.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLogPage;
