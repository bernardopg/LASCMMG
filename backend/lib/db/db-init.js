const { initializeDatabase } = require('./database'); // Importar initializeDatabase
const { runMigrations } = require('./schema');
const tournamentModel = require('../models/tournamentModel'); // tournamentModel é usado em testDatabaseConnection
const adminModel = require('../models/adminModel'); // Adicionar adminModel
const { logger } = require('../logger/logger'); // Importar logger para consistência
const auditLogger = require('../logger/auditLogger'); // Import auditLogger

async function applyDatabaseMigrations() {
  // A criação do diretório de dados agora é tratada em database.js
  // usando DB_CONFIG.dataDir, que é o local correto onde o arquivo do banco de dados será criado.
  // const dataDir = path.join(__dirname, '..', 'data'); // Removido
  // if (!fs.existsSync(dataDir)) { // Removido
  //   console.log(`Criando diretório de dados em ${dataDir}`); // Removido
  //   fs.mkdirSync(dataDir, { recursive: true }); // Removido
  // } // Removido

  try {
    logger.info(
      { component: 'DBInit' },
      'Iniciando processo de inicialização do banco de dados...'
    );

    // 1. Garantir que as tabelas básicas existam (CREATE TABLE IF NOT EXISTS)
    logger.info({ component: 'DBInit' }, 'Verificando/Criando tabelas do banco de dados...');
    initializeDatabase(); // Esta função é síncrona e usa db.exec
    logger.info({ component: 'DBInit' }, 'Criação/Verificação de tabelas concluída.');

    // 2. Aplicar migrações aditivas (ALTER TABLE ADD COLUMN)
    logger.info({ component: 'DBInit' }, 'Aplicando migrações de esquema (ALTERs)...');
    // runMigrations é síncrona, mas a função applyDatabaseMigrations é async, então await não é necessário aqui
    // se runMigrations não retornar uma Promise. Se runMigrations pudesse ser async no futuro, await seria bom.
    // Por ora, assumindo que runMigrations é síncrona como initializeDatabase.
    runMigrations();
    logger.info({ component: 'DBInit' }, 'Migrações de esquema (ALTERs) concluídas.');

    // 3. Após as migrações de esquema, tentar migrar/criar o admin a partir do JSON
    logger.info({ component: 'DBInit' }, 'Verificando/migrando credenciais do administrador...');
    const adminMigrationResult = await adminModel.migrateAdminCredentials();
    if (adminMigrationResult.success) {
      logger.info(
        { component: 'DBInit', status: 'admin_migration_success' },
        `Resultado da migração do admin: ${adminMigrationResult.message}`
      );
    } else {
      logger.error(
        { component: 'DBInit', status: 'admin_migration_failure' },
        `Falha na migração do admin: ${adminMigrationResult.message}`
      );
      // Considerar se deve lançar um erro aqui para impedir o início do servidor
      // se a criação do admin for crítica. Por ora, apenas loga.
    }

    // 4. Initialize Audit Logger
    logger.info({ component: 'DBInit' }, 'Inicializando sistema de auditoria...');
    await auditLogger.initialize(); // Initialize audit logger
    logger.info({ component: 'DBInit' }, 'Sistema de auditoria inicializado.');

    logger.info({ component: 'DBInit' }, 'Inicialização do banco de dados concluída com sucesso!');
  } catch (err) {
    logger.error(
      { component: 'DBInit', err },
      'Erro durante a inicialização completa do banco de dados.'
    );
    throw err;
  }
}

async function testDatabaseConnection() {
  try {
    logger.info({ component: 'DBInit' }, 'Testando conexão com o banco de dados...');
    const tournamentsCount = await tournamentModel.countTournaments();
    logger.info(
      { component: 'DBInit', tournamentsCount },
      `Total de torneios no banco: ${tournamentsCount}`
    );
    logger.info({ component: 'DBInit' }, 'Conexão com o banco de dados testada com sucesso!');
    return true;
  } catch (err) {
    logger.error({ component: 'DBInit', err }, 'Erro ao testar conexão com o banco de dados.');
    return false;
  }
}

module.exports = {
  applyDatabaseMigrations,
  testDatabaseConnection,
  // migrateDataFromJson removido, pois foi descontinuado
  // models removido, pois não é utilizado externamente
};
