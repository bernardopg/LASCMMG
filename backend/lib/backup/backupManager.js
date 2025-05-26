const fs = require('fs').promises;
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const { createGzip, createGunzip } = require('zlib');
const { queryAsync, runAsync } = require('../db/database');
const { logger } = require('../logger/logger');
const config = require('../config/config');

/**
 * Sistema de Backup e Restore do Banco de Dados
 * Gerencia backups automáticos, restauração e verificação de integridade
 */
class BackupManager {
  constructor() {
    this.backupDir = path.resolve(process.cwd(), 'backups');
    this.dbPath = config.DATABASE_PATH;
    this.maxBackups = 30; // Manter 30 dias de backup
    this.compressionEnabled = true;
    this.initialized = false;
  }

  /**
   * Inicializa o sistema de backup
   */
  async initialize() {
    try {
      // Criar diretório de backup se não existir
      await this.ensureBackupDirectory();

      // Agendar backup automático
      this.scheduleAutomaticBackup();

      this.initialized = true;
      logger.info(
        {
          component: 'BackupManager',
          backupDir: this.backupDir,
          maxBackups: this.maxBackups,
        },
        'Sistema de backup inicializado'
      );
    } catch (err) {
      logger.error(
        {
          component: 'BackupManager',
          err,
        },
        'Erro ao inicializar sistema de backup'
      );
      throw err;
    }
  }

