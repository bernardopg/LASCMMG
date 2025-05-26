const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../lib/middleware/authMiddleware');
const { roleMiddleware } = require('../lib/middleware/roleMiddleware');
const backupManager = require('../lib/backup/backupManager');
const { logger } = require('../lib/logger/logger');
const auditLogger = require('../lib/logger/auditLogger');

// Middleware de autenticação e autorização
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// == BACKUP MANAGEMENT ROUTES ==

/**
 * GET /api/admin/backup/status
 * Obter status do sistema de backup
 */
router.get('/status', async (req, res) => {
  try {
    const status = backupManager.getStatus();
    const backups = await backupManager.listBackups();

    const backupStatus = {
      ...status,
      backupCount: backups.length,
      lastBackup:
        backups.length > 0
          ? {
            fileName: backups[0].fileName,
            size: backups[0].sizeFormatted,
            created: backups[0].created,
            age: Math.round((Date.now() - new Date(backups[0].created)) / (60 * 60 * 1000)),
          }
          : null,
    };

    auditLogger.log('backup_status_checked', {
      userId: req.user.id,
      username: req.user.username,
      backupCount: backups.length,
      requestId: req.id,
    });

    res.json({
      success: true,
      status: backupStatus,
    });
  } catch (error) {
    logger.error(
      {
        component: 'BackupStatusRoute',
        err: error,
        userId: req.user.id,
        requestId: req.id,
      },
      'Erro ao obter status do sistema de backup'
    );

    res.status(500).json({
      success: false,
      message: 'Erro ao obter status do sistema de backup',
    });
  }
});

/**
 * GET /api/admin/backup/list
 * Listar todos os backups disponíveis
 */
router.get('/list', async (req, res) => {
  try {
    const backups = await backupManager.listBackups();

    auditLogger.log('backup_list_accessed', {
      userId: req.user.id,
      username: req.user.username,
      backupCount: backups.length,
      requestId: req.id,
    });

    res.json({
      success: true,
      backups,
      total: backups.length,
    });
  } catch (error) {
    logger.error(
      {
        component: 'BackupListRoute',
        err: error,
        userId: req.user.id,
        requestId: req.id,
      },
      'Erro ao listar backups'
    );

    res.status(500).json({
      success: false,
      message: 'Erro ao listar backups',
    });
  }
});

/**
 * POST /api/admin/backup/create
 * Criar novo backup manualmente
 */
router.post('/create', async (req, res) => {
  try {
    const { type = 'manual' } = req.body;

    logger.info(
      {
        component: 'BackupCreateRoute',
        userId: req.user.id,
        username: req.user.username,
        type,
        requestId: req.id,
      },
      'Iniciando criação de backup manual'
    );

    const backup = await backupManager.createBackup(type);

    auditLogger.log('backup_created', {
      userId: req.user.id,
      username: req.user.username,
      backupFile: backup.fileName,
      backupSize: backup.sizeFormatted,
      type,
      requestId: req.id,
    });

    res.status(201).json({
      success: true,
      backup: {
        fileName: backup.fileName,
        size: backup.sizeFormatted,
        created: backup.created,
        type: backup.type,
        compressed: backup.compressed,
        duration: backup.duration,
      },
      message: 'Backup criado com sucesso',
    });
  } catch (error) {
    logger.error(
      {
        component: 'BackupCreateRoute',
        err: error,
        userId: req.user.id,
        requestId: req.id,
      },
      'Erro ao criar backup'
    );

    auditLogger.log('backup_creation_failed', {
      userId: req.user.id,
      username: req.user.username,
      error: error.message,
      requestId: req.id,
    });

    res.status(500).json({
      success: false,
      message: 'Erro ao criar backup: ' + error.message,
    });
  }
});

/**
 * POST /api/admin/backup/restore
 * Restaurar banco de dados a partir de backup
 */
router.post('/restore', async (req, res) => {
  try {
    const { backupFileName, force = false, verify = true } = req.body;

    if (!backupFileName) {
      return res.status(400).json({
        success: false,
        message: 'Nome do arquivo de backup é obrigatório',
      });
    }

    // Verificar se está em produção e força confirmação
    if (process.env.NODE_ENV === 'production' && !force) {
      return res.status(400).json({
        success: false,
        message: 'Restauração em produção requer confirmação explícita (force: true)',
        requiresConfirmation: true,
      });
    }

    logger.warn(
      {
        component: 'BackupRestoreRoute',
        userId: req.user.id,
        username: req.user.username,
        backupFileName,
        force,
        verify,
        requestId: req.id,
      },
      'INICIANDO RESTAURAÇÃO DE BACKUP - OPERAÇÃO CRÍTICA'
    );

    const restoreInfo = await backupManager.restoreFromBackup(backupFileName, {
      force: true,
      verify,
    });

    auditLogger.log('backup_restored', {
      userId: req.user.id,
      username: req.user.username,
      backupFileName,
      preRestoreBackup: restoreInfo.preRestoreBackup,
      verified: restoreInfo.verified,
      duration: restoreInfo.duration,
      requestId: req.id,
    });

    res.json({
      success: true,
      restore: {
        backupFileName: restoreInfo.backupFileName,
        preRestoreBackup: restoreInfo.preRestoreBackup,
        verified: restoreInfo.verified,
        duration: restoreInfo.duration,
      },
      message: 'Restauração concluída com sucesso',
      warning: 'Banco de dados foi restaurado. Reinicie a aplicação se necessário.',
    });
  } catch (error) {
    logger.error(
      {
        component: 'BackupRestoreRoute',
        err: error,
        userId: req.user.id,
        backupFileName: req.body.backupFileName,
        requestId: req.id,
      },
      'ERRO CRÍTICO na restauração de backup'
    );

    auditLogger.log('backup_restore_failed', {
      userId: req.user.id,
      username: req.user.username,
      backupFileName: req.body.backupFileName,
      error: error.message,
      requestId: req.id,
    });

    res.status(500).json({
      success: false,
      message: 'Erro na restauração: ' + error.message,
      critical: true,
    });
  }
});

