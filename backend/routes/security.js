const express = require('express');
const router = express.Router();
const os = require('os');
const path = require('path');
const fs = require('fs');
const { DB_CONFIG } = require('../lib/config/config');
const { checkDbConnection } = require('../lib/db/database');
const tournamentModel = require('../lib/models/tournamentModel');
const playerModel = require('../lib/models/playerModel');
const matchModel = require('../lib/models/matchModel');
const scoreModel = require('../lib/models/scoreModel');
const { logger } = require('../lib/logger/logger');
const {
  validateRequest,
  honeypotConfigSchema,
  manualBlockIpSchema,
  ipAddressParamSchema,
} = require('../lib/utils/validationUtils'); // Import Joi validation utilities
const { authMiddleware } = require('../lib/middleware/authMiddleware');
const { readJsonFile } = require('../lib/utils/fileUtils');
const honeypot = require('../lib/middleware/honeypot'); // Import the honeypot module

const HONEYPOT_LOG_PATH = path.join(
  __dirname,
  '..',
  'data',
  'honeypot_activity.log'
);

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const tournamentCount = await tournamentModel.countTournaments();
    const playerCount = await playerModel.countPlayers();
    const matchCount = await matchModel.countMatches();
    const scoreCount = await scoreModel.countScores();

    const tournamentsStats = await tournamentModel.getTournamentStats();

    const dbFilePath = path.join(DB_CONFIG.dataDir, DB_CONFIG.dbFile);
    const dbSize = fs.existsSync(dbFilePath)
      ? Math.round((fs.statSync(dbFilePath).size / (1024 * 1024)) * 100) / 100
      : 0;

    const systemInfo = {
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        free: Math.round(os.freemem() / (1024 * 1024)),
        total: Math.round(os.totalmem() / (1024 * 1024)),
      },
      cpu: os.cpus().length,
      hostname: os.hostname(),
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        tournaments: {
          total: tournamentCount,
          active: tournamentsStats.active,
          completed: tournamentsStats.completed,
          scheduled: tournamentsStats.scheduled,
        },
        entities: {
          players: playerCount,
          matches: matchCount,
          scores: scoreCount,
        },
        system: systemInfo,
        storage: {
          databaseSize: `${dbSize} MB`,
        },
      },
    });
  } catch (error) {
    logger.error('SystemStatsRoute', 'Erro ao obter estatísticas do sistema:', {
      error: error,
      requestId: req.id,
    });
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do sistema',
      error: error.message,
    });
  }
});

router.get('/health', async (req, res) => {
  try {
    const dbStatus = checkDbConnection();

    const diskStatus = checkDiskSpace();

    const memoryUsage = process.memoryUsage();
    const memoryStatus = {
      ok: memoryUsage.rss < 500 * 1024 * 1024,
      rss: Math.round(memoryUsage.rss / (1024 * 1024)) + ' MB',
      heapTotal: Math.round(memoryUsage.heapTotal / (1024 * 1024)) + ' MB',
      heapUsed: Math.round(memoryUsage.heapUsed / (1024 * 1024)) + ' MB',
    };

    const status =
      dbStatus.status === 'ok' && diskStatus.ok && memoryStatus.ok
        ? 'ok'
        : 'degraded';

    res.status(status === 'ok' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbStatus,
        disk: diskStatus,
        memory: memoryStatus,
      },
      version: process.env.npm_package_version || 'unknown',
    });
  } catch (error) {
    logger.error('SystemStatsRoute', 'Erro no health check:', {
      error: error,
      requestId: req.id,
    });
    res.status(500).json({
      status: 'error',
      message: 'Erro interno no health check',
      error: error.message,
    });
  }
});

