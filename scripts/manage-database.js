const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { DB_CONFIG } = require('../backend/lib/config/config'); // Adjust path if necessary

const DB_PATH = path.join(__dirname, '..', DB_CONFIG.dataDir, DB_CONFIG.dbFile);
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

function ensureBackupDirExists() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`Diretório de backup criado: ${BACKUP_DIR}`);
  }
}

function backupDatabase() {
  ensureBackupDirExists();
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Erro: Arquivo do banco de dados não encontrado em ${DB_PATH}`);
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${DB_CONFIG.dbFile}-${timestamp}.sqlite`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  try {
    const db = new Database(DB_PATH, { readonly: true });
    db.backup(backupFilePath)
      .then(() => {
        console.log(`Backup do banco de dados concluído com sucesso: ${backupFilePath}`);
      })
      .catch((err) => {
        console.error('Erro ao fazer backup do banco de dados:', err);
      })
      .finally(() => {
        db.close();
      });
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados para backup:', err);
  }
}

function vacuumDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Erro: Arquivo do banco de dados não encontrado em ${DB_PATH}`);
    process.exit(1);
  }

  try {
    const db = new Database(DB_PATH);
    console.log('Iniciando VACUUM no banco de dados...');
    db.exec('VACUUM;');
    console.log('VACUUM concluído com sucesso.');
    db.close();
  } catch (err) {
    console.error('Erro ao executar VACUUM no banco de dados:', err);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Uso: node scripts/manage-database.js <comando>');
    console.log('Comandos disponíveis:');
    console.log('  backup    - Cria um backup do banco de dados');
    console.log('  vacuum    - Otimiza o arquivo do banco de dados');
    process.exit(1);
  }

  const command = args[0];
  switch (command) {
    case 'backup':
      backupDatabase();
      break;
    case 'vacuum':
      vacuumDatabase();
      break;
    default:
      console.error(`Comando desconhecido: ${command}`);
      process.exit(1);
  }
}

main();
