import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Configura o servidor de mock com os handlers definidos
export const server = setupServer(...handlers);
