#!/usr/bin/env node

/**
 * Script CLI para Gerenciamento de Backup
 * Permite executar operações de backup e restore via linha de comando
 *
 * Uso:
 * node scripts/backup-manager.js create [--type manual]
 * node scripts/backup-manager.js list
 * node scripts/backup-manager.js restore <backup-filename> [--force]
 * node scripts/backup-manager.js test
 * node scripts/backup-manager.js status
 * node scripts/backup-manager.js cleanup
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const backupManager = require('../backend/lib/backup/backupManager');
const { logger } = require('../backend/lib/logger/logger');

class BackupCLI {
  constructor() {
    this.commands = {
      create: this.createBackup.bind(this),
      list: this.listBackups.bind(this),
      restore: this.restoreBackup.bind(this),
      test: this.testBackup.bind(this),
      status: this.getStatus.bind(this),
      cleanup: this.cleanupBackups.bind(this),
      help: this.showHelp.bind(this)
    };
  }

  async run() {
    try {
      const args = process.argv.slice(2);
      const command = args[0] || 'help';

      if (!this.commands[command]) {
        console.error(`❌ Comando desconhecido: ${command}`);
        this.showHelp();
        process.exit(1);
      }

      // Inicializar sistema de backup
      await backupManager.initialize();

      // Executar comando
      await this.commands[command](args.slice(1));

    } catch (err) {
      console.error('❌ Erro:', err.message);
      logger.error({ err }, 'Erro no script de backup');
      process.exit(1);
    }
  }

  async createBackup(args) {
    const typeIndex = args.indexOf('--type');
    const type = typeIndex !== -1 && args[typeIndex + 1] ? args[typeIndex + 1] : 'manual';

    console.log('🔄 Criando backup...');
    const startTime = Date.now();

    const backup = await backupManager.createBackup(type);
    const duration = Date.now() - startTime;

    console.log('✅ Backup criado com sucesso!');
    console.log(`📁 Arquivo: ${backup.fileName}`);
    console.log(`📊 Tamanho: ${backup.sizeFormatted}`);
    console.log(`⏱️  Duração: ${duration}ms`);
    console.log(`🗜️  Comprimido: ${backup.compressed ? 'Sim' : 'Não'}`);
    console.log(`📍 Localização: ${backup.path}`);
  }

  async listBackups(args) {
    console.log('📋 Listando backups disponíveis...\n');

    const backups = await backupManager.listBackups();

    if (backups.length === 0) {
      console.log('⚠️  Nenhum backup encontrado.');
      return;
    }

    console.log('┌─────────────────────────────────────────┬──────────┬─────────────────────┐');
    console.log('│ Nome do Arquivo                         │ Tamanho  │ Data de Criação     │');
    console.log('├─────────────────────────────────────────┼──────────┼─────────────────────┤');

    backups.forEach(backup => {
      const name = backup.fileName.padEnd(39);
      const size = backup.sizeFormatted.padEnd(8);
      const date = new Date(backup.created).toLocaleString('pt-BR').padEnd(19);
      console.log(`│ ${name} │ ${size} │ ${date} │`);
    });

    console.log('└─────────────────────────────────────────┴──────────┴─────────────────────┘');
    console.log(`\n📊 Total: ${backups.length} backup(s)`);
  }

  async restoreBackup(args) {
    if (!args[0]) {
      console.error('❌ Nome do arquivo de backup é obrigatório.');
      console.log('💡 Uso: node scripts/backup-manager.js restore <backup-filename> [--force]');
      process.exit(1);
    }

    const backupFileName = args[0];
    const force = args.includes('--force');

    if (!force) {
      console.log('⚠️  AVISO: Esta operação irá substituir o banco de dados atual!');
      console.log('🔄 Um backup do estado atual será criado antes da restauração.');
      console.log('💡 Use --force para pular esta confirmação em ambientes de desenvolvimento.');

      // Em produção, seria necessário confirmar via input do usuário
      if (process.env.NODE_ENV === 'production') {
        console.log('❌ Restauração em produção requer confirmação manual.');
        console.log('💡 Implemente confirmação de usuário para ambiente de produção.');
        process.exit(1);
      }
    }

    console.log('🔄 Iniciando restauração...');
    const startTime = Date.now();

    const restoreInfo = await backupManager.restoreFromBackup(backupFileName, {
      force: true,
      verify: true
    });

    const duration = Date.now() - startTime;

    console.log('✅ Restauração concluída com sucesso!');
    console.log(`📁 Backup restaurado: ${restoreInfo.backupFileName}`);
    console.log(`🔄 Backup pré-restauração: ${restoreInfo.preRestoreBackup}`);
    console.log(`⏱️  Duração: ${duration}ms`);
    console.log(`✅ Verificação: ${restoreInfo.verified ? 'Aprovada' : 'Ignorada'}`);
  }

  async testBackup(args) {
    console.log('🧪 Iniciando teste do sistema de backup...\n');

    const testResult = await backupManager.testBackupRestore();

    if (testResult.testPassed) {
      console.log('✅ Teste de backup passou com sucesso!');
      console.log(`📁 Backup de teste: ${testResult.backupFile}`);
      console.log(`📊 Tamanho: ${testResult.backupSize}`);
      console.log(`🔍 Verificação de integridade: ${testResult.integrityCheck ? 'OK' : 'Falhou'}`);
      console.log(`📋 Total de backups: ${testResult.backupCount}`);
    } else {
      console.log('❌ Teste de backup falhou!');
      console.log(`🚨 Erro: ${testResult.error}`);
      process.exit(1);
    }
  }

  async getStatus(args) {
    console.log('📊 Status do Sistema de Backup\n');

    const status = backupManager.getStatus();
    const backups = await backupManager.listBackups();

    console.log(`🔧 Inicializado: ${status.initialized ? '✅ Sim' : '❌ Não'}`);
    console.log(`📂 Diretório: ${status.backupDir}`);
    console.log(`🗄️  Banco de dados: ${status.dbPath}`);
    console.log(`📈 Máximo de backups: ${status.maxBackups}`);
    console.log(`🗜️  Compressão: ${status.compressionEnabled ? '✅ Habilitada' : '❌ Desabilitada'}`);
    console.log(`📋 Backups existentes: ${backups.length}`);

    if (backups.length > 0) {
      const latestBackup = backups[0];
      const age = Math.round((Date.now() - new Date(latestBackup.created)) / (60 * 60 * 1000));
      console.log(`⏰ Último backup: ${age} hora(s) atrás`);
      console.log(`📁 Arquivo mais recente: ${latestBackup.fileName}`);
    }
  }

  async cleanupBackups(args) {
    console.log('🧹 Limpando backups antigos...');

    const backupsBefore = await backupManager.listBackups();
    await backupManager.cleanupOldBackups();
    const backupsAfter = await backupManager.listBackups();

    const removed = backupsBefore.length - backupsAfter.length;

    if (removed > 0) {
      console.log(`✅ ${removed} backup(s) antigo(s) removido(s).`);
    } else {
      console.log('ℹ️  Nenhum backup antigo para remover.');
    }

    console.log(`📋 Backups restantes: ${backupsAfter.length}`);
  }

  showHelp() {
    console.log(`
🛠️  LASCMMG Backup Manager

📋 Comandos disponíveis:

  create [--type <tipo>]           Criar novo backup
                                   Tipos: manual, scheduled, test

  list                            Listar todos os backups disponíveis

  restore <arquivo> [--force]     Restaurar banco a partir de backup
                                   --force: pula confirmação

  test                            Testar sistema de backup

  status                          Mostrar status do sistema

  cleanup                         Remover backups antigos

  help                            Mostrar esta ajuda

📝 Exemplos:

  node scripts/backup-manager.js create
  node scripts/backup-manager.js create --type manual
  node scripts/backup-manager.js list
  node scripts/backup-manager.js restore lascmmg_backup_2025-05-23_08-30-00.db.gz
  node scripts/backup-manager.js restore backup.db.gz --force
  node scripts/backup-manager.js test
  node scripts/backup-manager.js status

⚠️  IMPORTANTE:
  - Sempre teste restaurações em ambiente de desenvolvimento
  - Backups são criados automaticamente às 2:00 AM
  - Máximo de 30 backups são mantidos (configurável)
  - Use --force com cuidado em produção
`);
  }
}

// Executar CLI se chamado diretamente
if (require.main === module) {
  const cli = new BackupCLI();
  cli.run().catch(err => {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
  });
}

module.exports = BackupCLI;
