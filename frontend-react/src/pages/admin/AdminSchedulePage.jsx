import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

const AdminSchedulePage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Gerenciar Agendamento de Partidas</h1>
        {/* Add buttons or filters here if needed in the future */}
      </div>

      <div className="card p-6 md:p-8">
        <div className="text-center py-10">
          <FaCalendarAlt size={48} className="mx-auto text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Gerenciamento de Agendamento (Em Desenvolvimento)
          </h2>
          <p className="text-gray-400">
            Esta seção permitirá visualizar e ajustar datas e horários das partidas de um torneio.
          </p>
          <p className="text-gray-500 mt-2">
            Funcionalidades futuras incluirão um calendário interativo e a capacidade de notificar jogadores sobre alterações.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSchedulePage;
