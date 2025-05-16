const { initializeDatabase } = require('./database'); // Importar initializeDatabase
const { runMigrations } = require('./schema');
const tournamentModel = require('../models/tournamentModel'); // tournamentModel é usado em testDatabaseConnection
const adminModel = require('../models/adminModel'); // Adicionar adminModel
const { logger } = require('../logger/logger'); // Importar logger para consistência

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
      'DBInit',
      'Iniciando processo de inicialização do banco de dados...'
    );

    // 1. Garantir que as tabelas básicas existam (CREATE TABLE IF NOT EXISTS)
    logger.info('DBInit', 'Verificando/Criando tabelas do banco de dados...');
    initializeDatabase(); // Esta função é síncrona e usa db.exec
    logger.info('DBInit', 'Criação/Verificação de tabelas concluída.');

    // 2. Aplicar migrações aditivas (ALTER TABLE ADD COLUMN)
    logger.info('DBInit', 'Aplicando migrações de esquema (ALTERs)...');
    // runMigrations é síncrona, mas a função applyDatabaseMigrations é async, então await não é necessário aqui
    // se runMigrations não retornar uma Promise. Se runMigrations pudesse ser async no futuro, await seria bom.
    // Por ora, assumindo que runMigrations é síncrona como initializeDatabase.
    runMigrations();
    logger.info('DBInit', 'Migrações de esquema (ALTERs) concluídas.');

    // 3. Após as migrações de esquema, tentar migrar/criar o admin a partir do JSON
    logger.info(
      'DBInit',
      'Verificando/migrando credenciais do administrador...'
    );
    const adminMigrationResult = await adminModel.migrateAdminCredentials();
    if (adminMigrationResult.success) {
      logger.info(
        'DBInit',
        `Resultado da migração do admin: ${adminMigrationResult.message}`
      );
    } else {
      logger.error(
        'DBInit',
        `Falha na migração do admin: ${adminMigrationResult.message}`
      );
      // Considerar se deve lançar um erro aqui para impedir o início do servidor
      // se a criação do admin for crítica. Por ora, apenas loga.
    }

    logger.info(
      'DBInit',
      'Inicialização do banco de dados concluída com sucesso!'
    );
  } catch (err) {
    logger.error(
      'DBInit',
      'Erro durante a inicialização completa do banco de dados:',
      { error: err }
    );
    throw err;
  }
}

async function testDatabaseConnection() {
  try {
    logger.info('DBInit', 'Testando conexão com o banco de dados...');
    const tournamentsCount = await tournamentModel.countTournaments();
    logger.info('DBInit', `Total de torneios no banco: ${tournamentsCount}`);
    logger.info('DBInit', 'Conexão com o banco de dados testada com sucesso!');
    return true;
  } catch (err) {
    logger.error('DBInit', 'Erro ao testar conexão com o banco de dados:', {
      error: err,
    });
    return false;
  }
}

module.exports = {
  applyDatabaseMigrations,
  testDatabaseConnection,
  // migrateDataFromJson removido, pois foi descontinuado
  // models removido, pois não é utilizado externamente
};