function checkDiskSpace() {
  try {
    const dataDir = DB_CONFIG.dataDir;

    if (!fs.existsSync(dataDir)) {
      return { ok: false, message: 'Diretório de dados não encontrado' };
    }

    try {
      const testFile = path.join(dataDir, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return { ok: true, message: 'Diretório de dados está gravável' };
    } catch (e) {
      return {
        ok: false,
        message: 'Diretório de dados não está gravável',
        error: e.message,
      };
    }
  } catch (error) {
    return {
      ok: false,
      message: 'Erro ao verificar espaço em disco',
      error: error.message,
    };
  }
}

// Renamed from /honeypot-stats to /overview-stats to match frontend api.js
// This can be expanded to include more overview data if needed.
router.get('/security/overview-stats', authMiddleware, async (req, res) => {
  try {
    let honeypotLogs = await readJsonFile(HONEYPOT_LOG_PATH, []);
    const MAX_LOGS_TO_PROCESS = 10000; // Limit processing to the last N entries for performance

    if (honeypotLogs.length > MAX_LOGS_TO_PROCESS) {
      logger.warn('SecurityRoute', `Honeypot log file is large (${honeypotLogs.length} entries). Processing last ${MAX_LOGS_TO_PROCESS} for overview stats.`);
      honeypotLogs = honeypotLogs.slice(-MAX_LOGS_TO_PROCESS);
    }

    const overviewStats = {
      totalHoneypotEvents: honeypotLogs.length, // This will be MAX_LOGS_TO_PROCESS if truncated
      uniqueHoneypotIps: new Set(honeypotLogs.map((log) => log.ip)).size,
      honeypotEventTypes: {},
      honeypotTopIps: {},
      honeypotLastEventTimestamp:
        honeypotLogs.length > 0
          ? honeypotLogs[honeypotLogs.length - 1].timestamp
          : null,
      // Potentially add other security overview data here, e.g., from a firewall log or other security modules
    };

    for (const log of honeypotLogs) {
      overviewStats.honeypotEventTypes[log.type] =
        (overviewStats.honeypotEventTypes[log.type] || 0) + 1;

      if (!overviewStats.honeypotTopIps[log.ip]) {
        overviewStats.honeypotTopIps[log.ip] = {
          count: 0,
          types: {},
          lastSeen: log.timestamp,
        };
      }
      overviewStats.honeypotTopIps[log.ip].count++;
      overviewStats.honeypotTopIps[log.ip].types[log.type] =
        (overviewStats.honeypotTopIps[log.ip].types[log.type] || 0) + 1;
      if (
        new Date(log.timestamp) >
        new Date(overviewStats.honeypotTopIps[log.ip].lastSeen)
      ) {
        overviewStats.honeypotTopIps[log.ip].lastSeen = log.timestamp;
      }
    }

    const sortedTopHoneypotIps = Object.entries(overviewStats.honeypotTopIps)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    overviewStats.honeypotTopIps = sortedTopHoneypotIps;

    // The overviewStats currently focuses on honeypot activity.
    // Additional security module data can be added here if/when those modules are implemented.

    res.json({
      success: true,
      data: overviewStats,
    });
  } catch (error) {
    logger.error(
      'SystemStatsRoute',
      'Erro ao obter estatísticas de visão geral de segurança:',
      { error: error, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas de visão geral de segurança',
      error: error.message,
    });
  }
});

// Honeypot Configuration Routes
router.get('/security/honeypot-config', authMiddleware, async (req, res) => {
  try {
    const config = honeypot.getSettings(); // Use the new function
    res.json({ success: true, config });
  } catch (error) {
    logger.error(
      'SystemStatsRoute',
      'Erro ao obter configuração do honeypot:',
      { error, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configuração do honeypot.',
    });
  }
});

router.post('/security/honeypot-config', authMiddleware, validateRequest(honeypotConfigSchema), async (req, res) => {
  // req.body is validated by honeypotConfigSchema
  const { threshold, block_duration_hours, whitelist_ips } = req.body;
  try {
    // Pass validated and potentially renamed keys to updateSettings
    const success = await honeypot.updateSettings({
      detectionThreshold: threshold, // Map from schema key to internal key if different
      blockDurationHours: block_duration_hours,
      ipWhitelist: whitelist_ips,
      detectionThreshold,
      blockDurationHours,
      ipWhitelist,
    });
    if (success) {
      logger.info('SystemStatsRoute', 'Configuração do honeypot atualizada.', {
        newConfig: req.body,
        requestId: req.id,
      });
      res.json({
        success: true,
        message: 'Configuração do honeypot atualizada com sucesso.',
      });
    } else {
      logger.error(
        'SystemStatsRoute',
        'Falha ao salvar configuração do honeypot.',
        { body: req.body, requestId: req.id }
      );
      res.status(500).json({
        success: false,
        message: 'Falha ao salvar configuração do honeypot.',
      });
    }
  } catch (error) {
    logger.error(
      'SystemStatsRoute',
      'Erro ao atualizar configuração do honeypot:',
      { error, body: req.body, requestId: req.id }
    );
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configuração do honeypot.',
    });
  }
});

