const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { runAsync, getOneAsync } = require('../database'); // Corrigido para database
const { JWT_SECRET, JWT_EXPIRATION } = require('../config');

const CREDENTIALS_FILE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'admin_credentials.json'
);

async function adminExists(username) {
  if (!username) {
    throw new Error('Nome de usuário não fornecido');
  }

  const sql = "SELECT 1 FROM users WHERE username = ? AND role = 'admin'";

  try {
    const result = await getOneAsync(sql, [username]);
    return !!result;
  } catch (err) {
    console.error(
      `Erro ao verificar existência do admin ${username}:`,
      err.message
    );
    throw err;
  }
}

async function getAdminByUsername(username) {
  if (!username) {
    throw new Error('Nome de usuário não fornecido');
  }

  const sql =
    'SELECT id, username, hashedPassword, role FROM users WHERE username = ?'; // Selecionar hashedPassword e role

  try {
    return await getOneAsync(sql, [username]);
  } catch (err) {
    console.error(`Erro ao buscar admin ${username}:`, err.message);
    throw err;
  }
}

async function createAdmin(admin) {
  if (!admin || !admin.username || !admin.password) {
    throw new Error('Dados do administrador incompletos');
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(admin.password, saltRounds);

  const sql = `
    INSERT INTO users (username, hashedPassword, role)
    VALUES (?, ?, 'admin')
  `; // Adicionado role, created_at tem default

  try {
    const result = await runAsync(sql, [admin.username, hashedPassword]);

    return {
      id: result.lastID,
      username: admin.username,
      role: 'admin',
      // created_at será definido pelo DB
    };
  } catch (err) {
    console.error('Erro ao criar administrador:', err.message);
    throw err;
  }
}

async function updateLastLogin(username) {
  if (!username) {
    throw new Error('Nome de usuário não fornecido');
  }

  const sql =
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?';

  try {
    const result = await runAsync(sql, [username]);
    return result.changes > 0;
  } catch (err) {
    console.error(
      `Erro ao atualizar último login de ${username}:`,
      err.message
    );
    throw err;
  }
}

async function migrateAdminCredentials() {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE_PATH)) {
      console.warn('Arquivo de credenciais não encontrado para migração.');
      return {
        success: true,
        message: 'Arquivo de credenciais não encontrado, nada a migrar.',
      };
    }
    const fileCredentials = JSON.parse(
      fs.readFileSync(CREDENTIALS_FILE_PATH, 'utf8')
    );
    if (!fileCredentials || !fileCredentials.username) {
      console.warn('Arquivo de credenciais inválido para migração.');
      return { success: false, message: 'Arquivo de credenciais inválido.' };
    }

    const checkUserSql =
      'SELECT COUNT(*) as count FROM users WHERE username = ?';
    const result = await getOneAsync(checkUserSql, [fileCredentials.username]);

    if (result && result.count > 0) {
      console.log(
        'Administradores já existem no banco de dados, pulando migração.'
      );
      return { success: true, message: 'Administradores já existem no banco.' };
    }

    if (!fileCredentials.hashedPassword) {
      console.warn('Formato de credenciais inválido (hashedPassword ausente).');
      return { success: false, message: 'Formato de credenciais inválido.' };
    }

    const insertSql = `
      INSERT INTO users (username, hashedPassword, role)
      VALUES (?, ?, 'admin')
    `; // Adicionado role, created_at tem default

    await runAsync(insertSql, [
      fileCredentials.username,
      fileCredentials.hashedPassword,
    ]);

    console.log(
      `Administrador ${fileCredentials.username} migrado com sucesso para o banco de dados.`
    );
    return {
      success: true,
      message: 'Credenciais migradas com sucesso.',
      username: fileCredentials.username,
    };
  } catch (err) {
    console.error('Erro ao migrar credenciais:', err.message);
    return { success: false, message: `Erro: ${err.message}` };
  }
}

async function authenticateAdmin(username, password) {
  if (!username || !password) {
    throw new Error('Nome de usuário e senha são obrigatórios');
  }

  try {
    const admin = await getAdminByUsername(username);

    if (!admin) {
      if (!fs.existsSync(CREDENTIALS_FILE_PATH)) {
        throw new Error('Credenciais não encontradas');
      }

      const credentials = JSON.parse(
        fs.readFileSync(CREDENTIALS_FILE_PATH, 'utf8')
      );

      if (
        !credentials ||
        !credentials.username ||
        !credentials.hashedPassword
      ) {
        throw new Error('Arquivo de credenciais inválido');
      }

      if (username !== credentials.username) {
        return { success: false, message: 'Credenciais inválidas' };
      }

      const isPasswordCorrect = await bcrypt.compare(
        password,
        credentials.hashedPassword
      );

      if (!isPasswordCorrect) {
        return { success: false, message: 'Credenciais inválidas' };
      }

      const migrationResult = await migrateAdminCredentials();

      if (!migrationResult.success) {
        console.error(
          'Falha ao migrar credenciais do admin durante o login:',
          migrationResult.message
        );
        throw new Error(
          'Falha ao atualizar o sistema de credenciais. Por favor, contate o suporte.'
        );
      }

      const token = jwt.sign(
        { username: credentials.username, role: 'admin' },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRATION,
        }
      );

      return {
        success: true,
        message: 'Login bem-sucedido!',
        token,
        admin: { username: credentials.username },
      };
    } else {
      const isPasswordCorrect = await bcrypt.compare(
        password,
        admin.hashedPassword // Alterado para hashedPassword
      );

      if (!isPasswordCorrect) {
        return { success: false, message: 'Credenciais inválidas' };
      }

      await updateLastLogin(username);

      const token = jwt.sign(
        { username: admin.username, role: 'admin' },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRATION,
        }
      );

      return {
        success: true,
        message: 'Login bem-sucedido!',
        token,
        admin: { username: admin.username },
      };
    }
  } catch (err) {
    console.error('Erro durante autenticação:', err.message);
    throw err;
  }
}

async function changePassword(username, currentPassword, newPassword) {
  if (!username || !currentPassword || !newPassword) {
    throw new Error('Dados incompletos para alteração de senha');
  }

  try {
    const authResult = await authenticateAdmin(username, currentPassword);

    if (!authResult.success) {
      return { success: false, message: 'Senha atual incorreta' };
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const sql = 'UPDATE users SET hashedPassword = ? WHERE username = ?';
    await runAsync(sql, [hashedPassword, username]);

    return { success: true, message: 'Senha alterada com sucesso' };
  } catch (err) {
    console.error('Erro ao alterar senha:', err.message);
    throw err;
  }
}

module.exports = {
  adminExists,
  getAdminByUsername,
  createAdmin,
  updateLastLogin,
  migrateAdminCredentials,
  authenticateAdmin,
  changePassword,
};
