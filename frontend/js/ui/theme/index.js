/**
 * Índice do Sistema de Cores Dinâmicas
 *
 * Este arquivo serve como ponto de entrada para o sistema de cores dinâmicas,
 * exportando todos os componentes relacionados em um único local.
 */

// Exporta o sistema de cores dinâmicas
export { dynamicColorSystem } from './dynamicColorSystem.js';

// Exporta o painel de configuração de cores
export { createColorPanel } from './colorConfigPanel.js';

// Re-exporta utilitários de cores para facilitar o acesso
export {
  hslToHex,
  hexToRgb,
  hexToHsl,
  generateAccessiblePalette,
} from '../../utils/colorUtils.js';
