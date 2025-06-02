import { FaChartPie, FaFileAlt } from 'react-icons/fa';

const AdminReportsPage = () => {
  const cardClasses = 'bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-700';
  const infoBoxClasses = 'mt-8 p-4 border border-sky-500/50 rounded-lg bg-sky-500/10';

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-8 flex items-center">
        <FaFileAlt className="mr-3 h-8 w-8 text-lime-300" />
        Relatórios Administrativos
      </h1>
      <div className={cardClasses}>
        <p className="text-lg text-slate-300 mb-6">
          Esta seção será dedicada à geração e visualização de relatórios detalhados sobre torneios,
          jogadores, finanças e atividades do sistema.
        </p>
        <p className="font-semibold text-gray-400">Funcionalidades planejadas:</p>
        <ul className="list-disc list-inside pl-5 mt-2 text-gray-400 space-y-1">
          <li>Relatórios de participação em torneios.</li>
          <li>Relatórios financeiros (taxas de inscrição, premiações).</li>
          <li>Sumário de atividades de administradores.</li>
          <li>Estatísticas de popularidade de tipos de torneio.</li>
          <li>Exportação de relatórios (PDF, CSV).</li>
        </ul>
        <div className={infoBoxClasses}>
          <p className="font-semibold text-sky-600 flex items-center">
            <FaChartPie className="inline mr-2 h-5 w-5" />
            Em Desenvolvimento
          </p>
          <p className="text-sky-500 mt-1">
            A funcionalidade completa de relatórios está sendo desenvolvida e estará disponível em
            breve.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
