const { getSyncConnection, closeSyncConnection } = require('../lib/db');

function clearAllTournamentData() {
  console.log(
    'Iniciando a remoção de todos os dados de torneios, jogadores, partidas e placares...'
  );
  const db = getSyncConnection();

  try {
    // Devido ao ON DELETE CASCADE, deletar de tournaments deve limpar as tabelas relacionadas:
    // players, matches (e por sua vez scores), tournament_state, trash.

    // Para garantir a ordem correta e evitar possíveis problemas com a ordem de cascata
    // ou se alguma FK não tiver ON DELETE CASCADE, vamos deletar explicitamente
    // das tabelas dependentes primeiro, na ordem inversa da dependência.

    console.log('Removendo todos os scores...');
    db.prepare('DELETE FROM scores').run();

    console.log('Removendo todas as partidas...');
    db.prepare('DELETE FROM matches').run();

    console.log('Removendo todos os jogadores...');
    db.prepare('DELETE FROM players').run();

    console.log('Removendo todos os estados de torneio...');
    db.prepare('DELETE FROM tournament_state').run();

    console.log('Removendo todos os torneios da lixeira...');
    db.prepare('DELETE FROM trash').run();

    console.log('Removendo todos os torneios...');
    const info = db.prepare('DELETE FROM tournaments').run();

    console.log(
      `\nOperação concluída. ${info.changes} torneios e todos os dados associados foram removidos.`
    );
    console.log('O banco de dados agora está limpo de dados de torneios.');

    // Opcional: Rodar VACUUM para reduzir o tamanho do arquivo do banco de dados
    // console.log('Executando VACUUM para otimizar o arquivo do banco de dados...');
    // db.exec('VACUUM;');
    // console.log('VACUUM concluído.');
  } catch (error) {
    console.error('Erro ao limpar os dados do torneio:', error.message);
    throw error;
  } finally {
    // A conexão singleton não deve ser fechada aqui, pois pode ser usada por outros processos.
    // closeSyncConnection();
    // Se este script for executado como um processo único, fechar a conexão seria apropriado.
    // Mas como getSyncConnection é um singleton, é melhor deixar o app principal gerenciá-la.
  }
}

if (require.main === module) {
  // Permite que o script seja executado diretamente do CLI
  try {
    clearAllTournamentData();
    // Se for um script CLI único, podemos fechar a conexão aqui.
    // Mas se for chamado por outro módulo que ainda usa o DB, não.
    // Para um script de limpeza, é seguro fechar.
    closeSyncConnection();
  } catch (e) {
    console.error('Falha ao executar o script de limpeza:', e);
    process.exit(1);
  }
}

module.exports = { clearAllTournamentData };
