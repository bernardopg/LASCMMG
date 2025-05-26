const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../lib/middleware/authMiddleware');
const { roleMiddleware } = require('../lib/middleware/roleMiddleware');
const optimizedDb = require('../lib/performance/optimizedDatabase');
const queryAnalyzer = require('../lib/performance/queryAnalyzer');
const queryCache = require('../lib/performance/queryCache');
const { logger } = require('../lib/logger/logger');

/**
 * @route GET /api/admin/performance/report
 * @desc Gera relatório completo de performance
 * @access Admin only
 */
router.get('/report', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const report = await optimizedDb.generatePerformanceReport();

    logger.info(
      {
        component: 'PerformanceAPI',
        admin: req.user?.username,
        reportSize: JSON.stringify(report).length,
      },
      'Relatório de performance gerado'
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro ao gerar relatório de performance'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao gerar relatório',
    });
  }
});

/**
 * @route GET /api/admin/performance/slow-queries
 * @desc Lista queries lentas detectadas
 * @access Admin only
 */
router.get('/slow-queries', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const slowQueries = queryAnalyzer.getSlowQueriesReport();

    res.json({
      success: true,
      data: {
        queries: slowQueries,
        threshold: queryAnalyzer.slowQueryThreshold,
        total: slowQueries.length,
      },
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro ao buscar queries lentas'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/admin/performance/frequent-queries
 * @desc Lista queries mais frequentes
 * @access Admin only
 */
router.get('/frequent-queries', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const frequentQueries = queryAnalyzer.getFrequentQueriesReport();

    res.json({
      success: true,
      data: {
        queries: frequentQueries,
        total: frequentQueries.length,
      },
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro ao buscar queries frequentes'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/admin/performance/cache/stats
 * @desc Estatísticas do cache
 * @access Admin only
 */
router.get('/cache/stats', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const stats = queryCache.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro ao buscar estatísticas do cache'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

/**
 * @route POST /api/admin/performance/cache/clear
 * @desc Limpa todo o cache
 * @access Admin only
 */
router.post('/cache/clear', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    await queryCache.clear();

    logger.info(
      {
        component: 'PerformanceAPI',
        admin: req.user?.username,
      },
      'Cache limpo manualmente'
    );

    res.json({
      success: true,
      message: 'Cache limpo com sucesso',
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro ao limpar cache'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

/**
 * @route POST /api/admin/performance/cache/warmup
 * @desc Aquece o cache com queries comuns
 * @access Admin only
 */
router.post('/cache/warmup', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const warmedCount = await optimizedDb.warmupCache();

    logger.info(
      {
        component: 'PerformanceAPI',
        admin: req.user?.username,
        warmedCount,
      },
      'Cache aquecido manualmente'
    );

    res.json({
      success: true,
      message: `Cache aquecido com ${warmedCount} queries`,
      data: { warmedCount },
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro ao aquecer cache'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/admin/performance/index-suggestions
 * @desc Sugestões de índices para otimização
 * @access Admin only
 */
router.get('/index-suggestions', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const suggestions = queryAnalyzer.suggestIndexes();

    res.json({
      success: true,
      data: {
        suggestions,
        total: suggestions.length,
        highPriority: suggestions.filter((s) => s.priority === 'HIGH').length,
      },
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro ao gerar sugestões de índices'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

/**
 * @route POST /api/admin/performance/optimize-indexes
 * @desc Otimiza índices automaticamente
 * @access Admin only
 */
router.post('/optimize-indexes', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { dryRun = true } = req.body;
    const results = await optimizedDb.autoOptimizeIndexes(dryRun);

    logger.info(
      {
        component: 'PerformanceAPI',
        admin: req.user?.username,
        dryRun,
        results: results.length,
      },
      `Auto-otimização de índices ${dryRun ? 'simulada' : 'executada'}`
    );

    res.json({
      success: true,
      message: `Otimização ${dryRun ? 'simulada' : 'executada'} com sucesso`,
      data: {
        results,
        total: results.length,
        created: results.filter((r) => r.status === 'created').length,
        errors: results.filter((r) => r.status === 'error').length,
      },
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro na otimização de índices'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/admin/performance/query-plan/:encodedQuery
 * @desc Analisa plano de execução de uma query específica
 * @access Admin only
 */
router.get(
  '/query-plan/:encodedQuery',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const { encodedQuery } = req.params;
      const { params = '[]' } = req.query;

      // Decodificar query
      const sql = Buffer.from(encodedQuery, 'base64').toString('utf-8');
      const queryParams = JSON.parse(params);

      const plan = await queryAnalyzer.analyzeQueryPlan(sql, queryParams);

      res.json({
        success: true,
        data: {
          sql,
          params: queryParams,
          plan,
        },
      });
    } catch (err) {
      logger.error(
        {
          component: 'PerformanceAPI',
          err,
          admin: req.user?.username,
        },
        'Erro ao analisar plano de execução'
      );

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }
);

/**
 * @route PUT /api/admin/performance/config
 * @desc Configura parâmetros de otimização
 * @access Admin only
 */
router.put('/config', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { enableOptimizations, enableProfiling, slowQueryThreshold, cacheEnabled } = req.body;

    const options = {};

    if (enableOptimizations !== undefined) options.enableOptimizations = enableOptimizations;
    if (enableProfiling !== undefined) options.enableProfiling = enableProfiling;
    if (slowQueryThreshold !== undefined) options.slowQueryThreshold = slowQueryThreshold;
    if (cacheEnabled !== undefined) options.cacheEnabled = cacheEnabled;

    optimizedDb.configure(options);

    logger.info(
      {
        component: 'PerformanceAPI',
        admin: req.user?.username,
        options,
      },
      'Configurações de performance atualizadas'
    );

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data: optimizedDb.getOptimizationStatus(),
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro ao atualizar configurações'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/admin/performance/status
 * @desc Status atual das otimizações
 * @access Admin only
 */
router.get('/status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const status = optimizedDb.getOptimizationStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro ao buscar status das otimizações'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

/**
 * @route POST /api/admin/performance/analyze/reset
 * @desc Reseta estatísticas do analisador
 * @access Admin only
 */
router.post('/analyze/reset', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    queryAnalyzer.reset();

    logger.info(
      {
        component: 'PerformanceAPI',
        admin: req.user?.username,
      },
      'Estatísticas do analisador resetadas'
    );

    res.json({
      success: true,
      message: 'Estatísticas resetadas com sucesso',
    });
  } catch (err) {
    logger.error(
      {
        component: 'PerformanceAPI',
        err,
        admin: req.user?.username,
      },
      'Erro ao resetar estatísticas'
    );

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

module.exports = router;
