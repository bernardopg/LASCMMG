#!/usr/bin/env node

/**
 * Script para atualizar dependências do projeto
 *
 * Este script verifica e atualiza as dependências do projeto, auxiliando na manutenção
 * regular do sistema e prevenção de vulnerabilidades de segurança.
 *
 * Uso:
 *   node scripts/update-dependencies.js [--check-only] [--non-breaking]
 *
 * Opções:
 *   --check-only: Apenas verifica atualizações disponíveis sem aplicá-las
 *   --non-breaking: Atualiza apenas versões menores e de patch (não atualiza major versions)
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Cores para formatação do console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Configuração inicial
const args = process.argv.slice(2);
const checkOnly = args.includes('--check-only');
const nonBreaking = args.includes('--non-breaking');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Executa um comando shell e retorna o resultado como string
 * @param {string} command - Comando a ser executado
 * @returns {string} - Saída do comando
 */
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(
      `${colors.red}Erro ao executar comando:${colors.reset} ${command}`
    );
    console.error(error.stderr || error.message);
    return '';
  }
}

/**
 * Verifica se existem atualizações disponíveis para as dependências
 */
function checkUpdates() {
  console.log(
    `\n${colors.cyan}Verificando atualizações disponíveis...${colors.reset}\n`
  );
  const outdated = execCommand('npm outdated --json');

  if (!outdated || outdated === '{}') {
    console.log(
      `${colors.green}Todas as dependências estão atualizadas!${colors.reset}`
    );
    return {};
  }

  try {
    const outdatedPackages = JSON.parse(outdated);
    console.log(
      `${colors.yellow}Pacotes com atualizações disponíveis:${colors.reset}\n`
    );

    // Formatar saída em tabela
    console.log(
      `${'Pacote'.padEnd(20)} ${'Atual'.padEnd(15)} ${'Desejada'.padEnd(15)} ${'Última'.padEnd(15)} ${'Tipo'.padEnd(10)}`
    );
    console.log('-'.repeat(80));

    Object.keys(outdatedPackages).forEach((pkg) => {
      const info = outdatedPackages[pkg];
      const current = info.current;
      const wanted = info.wanted;
      const latest = info.latest;

      // Determinar tipo de atualização
      let updateType = '';
      if (current.split('.')[0] !== latest.split('.')[0]) {
        updateType = `${colors.red}Major${colors.reset}`;
      } else if (current.split('.')[1] !== latest.split('.')[1]) {
        updateType = `${colors.yellow}Minor${colors.reset}`;
      } else {
        updateType = `${colors.green}Patch${colors.reset}`;
      }

      console.log(
        `${pkg.padEnd(20)} ${current.padEnd(15)} ${wanted.padEnd(15)} ${latest.padEnd(15)} ${updateType}`
      );
    });

    return outdatedPackages;
  } catch (error) {
    console.error(
      `${colors.red}Erro ao analisar a saída do npm outdated:${colors.reset}`,
      error
    );
    return {};
  }
}

/**
 * Verifica vulnerabilidades nas dependências
 */
function checkVulnerabilities() {
  console.log(
    `\n${colors.cyan}Verificando vulnerabilidades...${colors.reset}\n`
  );
  const audit = execCommand('npm audit --json');

  try {
    const auditResult = JSON.parse(audit);
    const vulnerabilities = auditResult.vulnerabilities || {};
    const metadata = auditResult.metadata || {};
    const totalVulnerabilities = metadata.vulnerabilities?.total || 0;

    if (totalVulnerabilities === 0) {
      console.log(
        `${colors.green}Nenhuma vulnerabilidade encontrada!${colors.reset}`
      );
      return [];
    }

    console.log(
      `${colors.red}Vulnerabilidades encontradas:${colors.reset} ${totalVulnerabilities}\n`
    );

    // Exibir resumo por severidade
    if (metadata.vulnerabilities) {
      console.log(`${'Severidade'.padEnd(12)} ${'Quantidade'.padEnd(10)}`);
      console.log('-'.repeat(25));
      Object.entries(metadata.vulnerabilities).forEach(([severity, count]) => {
        if (severity !== 'total') {
          let color = colors.yellow;
          if (severity === 'critical' || severity === 'high')
            color = colors.red;
          else if (severity === 'moderate') color = colors.yellow;
          else if (severity === 'low') color = colors.green;

          console.log(
            `${color}${severity.padEnd(12)}${colors.reset} ${count.toString().padEnd(10)}`
          );
        }
      });
    }

    return Object.keys(vulnerabilities);
  } catch (error) {
    console.error(
      `${colors.red}Erro ao analisar a saída do npm audit:${colors.reset}`,
      error
    );
    return [];
  }
}

/**
 * Atualiza as dependências do projeto
 * @param {Object} outdatedPackages - Objeto com informações de pacotes desatualizados
 * @param {Array} vulnerablePackages - Lista de pacotes com vulnerabilidades
 * @param {boolean} nonBreaking - Se deve atualizar apenas versões não-quebradoras
 */
