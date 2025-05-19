import React from 'react';

/**
 * Página de Gerenciamento de Jogadores (Admin)
 * Exibe todos os jogadores cadastrados, permite adicionar, editar, excluir (soft/permanente) e importar/exportar jogadores.
 * Integração futura: consumir endpoints /api/admin/players, /api/admin/players/:playerId.
 */
const PlayersPage = () => {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-4 text-primary">Gerenciamento de Jogadores (Admin)</h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Esta página permitirá o gerenciamento completo dos jogadores do sistema.
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400">
          <li>Listar todos os jogadores cadastrados.</li>
          <li>Adicionar novo jogador.</li>
          <li>Editar informações de jogadores existentes.</li>
          <li>Excluir jogadores (soft delete e permanente).</li>
          <li>Importar/exportar lista de jogadores (CSV/JSON).</li>
          <li>Buscar e filtrar jogadores.</li>
        </ul>
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <strong>Em breve:</strong> Integração com a API real e UI completa.
        </div>
      </div>
    </div>
  );
};

export default PlayersPage;
