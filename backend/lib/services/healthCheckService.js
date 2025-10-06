/**
 * Health Check Service
 *
 * Comprehensive health monitoring for the LASCMMG application.
 * Checks database, Redis, filesystem, and system resources.
 */

const { getSyncConnection } = require('../db/database');
const { resilientRedisClient } = require('../db/resilientRedisClient');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { logger } = require('../logger/logger');

/**
 * Check database connectivity and responsiveness
 * @returns {Object} - Database health status
 */
function checkDatabase() {
  try {
    const db = getSyncConnection();
    const startTime = Date.now();

    // Simple query to test connectivity
    const result = db.prepare('SELECT 1 as test').get();
    const responseTime = Date.now() - startTime;

    if (result && result.test === 1) {
      // Get database file size
      const dbPath = path.join(__dirname, '../../../data/database.sqlite');
      let dbSize = 0;
      try {
        const stats = fs.statSync(dbPath);
        dbSize = stats.size;
      } catch (err) {
        logger.warn({ component: 'HealthCheck', err }, 'Could not get database file size');
      }

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        connection: 'established',
        size: formatBytes(dbSize),
        message: 'Database is operational',
      };
    }

    return {
      status: 'unhealthy',
      responseTime: `${responseTime}ms`,
      connection: 'established',
      message: 'Database query returned unexpected result',
    };
  } catch (error) {
    logger.error(
      { component: 'HealthCheck', error: error.message },
      'Database health check failed'
    );
    return {
      status: 'unhealthy',
      connection: 'failed',
      error: error.message,
      message: 'Database connection failed',
    };
  }
}

/**
 * Check Redis connectivity and responsiveness
 * @returns {Promise<Object>} - Redis health status
 */
async function checkRedis() {
  try {
    const startTime = Date.now();
    const testKey = 'health:check:test';
    const testValue = Date.now().toString();

    // Test write
    await resilientRedisClient.set(testKey, testValue, { EX: 10 });

    // Test read
    const retrievedValue = await resilientRedisClient.get(testKey);
    const responseTime = Date.now() - startTime;

    // Cleanup
    await resilientRedisClient.del(testKey);

    const isUsingFallback = resilientRedisClient.isUsingFallback();
    const stats = resilientRedisClient.getFallbackStats();

    if (retrievedValue === testValue) {
      return {
        status: isUsingFallback ? 'degraded' : 'healthy',
        mode: isUsingFallback ? 'memory-fallback' : 'redis',
        responseTime: `${responseTime}ms`,
        fallbackCacheSize: stats.memoryCacheSize,
        message: isUsingFallback
          ? 'Redis unavailable, using memory fallback'
          : 'Redis is operational',
      };
    }

    return {
      status: 'unhealthy',
      mode: 'unknown',
      responseTime: `${responseTime}ms`,
      error: 'Read/write test failed',
      message: 'Redis read/write test failed',
    };
  } catch (error) {
    logger.error({ component: 'HealthCheck', error: error.message }, 'Redis health check failed');
    return {
      status: 'degraded',
      mode: 'memory-fallback',
      error: error.message,
      message: 'Redis connection failed, using memory fallback',
    };
  }
}

/**
 * Check filesystem write permissions and space
 * @returns {Object} - Filesystem health status
 */
function checkFilesystem() {
  try {
    const testDir = path.join(__dirname, '../../../uploads');
    const testFile = path.join(testDir, '.health_check');

    // Ensure directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Test write
    const startTime = Date.now();
    fs.writeFileSync(testFile, 'health check test');

    // Test read
    const content = fs.readFileSync(testFile, 'utf8');
    const responseTime = Date.now() - startTime;

    // Cleanup
    fs.unlinkSync(testFile);

    // Get disk space info
    const stats = fs.statfsSync ? fs.statfsSync(testDir) : null;
    let diskSpace = 'unknown';
    if (stats) {
      const available = stats.bavail * stats.bsize;
      diskSpace = formatBytes(available);
    }

    if (content === 'health check test') {
      return {
        status: 'healthy',
        writable: true,
        responseTime: `${responseTime}ms`,
        uploadPath: testDir,
        availableSpace: diskSpace,
        message: 'Filesystem is operational',
      };
    }

    return {
      status: 'unhealthy',
      writable: false,
      error: 'Read/write test failed',
      message: 'Filesystem read/write test failed',
    };
  } catch (error) {
    logger.error(
      { component: 'HealthCheck', error: error.message },
      'Filesystem health check failed'
    );
    return {
      status: 'unhealthy',
      writable: false,
      error: error.message,
      message: 'Filesystem check failed',
    };
  }
}

/**
 * Check system resources (memory, CPU, uptime)
 * @returns {Object} - System health status
 */
function checkSystem() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

    const uptime = process.uptime();
    const systemUptime = os.uptime();

    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // Determine health status based on memory usage
    let status = 'healthy';
    let message = 'System resources are healthy';

    if (memUsagePercent > 90) {
      status = 'critical';
      message = 'Memory usage is critically high';
    } else if (memUsagePercent > 80) {
      status = 'degraded';
      message = 'Memory usage is high';
    }

    return {
      status,
      memory: {
        total: formatBytes(totalMem),
        used: formatBytes(usedMem),
        free: formatBytes(freeMem),
        usagePercent: `${memUsagePercent}%`,
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || 'unknown',
        loadAverage: loadAvg.map((load) => load.toFixed(2)),
      },
      uptime: {
        process: formatUptime(uptime),
        system: formatUptime(systemUptime),
      },
      platform: {
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        nodeVersion: process.version,
      },
      message,
    };
  } catch (error) {
    logger.error({ component: 'HealthCheck', error: error.message }, 'System health check failed');
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'System health check failed',
    };
  }
}

/**
 * Perform comprehensive health check
 * @returns {Promise<Object>} - Complete health check results
 */
async function performHealthCheck() {
  const startTime = Date.now();

  try {
    // Run all checks in parallel
    const [database, redis, filesystem, system] = await Promise.all([
      Promise.resolve(checkDatabase()),
      checkRedis(),
      Promise.resolve(checkFilesystem()),
      Promise.resolve(checkSystem()),
    ]);

    const totalTime = Date.now() - startTime;

    // Determine overall status
    const checks = { database, redis, filesystem, system };
    const statuses = Object.values(checks).map((check) => check.status);

    let overallStatus = 'healthy';
    let httpStatus = 200;

    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
      httpStatus = 503; // Service Unavailable
    } else if (statuses.includes('degraded') || statuses.includes('critical')) {
      overallStatus = 'degraded';
      httpStatus = 200; // Still operational but degraded
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${totalTime}ms`,
      checks,
      httpStatus,
    };
  } catch (error) {
    logger.error({ component: 'HealthCheck', error: error.message }, 'Health check failed');
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      error: error.message,
      httpStatus: 500,
    };
  }
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizeIndex = Math.min(i, sizes.length - 1); // Ensure we don't exceed array bounds
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[sizeIndex];
}

/**
 * Format uptime to human-readable string
 * @param {number} seconds - Uptime in seconds
 * @returns {string} - Formatted string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

module.exports = {
  performHealthCheck,
  checkDatabase,
  checkRedis,
  checkFilesystem,
  checkSystem,
};