// Blocked IPs Management Routes
router.get('/security/blocked-ips', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  try {
    const { ips, total, currentPage, totalPages } = honeypot.getBlockedIPs({
      page,
      limit,
    });
    res.json({
      success: true,
      blockedIps: ips,
      totalPages,
      currentPage,
      totalBlocked: total,
    });
  } catch (error) {
    logger.error('SystemStatsRoute', 'Erro ao obter IPs bloqueados:', {
      error,
      requestId: req.id,
    });
    res
      .status(500)
      .json({ success: false, message: 'Erro ao obter IPs bloqueados.' });
  }
});

router.post('/security/blocked-ips', authMiddleware, validateRequest(manualBlockIpSchema), async (req, res) => {
  // req.body is validated by manualBlockIpSchema
  const { ipAddress, durationHours, reason } = req.body;
  // if (!ipAddress) { ... } // This check is handled by Joi
  try {
    const success = await honeypot.manualBlockIP(
      ipAddress,
      durationHours,
      reason
    );
    if (success) {
      logger.info(
        'SystemStatsRoute',
        `IP ${ipAddress} bloqueado manualmente.`,
        { ipAddress, durationHours, reason, requestId: req.id }
      );
      res.json({
        success: true,
        message: `IP ${ipAddress} bloqueado com sucesso.`,
      });
    } else {
      logger.warn(
        'SystemStatsRoute',
        `Falha ao bloquear IP ${ipAddress} manualmente (possivelmente na whitelist).`,
        { ipAddress, requestId: req.id }
      );
      res.status(400).json({
        success: false,
        message: `Não foi possível bloquear o IP ${ipAddress}. Pode estar na whitelist.`,
      });
    }
  } catch (error) {
    logger.error(
      'SystemStatsRoute',
      `Erro ao bloquear IP ${ipAddress} manualmente:`,
      { error, body: req.body, requestId: req.id }
    );
    res.status(500).json({ success: false, message: 'Erro ao bloquear IP.' });
  }
});

router.delete(
  '/security/blocked-ips/:ipAddress',
  authMiddleware,
  validateRequest(ipAddressParamSchema), // Validate ipAddress in params
  async (req, res) => {
    const { ipAddress } = req.params; // Validated
    try {
      const success = await honeypot.unblockIP(ipAddress);
      if (success) {
        logger.info('SystemStatsRoute', `IP ${ipAddress} desbloqueado.`, {
          ipAddress,
          requestId: req.id,
        });
        res.json({
          success: true,
          message: `IP ${ipAddress} desbloqueado com sucesso.`,
        });
      } else {
        logger.warn(
          'SystemStatsRoute',
          `IP ${ipAddress} não encontrado para desbloqueio.`,
          { ipAddress, requestId: req.id }
        );
        res.status(404).json({
          success: false,
          message: 'IP não encontrado na lista de bloqueio.',
        });
      }
    } catch (error) {
      logger.error('SystemStatsRoute', `Erro ao desbloquear IP ${ipAddress}:`, {
        error,
        ipAddress,
        requestId: req.id,
      });
      res
        .status(500)
        .json({ success: false, message: 'Erro ao desbloquear IP.' });
    }
  }
);

module.exports = router;
