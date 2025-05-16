const crypto = require('crypto');
const { JWT_SECRET } = require('../config/config');

// Armazenamento de tokens para validação
// Em uma aplicação em cluster, seria necessário usar Redis ou similar
const tokenStore = new Map();
let tokenCleanupTimer = null;

// Configurações
const CSRF_CONFIG = {
  // Tempo de validade do token em segundos (30 minutos)
  tokenValidity: 30 * 60,

  // Nome do header que deve conter o token
  headerName: 'X-CSRF-Token',

  // Nome do cookie onde o token pode ser armazenado (alternativa ao header)
  cookieName: 'csrfToken',

  // Métodos HTTP que exigem proteção CSRF (que modificam o estado do servidor)
  protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
};

function generateToken(userId) {
  // Gerar valor aleatório
  const randomBytes = crypto.randomBytes(32).toString('hex');

  // Adicionar timestamp para verificar validade
  const timestamp = Date.now();

  // Criar assinatura baseada nos dados e no segredo JWT
  const data = `${userId}-${randomBytes}-${timestamp}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('hex');

  // Criar token completo
  const token = `${randomBytes}.${timestamp}.${signature}`;

  // Armazenar token com dados de usuário e expiração
  tokenStore.set(token, {
    userId,
    timestamp,
    expires: timestamp + CSRF_CONFIG.tokenValidity * 1000,
  });

  // Limpar tokens expirados periodicamente
  cleanExpiredTokens(); // Limpeza imediata também é bom

  // Iniciar timer de limpeza se não estiver ativo
  if (!tokenCleanupTimer && tokenStore.size > 0) {
    // Inicia apenas se houver tokens
    tokenCleanupTimer = setInterval(
      cleanExpiredTokens,
      (CSRF_CONFIG.tokenValidity * 1000) / 2
    ); // Limpa na metade do tempo de validade
  }

  return token;
}

function verifyToken(token, userId) {
  if (!token || !userId) {
    return false;
  }

  // Verificar se o token existe no armazenamento
  const tokenData = tokenStore.get(token);

  if (!tokenData) {
    return false;
  }

  // Verificar se o token pertence ao usuário correto
  if (tokenData.userId !== userId) {
    return false;
  }

  // Verificar se o token expirou
  if (Date.now() > tokenData.expires) {
    // Remover token expirado
    tokenStore.delete(token);
    return false;
  }

  // Validar assinatura
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [randomBytes, timestamp] = parts;
  const data = `${userId}-${randomBytes}-${timestamp}`;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('hex');

  return parts[2] === expectedSignature;
}

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expires) {
      tokenStore.delete(token);
    }
  }
  // if (removedCount > 0) { // Mantendo o comentário original para referência, mas a variável foi removida
  //   console.log(`CSRF Token Cleanup: Removed ${removedCount} expired tokens.`);
  // }

  // Parar o timer se não houver mais tokens para limpar (para economizar recursos)
  if (tokenStore.size === 0 && tokenCleanupTimer) {
    clearInterval(tokenCleanupTimer);
    tokenCleanupTimer = null;
    // console.log('CSRF Token Cleanup: Store is empty, timer stopped.');
  }
}

function csrfProvider(req, res, next) {
  // Verificar se o usuário está autenticado
  const userId = req.user?.username || 'anonymous';

  // Gerar o token
  const token = generateToken(userId);

  // Incluir o token nos headers da resposta
  res.set(CSRF_CONFIG.headerName, token);

  // Opcionalmente definir um cookie (útil para formulários HTML)
  // Tornar o cookie acessível ao JavaScript do cliente para que ele possa ser lido e enviado no header X-CSRF-Token.
  // A proteção CSRF ainda é mantida porque o servidor compara o token do cookie com o token do header.
  res.cookie(CSRF_CONFIG.cookieName, token, {
    httpOnly: false, // Permitir que o JavaScript do cliente leia este cookie
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: CSRF_CONFIG.tokenValidity * 1000,
  });

  // Disponibilizar o token no objeto de resposta para templates
  res.locals.csrfToken = token;

  next();
}

function csrfProtection(req, res, next) {
  // Não verificar para métodos que não modificam recursos
  if (!CSRF_CONFIG.protectedMethods.includes(req.method)) {
    return next();
  }

  // Obter o token do header ou cookie
  const token =
    req.headers[CSRF_CONFIG.headerName.toLowerCase()] ||
    req.cookies[CSRF_CONFIG.cookieName];

  // Obter o ID do usuário
  const userId = req.user?.username || 'anonymous';

  // Verificar se o token é válido
  if (!token || !verifyToken(token, userId)) {
    return res.status(403).json({
      success: false,
      message:
        'Token CSRF inválido ou expirado. Recarregue a página e tente novamente.',
    });
  }

  // Token é válido, prosseguir
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  csrfProvider,
  csrfProtection,
  CSRF_CONFIG,
};
