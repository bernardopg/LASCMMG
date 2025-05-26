const { logger } = require('../logger/logger');
const { redisClient } = require('../db/redisClient');

class QueryCache {
  constructor() {
    this.memoryCache = new Map();
    this.maxMemoryCacheSize = 500;
    this.defaultTtl = 300; // 5 minutos
    this.useRedis = redisClient && redisClient.isReady;
    this.hitCount = 0;
    this.missCount = 0;
    this.enableCaching = process.env.NODE_ENV !== 'test';

    // Configuração de TTL por tipo de query
    this.ttlConfig = {
      'SELECT * FROM tournaments': 300, // 5 min
      'SELECT * FROM players': 180, // 3 min
      'SELECT * FROM scores': 120, // 2 min
      'SELECT COUNT(*)': 600, // 10 min - contadores
      'SELECT * FROM matches': 240, // 4 min
      stats: 900, // 15 min - estatísticas
      aggregate: 600, // 10 min - agregações
    };
  }

  /**
   * Gera chave de cache baseada na query e parâmetros
   */
  generateCacheKey(sql, params) {
    const normalizedSql = this.normalizeQuery(sql);
    const paramString = Array.isArray(params) ? params.join('|') : JSON.stringify(params);

    return `query:${Buffer.from(normalizedSql + paramString).toString('base64')}`;
  }

  /**
   * Normaliza query para cache
   */
  normalizeQuery(sql) {
    return sql.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /**
   * Determina TTL baseado no tipo de query
   */
  determineTtl(sql) {
    const normalizedSql = this.normalizeQuery(sql);

    // Verificar padrões específicos
    for (const [pattern, ttl] of Object.entries(this.ttlConfig)) {
      if (normalizedSql.includes(pattern.toLowerCase())) {
        return ttl;
      }
    }

    // TTL baseado no tipo de operação
    if (normalizedSql.includes('count(')) return this.ttlConfig.aggregate;
    if (normalizedSql.includes('sum(') || normalizedSql.includes('avg(')) {
      return this.ttlConfig.aggregate;
    }
    if (normalizedSql.includes('join')) return 240; // JOINs são mais caros
    if (normalizedSql.includes('group by')) return this.ttlConfig.aggregate;

    return this.defaultTtl;
  }

  /**
   * Verifica se a query deve ser cacheada
   */
  shouldCache(sql) {
    if (!this.enableCaching) return false;

    const normalizedSql = this.normalizeQuery(sql);

    // Não cachear operações de escrita
    if (
      normalizedSql.startsWith('insert') ||
      normalizedSql.startsWith('update') ||
      normalizedSql.startsWith('delete')
    ) {
      return false;
    }

    // Não cachear queries com CURRENT_TIMESTAMP ou NOW()
    if (normalizedSql.includes('current_timestamp') || normalizedSql.includes('now()')) {
      return false;
    }

    // Cachear apenas SELECT queries
    return normalizedSql.startsWith('select');
  }

  /**
   * Busca resultado no cache
   */
  async get(sql, params) {
    if (!this.shouldCache(sql)) return null;

    const key = this.generateCacheKey(sql, params);

    try {
      // Tentar Redis primeiro
      if (this.useRedis) {
        const cached = await redisClient.get(key);
        if (cached) {
          this.hitCount++;
          logger.debug(
            {
              component: 'QueryCache',
              key,
              source: 'redis',
            },
            'Cache hit no Redis'
          );
          return JSON.parse(cached);
        }
      }

      // Fallback para memory cache
      if (this.memoryCache.has(key)) {
        const entry = this.memoryCache.get(key);
        if (entry.expires > Date.now()) {
          this.hitCount++;
          logger.debug(
            {
              component: 'QueryCache',
              key,
              source: 'memory',
            },
            'Cache hit na memória'
          );
          return entry.data;
        } else {
          this.memoryCache.delete(key);
        }
      }

      this.missCount++;
      return null;
    } catch (err) {
      logger.error(
        {
          component: 'QueryCache',
          err,
          key,
        },
        'Erro ao buscar no cache'
      );
      this.missCount++;
      return null;
    }
  }

  /**
   * Armazena resultado no cache
   */
  async set(sql, params, result) {
    if (!this.shouldCache(sql) || !result) return;

    const key = this.generateCacheKey(sql, params);
    const ttl = this.determineTtl(sql);

    try {
      // Armazenar no Redis se disponível
      if (this.useRedis) {
        await redisClient.setEx(key, ttl, JSON.stringify(result));
        logger.debug(
          {
            component: 'QueryCache',
            key,
            ttl,
            resultSize: JSON.stringify(result).length,
          },
          'Cache armazenado no Redis'
        );
      }

      // Armazenar também na memória como fallback
      this.manageMemoryCacheSize();
      this.memoryCache.set(key, {
        data: result,
        expires: Date.now() + ttl * 1000,
      });

      logger.debug(
        {
          component: 'QueryCache',
          key,
          ttl,
        },
        'Cache armazenado na memória'
      );
    } catch (err) {
      logger.error(
        {
          component: 'QueryCache',
          err,
          key,
        },
        'Erro ao armazenar no cache'
      );
    }
  }

  /**
   * Gerencia tamanho do cache em memória
   */
  manageMemoryCacheSize() {
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      // Remove entradas mais antigas (LRU)
      const keysToRemove = [];
      let count = 0;
      const maxToRemove = Math.floor(this.maxMemoryCacheSize * 0.1); // Remove 10%

      for (const [key, entry] of this.memoryCache) {
        if (entry.expires < Date.now() || count < maxToRemove) {
          keysToRemove.push(key);
          count++;
        }
        if (count >= maxToRemove) break;
      }

      keysToRemove.forEach((key) => this.memoryCache.delete(key));

      logger.debug(
        {
          component: 'QueryCache',
          removed: keysToRemove.length,
          remaining: this.memoryCache.size,
        },
        'Limpeza do cache de memória'
      );
    }
  }

