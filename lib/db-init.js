const path = require('path');
const fs = require('fs');
const { runMigrations } = require('./schema');
const tournamentModel = require('./models/tournamentModel'); // tournamentModel é usado em testDatabaseConnection

async function applyDatabaseMigrations() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    console.log(`Criando diretório de dados em ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    console.log('Iniciando processo de inicialização do banco de dados...');
    await runMigrations();
    console.log('Inicialização do banco de dados concluída com sucesso!');
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
    throw err;
  }
}

async function testDatabaseConnection() {
  try {
    console.log('Testando conexão com o banco de dados...');
    const tournamentsCount = await tournamentModel.countTournaments();
    console.log(`Total de torneios no banco: ${tournamentsCount}`);
    console.log('Conexão com o banco de dados testada com sucesso!');
    return true;
  } catch (err) {
    console.error('Erro ao testar conexão com o banco de dados:', err);
    return false;
  }
}

module.exports = {
  applyDatabaseMigrations,
  testDatabaseConnection,
  // migrateDataFromJson removido, pois foi descontinuado
  // models removido, pois não é utilizado externamente
};
