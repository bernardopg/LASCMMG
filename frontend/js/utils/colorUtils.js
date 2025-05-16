/**
 * Utilitários para manipulação e conversão de cores
 */

/**
 * Converte HSL para Hex
 * @param {number} h - Matiz (0-360)
 * @param {number} s - Saturação (0-100)
 * @param {number} l - Luminosidade (0-100)
 * @returns {string} - Código hexadecimal da cor
 */
export function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Converte Hex para RGB
 * @param {string} hex - Cor em formato hexadecimal
 * @returns {string} - Valores RGB no formato "r, g, b"
 */
export function hexToRgb(hex) {
  // Remover o '#' se presente
  hex = hex.replace(/^#/, '');

  // Expandir hex curto (por exemplo, #FFF para #FFFFFF)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((h) => h + h)
      .join('');
  }

  // Converter para valores RGB
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `${r}, ${g}, ${b}`;
}

/**
 * Converte Hex para HSL
 * @param {string} hex - Cor em formato hexadecimal
 * @returns {Array} - Array contendo valores H, S e L
 */
export function hexToHsl(hex) {
  // Remover o '#' se presente
  hex = hex.replace(/^#/, '');

  // Expandir hex curto
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((h) => h + h)
      .join('');
  }

  // Converter para valores RGB
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  // Encontrar min e max
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // acromático
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h = Math.round(h * 60);
  }

  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return [h, s, l];
}

/**
 * Gera uma paleta de cores acessível baseada em uma cor principal
 * @param {string} baseColor - Cor base em formato hexadecimal
 * @param {Function} hslToHex - Função de conversão HSL para Hex
 * @param {Function} hexToHsl - Função de conversão Hex para HSL
 * @returns {Object} - Paleta de cores relacionadas
 */
export function generateAccessiblePalette(baseColor, hslToHex, hexToHsl) {
  // Converter baseColor para HSL
  const hsl = hexToHsl(baseColor);
  const h = hsl[0];
  const s = hsl[1];
  const l = hsl[2];

  // Gera paleta acessível com cores relacionadas
  return {
    // Versão mais clara para fundos
    light: hslToHex(h, Math.max(s - 15, 0), Math.min(l + 45, 95)),
    // Versão mais escura para texto
    dark: hslToHex(h, Math.min(s + 10, 100), Math.max(l - 40, 15)),
    // Cor complementar
    complement: hslToHex((h + 180) % 360, s, l),
    // Cores análogas
    analogous1: hslToHex((h + 30) % 360, s, l),
    analogous2: hslToHex((h - 30 + 360) % 360, s, l),
  };
}
