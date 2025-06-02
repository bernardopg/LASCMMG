/**
 * Função para obter o URL do servidor a partir do ambiente
 * @returns {string} O URL base do servidor.
 */
export const getServerUrl = () => {
  // Em desenvolvimento, o socket poderia estar em uma porta diferente
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }
  // Em produção, usamos o mesmo host que o site
  return '';
};
