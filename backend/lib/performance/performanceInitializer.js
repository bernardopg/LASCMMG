const optimizedDb = require('./optimizedDatabase');
const queryAnalyzer = require('./queryAnalyzer');
const queryCache = require('./queryCache');
const { logger } = require('../logger/logger');
const { queryAsync, runAsync } = require('../db/database');

/**
 * Inicializador de performance do sistema
 * Aplica otimizações automáticas no banco de dados
 */
class PerformanceInitializer {
  constructor() {
    this.initialized = false;
    this.recommendedIndexes = [
      // Índices críticos para performance
      { table: 'tournaments', columns: ['status'], name: 'idx_tournaments_status' },
      { table: 'tournaments', columns: ['date'], name: 'idx_tournaments_date' },
      { table: 'tournaments', columns: ['is_deleted'], name: 'idx_tournaments_is_deleted' },

      { table: 'players', columns: ['is_deleted'], name: 'idx_players_is_deleted' },
      { table: 'players', columns: ['name'], name: 'idx_players_name' },

      { table: 'scores', columns: ['match_id'], name: 'idx_scores_match_id_custom' },
      { table: 'scores', columns: ['winner_id'], name: 'idx_scores_winner_id' },
      { table: 'scores', columns: ['is_deleted'], name: 'idx_scores_is_deleted' },
      { table: 'scores', columns: ['completed_at'], name: 'idx_scores_completed_at' },

      { table: 'matches', columns: ['tournament_id'], name: 'idx_matches_tournament_id' },
      { table: 'matches', columns: ['round'], name: 'idx_matches_round' },

      { table: 'users', columns: ['username'], name: 'idx_users_username' },
      { table: 'users', columns: ['role'], name: 'idx_users_role' },

      // Índices compostos para queries comuns
      { table: 'tournaments', columns: ['status', 'date'], name: 'idx_tournaments_status_date' },
      {
        table: 'matches',
        columns: ['tournament_id', 'round'],
        name: 'idx_matches_tournament_round',
      },
    ];
  }

  /**
   * Inicializa sistema de performance
   */
  async initialize() {
    if (this.initialized) {
      logger.info('Sistema de performance já inicializado');
      return;
    }

    try {
      logger.info('Inicializando sistema de performance...');

      // 1. Aplicar índices recomendados
      await this.applyRecommendedIndexes();

      // 2. Configurar otimizações
      await this.configureOptimizations();

      // 3. Aquecer cache
      await this.warmupCache();

      // 4. Configurar monitoramento
      await this.setupMonitoring();

      this.initialized = true;
      logger.info('Sistema de performance inicializado com sucesso');
    } catch (err) {
      logger.error(
        {
          component: 'PerformanceInitializer',
          err,
        },
        'Erro ao inicializar sistema de performance'
      );
      throw err;
    }
  }

