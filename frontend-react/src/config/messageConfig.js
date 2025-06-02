// Tipos de mensagens disponíveis
export const MESSAGE_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Posições disponíveis para as mensagens
export const MESSAGE_POSITIONS = {
  TOP: 'top',
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  BOTTOM: 'bottom',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
};

// Comportamentos para múltiplas mensagens
export const MESSAGE_BEHAVIORS = {
  STACK: 'stack', // Empilha mensagens, mostrando todas
  REPLACE: 'replace', // Substitui mensagens existentes
  QUEUE: 'queue', // Coloca em fila, mostrando uma de cada vez
};
