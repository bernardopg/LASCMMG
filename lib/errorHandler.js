const { NODE_ENV } = require('./config');
const { logger } = require('./logger'); // Importar o logger

function formatErrorResponse(message, status = 500, details = null) {
  const response = {
    success: false,
    message: message || 'Erro interno do servidor',
    status: status,
  };

  if (details && NODE_ENV !== 'production') {
    response.details = details;
  }

  return response;
}

function globalErrorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Erro interno do servidor';

  // Usar o logger para registrar o erro
  // Adicionar mais detalhes ao log, como o stack trace e o request ID (se disponível)
  const logDetails = {
    err_message: err.message,
    err_stack: err.stack,
    err_name: err.name,
    status_code: status,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id, // ID da requisição gerado pelo pino-http
  };

  if (status >= 500) {
    logger.error(logDetails, `Erro no servidor: ${message}`);
  } else if (status >= 400) {
    logger.warn(logDetails, `Erro do cliente: ${message}`);
  } else {
    // Para outros erros, se houver (improvável chegar aqui com status < 400)
    logger.info(logDetails, `Erro: ${message}`);
  }

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Erro de validação: ' + (err.message || 'Dados inválidos');
  } else if (
    err.name === 'UnauthorizedError' ||
    err.name === 'JsonWebTokenError'
  ) {
    status = 401;
    message = 'Erro de autenticação: ' + (err.message || 'Token inválido');
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Erro de autenticação: Token expirado';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Acesso negado: ' + (err.message || 'Permissão insuficiente');
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message =
      'Recurso não encontrado: ' +
      (err.message || 'O recurso solicitado não existe');
  }

  res.status(status).json(formatErrorResponse(message, status, err));
}

class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Dados de entrada inválidos') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Acesso não autorizado') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acesso proibido') {
    super(message, 403);
  }
}

module.exports = {
  formatErrorResponse,
  globalErrorHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
};