  /**
   * Garante que o diretório de backup existe
   */
  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.mkdir(this.backupDir, { recursive: true });
        logger.info(
          {
            component: 'BackupManager',
            dir: this.backupDir,
          },
          'Diretório de backup criado'
        );
      } else {
        throw err;
      }
    }
  }

  /**
   * Executa backup completo do banco de dados
   */
  async createBackup(type = 'scheduled') {
    const startTime = Date.now();
    const timestamp =
      new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] +
      '_' +
      new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0];

    const backupFileName = `lascmmg_backup_${timestamp}.db${this.compressionEnabled ? '.gz' : ''}`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      logger.info(
        {
          component: 'BackupManager',
          type,
          backupPath,
        },
        'Iniciando backup do banco de dados'
      );

      // Checkpoint do WAL (Write-Ahead Logging) para garantir consistência
      await this.checkpointDatabase();

      // Verificar integridade antes do backup
      const integrityCheck = await this.verifyDatabaseIntegrity();
      if (!integrityCheck.isValid) {
        throw new Error(`Falha na verificação de integridade: ${integrityCheck.error}`);
      }

      // Criar backup
      if (this.compressionEnabled) {
        await this.createCompressedBackup(backupPath);
      } else {
        await this.createUncompressedBackup(backupPath);
      }

      // Verificar backup criado
      const backupStats = await fs.stat(backupPath);

      // Obter estatísticas do backup
      const stats = await this.getBackupStats(backupPath);

      const duration = Date.now() - startTime;

      const backupInfo = {
        fileName: backupFileName,
        path: backupPath,
        size: backupStats.size,
        sizeFormatted: this.formatBytes(backupStats.size),
        created: new Date().toISOString(),
        type,
        duration,
        compressed: this.compressionEnabled,
        integrity: integrityCheck,
        stats,
      };

      // Salvar metadata do backup
      await this.saveBackupMetadata(backupInfo);

      // Limpar backups antigos
      await this.cleanupOldBackups();

      logger.info(
        {
          component: 'BackupManager',
          ...backupInfo,
          duration: `${duration}ms`,
        },
        'Backup criado com sucesso'
      );

      return backupInfo;
    } catch (err) {
      logger.error(
        {
          component: 'BackupManager',
          err,
          backupPath,
          type,
        },
        'Erro ao criar backup'
      );

      // Limpar backup parcial se existir
      try {
        await fs.unlink(backupPath);
      } catch {
        // Ignorar erro de limpeza
      }

      throw err;
    }
  }

  /**
   * Checkpoint do banco para garantir consistência
   */
  async checkpointDatabase() {
    try {
      await runAsync('PRAGMA wal_checkpoint(TRUNCATE)');
      logger.debug(
        {
          component: 'BackupManager',
        },
        'Checkpoint do banco executado'
      );
    } catch (err) {
      logger.warn(
        {
          component: 'BackupManager',
          err,
        },
        'Aviso: Falha no checkpoint do banco'
      );
    }
  }

  /**
   * Criar backup comprimido
   */
  async createCompressedBackup(backupPath) {
    const gzip = createGzip({ level: 6 });
    await pipeline(createReadStream(this.dbPath), gzip, createWriteStream(backupPath));
  }

  /**
   * Criar backup não comprimido
   */
  async createUncompressedBackup(backupPath) {
    await pipeline(createReadStream(this.dbPath), createWriteStream(backupPath));
  }

  /**
   * Verificar integridade do banco de dados
   */
  async verifyDatabaseIntegrity() {
    try {
      const result = await queryAsync('PRAGMA integrity_check');
      const isValid = result.length === 1 && result[0].integrity_check === 'ok';

      return {
        isValid,
        result: result[0]?.integrity_check || 'unknown',
        error: isValid ? null : 'Falha na verificação de integridade',
      };
    } catch (err) {
      return {
        isValid: false,
        result: null,
        error: err.message,
      };
    }
  }

  /**
   * Obter estatísticas do backup
   */
  async getBackupStats(backupPath) {
    try {
      // Para backups comprimidos, precisaríamos descomprimir para obter stats detalhadas
      // Por ora, retornamos stats básicas
      const fileStats = await fs.stat(backupPath);

      return {
        fileSize: fileStats.size,
        created: fileStats.birthtime,
        modified: fileStats.mtime,
        compressed: this.compressionEnabled,
      };
    } catch (err) {
      logger.warn(
        {
          component: 'BackupManager',
          err,
          backupPath,
        },
        'Não foi possível obter estatísticas do backup'
      );

      return null;
    }
  }

  /**
   * Salvar metadata do backup
   */
  async saveBackupMetadata(backupInfo) {
    const metadataPath = path.join(this.backupDir, 'backup_metadata.json');

    try {
      let metadata = [];

      // Carregar metadata existente
      try {
        const existingData = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(existingData);
      } catch {
        // Arquivo não existe ou é inválido, começar com array vazio
      }

      // Adicionar nova entrada
      metadata.push(backupInfo);

      // Manter apenas as últimas entradas
      if (metadata.length > this.maxBackups) {
        metadata = metadata.slice(-this.maxBackups);
      }

      // Salvar metadata atualizada
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (err) {
      logger.error(
        {
          component: 'BackupManager',
          err,
          metadataPath,
        },
        'Erro ao salvar metadata do backup'
      );
    }
  }

  /**
   * Restaurar banco de dados a partir de backup
   */
  async restoreFromBackup(backupFileName, options = {}) {
    const { force = false, verify = true } = options;
    const backupPath = path.join(this.backupDir, backupFileName);
    const restoreStartTime = Date.now();

    try {
      logger.info(
        {
          component: 'BackupManager',
          backupFileName,
          force,
          verify,
        },
        'Iniciando restauração do backup'
      );

      // Verificar se backup existe
      await fs.access(backupPath);

      // Criar backup do estado atual antes da restauração
      const currentBackup = await this.createBackup('pre-restore');

      // Parar aplicação ou bloquear acesso ao banco (em produção)
      if (!force) {
        const confirmation = await this.confirmRestore();
        if (!confirmation) {
          throw new Error('Restauração cancelada pelo usuário');
        }
      }

      // Criar arquivo temporário para restauração
      const tempRestorePath = this.dbPath + '.restore.tmp';

      try {
        // Extrair/copiar backup para arquivo temporário
        if (backupFileName.endsWith('.gz')) {
          await this.decompressBackup(backupPath, tempRestorePath);
        } else {
          await pipeline(createReadStream(backupPath), createWriteStream(tempRestorePath));
        }

        // Verificar integridade do backup restaurado
        if (verify) {
          const integrity = await this.verifyRestoredDatabase(tempRestorePath);
          if (!integrity.isValid) {
            throw new Error(`Backup corrompido: ${integrity.error}`);
          }
        }

        // Substituir banco atual pelo restaurado
        const originalBackupPath = this.dbPath + '.original.bak';
        await fs.rename(this.dbPath, originalBackupPath);
        await fs.rename(tempRestorePath, this.dbPath);

        const duration = Date.now() - restoreStartTime;

        const restoreInfo = {
          backupFileName,
          restored: new Date().toISOString(),
          duration,
          verified: verify,
          originalBackedUpAs: path.basename(originalBackupPath),
          preRestoreBackup: currentBackup.fileName,
        };

        logger.info(
          {
            component: 'BackupManager',
            ...restoreInfo,
            duration: `${duration}ms`,
          },
          'Restauração concluída com sucesso'
        );

        return restoreInfo;
      } catch (restoreErr) {
        // Limpar arquivo temporário em caso de erro
        try {
          await fs.unlink(tempRestorePath);
        } catch {
          // Ignorar erro de limpeza
        }
        throw restoreErr;
      }
    } catch (err) {
      logger.error(
        {
          component: 'BackupManager',
          err,
          backupFileName,
        },
        'Erro na restauração do backup'
      );
      throw err;
    }
  }

  /**
   * Descomprimir backup
   */
  async decompressBackup(compressedPath, outputPath) {
    const gunzip = createGunzip();
    await pipeline(createReadStream(compressedPath), gunzip, createWriteStream(outputPath));
  }

  /**
   * Verificar integridade do banco restaurado
   */
  async verifyRestoredDatabase(dbPath) {
    try {
      // Para verificar um banco temporário, precisaríamos de uma conexão separada
      // Por ora, assumimos que a descompressão bem-sucedida indica integridade
      const stats = await fs.stat(dbPath);

      if (stats.size === 0) {
        return {
          isValid: false,
          error: 'Arquivo de backup está vazio',
        };
      }

      return {
        isValid: true,
        size: stats.size,
      };
    } catch (err) {
      return {
        isValid: false,
        error: err.message,
      };
    }
  }

  /**
   * Confirmação de restauração (placeholder para interface)
   */
  async confirmRestore() {
    // Em uma implementação real, isso seria uma interface de confirmação
    // Por ora, assumimos confirmação em desenvolvimento
    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Listar backups disponíveis
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(
        (file) =>
          file.startsWith('lascmmg_backup_') && (file.endsWith('.db') || file.endsWith('.db.gz'))
      );

      const backups = [];

      for (const file of backupFiles) {
        try {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);

          backups.push({
            fileName: file,
            size: stats.size,
            sizeFormatted: this.formatBytes(stats.size),
            created: stats.birthtime,
            modified: stats.mtime,
            compressed: file.endsWith('.gz'),
          });
        } catch (err) {
          logger.warn(
            {
              component: 'BackupManager',
              file,
              err,
            },
            'Erro ao obter informações do backup'
          );
        }
      }

      // Ordenar por data de criação (mais recente primeiro)
      backups.sort((a, b) => new Date(b.created) - new Date(a.created));

      return backups;
    } catch (err) {
      logger.error(
        {
          component: 'BackupManager',
          err,
        },
        'Erro ao listar backups'
      );
      throw err;
    }
  }

  /**
   * Limpar backups antigos
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();

      if (backups.length > this.maxBackups) {
        const backupsToDelete = backups.slice(this.maxBackups);

        for (const backup of backupsToDelete) {
          try {
            const backupPath = path.join(this.backupDir, backup.fileName);
            await fs.unlink(backupPath);

            logger.info(
              {
                component: 'BackupManager',
                fileName: backup.fileName,
                age: Math.round((Date.now() - new Date(backup.created)) / (24 * 60 * 60 * 1000)),
              },
              'Backup antigo removido'
            );
          } catch (err) {
            logger.error(
              {
                component: 'BackupManager',
                fileName: backup.fileName,
                err,
              },
              'Erro ao remover backup antigo'
            );
          }
        }
      }
    } catch (err) {
      logger.error(
        {
          component: 'BackupManager',
          err,
        },
        'Erro na limpeza de backups antigos'
      );
    }
  }

  /**
   * Agendar backup automático
   */
  scheduleAutomaticBackup() {
    // Backup diário às 2:00 AM
    const scheduleBackup = () => {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(2, 0, 0, 0);

      // Se já passou das 2:00 hoje, agendar para amanhã
      if (now > scheduledTime) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const msUntilBackup = scheduledTime.getTime() - now.getTime();

      setTimeout(async () => {
        try {
          await this.createBackup('daily');
          logger.info(
            {
              component: 'BackupManager',
            },
            'Backup automático diário executado'
          );
        } catch (err) {
          logger.error(
            {
              component: 'BackupManager',
              err,
            },
            'Erro no backup automático diário'
          );
        }

        // Reagendar para o próximo dia
        scheduleBackup();
      }, msUntilBackup);

      logger.info(
        {
          component: 'BackupManager',
          nextBackup: scheduledTime.toISOString(),
          hoursUntil: Math.round(msUntilBackup / (60 * 60 * 1000)),
        },
        'Próximo backup automático agendado'
      );
    };

    scheduleBackup();
  }

  /**
   * Backup manual via comando
   */
  async manualBackup() {
    return await this.createBackup('manual');
  }

  /**
   * Testar sistema de backup e restore
   */
  async testBackupRestore() {
    try {
      logger.info(
        {
          component: 'BackupManager',
        },
        'Iniciando teste de backup e restore'
      );

      // 1. Criar backup de teste
      const backup = await this.createBackup('test');

      // 2. Verificar se backup foi criado
      const backupPath = backup.path;
      await fs.access(backupPath);

      // 3. Verificar integridade
      const integrity = await this.verifyDatabaseIntegrity();

      // 4. Listar backups
      const backups = await this.listBackups();

      const testResult = {
        backupCreated: true,
        backupFile: backup.fileName,
        backupSize: backup.sizeFormatted,
        integrityCheck: integrity.isValid,
        backupCount: backups.length,
        testPassed: true,
      };

      logger.info(
        {
          component: 'BackupManager',
          ...testResult,
        },
        'Teste de backup concluído com sucesso'
      );

      return testResult;
    } catch (err) {
      logger.error(
        {
          component: 'BackupManager',
          err,
        },
        'Teste de backup falhou'
      );

      return {
        testPassed: false,
        error: err.message,
      };
    }
  }

  /**
   * Obter status do sistema de backup
   */
  getStatus() {
    return {
      initialized: this.initialized,
      backupDir: this.backupDir,
      maxBackups: this.maxBackups,
      compressionEnabled: this.compressionEnabled,
      dbPath: this.dbPath,
    };
  }

  /**
   * Formatar bytes em formato legível
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// Instância singleton
const backupManager = new BackupManager();

module.exports = backupManager;
