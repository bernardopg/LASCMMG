/* eslint-disable no-undef */

/* eslint-env browser, node */
/**
 * Configuração para testes unitários
 *
 * Este arquivo configura o ambiente para testes unitários no projeto.
 * Utiliza uma abordagem simples sem dependências externas.
 */

// Configurar ambiente global de teste
globalThis.testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: [],
  currentSuite: null,
};

/**
 * Inicia uma nova suíte de testes
 * @param {string} name - Nome da suíte de testes
 * @param {Function} callback - Função contendo os testes
 */
globalThis.describe = (name, callback) => {
  const suite = {
    name,
    tests: [],
    beforeEachFns: [],
    afterEachFns: [],
  };

  testResults.suites.push(suite);
  testResults.currentSuite = suite;

  try {
    callback();
  } catch (error) {
    console.error(`Erro na suíte "${name}":`, error);
  }

  testResults.currentSuite = null;
};

/**
 * Define um teste
 * @param {string} name - Nome do teste
 * @param {Function} callback - Função do teste
 */
globalThis.test = (name, callback) => {
  if (!testResults.currentSuite) {
    throw new Error('teste deve ser definido dentro de uma suíte (describe)');
  }

  const suite = testResults.currentSuite;

  const testFn = async () => {
    testResults.total++;

    try {
      // Executar beforeEach hooks
      for (const beforeEachFn of suite.beforeEachFns) {
        await beforeEachFn();
      }

      // Executar o teste
      await callback();

      // Se chegou aqui, o teste passou
      testResults.passed++;
      console.log(`✅ PASSOU: ${suite.name} > ${name}`);

      // Executar afterEach hooks
      for (const afterEachFn of suite.afterEachFns) {
        await afterEachFn();
      }

      return true;
    } catch (error) {
      testResults.failed++;
      console.error(`❌ FALHOU: ${suite.name} > ${name}`);
      console.error('  Erro:', error.message);
      console.error('  Stack:', error.stack);

      // Mesmo em caso de falha, executar afterEach hooks
      try {
        for (const afterEachFn of suite.afterEachFns) {
          await afterEachFn();
        }
      } catch (afterError) {
        console.error('  Erro em afterEach:', afterError);
      }

      return false;
    }
  };

  suite.tests.push({ name, test: testFn });
};

/**
 * Define uma função para executar antes de cada teste
 * @param {Function} callback - Função a ser executada
 */
globalThis.beforeEach = (callback) => {
  if (!testResults.currentSuite) {
    throw new Error(
      'beforeEach deve ser definido dentro de uma suíte (describe)'
    );
  }

  testResults.currentSuite.beforeEachFns.push(callback);
};

/**
 * Define uma função para executar após cada teste
 * @param {Function} callback - Função a ser executada
 */
globalThis.afterEach = (callback) => {
  if (!testResults.currentSuite) {
    throw new Error(
      'afterEach deve ser definido dentro de uma suíte (describe)'
    );
  }

  testResults.currentSuite.afterEachFns.push(callback);
};

// Funções de asserção

/**
 * Verifica se dois valores são iguais
 * @param {any} actual - Valor atual
 * @param {any} expected - Valor esperado
 * @param {string} [message] - Mensagem opcional
 */
globalThis.expect = (actual) => {
  return {
    toBe: (expected, message) => {
      if (actual !== expected) {
        throw new Error(
          message ||
            `Esperado ${JSON.stringify(expected)}, mas recebeu ${JSON.stringify(actual)}`
        );
      }
    },

    toEqual: (expected, message) => {
      const actualJSON = JSON.stringify(actual);
      const expectedJSON = JSON.stringify(expected);

      if (actualJSON !== expectedJSON) {
        throw new Error(
          message || `Esperado ${expectedJSON}, mas recebeu ${actualJSON}`
        );
      }
    },

    toContain: (expected, message) => {
      if (Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new Error(
            message ||
              `Esperado que o array contenha ${JSON.stringify(expected)}, mas não contém`
          );
        }
      } else if (typeof actual === 'string') {
        if (!actual.includes(expected)) {
          throw new Error(
            message ||
              `Esperado que a string contenha "${expected}", mas não contém`
          );
        }
      } else {
        throw new Error(
          message || 'toContain só pode ser usado com arrays ou strings'
        );
      }
    },

    toHaveProperty: (prop, value, message) => {
      if (!actual || typeof actual !== 'object') {
        throw new Error(
          message || `Esperado um objeto, mas recebeu ${typeof actual}`
        );
      }

      if (!(prop in actual)) {
        throw new Error(
          message ||
            `Esperado que o objeto tenha a propriedade "${prop}", mas não tem`
        );
      }

      if (value !== undefined && actual[prop] !== value) {
        throw new Error(
          message ||
            `Esperado que a propriedade "${prop}" seja ${JSON.stringify(value)}, mas recebeu ${JSON.stringify(actual[prop])}`
        );
      }
    },

    toBeTruthy: (message) => {
      if (!actual) {
        throw new Error(
          message || `Esperado valor verdadeiro, mas recebeu ${actual}`
        );
      }
    },

    toBeFalsy: (message) => {
      if (actual) {
        throw new Error(
          message || `Esperado valor falso, mas recebeu ${actual}`
        );
      }
    },

    toThrow: (expected, message) => {
      if (typeof actual !== 'function') {
        throw new Error(message || 'toThrow só pode ser usado com funções');
      }

      try {
        actual();
        throw new Error(
          message || 'Esperado que a função lance uma exceção, mas não lançou'
        );
      } catch (error) {
        if (expected) {
          if (
            typeof expected === 'string' &&
            !error.message.includes(expected)
          ) {
            throw new Error(
              message ||
                `Esperado que a exceção contenha "${expected}", mas recebeu "${error.message}"`
            );
          } else if (
            expected instanceof RegExp &&
            !expected.test(error.message)
          ) {
            throw new Error(
              message ||
                `Esperado que a exceção corresponda a ${expected}, mas recebeu "${error.message}"`
            );
          } else if (
            typeof expected === 'function' &&
            !(error instanceof expected)
          ) {
            throw new Error(
              message ||
                `Esperado exceção do tipo ${expected.name}, mas recebeu ${error.constructor.name}`
            );
          }
        }
      }
    },
  };
};

/**
 * Executor de testes
 * Executa todos os testes e gera um relatório
 */
globalThis.runTests = async () => {
  console.log('Iniciando execução de testes...');

  for (const suite of testResults.suites) {
    console.log(`\n📁 Suíte: ${suite.name}`);

    for (const testItem of suite.tests) {
      await testItem.test();
    }
  }

  console.log('\n📊 Resultados:');
  console.log(`Total: ${testResults.total}`);
  console.log(`Passou: ${testResults.passed}`);
  console.log(`Falhou: ${testResults.failed}`);

  return {
    success: testResults.failed === 0,
    results: testResults,
  };
};

// Definir variáveis locais para exportação
const describe = globalThis.describe;
const test = globalThis.test;
const beforeEach = globalThis.beforeEach;
const afterEach = globalThis.afterEach;
const expect = globalThis.expect;
const runTests = globalThis.runTests;

// Exportar funções para uso em módulos
export { describe, test, beforeEach, afterEach, expect, runTests };
