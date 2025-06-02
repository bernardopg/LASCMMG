import { FaClipboardList, FaHistory } from 'react-icons/fa';

const AdminActivityLogPage = () => {
  const cardClasses = 'bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-700';
  const infoBoxClasses = 'mt-8 p-4 border border-sky-500/40 rounded-lg bg-sky-500/10';

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-8 flex items-center">
        <FaHistory className="mr-3 h-8 w-8 text-lime-300" />
        Log de Atividades Administrativas
      </h1>
      <div className={cardClasses}>
        <p className="text-lg text-slate-300 mb-6">
          Esta página exibirá um registro detalhado de todas as ações administrativas importantes
          realizadas no sistema.
        </p>
        <p className="font-semibold text-gray-400">Funcionalidades planejadas:</p>
        <ul className="list-disc list-inside pl-5 mt-2 text-gray-400 space-y-1">
          <li>Visualização de logs de auditoria do backend.</li>
          <li>Filtros por tipo de ação, administrador, data, etc.</li>
          <li>Detalhes de cada ação registrada.</li>
          <li>Interface para busca e paginação dos logs.</li>
        </ul>
        <div className={infoBoxClasses}>
          <p className="font-semibold text-sky-300 flex items-center">
            <FaClipboardList className="inline mr-2 h-5 w-5" />
            Em Desenvolvimento
          </p>
          <p className="text-sky-500 mt-1">
            A visualização completa do log de atividades está sendo desenvolvida e estará disponível
            em breve.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLogPage;
