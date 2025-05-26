import React from 'react';
import { FaChartPie, FaFileAlt } from 'react-icons/fa';

const AdminReportsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
        <FaFileAlt className="mr-3 text-primary dark:text-primary-light" />
        Relatórios Administrativos
      </h1>
      <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          Esta seção será dedicada à geração e visualização de relatórios detalhados sobre torneios,
          jogadores, finanças e atividades do sistema.
        </p>
        <p className="font-semibold text-gray-600 dark:text-gray-400">
          Funcionalidades planejadas:
        </p>
        <ul className="list-disc list-inside pl-5 mt-2 text-gray-600 dark:text-gray-400 space-y-1">
          <li>Relatórios de participação em torneios.</li>
          <li>Relatórios financeiros (taxas de inscrição, premiações).</li>
          <li>Sumário de atividades de administradores.</li>
          <li>Estatísticas de popularidade de tipos de torneio.</li>
          <li>Exportação de relatórios (PDF, CSV).</li>
        </ul>
        <div className="mt-8 p-4 border border-blue-400 dark:border-blue-500/50 rounded-md bg-blue-50 dark:bg-blue-500/10">
          <p className="font-semibold text-blue-700 dark:text-blue-300">
            <FaChartPie className="inline mr-2" />
            Em Desenvolvimento
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            A funcionalidade completa de relatórios está sendo desenvolvida e estará disponível em
            breve.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
