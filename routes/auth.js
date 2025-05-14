const express = require('express');
const adminModel = require('../lib/models/adminModel');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (
    !username ||
    !password ||
    typeof username !== 'string' ||
    typeof password !== 'string'
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const authResult = await adminModel.authenticateAdmin(username, password);

    if (authResult.success) {
      res.json(authResult);
    } else {
      res.status(401).json(authResult);
    }
  } catch (error) {
    console.error('Erro durante autenticação:', error);
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
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao alterar senha.',
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    if (req.revokeToken) {
      const result = req.revokeToken();
      if (result) {
        return res.json({
          success: true,
          message: 'Logout realizado com sucesso.',
        });
      }
    }

    return res.json({ success: true, message: 'Logout processado.' });
  } catch (error) {
    console.error('Erro ao processar logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar logout.',
    });
  }
});

module.exports = router;
