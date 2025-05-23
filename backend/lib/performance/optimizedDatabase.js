const {
  queryAsync,
  runAsync,
  getOneAsync,
  transactionAsync,
  querySync,
  runSync,
  getOneSync,
  transactionSync
} = require('../db/database');
const queryAnalyzer = require('./queryAnalyzer');
const queryCache = require('./queryCache');
const { logger } = require('../logger/logger');

class OptimizedDatabase {
  constructor() {
    this.enableOptimizations = process.env.NODE_ENV !== 'test';
    this.enableProfiling = process.env.NODE_ENV !== 'production';
  }

  /**
   * Executa query com cache e análise de performance
   */
  async optimizedQuery(sql, params = []) {
    const startTime = Date.now();

    try {
      // Tentar buscar no cache primeiro
      if (this.enableOptimizations) {
        const cached = await queryCache.get(sql, params);
        if (cached) {
          const executionTime = Date.now() - startTime;
          if (this.enableProfiling) {
            queryAnalyzer.analyzeQuery(sql, params, executionTime, cached.length || 0);
          }
          return cached;
        }
      }

      // Executar query se não estiver no cache
      const result = await queryAsync(sql, params);
      const executionTime = Date.now() - startTime;

      // Análise de performance
      if (this.enableProfiling) {
        queryAnalyzer.analyzeQuery(sql, params, executionTime, result.length || 0);
      }

      // Armazenar no cache
      if (this.enableOptimizations && result) {
        await queryCache.set(sql, params, result);
      }

      return result;
    } catch (err) {
      const executionTime = Date.now() - startTime;

      logger.error({
        component: 'OptimizedDatabase',
        sql,
        params,
        executionTime,
        err
      }, 'Erro na execução de query otimizada');

      throw err;
    }
  }

  /**
   * Executa operação de escrita com invalidação de cache
   */
  async optimizedRun(sql, params = []) {
    const startTime = Date.now();

    try {
      const result = await runAsync(sql, params);
      const executionTime = Date.now() - startTime;

      // Análise de performance
      if (this.enableProfiling) {
        queryAnalyzer.analyzeQuery(sql, params, executionTime, result.changes || 0);
      }

      // Invalidar cache baseado na operação
      if (this.enableOptimizations) {
        await this.invalidateCacheForOperation(sql, params);
      }

      return result;
    } catch (err) {
      const executionTime = Date.now() - startTime;

      logger.error({
        component: 'OptimizedDatabase',
        sql,
        params,
        executionTime,
        err
      }, 'Erro na execução de operação otimizada');

      throw err;
    }
  }

  /**
   * Busca um único registro com cache
   */
  async optimizedGetOne(sql, params = []) {
    const startTime = Date.now();

    try {
      // Tentar buscar no cache primeiro
      if (this.enableOptimizations) {
        const cached = await queryCache.get(sql, params);
        if (cached) {
          const executionTime = Date.now() - startTime;
          if (this.enableProfiling) {
            queryAnalyzer.analyzeQuery(sql, params, executionTime, 1);
          }
          return cached;
        }
      }

      // Executar query se não estiver no cache
      const result = await getOneAsync(sql, params);
      const executionTime = Date.now() - startTime;

      // Análise de performance
      if (this.enableProfiling) {
        queryAnalyzer.analyzeQuery(sql, params, executionTime, result ? 1 : 0);
      }

      // Armazenar no cache
      if (this.enableOptimizations && result) {
        await queryCache.set(sql, params, result);
      }

      return result;
    } catch (err) {
      const executionTime = Date.now() - startTime;

      logger.error({
        component: 'OptimizedDatabase',
        sql,
        params,
        executionTime,
        err
      }, 'Erro na execução de getOne otimizado');

      throw err;
    }
  }

  /**
   * Executa transação com análise de performance
   */
  async optimizedTransaction(actions) {
    const startTime = Date.now();

    try {
      const result = await transactionAsync(actions);
      const executionTime = Date.now() - startTime;

      // Log da transação
      if (this.enableProfiling) {
        logger.info({
          component: 'OptimizedDatabase',
          executionTime,
          type: 'transaction'
        }, `Transação executada em ${executionTime}ms`);
      }

      // Invalidar cache após transação (conservativo)
      if (this.enableOptimizations) {
        await queryCache.clear(); // Limpar todo o cache após transação
      }

      return result;
    } catch (err) {
      const executionTime = Date.now() - startTime;

      logger.error({
        component: 'OptimizedDatabase',
        executionTime,
        err
      }, 'Erro na execução de transação otimizada');

      throw err;
    }
  }

