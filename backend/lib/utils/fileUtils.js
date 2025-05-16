/**
 * Utilitários para operações de leitura/escrita de arquivos JSON
 * com tratamento de concorrência e segurança de dados
 */

const fs = require('fs');
const path = require('path');
const lockfile = require('proper-lockfile');

/**
 * Lê e analisa um arquivo JSON de forma assíncrona.
 *
 * @param {string} filePath - O caminho para o arquivo JSON.
 * @param {any} [defaultValueIfNotFound=[]] - O valor a retornar se o arquivo não existir.
 * @returns {Promise<any>} - Uma Promise que resolve com os dados JSON analisados ou o valor padrão.
 * @throws {Error} - Lança um erro se a leitura/análise falhar por motivos diferentes de arquivo não encontrado.
 */
async function readJsonFile(filePath, defaultValueIfNotFound = []) {
  try {
    // Verificar se o diretório do arquivo existe
    const dirPath = path.dirname(filePath);
    try {
      await fs.promises.access(dirPath);
    } catch (dirErr) {
      if (dirErr.code === 'ENOENT') {
        console.warn(
          `Diretório para ${filePath} não existe. Retornando valor padrão.`
        );
        return defaultValueIfNotFound;
      }
    }

    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(
        `Arquivo não encontrado: ${filePath}. Retornando valor padrão.`
      );
      return defaultValueIfNotFound;
    }
    if (err instanceof SyntaxError) {
      console.error(`Erro ao analisar JSON do arquivo ${filePath}:`, err);
      throw new Error(
        `Formato JSON inválido no arquivo ${path.basename(filePath)}`
      );
    }
    console.error(`Erro ao ler ou analisar arquivo JSON ${filePath}:`, err);
    throw err; // Re-throw other errors
  }
}

/**
 * Escreve dados em um arquivo JSON de forma assíncrona, garantindo que o diretório exista e usando bloqueio de arquivo.
 *
 * @param {string} filePath - O caminho para o arquivo JSON.
 * @param {any} data - Os dados a serem serializados e escritos.
 * @throws {Error} - Lança um erro se o bloqueio ou a escrita falhar.
 */
async function writeJsonFile(filePath, data) {
  let release; // Variável para armazenar a função de desbloqueio
  try {
    // Garantir que o diretório exista primeiro (criar diretórios geralmente é seguro de forma concorrente)
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    // Tentar adquirir o bloqueio para evitar corrupção de dados quando múltiplos processos tentam escrever
    release = await lockfile.lock(filePath, {
      retries: {
        retries: 5,
        factor: 3,
        minTimeout: 100,
        maxTimeout: 3000,
        randomize: true,
      },
      lockfilePath: `${filePath}.lock`, // Definir explicitamente o caminho do arquivo de bloqueio
    });

    // Escrever o arquivo agora que temos o bloqueio
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error(
      `Erro durante operação de bloqueio ou escrita para ${filePath}:`,
      err
    );

    if (err.code === 'ENOSPC') {
      throw new Error('Espaço em disco insuficiente para salvar o arquivo.');
    } else if (err.code === 'EPERM' || err.code === 'EACCES') {
      throw new Error('Permissão negada para escrever o arquivo.');
    } else if (err.message.includes('ELOCKED')) {
      throw new Error(
        'Arquivo está sendo usado por outro processo. Tente novamente em alguns instantes.'
      );
    }

    throw err; // Re-lançar erro após registro
  } finally {
    // Garantir que o bloqueio seja liberado
    if (release) {
      try {
        await release();
      } catch (unlockErr) {
        console.error(`Erro ao desbloquear arquivo ${filePath}:`, unlockErr);
      }
    }
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};
