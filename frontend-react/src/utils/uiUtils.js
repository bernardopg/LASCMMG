/**
 * Retorna classes de cor do Tailwind com base no status do torneio.
 * @param {string} status - O status do torneio.
 * @returns {string} As classes de cor correspondentes.
 */
export const getTournamentStatusColorClasses = (status) => {
  switch (status?.toLowerCase()) {
    case 'ativo':
    case 'em andamento':
      return 'bg-green-700 text-green-100'; // Success colors for dark theme
    case 'finalizado':
      return 'bg-gray-700 text-gray-100'; // Gray colors for dark theme
    case 'cancelado':
      return 'bg-red-700 text-red-100'; // Danger colors for dark theme
    case 'agendado':
      return 'bg-blue-700 text-blue-100'; // Info colors for dark theme
    default:
      return 'bg-gray-700 text-gray-100';
  }
};

/**
 * Retorna classes de cor do Tailwind com base na força da senha.
 * @param {string} strength - A força da senha ('weak', 'medium', 'strong').
 * @returns {string} As classes de cor correspondentes.
 */
export const getPasswordStrengthColorClasses = (strength) => {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

// Adicione outras funções de utilidade de UI conforme necessário
