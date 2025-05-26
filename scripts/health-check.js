#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Health Check Script para CI/CD
 * Verifica se o servidor está funcionando corretamente
 */

const http = require('http');
const { URL } = require('url');

const DEFAULT_PORT = process.env.PORT || 3000;
const DEFAULT_HOST = process.env.HOST || 'localhost';
const TIMEOUT = parseInt(process.env.HEALTH_TIMEOUT) || 10000; // 10 segundos
const MAX_RETRIES = parseInt(process.env.HEALTH_RETRIES) || 3;
const RETRY_DELAY = parseInt(process.env.HEALTH_RETRY_DELAY) || 2000; // 2 segundos

// Endpoints para verificar
const healthEndpoints = ['/ping', '/api/system/health'];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://${DEFAULT_HOST}:${DEFAULT_PORT}${endpoint}`);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        timeout: TIMEOUT,
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonData = JSON.parse(data);
              resolve({
                endpoint,
                status: 'ok',
                statusCode: res.statusCode,
                data: jsonData,
              });
            } catch {
              resolve({
                endpoint,
                status: 'ok',
                statusCode: res.statusCode,
                data: data,
              });
            }
          } else {
            reject({
              endpoint,
              status: 'error',
              statusCode: res.statusCode,
              data: data,
            });
          }
        });
      }
    );

    req.on('error', (err) => {
      reject({
        endpoint,
        status: 'error',
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        endpoint,
        status: 'timeout',
        error: 'Request timeout',
      });
    });

    req.end();
  });
}

async function healthCheck() {
  console.log(`🏥 Iniciando health check...`);
  console.log(`🔗 Host: ${DEFAULT_HOST}:${DEFAULT_PORT}`);
  console.log(`⏱️  Timeout: ${TIMEOUT}ms`);
  console.log(`🔄 Max retries: ${MAX_RETRIES}`);

  const results = [];
  let allHealthy = true;

  for (const endpoint of healthEndpoints) {
    let success = false;
    let lastError = null;

    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        if (retry > 0) {
          console.log(`🔄 Tentativa ${retry}/${MAX_RETRIES} para ${endpoint}...`);
          await sleep(RETRY_DELAY);
        }

        const result = await checkEndpoint(endpoint);
        results.push(result);
        console.log(`✅ ${endpoint}: OK (${result.statusCode})`);
        success = true;
        break;
      } catch (error) {
        lastError = error;
        if (retry === MAX_RETRIES) {
          console.log(`❌ ${endpoint}: FALHA após ${MAX_RETRIES + 1} tentativas`);
          console.log(`   Erro: ${error.error || error.statusCode}`);
        }
      }
    }

    if (!success) {
      allHealthy = false;
      results.push(lastError);
    }
  }

  // Resumo
  console.log('\n📊 Resumo do Health Check:');
  console.log(`Total de endpoints: ${healthEndpoints.length}`);
  console.log(`Saudáveis: ${results.filter((r) => r.status === 'ok').length}`);
  console.log(`Com problemas: ${results.filter((r) => r.status !== 'ok').length}`);

  if (allHealthy) {
    console.log('\n🎉 Todos os endpoints estão saudáveis!');
    process.exit(0);
  } else {
    console.log('\n💥 Alguns endpoints falharam no health check!');
    console.log('\nDetalhes dos erros:');
    results
      .filter((r) => r.status !== 'ok')
      .forEach((result) => {
        console.log(`  - ${result.endpoint}: ${result.error || result.statusCode}`);
      });
    process.exit(1);
  }
}

// Verificar se é execução direta
if (require.main === module) {
  healthCheck().catch((error) => {
    console.error('💥 Erro inesperado no health check:', error);
    process.exit(1);
  });
}

module.exports = { healthCheck, checkEndpoint };
