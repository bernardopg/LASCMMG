const express = require('express');
const router = express.Router();
const os = require('os');
const path = require('path');
const fs = require('fs');
const { DB_CONFIG } = require('../lib/config');

const { models } = require('../lib/db-init');
const { authMiddleware } = require('../lib/authMiddleware');
const { readJsonFile } = require('../lib/fileUtils'); // Para ler o log do honeypot
const HONEYPOT_LOG_PATH = path.join(
  __dirname,
  '..',
  'data',
  'honeypot_activity.log'
);

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const tournamentCount = await models.tournament.countTournaments();
    const playerCount = await models.player.countPlayers();
    const matchCount = await models.match.countMatches();
    const scoreCount = await models.score.countScores();

    const tournamentsStats = await models.tournament.getTournamentStats();

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
    console.error('Erro ao obter estatísticas do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do sistema',
      error: error.message,
    });
  }
});

router.get('/health', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection();

    const diskStatus = checkDiskSpace();

    const memoryUsage = process.memoryUsage();
    const memoryStatus = {
      ok: memoryUsage.rss < 500 * 1024 * 1024,
      rss: Math.round(memoryUsage.rss / (1024 * 1024)) + ' MB',
      heapTotal: Math.round(memoryUsage.heapTotal / (1024 * 1024)) + ' MB',
      heapUsed: Math.round(memoryUsage.heapUsed / (1024 * 1024)) + ' MB',
    };

    const status =
      dbStatus.ok && diskStatus.ok && memoryStatus.ok ? 'ok' : 'degraded';

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
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno no health check',
      error: error.message,
    });
  }
});

async function checkDatabaseConnection() {
  try {
    await models.tournament.countTournaments();
    return { ok: true, message: 'Conexão com o banco de dados OK' };
  } catch (error) {
    console.error('Erro na conexão com o banco de dados:', error);
    return {
      ok: false,
      message: 'Falha na conexão com o banco de dados',
      error: error.message,
    };
  }
}

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

router.get('/security/honeypot-stats', authMiddleware, async (req, res) => {
  try {
    const logs = await readJsonFile(HONEYPOT_LOG_PATH, []);

    const stats = {
      totalEvents: logs.length,
      uniqueIps: new Set(logs.map((log) => log.ip)).size,
      eventTypes: {},
      topIps: {},
      lastEventTimestamp:
        logs.length > 0 ? logs[logs.length - 1].timestamp : null,
    };

    for (const log of logs) {
      // Contar tipos de evento
      stats.eventTypes[log.type] = (stats.eventTypes[log.type] || 0) + 1;

      // Contar IPs
      if (!stats.topIps[log.ip]) {
        stats.topIps[log.ip] = { count: 0, types: {}, lastSeen: log.timestamp };
      }
      stats.topIps[log.ip].count++;
      stats.topIps[log.ip].types[log.type] =
        (stats.topIps[log.ip].types[log.type] || 0) + 1;
      if (new Date(log.timestamp) > new Date(stats.topIps[log.ip].lastSeen)) {
        stats.topIps[log.ip].lastSeen = log.timestamp;
      }
    }

    // Converter topIps para array e ordenar (ex: top 10)
    const sortedTopIps = Object.entries(stats.topIps)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    stats.topIps = sortedTopIps;

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de honeypot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas de honeypot',
      error: error.message,
    });
  }
});

module.exports = router;
