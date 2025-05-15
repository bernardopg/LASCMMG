const { db } = require('../lib/database'); // Acessa a instância db diretamente

/**
 * Otimiza o banco de dados SQLite executando o comando VACUUM.
 * Este comando reconstrói o banco de dados, desfragmentando-o e recuperando espaço não utilizado.
 * É recomendado executar este script periodicamente ou após grandes volumes de exclusões.
 *
 * IMPORTANTE: O comando VACUUM pode ser demorado em bancos de dados grandes e
 * pode bloquear outras conexões enquanto estiver em execução.
 * Execute durante períodos de baixa atividade.
 */
function optimizeDatabase() {
  console.log('Iniciando otimização do banco de dados (VACUUM)...');
  try {
    // O comando VACUUM não retorna um result set, então usamos exec diretamente.
    // better-sqlite3 executa o SQL imediatamente.
    db.exec('VACUUM;');
    console.log('Otimização do banco de dados concluída com sucesso.');
  } catch (err) {
    console.error('Erro ao otimizar o banco de dados:', err.message);
    // Considerar se deve relançar o erro ou tratar de outra forma
  }
}

// Executa a função de otimização
optimizeDatabase();

// Se você quiser fechar o banco de dados após a otimização (opcional,
// pois o script terminará e o processo Node.js fechará as conexões):
// db.close();
// console.log('Conexão com o banco de dados fechada.');

// Para executar este script: node scripts/optimize-database.js
