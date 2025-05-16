const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { DB_CONFIG } = require('../lib/config');

// Configurações do backup
const BACKUP_CONFIG = {
  // Diretório onde os backups serão armazenados
  backupDir: path.join(__dirname, '..', 'backups'),

  // Número máximo de backups a manter (rotação)
  maxBackups: 10,

  // Extensões dos arquivos a serem incluídos no backup
  fileExtensions: ['.sqlite', '.sqlite-journal', '.sqlite-shm', '.sqlite-wal'],

  // Nome base do arquivo de backup (será acrescentado timestamp)
  backupBaseName: 'lascmmg-backup',
};

/**
 * Cria o diretório de backups se não existir
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
    fs.mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true });
  }
}

/**
 * Gera um timestamp formatado para o nome do arquivo
 * @returns {string} Timestamp no formato YYYY-MM-DD_HH-MM-SS
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Cria um backup do banco de dados
 * @returns {string|null} Caminho do arquivo de backup criado ou null se falhou
 */
function createBackup() {
  try {
    // Verificar se o arquivo de banco de dados existe
    const dbPath = path.join(DB_CONFIG.dataDir, DB_CONFIG.dbFile);

    if (!fs.existsSync(dbPath)) {
      console.error(`Arquivo de banco de dados não encontrado: ${dbPath}`);
      return null;
    }

    // Gerar nome do arquivo de backup com timestamp
    const timestamp = getTimestamp();
    const backupFileName = `${BACKUP_CONFIG.backupBaseName}_${timestamp}.tar.gz`;
    const backupPath = path.join(BACKUP_CONFIG.backupDir, backupFileName);

    // Criar lista de arquivos para backup
    const filesToBackup = [];
    const dbDir = path.dirname(dbPath);
    const dbName = path.basename(dbPath, path.extname(dbPath));

    BACKUP_CONFIG.fileExtensions.forEach((ext) => {
      const fileName = `${dbName}${ext}`;
      const filePath = path.join(dbDir, fileName);

      if (fs.existsSync(filePath)) {
        filesToBackup.push(filePath);
      }
    });

    if (filesToBackup.length === 0) {
      console.error('Nenhum arquivo de banco de dados encontrado para backup');
      return null;
    }

    // Criar o arquivo de backup usando tar

    // Em sistemas Unix/Linux/Mac:
    const tarCommand = `tar -czf "${backupPath}" ${filesToBackup.map((f) => `"${f}"`).join(' ')}`;

    // Em sistemas Windows, seria diferente (poderia usar módulos como archiver)
    // mas estou assumindo ambiente Unix-like para este exemplo

    execSync(tarCommand);

    console.log(`Backup concluído com sucesso: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Erro ao criar backup:', error.message);
    return null;
  }
}

/**
 * Mantém apenas os N backups mais recentes, removendo os mais antigos
 */
function rotateBackups() {
  try {
    const backupFiles = fs
      .readdirSync(BACKUP_CONFIG.backupDir)
      .filter(
        (file) =>
          file.startsWith(BACKUP_CONFIG.backupBaseName) &&
          file.endsWith('.tar.gz')
      )
      .map((file) => ({
        name: file,
        path: path.join(BACKUP_CONFIG.backupDir, file),
        time: fs
          .statSync(path.join(BACKUP_CONFIG.backupDir, file))
          .mtime.getTime(),
      }))
      // Ordenar do mais recente para o mais antigo
      .sort((a, b) => b.time - a.time);

    // Se temos mais backups do que o máximo configurado, remover os mais antigos
    if (backupFiles.length > BACKUP_CONFIG.maxBackups) {
      const filesToRemove = backupFiles.slice(BACKUP_CONFIG.maxBackups);

      filesToRemove.forEach((file) => {
        fs.unlinkSync(file.path);
      });
    }
  } catch (error) {
    console.error('Erro ao rotacionar backups antigos:', error.message);
  }
}

/**
 * Função principal do script
 */
function runBackup() {
  try {
    // Garantir que o diretório de backups existe
    ensureBackupDir();

    // Criar o backup
    const backupPath = createBackup();

    if (backupPath) {
      // Remover backups antigos se necessário
      rotateBackups();
    } else {
      console.error('\n❌ Falha ao criar backup');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erro durante o processo de backup:', error.message);
    process.exit(1);
  }
}

// Executar o backup
runBackup();

// Para uso programático
module.exports = {
  runBackup,
  createBackup,
  rotateBackups,
  getTimestamp,
  ensureBackupDir,
};
