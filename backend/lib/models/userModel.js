const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { runAsync, getOneAsync } = require('../db/database');
const { JWT_SECRET, JWT_EXPIRATION } = require('../config/config');
const { logger } = require('../logger/logger');
const auditLogger = require('../logger/auditLogger');

/**
 * Checks if a user with the given username already exists.
 * @param {string} username - The username to check.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
async function userExists(username) {
  if (!username) {
    throw new Error('Username not provided');
  }
  const sql = "SELECT 1 FROM users WHERE username = ? AND role = 'user'";
  try {
    const result = await getOneAsync(sql, [username]);
    return !!result;
  } catch (err) {
    logger.error(
      'UserModel',
      `Error checking if user ${username} exists: ${err.message}`,
      { error: err }
    );
    throw err;
  }
}

/**
 * Retrieves a user by their username.
 * @param {string} username - The username of the user.
 * @returns {Promise<object|null>} The user object or null if not found.
 */
async function getUserByUsername(username) {
  if (!username) {
    throw new Error('Username not provided');
  }
  const sql =
    'SELECT id, username, hashedPassword, role, last_login, created_at FROM users WHERE username = ?'; // Include all relevant fields
  try {
    return await getOneAsync(sql, [username]);
  } catch (err) {
    logger.error(
      'UserModel',
      `Error fetching user ${username}: ${err.message}`,
      { error: err }
    );
    throw err;
  }
}

/**
 * Creates a new user.
 * @param {object} userData - User data (username, password).
 * @returns {Promise<object>} The created user object (without password).
 */
async function createUser(userData) {
  if (!userData || !userData.username || !userData.password) {
    throw new Error('Incomplete user data for registration');
  }

  const existingUser = await userExists(userData.username);
  if (existingUser) {
    throw new Error('Username already taken');
  }

  // Password validation (length, complexity) is now handled by Joi schema at the route level.

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

  const sql = `
    INSERT INTO users (username, hashedPassword, role)
    VALUES (?, ?, 'user')
  `;
  try {
    const result = await runAsync(sql, [userData.username, hashedPassword]);
    const newUser = {
      id: result.lastInsertRowid,
      username: userData.username,
      role: 'user',
    };
    auditLogger.logAction(
      newUser.id.toString(), // Or a system/guest ID if user not fully created
      'USER_REGISTER',
      'user',
      newUser.id.toString(),
      { username: newUser.username, ipAddress: userData.ipAddress || 'unknown' } // Assuming IP is passed in userData
    );
    return newUser;
  } catch (err) {
    logger.error('UserModel', `Error creating user: ${err.message}`, {
      error: err,
      username: userData.username,
    });
    throw err;
  }
}

/**
 * Updates the last login timestamp for a user.
 * @param {string} username - The username of the user.
 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
 */
async function updateUserLastLogin(username) {
  if (!username) {
    throw new Error('Username not provided for last login update');
  }
  const sql =
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?';
  try {
    const result = await runAsync(sql, [username]);
    return result.changes > 0;
  } catch (err) {
    logger.error(
      'UserModel',
      `Error updating last login for ${username}: ${err.message}`,
      { error: err }
    );
    throw err;
  }
}

/**
 * Authenticates a user.
 * @param {string} username - The username.
 * @param {string} password - The password.
 * @param {string} ipAddress - The IP address of the user.
 * @returns {Promise<object>} Object containing success status, message, token, and user info.
 */
async function authenticateUser(username, password, ipAddress) {
  // Added ipAddress parameter
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  try {
    const user = await getUserByUsername(username);

    if (!user) {
      auditLogger.logAction(
        username, // Use username as entityId since user object is null
        'USER_LOGIN_FAILURE',
        'user',
        username,
        {
          username,
          reason: 'User not found',
          ipAddress: ipAddress || 'unknown',
        }
      );
      return {
        success: false,
        message: 'Invalid credentials or user not found.',
      };
    }

    // Ensure user is not an admin trying to log in via user portal
    if (user.role === 'admin') {
      auditLogger.logAction(username, 'USER_LOGIN_FAILURE', 'user', username, {
        username,
        reason: 'Admin login attempt on user portal',
        ipAddress: ipAddress || 'unknown',
      });
      return {
        success: false,
        message: 'Admin login should use the admin portal.',
      };
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.hashedPassword
    );

    if (!isPasswordCorrect) {
      auditLogger.logAction(
        user.id.toString(),
        'USER_LOGIN_FAILURE',
        'user',
        user.id.toString(),
        {
          username: user.username,
          reason: 'Incorrect password',
          ipAddress: ipAddress || 'unknown',
        }
      );
      return { success: false, message: 'Invalid credentials.' };
    }

    await updateUserLastLogin(username);

    auditLogger.logAction(
      user.id.toString(),
      'USER_LOGIN_SUCCESS',
      'user',
      user.id.toString(),
      { username: user.username, ipAddress: ipAddress || 'unknown' } // Use ipAddress parameter
    );

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, // Include user ID in token
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION, jwtid: crypto.randomUUID() }
    );

    return {
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user.id, username: user.username, role: user.role },
    };
  } catch (err) {
    logger.error('UserModel', 'Error during user authentication:', {
      error: err,
      username,
    });
    // Do not throw generic error to client, specific messages handled above
    return {
      success: false,
      message: 'An error occurred during authentication.',
    };
  }
}

