const { logger } = require('../logger/logger');
const { getSyncConnection } = require('../db/database');

class QueryAnalyzer {
  constructor() {
    this.queryStats = new Map();
    this.slowQueryThreshold = 100; // ms
    this.enableProfiling = process.env.NODE_ENV !== 'production';
    this.maxStatsEntries = 1000;
  }

  /**
   * Analisa e registra estatísticas de performance de uma query
   */
  analyzeQuery(sql, params, executionTime, rowCount = 0) {
    if (!this.enableProfiling) return;

    const queryKey = this.normalizeQuery(sql);
    const stats = this.queryStats.get(queryKey) || {
      query: sql,
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      slowExecutions: 0,
      lastExecuted: null,
      params: []
    };

    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.minTime = Math.min(stats.minTime, executionTime);
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.lastExecuted = new Date();

    if (executionTime > this.slowQueryThreshold) {
      stats.slowExecutions++;

      // Log query lenta
      logger.warn({
        component: 'QueryAnalyzer',
        sql: sql,
        params: params,
        executionTime: executionTime,
        rowCount: rowCount
      }, `Query lenta detectada: ${executionTime}ms`);
    }

    // Armazenar exemplos de parâmetros para análise
    if (stats.params.length < 5) {
      stats.params.push(params);
    }

    this.queryStats.set(queryKey, stats);

    // Limitar o número de entradas para evitar vazamento de memória
    if (this.queryStats.size > this.maxStatsEntries) {
      const oldestKey = this.queryStats.keys().next().value;
      this.queryStats.delete(oldestKey);
    }
  }

  /**
   * Normaliza a query removendo valores específicos para agrupamento
   */
  normalizeQuery(sql) {
    return sql
      .replace(/\?/g, '?')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Retorna relatório de queries lentas
   */
  getSlowQueriesReport() {
    const slowQueries = Array.from(this.queryStats.entries())
      .filter(([_, stats]) => stats.slowExecutions > 0)
      .sort((a, b) => b[1].maxTime - a[1].maxTime)
      .slice(0, 20);

    return slowQueries.map(([queryKey, stats]) => ({
      query: stats.query,
      count: stats.count,
      slowExecutions: stats.slowExecutions,
      avgTime: Math.round(stats.avgTime * 100) / 100,
      maxTime: stats.maxTime,
      slowRatio: (stats.slowExecutions / stats.count * 100).toFixed(2) + '%'
    }));
  }

  /**
   * Retorna relatório de queries mais frequentes
   */
  getFrequentQueriesReport() {
    const frequentQueries = Array.from(this.queryStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20);

    return frequentQueries.map(([queryKey, stats]) => ({
      query: stats.query,
      count: stats.count,
      avgTime: Math.round(stats.avgTime * 100) / 100,
      totalTime: Math.round(stats.totalTime),
      lastExecuted: stats.lastExecuted
    }));
  }

  /**
   * Analisa o plano de execução de uma query
   */
  async analyzeQueryPlan(sql, params = []) {
    try {
      const db = getSyncConnection();
      const explainSql = `EXPLAIN QUERY PLAN ${sql}`;
      const stmt = db.prepare(explainSql);

      let plan;
      if (Array.isArray(params) && params.length > 0) {
        plan = stmt.all(...params);
      } else if (params && typeof params === 'object') {
        plan = stmt.all(params);
      } else {
        plan = stmt.all();
      }

      return this.parseQueryPlan(plan);
    } catch (err) {
      logger.error({
        component: 'QueryAnalyzer',
        err,
        sql,
        params
      }, 'Erro ao analisar plano de execução');
      return null;
    }
  }

  /**
   * Analisa o plano de execução e identifica problemas
   */
  parseQueryPlan(plan) {
    const analysis = {
      hasTableScan: false,
      hasIndexScan: false,
      missingIndexes: [],
      recommendations: [],
      operations: []
    };

    for (const step of plan) {
      const detail = step.detail.toLowerCase();

      analysis.operations.push({
        id: step.id,
        parent: step.parent,
        detail: step.detail
      });

      // Detectar table scans
      if (detail.includes('scan table')) {
        analysis.hasTableScan = true;
        const tableName = this.extractTableName(detail);
        if (tableName) {
          analysis.recommendations.push(
            `Consider adding an index to table '${tableName}' to avoid full table scan`
          );
        }
      }

      // Detectar index scans
      if (detail.includes('search table') && detail.includes('using index')) {
        analysis.hasIndexScan = true;
      }

      // Detectar potential missing indexes
      if (detail.includes('using covering index') === false &&
          detail.includes('search table')) {
        const tableName = this.extractTableName(detail);
        if (tableName) {
          analysis.missingIndexes.push(tableName);
        }
      }
    }

    return analysis;
  }

  /**
   * Extrai nome da tabela de uma descrição do plano
   */
  extractTableName(detail) {
    const match = detail.match(/table (\w+)/);
    return match ? match[1] : null;
  }

  /**
   * Identifica queries que se beneficiariam de índices
   */
  suggestIndexes() {
    const suggestions = [];

    for (const [_, stats] of this.queryStats) {
      if (stats.avgTime > this.slowQueryThreshold || stats.slowExecutions > 0) {
        const sql = stats.query.toLowerCase();

        // Analisar WHERE clauses
        const whereMatches = sql.match(/where\s+(.+?)(?:\s+order\s+by|\s+group\s+by|\s+limit|$)/i);
        if (whereMatches) {
          const whereClause = whereMatches[1];
          const columns = this.extractColumnsFromWhere(whereClause);

          for (const column of columns) {
            suggestions.push({
              table: this.extractTableFromQuery(sql),
              column: column,
              reason: `Frequent WHERE clause usage (${stats.count} times, avg: ${stats.avgTime}ms)`,
              priority: stats.slowExecutions > 0 ? 'HIGH' : 'MEDIUM'
            });
          }
        }

        // Analisar JOINs
        const joinMatches = sql.match(/join\s+(\w+)\s+.*?on\s+(.+?)(?:\s+where|\s+order|\s+group|$)/gi);
        if (joinMatches) {
          for (const joinMatch of joinMatches) {
            const onClause = joinMatch.match(/on\s+(.+?)(?:\s+where|\s+order|\s+group|$)/i);
            if (onClause) {
              const joinColumns = this.extractColumnsFromWhere(onClause[1]);
              for (const column of joinColumns) {
                suggestions.push({
                  table: 'detected_in_join',
                  column: column,
                  reason: `JOIN condition optimization (${stats.count} times)`,
                  priority: 'HIGH'
                });
              }
            }
          }
        }
      }
    }

    return this.deduplicateSuggestions(suggestions);
  }

  /**
   * Extrai colunas de uma cláusula WHERE
   */
  extractColumnsFromWhere(whereClause) {
    const columns = [];

    // Padrões comuns: column = ?, column IN (?), column LIKE ?
    const patterns = [
      /(\w+\.?\w+)\s*[=<>!]/g,
      /(\w+\.?\w+)\s+in\s*\(/gi,
      /(\w+\.?\w+)\s+like\s/gi,
      /(\w+\.?\w+)\s+between\s/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(whereClause)) !== null) {
        columns.push(match[1]);
      }
    }

    return [...new Set(columns)]; // Remover duplicatas
  }