  /**
   * Invalida cache baseado na operação SQL
   */
  async invalidateCacheForOperation(sql, params) {
    const normalizedSql = sql.toLowerCase().trim();

    try {
      // Detectar tabela afetada
      let affectedTable = null;

      if (normalizedSql.startsWith('insert into')) {
        const match = normalizedSql.match(/insert\s+into\s+(\w+)/);
        affectedTable = match ? match[1] : null;
      } else if (normalizedSql.startsWith('update')) {
        const match = normalizedSql.match(/update\s+(\w+)/);
        affectedTable = match ? match[1] : null;
      } else if (normalizedSql.startsWith('delete from')) {
        const match = normalizedSql.match(/delete\s+from\s+(\w+)/);
        affectedTable = match ? match[1] : null;
      }

      if (affectedTable) {
        await queryCache.invalidateTable(affectedTable);

        // Invalidações específicas por tabela
        await this.handleSpecificTableInvalidation(affectedTable, params);
      }
    } catch (err) {
      logger.error({
        component: 'OptimizedDatabase',
        sql,
        err
      }, 'Erro ao invalidar cache');
    }
  }

  /**
   * Tratamento específico de invalidação por tabela
   */
  async handleSpecificTableInvalidation(tableName, params) {
    switch (tableName) {
      case 'tournaments':
        if (params && params[0]) {
          await queryCache.invalidateTournament(params[0]);
        }
        break;

      case 'players':
        // Invalidar cache de estatísticas quando jogadores são modificados
        await queryCache.invalidate(['count(*)', 'stats']);
        break;

      case 'scores':
        // Invalidar cache de estatísticas e rankings
        await queryCache.invalidate(['count(*)', 'stats', 'ranking', 'leaderboard']);
        break;

      case 'matches':
        // Invalidar cache de bracket e torneios
        await queryCache.invalidate(['bracket', 'tournament']);
        break;
    }
  }

  /**
   * Versões síncronas otimizadas (para backward compatibility)
   */
  optimizedQuerySync(sql, params = []) {
    const startTime = Date.now();

    try {
      const result = querySync(sql, params);
      const executionTime = Date.now() - startTime;

      if (this.enableProfiling) {
        queryAnalyzer.analyzeQuery(sql, params, executionTime, result.length || 0);
      }

      return result;
    } catch (err) {
      const executionTime = Date.now() - startTime;

      logger.error({
        component: 'OptimizedDatabase',
        sql,
        params,
        executionTime,
        err
      }, 'Erro na execução de query síncrona otimizada');

      throw err;
    }
  }

  optimizedRunSync(sql, params = []) {
    const startTime = Date.now();

    try {
      const result = runSync(sql, params);
      const executionTime = Date.now() - startTime;

      if (this.enableProfiling) {
        queryAnalyzer.analyzeQuery(sql, params, executionTime, result.changes || 0);
      }

      return result;
    } catch (err) {
      const executionTime = Date.now() - startTime;

      logger.error({
        component: 'OptimizedDatabase',
        sql,
        params,
        executionTime,
        err
      }, 'Erro na execução de run síncrono otimizado');

      throw err;
    }
  }

  optimizedGetOneSync(sql, params = []) {
    const startTime = Date.now();

    try {
      const result = getOneSync(sql, params);
      const executionTime = Date.now() - startTime;

      if (this.enableProfiling) {
        queryAnalyzer.analyzeQuery(sql, params, executionTime, result ? 1 : 0);
      }

      return result;
    } catch (err) {
      const executionTime = Date.now() - startTime;

      logger.error({
        component: 'OptimizedDatabase',
        sql,
        params,
        executionTime,
        err
      }, 'Erro na execução de getOne síncrono otimizado');

      throw err;
    }
  }

  /**
   * Aquece cache com queries comuns
   */
  async warmupCache() {
    const commonQueries = [
      // Contadores gerais
      { sql: 'SELECT COUNT(*) as total FROM tournaments WHERE (is_deleted = 0 OR is_deleted IS NULL)', params: [] },
      { sql: 'SELECT COUNT(*) as total FROM players WHERE (is_deleted = 0 OR is_deleted IS NULL)', params: [] },
      { sql: 'SELECT COUNT(*) as total FROM scores WHERE (s.is_deleted = 0 OR s.is_deleted IS NULL)', params: [] },

      // Torneios ativos
      { sql: 'SELECT * FROM tournaments WHERE status = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY date DESC LIMIT 10', params: ['Ativo'] },

      // Estatísticas básicas
      { sql: 'SELECT COUNT(*) as active_tournaments FROM tournaments WHERE status = ? AND (is_deleted = 0 OR is_deleted IS NULL)', params: ['Ativo'] },
      { sql: 'SELECT COUNT(*) as pending_tournaments FROM tournaments WHERE status = ? AND (is_deleted = 0 OR is_deleted IS NULL)', params: ['Pendente'] }
    ];

    return await queryCache.warmup(commonQueries);
  }