function updateDependencies(outdatedPackages, vulnerablePackages, nonBreaking) {
  console.log(
    `\n${colors.cyan}Preparando para atualizar dependências...${colors.reset}\n`
  );

  const packagesToUpdate = [];
  const majorUpdates = [];

  // Analisar pacotes desatualizados
  Object.keys(outdatedPackages).forEach((pkg) => {
    const info = outdatedPackages[pkg];
    const current = info.current.split('.');
    const latest = info.latest.split('.');

    // Verificar se é atualização major
    const isMajor = current[0] !== latest[0];

    if (isMajor) {
      majorUpdates.push(pkg);
    }

    // Se não for major ou se aceitamos major updates, adicionar à lista
    if (!isMajor || !nonBreaking) {
      packagesToUpdate.push(pkg);
    }
  });

  // Adicionar pacotes vulneráveis que não estão na lista de atualizações
  vulnerablePackages.forEach((pkg) => {
    if (!packagesToUpdate.includes(pkg)) {
      packagesToUpdate.push(pkg);
    }
  });

  if (packagesToUpdate.length === 0) {
    console.log(`${colors.yellow}Nenhum pacote para atualizar.${colors.reset}`);
    return;
  }

  console.log(
    `${colors.green}Pacotes a serem atualizados:${colors.reset}\n- ${packagesToUpdate.join('\n- ')}`
  );

  if (majorUpdates.length > 0 && nonBreaking) {
    console.log(
      `\n${colors.yellow}Pacotes com atualizações major (não serão atualizados):${colors.reset}\n- ${majorUpdates.join('\n- ')}`
    );
    console.log(
      `\n${colors.yellow}Use a opção --force para atualizar todos os pacotes independentemente do tipo de versão.${colors.reset}`
    );
  }

  if (checkOnly) {
    console.log(
      `\n${colors.blue}Execução em modo de verificação. Nenhuma atualização será aplicada.${colors.reset}`
    );
    return;
  }

  console.log(`\n${colors.cyan}Atualizando pacotes...${colors.reset}`);

  packagesToUpdate.forEach((pkg) => {
    const target =
      nonBreaking && !vulnerablePackages.includes(pkg)
        ? outdatedPackages[pkg].wanted
        : 'latest';
    const command = `npm install ${pkg}@${target} --save-exact`;

    console.log(`\n${colors.blue}Executando:${colors.reset} ${command}`);
    const result = execCommand(command);
    console.log(result);
  });

  console.log(`\n${colors.green}Atualizações concluídas!${colors.reset}`);

  // Verificar novamente após atualizações
  console.log(
    `\n${colors.cyan}Verificando o estado atual após atualizações...${colors.reset}`
  );
  checkUpdates();
  checkVulnerabilities();
}

/**
 * Atualiza arquivo package-lock.json após mudanças
 */
function updateLockFile() {
  console.log(
    `\n${colors.cyan}Atualizando o arquivo package-lock.json...${colors.reset}`
  );
  execCommand('npm install --package-lock-only');
  console.log(
    `${colors.green}Arquivo package-lock.json atualizado.${colors.reset}`
  );
}

/**
 * Função principal do script
 */
async function main() {
  console.log(
    `\n${colors.magenta}=== Assistente de Atualização de Dependências ===${colors.reset}`
  );
  console.log(`Modo: ${checkOnly ? 'Apenas verificação' : 'Atualização'}`);
  console.log(`Atualizar versões major: ${!nonBreaking ? 'Sim' : 'Não'}`);

  // Verificar atualizações disponíveis
  const outdatedPackages = checkUpdates();

  // Verificar vulnerabilidades
  const vulnerablePackages = checkVulnerabilities();

  // Se não há pacotes desatualizados nem vulneráveis, finaliza
  if (
    Object.keys(outdatedPackages).length === 0 &&
    vulnerablePackages.length === 0
  ) {
    console.log(
      `\n${colors.green}Tudo em ordem! Não há pacotes a serem atualizados.${colors.reset}`
    );
    process.exit(0);
  }

  // Confirmar antes de atualizar
  if (!checkOnly) {
    await new Promise((resolve) => {
      rl.question(
        `\n${colors.yellow}Deseja prosseguir com a atualização? (s/N): ${colors.reset}`,
        (answer) => {
          if (answer.toLowerCase() !== 's') {
            console.log(
              `\n${colors.blue}Operação cancelada pelo usuário.${colors.reset}`
            );
            process.exit(0);
          }
          resolve();
        }
      );
    });
  }

  // Atualizar dependências
  if (!checkOnly) {
    updateDependencies(outdatedPackages, vulnerablePackages, nonBreaking);
    updateLockFile();
  }

  console.log(`\n${colors.magenta}=== Processo finalizado ===${colors.reset}`);
  rl.close();
}

// Executar script
main().catch((error) => {
  console.error(`${colors.red}Erro:${colors.reset}`, error);
  process.exit(1);
});