/**
 * POST /api/admin/backup/test
 * Testar sistema de backup
 */
router.post('/test', async (req, res) => {
  try {
    logger.info(
      {
        component: 'BackupTestRoute',
        userId: req.user.id,
        username: req.user.username,
        requestId: req.id,
      },
      'Iniciando teste do sistema de backup'
    );

    const testResult = await backupManager.testBackupRestore();

    auditLogger.log('backup_test_executed', {
      userId: req.user.id,
      username: req.user.username,
      testPassed: testResult.testPassed,
      backupFile: testResult.backupFile,
      requestId: req.id,
    });

    if (testResult.testPassed) {
      res.json({
        success: true,
        test: testResult,
        message: 'Teste do sistema de backup passou com sucesso',
      });
    } else {
      res.status(500).json({
        success: false,
        test: testResult,
        message: 'Teste do sistema de backup falhou',
      });
    }
  } catch (error) {
    logger.error(
      {
        component: 'BackupTestRoute',
        err: error,
        userId: req.user.id,
        requestId: req.id,
      },
      'Erro no teste do sistema de backup'
    );

    auditLogger.log('backup_test_failed', {
      userId: req.user.id,
      username: req.user.username,
      error: error.message,
      requestId: req.id,
    });

    res.status(500).json({
      success: false,
      message: 'Erro no teste do sistema de backup: ' + error.message,
    });
  }
});

/**
 * DELETE /api/admin/backup/cleanup
 * Limpar backups antigos
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const backupsBefore = await backupManager.listBackups();
    await backupManager.cleanupOldBackups();
    const backupsAfter = await backupManager.listBackups();

    const removed = backupsBefore.length - backupsAfter.length;

    auditLogger.log('backup_cleanup_executed', {
      userId: req.user.id,
      username: req.user.username,
      backupsRemoved: removed,
      backupsRemaining: backupsAfter.length,
      requestId: req.id,
    });

    res.json({
      success: true,
      cleanup: {
        removed,
        remaining: backupsAfter.length,
        before: backupsBefore.length,
      },
      message:
        removed > 0
          ? `${removed} backup(s) antigo(s) removido(s)`
          : 'Nenhum backup antigo para remover',
    });
  } catch (error) {
    logger.error(
      {
        component: 'BackupCleanupRoute',
        err: error,
        userId: req.user.id,
        requestId: req.id,
      },
      'Erro na limpeza de backups antigos'
    );

    res.status(500).json({
      success: false,
      message: 'Erro na limpeza de backups: ' + error.message,
    });
  }
});

/**
 * DELETE /api/admin/backup/:fileName
 * Deletar backup específico
 */
router.delete('/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName || !fileName.startsWith('lascmmg_backup_')) {
      return res.status(400).json({
        success: false,
        message: 'Nome de arquivo de backup inválido',
      });
    }

    const backupManager = require('../lib/backup/backupManager');
    const fs = require('fs').promises;
    const path = require('path');

    const backupPath = path.join(backupManager.backupDir, fileName);

    // Verificar se backup existe
    try {
      await fs.access(backupPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Backup não encontrado',
      });
    }

    // Remover arquivo
    await fs.unlink(backupPath);

    auditLogger.log('backup_deleted', {
      userId: req.user.id,
      username: req.user.username,
      backupFileName: fileName,
      requestId: req.id,
    });

    logger.info(
      {
        component: 'BackupDeleteRoute',
        userId: req.user.id,
        username: req.user.username,
        fileName,
        requestId: req.id,
      },
      'Backup deletado manualmente'
    );

    res.json({
      success: true,
      message: 'Backup deletado com sucesso',
    });
  } catch (error) {
    logger.error(
      {
        component: 'BackupDeleteRoute',
        err: error,
        userId: req.user.id,
        fileName: req.params.fileName,
        requestId: req.id,
      },
      'Erro ao deletar backup'
    );

    res.status(500).json({
      success: false,
      message: 'Erro ao deletar backup: ' + error.message,
    });
  }
});

/**
 * GET /api/admin/backup/schedule
 * Obter informações sobre agendamento de backup
 */
router.get('/schedule', async (req, res) => {
  try {
    const status = backupManager.getStatus();

    // Calcular próximo backup (baseado no agendamento às 2:00 AM)
    const now = new Date();
    const nextBackup = new Date();
    nextBackup.setHours(2, 0, 0, 0);

    if (now > nextBackup) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }

    const hoursUntilNext = Math.round((nextBackup.getTime() - now.getTime()) / (60 * 60 * 1000));

    res.json({
      success: true,
      schedule: {
        enabled: status.initialized,
        frequency: 'daily',
        time: '02:00 AM',
        nextBackup: nextBackup.toISOString(),
        hoursUntilNext,
        maxBackups: status.maxBackups,
        compressionEnabled: status.compressionEnabled,
      },
    });
  } catch (error) {
    logger.error(
      {
        component: 'BackupScheduleRoute',
        err: error,
        userId: req.user.id,
        requestId: req.id,
      },
      'Erro ao obter informações de agendamento'
    );

    res.status(500).json({
      success: false,
      message: 'Erro ao obter informações de agendamento',
    });
  }
});

module.exports = router;
