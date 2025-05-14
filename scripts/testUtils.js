// scripts/testUtils.js
// Utilitários comuns para scripts de teste LASCMMG

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function checkServerRunning() {
  console.log('Verificando se o servidor está em execução...');
  try {
    execSync('curl -s http://localhost:3000/ -o /dev/null', {
      stdio: 'ignore',
    });
    console.log('✅ Servidor está em execução.\n');
    return true;
  } catch {
    console.error('❌ Erro: O servidor não está em execução.');
    console.error(
      'Por favor, inicie o servidor com "npm start" e tente novamente.\n'
    );
    return false;
  }
}

function executeCurl(command, description) {
  console.log(`\n${description}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log('✅ Comando executado com sucesso.');
    try {
      const jsonOutput = JSON.parse(output);
      return jsonOutput;
    } catch {
      return output;
    }
  } catch (error) {
    console.error(`❌ Erro ao executar o comando: ${error.message}`);
    if (error.stdout) console.error('Resposta:', error.stdout.toString());
    if (error.stderr) console.error('Erro detalhado:', error.stderr.toString());
    return null;
  }
}

function generatePlayerName() {
  const firstNames = [
    'João',
    'Maria',
    'Pedro',
    'Ana',
    'Lucas',
    'Carla',
    'José',
    'Juliana',
    'Carlos',
    'Mariana',
    'Paulo',
    'Fernanda',
    'Rafael',
    'Amanda',
    'Ricardo',
  ];
  const lastNames = [
    'Silva',
    'Santos',
    'Oliveira',
    'Souza',
    'Costa',
    'Pereira',
    'Lima',
    'Martins',
    'Rodrigues',
    'Almeida',
    'Nascimento',
    'Gomes',
    'Ferreira',
  ];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function generateNickname(name) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('');
}

/**
 * Realiza login admin e retorna token CSRF e cookie para uso em requisições autenticadas.
 * Retorna: { csrfToken, cookiesFile, jwtToken }
 */
function loginAndGetCSRF({
  username = 'admin',
  password = 'admin',
  baseUrl = 'http://localhost:3000',
  cookiesFile = 'cookies.txt',
} = {}) {
  const { execSync } = require('child_process');
  // 1. Obter cookie csrfToken ao acessar /admin.html
  const headers = execSync(`curl -i -c ${cookiesFile} ${baseUrl}/admin.html`, {
    encoding: 'utf8',
  });
  // Extrair o valor do cookie csrfToken
  const match = headers.match(/Set-Cookie: csrfToken=([^;]+)/);
  if (!match) {
    throw new Error('Não foi possível obter o cookie csrfToken.');
  }
  const csrfToken = match[1];

  // 2. Realizar login admin (POST para /api/login) e capturar o JWT
  const loginData = JSON.stringify({ username, password, _csrf: csrfToken });
  const loginResp = execSync(
    `curl -s -X POST -b ${cookiesFile} -c ${cookiesFile} -H "Content-Type: application/json" -H "X-CSRF-Token: ${csrfToken}" -d '${loginData}' ${baseUrl}/api/login`,
    { encoding: 'utf8' }
  );
  let jwtToken = null;
  try {
    const loginJson = JSON.parse(loginResp);
    jwtToken = loginJson.token;
  } catch {
    throw new Error('Não foi possível obter o token JWT do login.');
  }

  // 3. Retornar token, cookies e JWT para uso nas requisições autenticadas
  return { csrfToken, cookiesFile, jwtToken };
}

module.exports = {
  checkServerRunning,
  executeCurl,
  generatePlayerName,
  generateNickname,
  fs,
  path,
  execSync,
  loginAndGetCSRF,
};
