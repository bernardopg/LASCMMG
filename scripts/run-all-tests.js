#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('==========================================================');
console.log('SISTEMA DE TESTES - LASCMMG');
console.log('==========================================================');
console.log(
  'Este script executará uma série de testes para verificar o funcionamento'
);
console.log('do sistema de gerenciamento de torneios.');
console.log(
  '\nATENÇÃO: Certifique-se que o servidor está rodando antes de continuar!'
);
console.log('==========================================================\n');

// Função para executar um comando e imprimir sua saída
function runCommand(command, description) {
  console.log(`\n\n${description}\n${'='.repeat(description.length)}\n`);

  try {
    execSync(command, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    return true;
  } catch {
    console.error(`\n❌ ERRO ao executar: ${description}`);
    console.error('Continuando com os próximos testes...\n');
    return false;
  }
}

// Executar os testes em sequência
console.log('Iniciando testes sequenciais...\n');

// Teste principal: ciclo completo e funcionalidades avançadas
runCommand(
  'node scripts/test-ciclo-completo.js',
  'TESTE: Ciclo completo e funcionalidades avançadas (API autenticada)'
);

// Testes opcionais: SQL direto (baixo nível)
// Descomente se desejar rodar testes diretos no banco
// runCommand(
//   'node scripts/test-direto.js',
//   'TESTE OPCIONAL: Teste direto no banco (sem CSRF)'
// );
// runCommand(
//   'node scripts/test-sql-direto.js',
//   'TESTE OPCIONAL: Teste SQL direto no banco (sem CSRF)'
// );

console.log('\n\n==========================================================');
console.log('TESTES CONCLUÍDOS');
console.log('==========================================================');
console.log('Todos os testes essenciais foram executados.');
console.log('\nAcesse o painel administrativo para visualizar os resultados:');
console.log('http://localhost:3000/admin.html');
console.log('\nAcesse a visualização pública para conferir os torneios:');
console.log('http://localhost:3000');
console.log('==========================================================\n');

// Nota: Os timeouts são para evitar problemas de concorrência entre os testes
