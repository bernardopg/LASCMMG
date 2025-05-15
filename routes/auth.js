const express = require('express');
const adminModel = require('../lib/models/adminModel');
const router = express.Router();
const { logger } = require('../lib/logger'); // Importar o logger

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (
    !username ||
    !password ||
    typeof username !== 'string' ||
    typeof password !== 'string'
  ) {
    logger.warn(
      {
        message: 'Tentativa de login com dados inválidos.',
        username,
        requestId: req.id,
        ip: req.ip,
      },
      'Tentativa de login com dados inválidos.'
    );
    return res
      .status(400)
      .json({ success: false, message: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const authResult = await adminModel.authenticateAdmin(username, password);

    if (authResult.success) {
      logger.info(
        { username, success: true, requestId: req.id, ip: req.ip },
        'Login bem-sucedido'
      );
      res.json(authResult);
    } else {
      logger.warn(
        {
          username,
          success: false,
          message: authResult.message,
          requestId: req.id,
          ip: req.ip,
        },
        'Falha na autenticação'
      );
      res.status(401).json(authResult);
    }
  } catch (error) {
    logger.error(
      {
        err_message: error.message,
        err_stack: error.stack,
        username,
        requestId: req.id,
        ip: req.ip,
      },
      'Erro interno durante autenticação:'
    );
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante o login.',
    });
  }
});

router.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (
    !username ||
    !currentPassword ||
    !newPassword ||
    typeof username !== 'string' ||
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string'
  ) {
    logger.warn(
      {
        message: 'Tentativa de alterar senha com dados inválidos.',
        username,
        requestId: req.id,
        ip: req.ip,
      },
      'Tentativa de alterar senha com dados inválidos.'
    );
    return res.status(400).json({
      success: false,
      message:
        'Usuário, senha atual e nova senha (como strings) são obrigatórios.',
    });
  }

  try {
    const result = await adminModel.changePassword(
      username,
      currentPassword,
      newPassword
    );

    if (result.success) {
      logger.info(
        { username, success: true, requestId: req.id, ip: req.ip },
        'Senha alterada com sucesso'
      );
      res.json(result);
    } else {
      logger.warn(
        {
          username,
          success: false,
          message: result.message,
          requestId: req.id,
          ip: req.ip,
        },
        'Falha ao alterar senha'
      );
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error(
      {
        err_message: error.message,
        err_stack: error.stack,
        username,
        requestId: req.id,
        ip: req.ip,
      },
      'Erro interno ao alterar senha:'
    );
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao alterar senha.',
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const username = req.user ? req.user.username : 'unknown_user';

    if (req.revokeToken) {
      const result = req.revokeToken();
      if (result) {
        logger.info(
          { username, success: true, requestId: req.id, ip: req.ip },
          'Logout (token revogado) realizado com sucesso.'
        );
        return res.json({
          success: true,
          message: 'Logout realizado com sucesso.',
        });
      }
    }
    logger.info(
      { username, success: true, requestId: req.id, ip: req.ip },
      'Logout processado (sem revogação de token ou falha na revogação).'
    );
    return res.json({ success: true, message: 'Logout processado.' });
  } catch (error) {
    const username = req.user ? req.user.username : 'unknown_user_on_error';
    logger.error(
      {
        err_message: error.message,
        err_stack: error.stack,
        username,
        requestId: req.id,
        ip: req.ip,
      },
      'Erro interno ao processar logout:'
    );
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar logout.',
    });
  }
});

module.exports = router;
