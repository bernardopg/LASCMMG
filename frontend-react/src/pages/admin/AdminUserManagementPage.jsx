import React from 'react';
import { FaUsersCog } from 'react-icons/fa';

const AdminUserManagementPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Gerenciamento de Usuários Administradores</h1>
        {/* Add buttons or filters here if needed in the future, e.g., "Adicionar Novo Admin" */}
      </div>

      <div className="card p-6 md:p-8">
        <div className="text-center py-10">
          <FaUsersCog size={48} className="mx-auto text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Gerenciamento de Usuários (Em Desenvolvimento)
          </h2>
          <p className="text-gray-400">
            Esta seção permitirá gerenciar contas de usuários com privilégios administrativos.
          </p>
          <p className="text-gray-500 mt-2">
            Funcionalidades futuras podem incluir listagem de administradores, adição, edição de papéis/permissões e remoção de acesso administrativo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagementPage;