  /**
   * Invalida cache baseado em padrões
   */
  async invalidate(patterns) {
    if (!Array.isArray(patterns)) {
      patterns = [patterns];
    }

    let invalidatedCount = 0;

    try {
      // Invalidar no Redis
      if (this.useRedis) {
        for (const pattern of patterns) {
          const keys = await redisClient.keys(`query:*${pattern}*`);
          if (keys.length > 0) {
            await redisClient.del(keys);
            invalidatedCount += keys.length;
          }
        }
      }

      // Invalidar na memória
      for (const [key] of this.memoryCache) {
        for (const pattern of patterns) {
          if (key.includes(pattern)) {
            this.memoryCache.delete(key);
            invalidatedCount++;
            break;
          }
        }
      }

      logger.info(
        {
          component: 'QueryCache',
          patterns,
          invalidatedCount,
        },
        'Cache invalidado'
      );
    } catch (err) {
      logger.error(
        {
          component: 'QueryCache',
          err,
          patterns,
        },
        'Erro ao invalidar cache'
      );
    }

    return invalidatedCount;
  }

  /**
   * Invalida cache por tabela
   */
  async invalidateTable(tableName) {
    return await this.invalidate([
      `from ${tableName}`,
      `join ${tableName}`,
      `update ${tableName}`,
      `into ${tableName}`,
    ]);
  }

  /**
   * Invalida cache por torneio
   */
  async invalidateTournament(tournamentId) {
    return await this.invalidate([
      `tournament_id = ${tournamentId}`,
      `tournament_id=${tournamentId}`,
      `"${tournamentId}"`,
    ]);
  }

  /**
   * Limpa todo o cache
   */
  async clear() {
    try {
      if (this.useRedis) {
        const keys = await redisClient.keys('query:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }

      this.memoryCache.clear();
      this.hitCount = 0;
      this.missCount = 0;

      logger.info(
        {
          component: 'QueryCache',
        },
        'Cache limpo completamente'
      );
    } catch (err) {
      logger.error(
        {
          component: 'QueryCache',
          err,
        },
        'Erro ao limpar cache'
      );
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? ((this.hitCount / totalRequests) * 100).toFixed(2) : 0;

    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: `${hitRate}%`,
      memoryCacheSize: this.memoryCache.size,
      maxMemoryCacheSize: this.maxMemoryCacheSize,
      redisAvailable: this.useRedis,
      enabled: this.enableCaching,
    };
  }

  /**
   * Aquece o cache com queries comuns
   */
  async warmup(queries = []) {
    const defaultQueries = [
      {
        sql: 'SELECT COUNT(*) as total FROM tournaments WHERE (is_deleted = 0 OR is_deleted IS NULL)',
        params: [],
      },
      {
        sql: 'SELECT COUNT(*) as total FROM players WHERE (is_deleted = 0 OR is_deleted IS NULL)',
        params: [],
      },
      {
        sql: 'SELECT COUNT(*) as total FROM scores WHERE (is_deleted = 0 OR is_deleted IS NULL)',
        params: [],
      },
    ];

    const queriesToWarm = queries.length > 0 ? queries : defaultQueries;
    let warmedCount = 0;

    for (const { sql, params } of queriesToWarm) {
      try {
        this.generateCacheKey(sql, params);
        const cached = await this.get(sql, params);

        if (!cached) {
          // Simular resultado para aquecimento - na implementação real
          // isso seria feito executando a query real
          await this.set(sql, params, { warmed: true, timestamp: new Date() });
          warmedCount++;
        }
      } catch (err) {
        logger.error(
          {
            component: 'QueryCache',
            err,
            sql,
          },
          'Erro ao aquecer cache'
        );
      }
    }

    logger.info(
      {
        component: 'QueryCache',
        warmedCount,
        totalQueries: queriesToWarm.length,
      },
      'Cache aquecido'
    );

    return warmedCount;
  }

  /**
   * Configura TTL personalizado para padrão de query
   */
  setTtlConfig(pattern, ttl) {
    this.ttlConfig[pattern] = ttl;
    logger.info(
      {
        component: 'QueryCache',
        pattern,
        ttl,
      },
      'Configuração TTL atualizada'
    );
  }

  /**
   * Habilita ou desabilita cache
   */
  setEnabled(enabled) {
    this.enableCaching = enabled;
    logger.info(
      {
        component: 'QueryCache',
        enabled,
      },
      'Cache habilitado/desabilitado'
    );
  }
}

// Instância singleton
const queryCache = new QueryCache();

module.exports = queryCache;