/**
 * Atualiza a senha de um usuário (identificado por ID) após validar a senha atual.
 * A complexidade da nova senha deve ser validada na camada de rota usando Joi.
 * @param {number} userId - O ID do usuário.
 * @param {string} currentPassword - A senha atual do usuário.
 * @param {string} newPassword - A nova senha a ser definida.
 * @param {string} ipAddress - O endereço IP do requisitante para auditoria.
 * @returns {Promise<object>} Objeto com status de sucesso e mensagem.
 */
async function updatePasswordById(userId, currentPassword, newPassword, ipAddress) {
  if (!userId) {
    // Este erro deve ser pego antes pela validação da rota ou verificação do req.user,
    // mas é uma salvaguarda.
    logger.error('UserModel', 'ID de usuário não fornecido para updatePasswordById.');
    return { success: false, message: 'ID de usuário não fornecido.' };
  }

  if (!currentPassword || !newPassword) {
    // Também deve ser pego pela validação da rota.
    logger.error('UserModel', `Senha atual ou nova não fornecida para usuário ID: ${userId}.`);
    return { success: false, message: 'Senha atual e nova senha são obrigatórias.' };
  }

  if (currentPassword === newPassword) {
    return {
      success: false,
      message: 'Nova senha não pode ser igual à senha atual.',
    };
  }

  try {
    // Obter o usuário para validar a senha atual e para auditoria
    // Selecionar username para o log de auditoria.
    const user = await getOneAsync('SELECT id, username, hashedPassword, role FROM users WHERE id = ?', [userId]);

    if (!user) {
      logger.warn('UserModel', `Tentativa de atualização de senha para usuário inexistente ID: ${userId}.`);
      return { success: false, message: 'Usuário não encontrado.' };
    }

    // Verificar se a senha atual está correta
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.hashedPassword
    );

    if (!isCurrentPasswordValid) {
      logger.warn('UserModel', `Tentativa de atualização de senha com senha atual inválida para usuário ID: ${userId}.`);
      return { success: false, message: 'Senha atual incorreta.' };
    }

    // Gerar hash da nova senha
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar a senha no banco de dados
    const result = await runAsync(
      'UPDATE users SET hashedPassword = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, userId]
    );

    if (result.changes === 0) {
      // Isso não deveria acontecer se o usuário foi encontrado e a senha atual estava correta.
      logger.error('UserModel', `Falha ao atualizar a senha no banco de dados para o usuário ID: ${userId}, nenhuma linha afetada.`);
      return { success: false, message: 'Erro ao atualizar a senha. Nenhuma alteração feita.' };
    }

    // Registrar a ação no log de auditoria
    // Usar o formato de log de auditoria consistente com outros logs de ação.
    auditLogger.logAction(
      user.id.toString(),
      user.role === 'admin' ? 'ADMIN_PASSWORD_CHANGE_BY_ID' : 'USER_PASSWORD_CHANGE_BY_ID',
      user.role, // entityType
      user.id.toString(), // entityId
      { username: user.username, changedByUserId: userId, ipAddress: ipAddress || 'unknown' }
    );

    logger.info('UserModel', `Senha atualizada com sucesso para o usuário ID: ${userId}.`);
    return { success: true, message: 'Senha alterada com sucesso.' };
  } catch (err) {
    logger.error(
      'UserModel',
      `Erro ao atualizar senha para o usuário ID: ${userId}: ${err.message}`,
      { error: err }
    );
    // Não relançar o erro diretamente para o cliente, mas retornar uma mensagem genérica.
    return { success: false, message: 'Ocorreu um erro ao tentar alterar a senha.' };
  }
}

module.exports = {
  userExists,
  getUserByUsername,
  createUser,
  updateUserLastLogin,
  authenticateUser,
  // changeUserPassword, // Removida
  updatePasswordById, // Nova função consolidada
};