  /**
   * Gera relatório de performance
   */
  async generatePerformanceReport() {
    const analyzerReport = queryAnalyzer.generatePerformanceReport();
    const cacheStats = queryCache.getStats();

    return {
      ...analyzerReport,
      cache: cacheStats,
      recommendations: this.generateOptimizationRecommendations(analyzerReport, cacheStats)
    };
  }

  /**
   * Gera recomendações de otimização
   */
  generateOptimizationRecommendations(analyzerReport, cacheStats) {
    const recommendations = [];

    // Recomendações baseadas na análise de queries
    if (analyzerReport.slowQueries.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'HIGH',
        title: 'Queries Lentas Detectadas',
        description: `${analyzerReport.slowQueries.length} queries lentas foram identificadas. Considere otimizar ou adicionar índices.`,
        actions: [
          'Analisar planos de execução das queries lentas',
          'Adicionar índices apropriados',
          'Revisar lógica de queries complexas'
        ]
      });
    }

    // Recomendações baseadas no cache
    const hitRate = parseFloat(cacheStats.hitRate);
    if (hitRate < 50) {
      recommendations.push({
        type: 'cache',
        priority: 'MEDIUM',
        title: 'Taxa de Cache Baixa',
        description: `Taxa de hit do cache está em ${cacheStats.hitRate}. Considere ajustar configurações de TTL.`,
        actions: [
          'Revisar configurações de TTL',
          'Identificar queries que se beneficiariam de cache',
          'Considerar pre-warming do cache'
        ]
      });
    }

    // Recomendações de índices
    if (analyzerReport.indexSuggestions.length > 0) {
      recommendations.push({
        type: 'indexing',
        priority: 'HIGH',
        title: 'Índices Recomendados',
        description: `${analyzerReport.indexSuggestions.length} índices foram sugeridos para melhorar performance.`,
        actions: analyzerReport.indexSuggestions.map(idx =>
          `CREATE INDEX idx_${idx.table}_${idx.column} ON ${idx.table}(${idx.column})`
        ).slice(0, 5) // Mostrar apenas os 5 primeiros
      });
    }

    return recommendations;
  }

  /**
   * Otimiza automaticamente índices baseado na análise
   */
  async autoOptimizeIndexes(dryRun = true) {
    const indexSuggestions = queryAnalyzer.suggestIndexes();
    const results = [];

    for (const suggestion of indexSuggestions.slice(0, 10)) { // Limitar a 10 sugestões
      if (suggestion.priority === 'HIGH') {
        const indexName = `idx_${suggestion.table}_${suggestion.column.replace('.', '_')}`;
        const createIndexSql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${suggestion.table}(${suggestion.column})`;

        try {
          if (!dryRun) {
            await this.optimizedRun(createIndexSql, []);
          }

          results.push({
            table: suggestion.table,
            column: suggestion.column,
            indexName,
            sql: createIndexSql,
            status: dryRun ? 'planned' : 'created',
            reason: suggestion.reason
          });
        } catch (err) {
          results.push({
            table: suggestion.table,
            column: suggestion.column,
            indexName,
            status: 'error',
            error: err.message
          });
        }
      }
    }

    logger.info({
      component: 'OptimizedDatabase',
      dryRun,
      results: results.length
    }, `Auto-otimização de índices ${dryRun ? 'simulada' : 'executada'}: ${results.length} índices processados`);

    return results;
  }

  /**
   * Configura otimizações
   */
  configure(options = {}) {
    if (options.enableOptimizations !== undefined) {
      this.enableOptimizations = options.enableOptimizations;
    }

    if (options.enableProfiling !== undefined) {
      this.enableProfiling = options.enableProfiling;
    }

    if (options.slowQueryThreshold !== undefined) {
      queryAnalyzer.setSlowQueryThreshold(options.slowQueryThreshold);
    }

    if (options.cacheEnabled !== undefined) {
      queryCache.setEnabled(options.cacheEnabled);
    }

    logger.info({
      component: 'OptimizedDatabase',
      options
    }, 'Configurações de otimização atualizadas');
  }

  /**
   * Status das otimizações
   */
  getOptimizationStatus() {
    return {
      optimizationsEnabled: this.enableOptimizations,
      profilingEnabled: this.enableProfiling,
      cache: queryCache.getStats(),
      analyzer: {
        totalQueries: queryAnalyzer.queryStats.size,
        slowQueryThreshold: queryAnalyzer.slowQueryThreshold
      }
    };
  }
}

// Instância singleton
const optimizedDb = new OptimizedDatabase();

module.exports = optimizedDb;
