#!/usr/bin/env node

/**
 * Sistema de Detecção de Código Morto
 *
 * Este script analisa o código JavaScript do frontend para identificar:
 * - Funções definidas mas nunca chamadas
 * - Variáveis declaradas mas nunca utilizadas
 * - Código inalcançável
 * - Imports não utilizados
 *
 * Uso: node scripts/detect-dead-code.js [--fix] [--verbose] [diretórios]
 * Exemplo: node scripts/detect-dead-code.js --verbose js/admin js/main
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { program } = require('commander');

// Configuração do script
program
  .description('Detecta código morto no frontend')
  .option('--fix', 'Remove automaticamente o código morto quando possível')
  .option('--verbose', 'Exibe informações detalhadas durante a análise')
  .option('--output <file>', 'Salva o relatório em um arquivo')
  .option('--threshold <number>', 'Define o limiar de confiança (1-100)', 70)
  .option(
    '--ignore <patterns>',
    'Padrões de arquivos a ignorar (separados por vírgula)'
  )
  .arguments('[diretórios...]')
  .parse(process.argv);

const options = program.opts();
const searchDirs = program.args.length ? program.args : ['js']; // Padrão: diretório 'js'
const FIX_MODE = options.fix || false;
const VERBOSE = options.verbose || false;
const OUTPUT_FILE = options.output;
const CONFIDENCE_THRESHOLD = parseInt(options.threshold) || 70;
const IGNORE_PATTERNS = options.ignore ? options.ignore.split(',') : [];

// Adicionar padrões de ignorar padrão
IGNORE_PATTERNS.push(
  '*.min.js',
  'vendor/**',
  'node_modules/**',
  'dist/**',
  '**/__tests__/**'
);

// Variáveis para armazenar os resultados
const results = {
  unusedFunctions: [],
  unusedVariables: [],
  unreachableCode: [],
  unusedImports: [],
  deadFiles: [],
  summary: {
    totalFiles: 0,
    filesWithIssues: 0,
    totalIssues: 0,
    fixedIssues: 0,
  },
};

// Verificar se as ferramentas necessárias estão instaladas
function checkDependencies() {
  try {
    // Verificar se eslint está instalado
    execSync('npx eslint --version', { stdio: 'ignore' });

    // Verificar se temos o plugin no-unused-vars
    const eslintConfig = path.join(process.cwd(), '.eslintrc.json');
    if (!fs.existsSync(eslintConfig)) {
      console.log(
        'Aviso: Arquivo .eslintrc.json não encontrado. Criando configuração básica...'
      );
      // Criar configuração básica se não existir
      const basicConfig = {
        env: {
          browser: true,
          es2021: true,
        },
        extends: 'eslint:recommended',
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
        rules: {
          'no-unused-vars': 'warn',
          'no-unreachable': 'warn',
        },
      };
      fs.writeFileSync(eslintConfig, JSON.stringify(basicConfig, null, 2));
    }

    return true;
  } catch {
    console.error('Erro: ESLint não está instalado ou não pode ser executado.');
    console.error('Por favor, instale as dependências necessárias com:');
    console.error('npm install --save-dev eslint eslint-plugin-import');
    return false;
  }
}

// Encontrar todos os arquivos JavaScript nos diretórios especificados
function findJavaScriptFiles(dirs) {
  let files = [];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) {
      if (VERBOSE) console.log(`Diretório não encontrado: ${dir}`);
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Verificar se o arquivo/diretório deve ser ignorado
      const relativePath = path.relative(process.cwd(), fullPath);
      if (
        IGNORE_PATTERNS.some((pattern) => {
          if (pattern.includes('*')) {
            // Regex simples para padrões glob
            const regex = new RegExp(
              '^' +
                pattern
                  .split('*')
                  .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                  .join('.*') +
                '$'
            );
            return regex.test(relativePath);
          }
          return relativePath.includes(pattern);
        })
      ) {
        if (VERBOSE) console.log(`Ignorando: ${relativePath}`);
        continue;
      }

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (
        entry.name.endsWith('.js') &&
        !entry.name.endsWith('.min.js')
      ) {
        files.push(fullPath);
      }
    }
  }

  dirs.forEach(scanDir);

  if (VERBOSE) {
    console.log(`Encontrados ${files.length} arquivos JavaScript para análise`);
  }

  return files;
}

// Analisar um arquivo usando ESLint
function analyzeFile(filePath) {
  try {
    // Executar ESLint no arquivo
    const output = execSync(`npx eslint "${filePath}" -f json`, {
      encoding: 'utf8',
    });
    const eslintResults = JSON.parse(output);

    if (
      eslintResults.length === 0 ||
      !eslintResults[0].messages ||
      eslintResults[0].messages.length === 0
    ) {
      return null; // Nenhum problema encontrado
    }

    return eslintResults[0];
  } catch (error) {
    // ESLint pode falhar, mas ainda retornar resultados em formato JSON
    try {
      const jsonStart = error.stdout.indexOf('[{');
      if (jsonStart >= 0) {
        const jsonResult = error.stdout.substring(jsonStart);
        const eslintResults = JSON.parse(jsonResult);

        if (eslintResults.length > 0) {
          return eslintResults[0];
        }
      }
    } catch {
      // Ignorar erro de parsing
    }

    if (VERBOSE) {
      console.error(`Erro ao analisar ${filePath}:`, error.message);
    }
    return null;
  }
}

// Analisar imports e exports entre arquivos para detectar código não utilizado
function analyzeImports(files) {
  const exportedItems = new Map(); // arquivo -> [itens exportados]
  const importedItems = new Map(); // arquivo -> { de: arquivo, itens: [itens importados] }

  // Primeiro passo: catalogar todos os exports
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const exports = [];

    // Procurar por exports nomeados ou default
    const exportRegex =
      /export\s+(const|let|var|function|class|default)\s+([a-zA-Z0-9_$]+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1] === 'default') {
        exports.push('default');
      } else {
        exports.push(match[2]);
      }
    }

    // Procurar pelo padrão "export { x, y, z }"
    const namedExportsRegex = /export\s+\{([^}]+)\}/g;
    while ((match = namedExportsRegex.exec(content)) !== null) {
      const namedExports = match[1].split(',').map((e) => {
        // Capturar aliases: "export { x as y }"
        const aliasMatch = e
          .trim()
          .match(/([a-zA-Z0-9_$]+)(?:\s+as\s+([a-zA-Z0-9_$]+))?/);
        return aliasMatch ? aliasMatch[2] || aliasMatch[1] : e.trim();
      });
      exports.push(...namedExports);
    }

    if (exports.length > 0) {
      exportedItems.set(file, exports);
      if (VERBOSE) {
        console.log(
          `Arquivo ${path.relative(process.cwd(), file)} exporta: ${exports.join(', ')}`
        );
      }
    }
  });

  // Segundo passo: catalogar todos os imports
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const imports = [];

    // Procurar por imports
    const importRegex =
      /import\s+(?:{([^}]+)}|([a-zA-Z0-9_$]+))\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importSource = match[3];

      // Converter caminho relativo para absoluto
      let absoluteImportPath;
      if (importSource.startsWith('./') || importSource.startsWith('../')) {
        absoluteImportPath = path.resolve(path.dirname(file), importSource);

        // Adicionar extensão .js se não houver
        if (!absoluteImportPath.endsWith('.js')) {
          absoluteImportPath += '.js';
        }
      } else {
        // Import de módulo externo (node_modules), ignorar
        continue;
      }

      const importedFrom = {
        source: absoluteImportPath,
        items: [],
      };

      if (match[1]) {
        // Import nomeado: import { x, y as z } from './file'
        const namedImports = match[1].split(',').map((i) => {
          // Capturar aliases: "import { x as y }"
          const aliasMatch = i
            .trim()
            .match(/([a-zA-Z0-9_$]+)(?:\s+as\s+([a-zA-Z0-9_$]+))?/);
          return aliasMatch ? aliasMatch[1] : i.trim();
        });
        importedFrom.items = namedImports;
      } else if (match[2]) {
        // Import default: import X from './file'
        importedFrom.items = ['default'];
      }

      imports.push(importedFrom);
    }

    if (imports.length > 0) {
      importedItems.set(file, imports);
    }
  });

  // Terceiro passo: identificar exports não utilizados
  const unusedExports = [];

  exportedItems.forEach((exports, file) => {
    const unusedInFile = [...exports];

    importedItems.forEach((imports) => {
      imports.forEach((importedFrom) => {
        if (importedFrom.source === file) {
          // Remover itens importados da lista de não utilizados
          importedFrom.items.forEach((item) => {
            const index = unusedInFile.indexOf(item);
            if (index !== -1) {
              unusedInFile.splice(index, 1);
            }
          });
        }
      });
    });

    if (unusedInFile.length > 0) {
      unusedExports.push({
        file,
        unusedExports: unusedInFile,
      });
    }
  });

  // Arquivos importados que não existem
  const missingImports = [];

  importedItems.forEach((imports, file) => {
    imports.forEach((importedFrom) => {
      if (!fs.existsSync(importedFrom.source)) {
        missingImports.push({
          file,
          missingImport: importedFrom.source,
        });
      }
    });
  });

  // Arquivos não importados por ninguém (possíveis arquivos mortos)
  const filesNeverImported = [];

  files.forEach((file) => {
    // Pular arquivos de entrada como index.js, main.js, app.js, etc.
    const fileName = path.basename(file);
    if (
      ['index.js', 'main.js', 'app.js', 'adminApp.js', 'mainApp.js'].includes(
        fileName
      )
    ) {
      return;
    }

    let isImported = false;
    importedItems.forEach((imports) => {
      if (imports.some((imp) => imp.source === file)) {
        isImported = true;
      }
    });

    if (!isImported) {
      filesNeverImported.push(file);
    }
  });

  return {
    unusedExports,
    missingImports,
    filesNeverImported,
  };
}

// Detectar funções não utilizadas em um arquivo
function detectUnusedFunctions(fileContent, _filePath) {
  const lines = fileContent.split('\n');
  const unusedFunctions = [];

  // Análise simples para encontrar definições de funções
  const functionRegex =
    /(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/g;

  let match;
  while ((match = functionRegex.exec(fileContent)) !== null) {
    const functionName = match[1] || match[2];
    const line = fileContent.substring(0, match.index).split('\n').length;

    // Verificar se a função é chamada em qualquer lugar do arquivo
    // (análise básica, pode ter falsos positivos)
    const functionCallRegex = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
    let isCalled = false;
    let callMatch = null;

    while ((callMatch = functionCallRegex.exec(fileContent)) !== null) {
      // Ignorar a própria definição
      if (Math.abs(callMatch.index - match.index) > 50) {
        isCalled = true;
        break;
      }
    }

    // Também verificar se a função é exportada
    const exportRegex = new RegExp(
      `export\\s+(?:function\\s+${functionName}|{[^}]*\\b${functionName}\\b[^}]*}|default\\s+${functionName})`,
      'g'
    );
    const isExported = exportRegex.test(fileContent);

    if (!isCalled && !isExported) {
      const lineContent = lines[line - 1].trim();

      // Verificar se não é parte de uma classe/objeto
      if (!lineContent.includes('class') && !lineContent.includes(':')) {
        unusedFunctions.push({
          name: functionName,
          line,
          confidence: 85, // Confiança média-alta, pode ter falsos positivos
          context: lineContent,
        });
      }
    }
  }

  return unusedFunctions;
}

// Verificar variáveis não utilizadas (usando resultado do ESLint)
function detectUnusedVariables(eslintResult, _filePath) {
  if (!eslintResult || !eslintResult.messages) return [];

  const unusedVars = eslintResult.messages
    .filter((msg) => msg.ruleId === 'no-unused-vars')
    .map((msg) => ({
      name: msg.message.split("'")[1], // Extrair nome da variável
      line: msg.line,
      confidence: 95, // Alta confiança, vem do ESLint
      context: `Linha ${msg.line}:${msg.column}`,
    }));

  return unusedVars;
}

// Verificar código inalcançável (usando resultado do ESLint)
function detectUnreachableCode(eslintResult, _filePath) {
  if (!eslintResult || !eslintResult.messages) return [];

  const unreachableCode = eslintResult.messages
    .filter((msg) => msg.ruleId === 'no-unreachable')
    .map((msg) => ({
      line: msg.line,
      confidence: 98, // Muito alta confiança, vem do ESLint
      context: `Linha ${msg.line}:${msg.column} - ${msg.message}`,
    }));

  return unreachableCode;
}

// Tentar remover automaticamente código morto
function fixDeadCode(file, issues) {
  if (!FIX_MODE || issues.length === 0) return 0;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let fixedIssues = 0;
  let newContent = '';

  // Marcar linhas para remoção
  const linesToRemove = new Set();

  issues.forEach((issue) => {
    if (issue.confidence >= CONFIDENCE_THRESHOLD) {
      // Para variáveis e funções não utilizadas, removemos a linha de declaração
      if (issue.line) {
        linesToRemove.add(issue.line - 1); // Ajuste para índice 0-based
        fixedIssues++;
      }
    }
  });

  // Criar novo conteúdo sem as linhas removidas
  for (let i = 0; i < lines.length; i++) {
    if (!linesToRemove.has(i)) {
      newContent += lines[i] + '\n';
    }
  }

  // Salvar arquivo atualizado
  if (fixedIssues > 0) {
    fs.writeFileSync(file, newContent.trim() + '\n');
    console.log(
      `\x1b[32mCorrigido\x1b[0m: Removidas ${fixedIssues} linhas de código morto em ${path.relative(process.cwd(), file)}`
    );
  }

  return fixedIssues;
}

// Analisar um arquivo e identificar código morto
function analyzeCodeFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);

  if (VERBOSE) {
    console.log(`Analisando: ${relativePath}`);
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const eslintResult = analyzeFile(filePath);

    // Detectar diferentes tipos de código morto
    const unusedFuncs = detectUnusedFunctions(content, filePath);
    const unusedVars = detectUnusedVariables(eslintResult, filePath);
    const unreachableCode = detectUnreachableCode(eslintResult, filePath);

    const fileIssues = [
      ...unusedFuncs.map((f) => ({ ...f, type: 'function' })),
      ...unusedVars.map((v) => ({ ...v, type: 'variable' })),
      ...unreachableCode.map((c) => ({ ...c, type: 'unreachable' })),
    ];

    // Adicionar aos resultados globais
    if (unusedFuncs.length > 0) {
      results.unusedFunctions.push({
        file: relativePath,
        functions: unusedFuncs,
      });
    }

    if (unusedVars.length > 0) {
      results.unusedVariables.push({
        file: relativePath,
        variables: unusedVars,
      });
    }

    if (unreachableCode.length > 0) {
      results.unreachableCode.push({
        file: relativePath,
        blocks: unreachableCode,
      });
    }

    // Atualizar estatísticas
    results.summary.totalFiles++;
    if (fileIssues.length > 0) {
      results.summary.filesWithIssues++;
      results.summary.totalIssues += fileIssues.length;

      // Tentar corrigir o código morto
      const fixed = fixDeadCode(filePath, fileIssues);
      results.summary.fixedIssues += fixed;
    }

    return fileIssues.length;
  } catch (error) {
    console.error(
      `\x1b[31mErro\x1b[0m ao analisar ${relativePath}:`,
      error.message
    );
    return 0;
  }
}

// Gerar um relatório detalhado dos resultados
function generateReport() {
  let report = '# Relatório de Análise de Código Morto\n\n';
  report += `Data: ${new Date().toLocaleString()}\n\n`;

  report += '## Resumo\n\n';
  report += `- Total de arquivos analisados: ${results.summary.totalFiles}\n`;
  report += `- Arquivos com problemas: ${results.summary.filesWithIssues}\n`;
  report += `- Total de problemas encontrados: ${results.summary.totalIssues}\n`;

  if (FIX_MODE) {
    report += `- Problemas corrigidos automaticamente: ${results.summary.fixedIssues}\n`;
  }

  report += '\n## Problemas Encontrados\n\n';

  if (results.deadFiles.length > 0) {
    report += '### Arquivos Potencialmente Mortos\n\n';
    results.deadFiles.forEach((file) => {
      report += `- \`${file}\` - Arquivo não importado em nenhum outro lugar\n`;
    });
    report += '\n';
  }

  if (results.unusedImports.length > 0) {
    report += '### Imports Não Utilizados\n\n';
    results.unusedImports.forEach((item) => {
      report += `- Em \`${item.file}\`:\n`;
      item.unusedExports.forEach((exp) => {
        report += `  - \`${exp}\` não é importado em nenhum lugar\n`;
      });
    });
    report += '\n';
  }

  if (results.unusedFunctions.length > 0) {
    report += '### Funções Não Utilizadas\n\n';
    results.unusedFunctions.forEach((item) => {
      report += `- Em \`${item.file}\`:\n`;
      item.functions.forEach((func) => {
        report += `  - \`${func.name}\` (linha ${func.line}, confiança: ${func.confidence}%)\n`;
      });
    });
    report += '\n';
  }

  if (results.unusedVariables.length > 0) {
    report += '### Variáveis Não Utilizadas\n\n';
    results.unusedVariables.forEach((item) => {
      report += `- Em \`${item.file}\`:\n`;
      item.variables.forEach((variable) => {
        report += `  - \`${variable.name}\` (linha ${variable.line}, confiança: ${variable.confidence}%)\n`;
      });
    });
    report += '\n';
  }

  if (results.unreachableCode.length > 0) {
    report += '### Código Inalcançável\n\n';
    results.unreachableCode.forEach((item) => {
      report += `- Em \`${item.file}\`:\n`;
      item.blocks.forEach((block) => {
        report += `  - Linha ${block.line}: ${block.context}\n`;
      });
    });
    report += '\n';
  }

  report += '\n## Recomendações\n\n';
  report += '1. Revise cada problema manualmente antes de removê-lo\n';
  report +=
    '2. Algumas funções podem ser utilizadas indiretamente (eventos, callbacks)\n';
  report +=
    '3. Execute testes após remover código para garantir que tudo continue funcionando\n';

  if (OUTPUT_FILE) {
    fs.writeFileSync(OUTPUT_FILE, report);
    console.log(`\nRelatório detalhado salvo em: ${OUTPUT_FILE}`);
  }

  return report;
}

// Exibir estatísticas e resultados
function displayResults() {
  console.log('\n===== Análise de Código Morto Concluída =====\n');

  console.log(`Total de arquivos analisados: ${results.summary.totalFiles}`);
  console.log(`Arquivos com problemas: ${results.summary.filesWithIssues}`);
  console.log(`Total de problemas encontrados: ${results.summary.totalIssues}`);

  if (FIX_MODE) {
    console.log(
      `Problemas corrigidos automaticamente: ${results.summary.fixedIssues}`
    );
  }

  console.log('\n--- Detalhamento ---\n');

  if (results.deadFiles.length > 0) {
    console.log(
      `\x1b[33mArquivos potencialmente mortos\x1b[0m: ${results.deadFiles.length}`
    );
  }

  if (results.unusedImports.length > 0) {
    console.log(
      `\x1b[33mArquivos com exports não utilizados\x1b[0m: ${results.unusedImports.length}`
    );
  }

  if (results.unusedFunctions.length > 0) {
    console.log(
      `\x1b[33mArquivos com funções não utilizadas\x1b[0m: ${results.unusedFunctions.length}`
    );
  }

  if (results.unusedVariables.length > 0) {
    console.log(
      `\x1b[33mArquivos com variáveis não utilizadas\x1b[0m: ${results.unusedVariables.length}`
    );
  }

  if (results.unreachableCode.length > 0) {
    console.log(
      `\x1b[33mArquivos com código inalcançável\x1b[0m: ${results.unreachableCode.length}`
    );
  }

  console.log(
    '\nPara detalhes completos, execute com a opção --output report.md'
  );

  if (OUTPUT_FILE) {
    console.log(`\nRelatório detalhado salvo em: ${OUTPUT_FILE}`);
  }
}

// Função principal
async function main() {
  console.log('===== Sistema de Detecção de Código Morto =====');

  // Verificar dependências
  if (!checkDependencies()) {
    process.exit(1);
  }

  // Encontrar arquivos JavaScript
  const jsFiles = findJavaScriptFiles(searchDirs);

  if (jsFiles.length === 0) {
    console.log(
      'Nenhum arquivo JavaScript encontrado nos diretórios especificados.'
    );
    process.exit(0);
  }

  console.log(`Analisando ${jsFiles.length} arquivos JavaScript...`);

  // Analisar cada arquivo
  for (const file of jsFiles) {
    analyzeCodeFile(file);
  }

  // Analisar importações entre arquivos
  const importAnalysis = analyzeImports(jsFiles);
  results.unusedImports = importAnalysis.unusedExports;
  results.deadFiles = importAnalysis.filesNeverImported;

  // Gerar e exibir relatório
  generateReport();
  displayResults();

  // Retornar código de saída baseado nos resultados
  return results.summary.totalIssues > 0 ? 1 : 0;
}

// Executar programa
main()
  .then((exitCode) => {
    if (!OUTPUT_FILE && results.summary.totalIssues > 0) {
      console.log(
        '\nDica: Execute com --output report.md para gerar um relatório detalhado'
      );
    }

    if (FIX_MODE && results.summary.fixedIssues > 0) {
      console.log(
        `\nRemovidas ${results.summary.fixedIssues} instâncias de código morto`
      );
    }

    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