  /**
   * Aplica índices recomendados
   */
  async applyRecommendedIndexes() {
    logger.info('Aplicando índices recomendados...');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const index of this.recommendedIndexes) {
      try {
        // Verificar se o índice já existe
        const exists = await this.indexExists(index.name);

        if (exists) {
          skipped++;
          continue;
        }

        // Criar índice
        const columns = Array.isArray(index.columns) ? index.columns.join(', ') : index.columns;
        const sql = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table}(${columns})`;

        await runAsync(sql);
        created++;

        logger.debug(
          {
            component: 'PerformanceInitializer',
            table: index.table,
            columns,
            indexName: index.name,
          },
          'Índice criado'
        );
      } catch (err) {
        errors++;
        logger.error(
          {
            component: 'PerformanceInitializer',
            err,
            index,
          },
          'Erro ao criar índice'
        );
      }
    }

    logger.info(
      {
        component: 'PerformanceInitializer',
        created,
        skipped,
        errors,
        total: this.recommendedIndexes.length,
      },
      'Aplicação de índices concluída'
    );
  }

  /**
   * Verifica se um índice existe
   */
  async indexExists(indexName) {
    try {
      const sql = `
        SELECT name FROM sqlite_master
        WHERE type='index' AND name=?
      `;

      const result = await queryAsync(sql, [indexName]);
      return result.length > 0;
    } catch (err) {
      logger.error(
        {
          component: 'PerformanceInitializer',
          err,
          indexName,
        },
        'Erro ao verificar existência do índice'
      );
      return false;
    }
  }

  /**
   * Configura otimizações do sistema
   */
  async configureOptimizations() {
    logger.info('Configurando otimizações...');

    // Configurar otimizações baseadas no ambiente
    const isProduction = process.env.NODE_ENV === 'production';

    optimizedDb.configure({
      enableOptimizations: true,
      enableProfiling: !isProduction, // Profiling apenas em desenvolvimento
      slowQueryThreshold: isProduction ? 500 : 200, // Mais rigoroso em dev
      cacheEnabled: true,
    });

    // Configurar TTLs personalizados
    queryCache.setTtlConfig('SELECT * FROM tournaments WHERE status = ?', 300); // 5 min
    queryCache.setTtlConfig('SELECT COUNT(*)', 600); // 10 min - contadores
    queryCache.setTtlConfig('stats', 900); // 15 min - estatísticas
    queryCache.setTtlConfig('ranking', 300); // 5 min - rankings

    logger.info('Otimizações configuradas');
  }

  /**
   * Aquece o cache com queries comuns
   */
  async warmupCache() {
    logger.info('Aquecendo cache...');

    try {
      const warmedCount = await optimizedDb.warmupCache();

      logger.info(
        {
          component: 'PerformanceInitializer',
          warmedCount,
        },
        'Cache aquecido'
      );
    } catch (err) {
      logger.error(
        {
          component: 'PerformanceInitializer',
          err,
        },
        'Erro ao aquecer cache'
      );
    }
  }

  /**
   * Configura monitoramento de performance
   */
  async setupMonitoring() {
    logger.info('Configurando monitoramento de performance...');

    // Configurar threshold para queries lentas
    queryAnalyzer.setSlowQueryThreshold(process.env.NODE_ENV === 'production' ? 500 : 200);

    // Configurar limpeza automática de estatísticas antigas
    if (process.env.NODE_ENV === 'production') {
      this.setupPeriodicCleanup();
    }

    logger.info('Monitoramento configurado');
  }

  /**
   * Configura limpeza periódica de dados de performance
   */
  setupPeriodicCleanup() {
    // Limpeza a cada 6 horas
    const cleanupInterval = 6 * 60 * 60 * 1000; // 6 horas

    setInterval(async () => {
      try {
        logger.info('Executando limpeza automática de performance...');

        // Limpar estatísticas antigas do analisador
        const queryStatsSize = queryAnalyzer.queryStats.size;
        if (queryStatsSize > 1000) {
          queryAnalyzer.reset();
          logger.info(
            {
              component: 'PerformanceInitializer',
              clearedStats: queryStatsSize,
            },
            'Estatísticas do analisador limpas'
          );
        }

        // Reduzir cache se muito grande
        const cacheStats = queryCache.getStats();
        if (cacheStats.memoryCacheSize > 400) {
          await queryCache.clear();
          await optimizedDb.warmupCache();
          logger.info(
            {
              component: 'PerformanceInitializer',
              previousCacheSize: cacheStats.memoryCacheSize,
            },
            'Cache limpo e reaquecido'
          );
        }
      } catch (err) {
        logger.error(
          {
            component: 'PerformanceInitializer',
            err,
          },
          'Erro na limpeza automática'
        );
      }
    }, cleanupInterval);

    logger.info(
      {
        component: 'PerformanceInitializer',
        intervalHours: 6,
      },
      'Limpeza automática configurada'
    );
  }

  /**
   * Executa análise de performance e retorna relatório
   */
  async generateHealthReport() {
    try {
      const report = await optimizedDb.generatePerformanceReport();

      // Adicionar informações específicas do inicializador
      report.initializer = {
        initialized: this.initialized,
        recommendedIndexesCount: this.recommendedIndexes.length,
        appliedIndexes: await this.getAppliedIndexesCount(),
        lastInitialization: new Date().toISOString(),
      };

      return report;
    } catch (err) {
      logger.error(
        {
          component: 'PerformanceInitializer',
          err,
        },
        'Erro ao gerar relatório de saúde'
      );
      throw err;
    }
  }

  /**
   * Conta quantos dos índices recomendados foram aplicados
   */
  async getAppliedIndexesCount() {
    let applied = 0;

    for (const index of this.recommendedIndexes) {
      const exists = await this.indexExists(index.name);
      if (exists) applied++;
    }

    return applied;
  }

  /**
   * Aplica otimizações automáticas baseadas na análise atual
   */
  async autoOptimize() {
    try {
      logger.info('Executando otimização automática...');

      // 1. Aplicar índices sugeridos pelo analisador
      const suggestions = queryAnalyzer.suggestIndexes();
      const highPrioritySuggestions = suggestions.filter((s) => s.priority === 'HIGH').slice(0, 5);

      for (const suggestion of highPrioritySuggestions) {
        try {
          const indexName = `idx_auto_${suggestion.table}_${suggestion.column.replace('.', '_')}`;
          const exists = await this.indexExists(indexName);

          if (!exists) {
            const sql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${suggestion.table}(${suggestion.column})`;
            await runAsync(sql);

            logger.info(
              {
                component: 'PerformanceInitializer',
                table: suggestion.table,
                column: suggestion.column,
                reason: suggestion.reason,
              },
              'Índice automático criado'
            );
          }
        } catch (err) {
          logger.error(
            {
              component: 'PerformanceInitializer',
              err,
              suggestion,
            },
            'Erro ao criar índice automático'
          );
        }
      }

      // 2. Ajustar configurações de cache baseado na performance
      const cacheStats = queryCache.getStats();
      const hitRate = parseFloat(cacheStats.hitRate);

      if (hitRate < 40) {
        // Taxa de hit baixa - aumentar TTLs
        queryCache.setTtlConfig('SELECT', 450); // Aumentar TTL padrão
        logger.info('TTL do cache aumentado devido à baixa taxa de hit');
      } else if (hitRate > 80) {
        // Taxa de hit alta - pode reduzir TTLs para dados mais frescos
        queryCache.setTtlConfig('SELECT', 240); // Reduzir TTL padrão
        logger.info('TTL do cache reduzido devido à alta taxa de hit');
      }

      logger.info('Otimização automática concluída');
    } catch (err) {
      logger.error(
        {
          component: 'PerformanceInitializer',
          err,
        },
        'Erro na otimização automática'
      );
    }
  }

  /**
   * Status do sistema de performance
   */
  getStatus() {
    return {
      initialized: this.initialized,
      recommendedIndexes: this.recommendedIndexes.length,
      optimizations: optimizedDb.getOptimizationStatus(),
      cache: queryCache.getStats(),
    };
  }
}

// Instância singleton
const performanceInitializer = new PerformanceInitializer();

module.exports = performanceInitializer;
