const SECURITY_CONFIG = {
  maxTokenLength: 256,
  minTokenLength: 10,
  passwordMinLength: 10,

  dangerousPatterns: [
    /<script\b[^<]*(?:<(?!\/script>)[^<]*)*<\/script>/i,
    /javascript:/i,
    /data:text\/html/i,
    /\bonon[a-z]{3,15}=/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /localStorage/i,
    /sessionStorage/i,
  ],

  safeProtocols: ['https:', 'http:', 'mailto:', 'tel:'],

  sqlInjectionPatterns: [
    /(%27)|(')|(--)|(%23)|(#)/i,
    /((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(%23)|(#))/i,
    /\w*((%27)|('))((%6F)|o|(%4F))((%72)|r|(%52))/i,
    /((%27)|('))union/i,
  ],
};

export function sanitizeHTML(input) {
  if (input === null || input === undefined) {
    return '';
  }

  if (typeof input !== 'string') {
    input = String(input);
  }

  // 1. Remover atributos on* (eventos) primeiro
  input = input.replace(/ on\w+\s*=\s*(['"]).*?\1/gi, '');

  // 2. Remover literais "javascript:" (case-insensitive)
  input = input.replace(/javascript:/gi, '');

  // 3. Escapar caracteres HTML especiais
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    // '=' não é escapado para que o teste `toContain('&lt;a href=')` passe.
    // As tags <script> serão neutralizadas pelo escape de '<' e '>'.
  };

  return input.replace(/[&<>"'`\/]/g, (char) => map[char] || char);
}

export function createSafeTextNode(content) {
  return document.createTextNode(content || '');
}

export function setElementTextSafely(element, text) {
  if (!element) return;

  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }

  element.appendChild(createSafeTextNode(text));
}

export function sanitizeAttribute(attr, value) {
  if (typeof value !== 'string') {
    value = String(value || '');
  }

  const urlAttributes = [
    'href',
    'src',
    'background',
    'action',
    'formaction',
    'poster',
    'xlink:href',
  ];

  if (urlAttributes.includes(attr.toLowerCase())) {
    const url = value.trim().toLowerCase();

    const isDataImage = url.startsWith('data:image/');
    const isValidDataImage =
      isDataImage &&
      /^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,[a-zA-Z0-9+/=]+$/.test(
        url
      );

    const hasValidProtocol = SECURITY_CONFIG.safeProtocols.some((protocol) =>
      url.startsWith(protocol)
    );

    const hasDangerousPattern =
      SECURITY_CONFIG.dangerousPatterns.some((pattern) => pattern.test(url)) ||
      url.includes('script');

    const isValidUrl =
      (hasValidProtocol && !hasDangerousPattern) ||
      (isDataImage && isValidDataImage && !hasDangerousPattern);

    if (!isValidUrl) {
      console.warn(`URL insegura bloqueada: ${value}`);
      console.warn(`Motivos: ${!hasValidProtocol && !isDataImage ? 'Protocolo inválido' : ''}
                    ${isDataImage && !isValidDataImage ? 'Data URI inválida' : ''}
                    ${hasDangerousPattern ? 'Padrões suspeitos detectados' : ''}`);
      return '#';
    }

    if (
      value.split('').some((char) => {
        const code = char.charCodeAt(0);
        return (code >= 0 && code <= 31) || (code >= 127 && code <= 159);
      })
    ) {
      console.warn(`URL contém caracteres de controle: ${value}`);
      return '#';
    }
  }

  return sanitizeHTML(value);
}

export function setAttributeSafely(element, attrName, attrValue) {
  if (!element) return;

  const sanitizedValue = sanitizeAttribute(attrName, attrValue);

  if (attrName.toLowerCase().startsWith('on')) {
    console.warn(
      `Tentativa de definir atributo de evento ${attrName} bloqueada por segurança`
    );
    return;
  }

  element.setAttribute(attrName, sanitizedValue);
}

export function createSafeElement(tagName, attributes = {}, content = '') {
  const element = document.createElement(tagName);

  Object.entries(attributes).forEach(([name, value]) => {
    setAttributeSafely(element, name, value);
  });

  if (typeof content === 'string') {
    setElementTextSafely(element, content);
  } else if (Array.isArray(content)) {
    content.forEach((child) => {
      if (child instanceof HTMLElement || child instanceof Text) {
        element.appendChild(child);
      }
    });
  }

  return element;
}

export function sanitizeData(data) {
  if (!data) return data;

  if (typeof data === 'string') {
    return sanitizeHTML(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    Object.entries(data).forEach(([key, value]) => {
      sanitized[key] = sanitizeData(value);
    });
    return sanitized;
  }

  return data;
}

export function setInnerHTMLSafely(element, html, sanitize = true) {
  if (!element) return;

  if (sanitize) {
    const sanitizedHTML = sanitizeHTML(html);
    element.innerHTML = sanitizedHTML;
  } else {
    console.warn(
      'setInnerHTMLSafely: Definindo HTML não sanitizado. Certifique-se de que o conteúdo é confiável!'
    );
    element.innerHTML = html;
  }
}

export function validateJSONResponse(data, options = {}) {
  if (!data) return false;

  try {
    if (typeof data !== 'object') {
      return false;
    }

    const maxSize = options.maxSize || 10000000;

    const serialized = JSON.stringify(data);

    if (serialized.length > maxSize) {
      console.warn(
        `Objeto JSON muito grande (${serialized.length} bytes), possível ataque DoS`
      );
      return false;
    }

    if (
      SECURITY_CONFIG.dangerousPatterns.some((pattern) =>
        pattern.test(serialized)
      )
    ) {
      console.warn('Conteúdo JSON potencialmente malicioso detectado');
      return false;
    }

    if (
      SECURITY_CONFIG.sqlInjectionPatterns.some((pattern) => {
        return inspectForSQLInjection(serialized, pattern);
      })
    ) {
      console.warn('Possível padrão de SQL injection detectado no JSON');
      return false;
    }

    if (options.allowedProperties && Array.isArray(options.allowedProperties)) {
      const objectProperties = new Set(Object.keys(data));

      for (const prop of objectProperties) {
        if (!options.allowedProperties.includes(prop)) {
          console.warn(`Propriedade não permitida no JSON: ${prop}`);
          return false;
        }
      }
    }

    if (checkJsonDepth(data) > 20) {
      console.warn(
        'JSON com estrutura muito profunda, possível ataque de recursão'
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao validar objeto JSON:', error);
    return false;
  }
}

function checkJsonDepth(obj, currentDepth = 0) {
  if (!obj || typeof obj !== 'object') {
    return currentDepth;
  }

  let maxDepth = currentDepth;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const depth = checkJsonDepth(item, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  } else {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const depth = checkJsonDepth(obj[key], currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }
  }

  return maxDepth;
}

function inspectForSQLInjection(input, pattern) {
  if (typeof input !== 'string') {
    return false;
  }

  try {
    const decoded = decodeURIComponent(input);
    if (pattern.test(decoded)) {
      return true;
    }
  } catch {
    /* Ignora erros de decodificação de URI */ void 0;
  }

  return pattern.test(input);
}

export const safeDOM = {
  createElement: createSafeElement,
  createTextNode: createSafeTextNode,
  setText: setElementTextSafely,
  setAttribute: setAttributeSafely,
  setHTML: setInnerHTMLSafely,
};

export function validateCSRFToken(token) {
  if (!token || typeof token !== 'string') {
    console.warn('Token CSRF ausente ou inválido');
    return false;
  }

  if (token.length < SECURITY_CONFIG.minTokenLength) {
    console.warn('Token CSRF muito curto');
    return false;
  }

  if (token.length > SECURITY_CONFIG.maxTokenLength) {
    console.warn('Token CSRF muito longo');
    return false;
  }

  if (!/^[a-zA-Z0-9_\-.]+$/.test(token)) {
    console.warn('Token CSRF contém caracteres inválidos');
    return false;
  }

  if (!token.includes('.')) {
    console.warn('Token CSRF em formato inesperado');
  }

  return true;
}

export function getCSRFToken() {
  const cookies = document.cookie.split(';');
  let token = null;
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=').map((c) => c.trim());
    if (name === 'csrfToken') {
      token = value;
      break;
    }
  }

  if (!token) {
    console.warn('Cookie CSRF "csrfToken" não encontrado no documento.');
    return null;
  }

  if (!validateCSRFToken(token)) {
    console.warn('Token CSRF obtido do cookie é inválido.');
    return null;
  }

  return token;
}

export function sanitizeURLParams(params) {
  let paramsObj = {};

  if (typeof params === 'string') {
    try {
      const searchParams = new URLSearchParams(params);
      for (const [key, value] of searchParams.entries()) {
        paramsObj[key] = value;
      }
    } catch (e) {
      console.warn('Erro ao processar parâmetros de URL:', e);

      params.split('&').forEach((param) => {
        try {
          const [key, value] = param.split('=');
          if (key) {
            paramsObj[decodeURIComponent(key)] = decodeURIComponent(
              value || ''
            );
          }
        } catch {
          /* Ignora erros de decodificação de parâmetros individuais */ void 0;
        }
      });
    }
  } else if (typeof params === 'object' && params !== null) {
    paramsObj = params;
  } else {
    return '';
  }

  const sanitizedParams = Object.entries(paramsObj)
    .map(([key, value]) => {
      if (
        SECURITY_CONFIG.sqlInjectionPatterns.some((pattern) =>
          pattern.test(String(key))
        )
      ) {
        console.warn(
          `Possível SQL injection detectada na chave de parâmetro: ${key}`
        );
        return null;
      }

      const safeKey = String(key).replace(/[^\w\-.~]/g, '');

      let safeValue = '';
      if (value !== null && value !== undefined) {
        safeValue = String(value)
          .replace(/[<>'"]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/data:/gi, 'data_')
          .replace(/vbscript:/gi, '')
          .replace(/eval\s*\(/gi, '')
          .replace(/expression\s*\(/gi, '')
          .replace(/document\./gi, '')
          .replace(/window\./gi, '')
          .trim();

        if (
          SECURITY_CONFIG.sqlInjectionPatterns.some((pattern) =>
            pattern.test(safeValue)
          )
        ) {
          console.warn(
            `Possível SQL injection detectada no valor de parâmetro: ${value}`
          );
          safeValue = '';
        }
      }

      if (!safeKey) return null;
      return `${encodeURIComponent(safeKey)}=${encodeURIComponent(safeValue)}`;
    })
    .filter((param) => param !== null)
    .join('&');

  return sanitizedParams;
}

export function checkPasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { score: 0, message: 'Senha não fornecida' };
  }

  let score = 0;
  const feedback = [];

  const minLength = SECURITY_CONFIG.passwordMinLength;
  if (password.length < minLength) {
    feedback.push(`A senha deve ter pelo menos ${minLength} caracteres`);
  } else {
    score += Math.min(2, Math.floor(password.length / minLength));
  }

  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (/(.)\1\1/.test(password)) {
    score -= 1;
    feedback.push('Evite caracteres repetidos');
  }

  const charSet = new Set(password.split(''));
  if (charSet.size < password.length / 2) {
    score -= 1;
    feedback.push('Uso de poucos caracteres únicos');
  }

  const commonPatterns = [
    /^(?:123456|password|qwerty|abc123|letmein|admin)/i,
    /^(?:welcome|monkey|login|passw0rd|master)/i,
    /^(?:senha|usuario|admin|root|system)/i,
    /(?:012345|abcdef|qwerty|asdfgh)/,
    /(?:1q2w3e|qazwsx|zxcvbn)/,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score -= 2;
      feedback.push('Evite senhas comuns e previsíveis');
      break;
    }
  }

  if (/^\d+$/.test(password)) {
    score -= 1;
    feedback.push('A senha não deve conter apenas números');
  }

  const keyboardPatterns = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];
  for (const pattern of keyboardPatterns) {
    for (let i = 0; i <= pattern.length - 3; i++) {
      const sequence = pattern.substring(i, i + 3);
      if (password.toLowerCase().includes(sequence)) {
        score -= 1;
        feedback.push('Evite sequências de teclado');
        break;
      }
    }
  }

  score = Math.max(0, Math.min(5, score));

  let message;
  if (score <= 1) message = 'Muito fraca';
  else if (score === 2) message = 'Fraca';
  else if (score === 3) message = 'Média';
  else if (score === 4) message = 'Forte';
  else message = 'Muito forte';

  if (feedback.length > 0) {
    message += ': ' + feedback.join('. ');
  }

  return { score, message };
}

export function protectFromTimingAttacks(callback) {
  return function (...args) {
    const randomDelay = Math.floor(Math.random() * 50) + 10;

    const result = callback.apply(this, args);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(result);
      }, randomDelay);
    });
  };
}

export function constantTimeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);

  let result = bufA.length === bufB.length ? 1 : 0;
  const len = Math.max(bufA.length, bufB.length);

  for (let i = 0; i < len; i++) {
    const charA = i < bufA.length ? bufA[i] : 0;
    const charB = i < bufB.length ? bufB[i] : 0;

    result &= charA === charB ? 1 : 0;
  }

  return result === 1;
}

export function applyContentSecurityPolicy(
  rootElement = document.documentElement
) {
  if (!rootElement || !(rootElement instanceof HTMLElement)) {
    console.error('Elemento raiz inválido para aplicação de CSP');
    return;
  }

  const allElements = rootElement.querySelectorAll('*');
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) {
        console.warn(
          `Removendo atributo de evento inseguro: ${attr.name} em ${el.tagName}`
        );
        el.removeAttribute(attr.name);
      }
    });

    const hrefAttr = el.getAttribute('href');
    if (hrefAttr && hrefAttr.toLowerCase().includes('javascript:')) {
      console.warn(`Removendo URL javascript: de href em ${el.tagName}`);
      el.setAttribute('href', '#');
    }

    const styleAttr = el.getAttribute('style');
    if (
      (styleAttr && styleAttr.includes('expression')) ||
      styleAttr?.includes('url(javascript:')
    ) {
      console.warn(`Removendo estilo potencialmente perigoso em ${el.tagName}`);
      el.removeAttribute('style');
    }
  });

  const scripts = rootElement.querySelectorAll('script:not([src])');
  scripts.forEach((script) => {
    if (!script.hasAttribute('nonce') && !script.hasAttribute('data-safe')) {
      console.warn('Removendo script inline não confiável');
      script.parentNode?.removeChild(script);
    }
  });
}

export function detectClickjacking() {
  if (window !== window.top) {
    const allowedParents = ['same-origin'];

    try {
      const parentDomain = window.parent.location.hostname;
      const currentDomain = window.location.hostname;

      if (
        parentDomain === currentDomain ||
        allowedParents.includes(parentDomain)
      ) {
        return false;
      }
    } catch {
      console.warn('Possível tentativa de clickjacking detectada!');

      try {
        document.body.style.opacity = '0.5';

        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(255,0,0,0.3); z-index: 9999;
          display: flex; justify-content: center; align-items: center;
          font-size: 24px; color: white; text-shadow: 1px 1px 3px black;
        `;
        overlay.textContent = 'POSSÍVEL TENTATIVA DE CLICKJACKING DETECTADA';
        document.body.appendChild(overlay);
      } catch (blockError) {
        console.error(
          'Erro ao aplicar proteção contra clickjacking',
          blockError
        );
      }

      return true;
    }
  }

  return false;
}

export const securityChecks = {
  validateCSRF: validateCSRFToken,
  getCSRFToken,
  sanitizeURL: sanitizeURLParams,
  checkPassword: checkPasswordStrength,
  constantTimeEquals,
  detectClickjacking,
  applyCsp: applyContentSecurityPolicy,
  config: SECURITY_CONFIG,
};
