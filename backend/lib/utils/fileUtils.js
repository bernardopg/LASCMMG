const fs = require('fs');
const path = require('path');
const lockfile = require('proper-lockfile');
const { logger } = require('../logger/logger'); // Importar logger

async function readJsonFile(filePath, defaultValueIfNotFound = []) {
  try {
    // Verificar se o diretório do arquivo existe
    const dirPath = path.dirname(filePath);
    try {
      await fs.promises.access(dirPath);
    } catch (dirErr) {
      if (dirErr.code === 'ENOENT') {
        logger.warn(
          { component: 'FileUtils', path: filePath, err: dirErr },
          `Diretório para ${filePath} não existe. Retornando valor padrão.`
        );
        return defaultValueIfNotFound;
      }
      // Se o erro não for ENOENT ao acessar o diretório, relançar.
      throw dirErr;
    }

    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.warn(
        { component: 'FileUtils', path: filePath },
        `Arquivo não encontrado: ${filePath}. Retornando valor padrão.`
      );
      return defaultValueIfNotFound;
    }
    if (err instanceof SyntaxError) {
      logger.error(
        { component: 'FileUtils', path: filePath, err },
        `Erro ao analisar JSON do arquivo ${filePath}.`
      );
      throw new Error(`Formato JSON inválido no arquivo ${path.basename(filePath)}`);
    }
    logger.error(
      { component: 'FileUtils', path: filePath, err },
      `Erro ao ler ou analisar arquivo JSON ${filePath}.`
    );
    throw err; // Re-throw other errors
  }
}

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
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    logger.error(
      { component: 'FileUtils', path: filePath, err },
      `Erro durante operação de bloqueio ou escrita para ${filePath}.`
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
        logger.error(
          { component: 'FileUtils', path: filePath, err: unlockErr },
          `Erro ao desbloquear arquivo ${filePath}.`
        );
      }
    }
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};
