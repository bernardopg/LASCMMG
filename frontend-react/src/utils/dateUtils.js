/**
 * Formata uma string de data para o formato DD/MM/YYYY.
 * @param {string} dateString - A string da data a ser formatada.
 * @returns {string} A data formatada ou uma string vazia se a entrada for inválida.
 */
export const formatDateToLocale = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Data inválida'; // Ou retorna a string original, ou uma mensagem de erro
  }
};

/**
 * Formata uma string de data e hora para um formato legível.
 * Exemplo: 23 de maio de 2024, 14:30
 * @param {string} dateTimeString - A string de data e hora.
 * @returns {string} A data e hora formatadas.
 */
export const formatDateTimeReadable = (dateTimeString) => {
  if (!dateTimeString) return '';
  try {
    return new Date(dateTimeString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting datetime:', dateTimeString, error);
    return 'Data/hora inválida';
  }
};

// Adicione outras funções de utilidade de data conforme necessário