  /**
   * Extrai nome da tabela principal da query
   */
  extractTableFromQuery(sql) {
    const match = sql.match(/from\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  /**
   * Remove sugestões duplicadas de índices
   */
  deduplicateSuggestions(suggestions) {
    const unique = new Map();

    for (const suggestion of suggestions) {
      const key = `${suggestion.table}.${suggestion.column}`;
      if (!unique.has(key) || suggestion.priority === 'HIGH') {
        unique.set(key, suggestion);
      }
    }

    return Array.from(unique.values())
      .sort((a, b) => {
        if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
        if (b.priority === 'HIGH' && a.priority !== 'HIGH') return 1;
        return 0;
      });
  }

  /**
   * Gera relatório completo de performance
   */
  generatePerformanceReport() {
    return {
      summary: {
        totalQueries: this.queryStats.size,
        totalExecutions: Array.from(this.queryStats.values())
          .reduce((sum, stats) => sum + stats.count, 0),
        slowQueries: Array.from(this.queryStats.values())
          .filter(stats => stats.slowExecutions > 0).length,
        avgQueryTime: this.calculateOverallAvgTime()
      },
      slowQueries: this.getSlowQueriesReport(),
      frequentQueries: this.getFrequentQueriesReport(),
      indexSuggestions: this.suggestIndexes(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calcula tempo médio geral de todas as queries
   */
  calculateOverallAvgTime() {
    const stats = Array.from(this.queryStats.values());
    if (stats.length === 0) return 0;

    const totalTime = stats.reduce((sum, stat) => sum + stat.totalTime, 0);
    const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);

    return totalCount > 0 ? Math.round((totalTime / totalCount) * 100) / 100 : 0;
  }

  /**
   * Reseta estatísticas
   */
  reset() {
    this.queryStats.clear();
    logger.info({ component: 'QueryAnalyzer' }, 'Estatísticas de query resetadas');
  }

  /**
   * Define threshold para queries lentas
   */
  setSlowQueryThreshold(ms) {
    this.slowQueryThreshold = ms;
    logger.info({
      component: 'QueryAnalyzer',
      threshold: ms
    }, 'Threshold de query lenta atualizado');
  }
}

// Instância singleton
const queryAnalyzer = new QueryAnalyzer();

module.exports = queryAnalyzer;
