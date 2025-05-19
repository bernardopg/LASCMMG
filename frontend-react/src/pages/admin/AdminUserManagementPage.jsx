import React, { useState } from 'react';
import { FaUsersCog, FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';

const AdminUserManagementPage = () => {
  // Placeholder data - replace with actual data fetching
  const [adminUsers, setAdminUsers] = useState([
    { id: 'user1', username: 'admin', name: 'Admin Principal', role: 'superadmin', lastLogin: '2024-05-19T10:00:00Z' },
    { id: 'user2', username: 'editor', name: 'Editor Chefe', role: 'admin', lastLogin: '2024-05-18T15:30:00Z' },
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-100">Gerenciamento de Usuários Administradores</h1>
        <button
          onClick={() => alert('Funcionalidade Adicionar Novo Admin a ser implementada.')}
          className="btn btn-primary flex items-center"
        >
          <FaPlus className="mr-2" /> Adicionar Novo Admin
        </button>
      </div>

      <div className="card overflow-x-auto">
        {adminUsers.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Papel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Último Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {adminUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(user.lastLogin).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => alert(`Editar usuário ${user.username} (a ser implementado)`)}
                      className="text-blue-400 hover:text-blue-300"
                      title="Editar Usuário"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => alert(`Excluir usuário ${user.username} (a ser implementado)`)}
                      className="text-red-400 hover:text-red-300"
                      title="Excluir Usuário"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10">
            <FaUsersCog size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg">Nenhum usuário administrador encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagementPage;
