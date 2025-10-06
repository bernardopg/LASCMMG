const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Note: Using console.log in setup scripts is acceptable as they're one-time utilities
// For production code, use the Pino logger instead

function simpleSetupDatabase() {
  try {
    console.log('🗄️ Configurando banco de dados (versão simples)...');

    const dbPath = process.env.DB_PATH || './monitoring.db';

    // Criar diretório se não existir
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new Database(dbPath);

    // Criar tabelas básicas
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        status TEXT DEFAULT 'upcoming',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Verificar tabelas
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('✅ Banco de dados configurado');
    console.log(`📍 Localização: ${path.resolve(dbPath)}`);
    console.log(`📊 Tabelas: ${tables.map((t) => t.name).join(', ')}`);

    db.close();
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

// Se executado diretamente, fazer setup simples
if (require.main === module) {
  const success = simpleSetupDatabase();
  process.exit(success ? 0 : 1);
}

module.exports = { simpleSetupDatabase };
