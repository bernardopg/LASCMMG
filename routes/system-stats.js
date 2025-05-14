const express = require('express');
const router = express.Router();
const os = require('os');
const path = require('path');
const fs = require('fs');
const { DB_CONFIG } = require('../lib/config');

const { models } = require('../lib/db-init');

router.get('/stats', async (req, res) => {
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

router.get('/security/honeypot-stats', async (req, res) => {
  try {
    const simulatedStats = {
      totalEvents: 123,
      uniqueIps: 45,
      uniquePatterns: 12,
      lastUpdated: new Date().toISOString(),
      topIps: [
        {
          ip: '192.168.1.100',
          count: 50,
          lastSeen: new Date().toISOString(),
          topPatterns: [
            { pattern: 'SQL_INJECTION', count: 20 },
            { pattern: 'XSS', count: 30 },
          ],
        },
        {
          ip: '10.0.0.5',
          count: 30,
          lastSeen: new Date().toISOString(),
          topPatterns: [{ pattern: 'PATH_TRAVERSAL', count: 30 }],
        },
      ],
      activeHoneypots: ['/wp-login.php', '/admin/login', '/old-backup.zip'],
      topPatterns: [
        { pattern: 'SQL_INJECTION', count: 50 },
        { pattern: 'XSS', count: 40 },
        { pattern: 'PATH_TRAVERSAL', count: 33 },
      ],
    };

    res.json({
      success: true,
      data: simulatedStats,
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
