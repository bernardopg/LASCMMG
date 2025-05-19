import React from 'react';

/**
 * Página de Lixeira/AdminTrash
 * Exibe itens excluídos (soft delete) como jogadores, placares e torneios.
 * Permite restaurar ou excluir permanentemente itens.
 * Integração futura: consumir endpoints /api/admin/trash, /api/admin/trash/restore, /api/admin/trash/item.
 */
const TrashPage = () => {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-4 text-primary">Lixeira (Admin)</h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Esta página exibirá todos os itens excluídos (soft delete) do sistema, incluindo jogadores, placares e torneios.
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400">
          <li>Restaurar itens para o estado ativo.</li>
          <li>Excluir permanentemente itens da lixeira.</li>
          <li>Filtrar por tipo de item (Jogador, Placar, Torneio).</li>
          <li>Paginação e busca.</li>
        </ul>
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <strong>Em breve:</strong> Integração com a API real e UI completa.
        </div>
      </div>
    </div>
  );
};

export default TrashPage;
