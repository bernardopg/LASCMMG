import { showMessage, setButtonLoading } from './uiUtils.js';
import { fetchApi, isAuthenticated } from './apiService.js';
import { LOGIN_TOKEN_KEY } from './constants.js';

export function checkAuthentication(showAdminCallback, showLoginCallback) {
  if (isAuthenticated()) {
    showAdminCallback();
  } else {
    sessionStorage.removeItem(LOGIN_TOKEN_KEY);
    showLoginCallback();
  }
}

const loginAttempts = {
  count: 0,
  lastAttempt: 0,
  cooldownActive: false,
};

const LOGIN_COOLDOWN_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

export async function handleLogin(event, showAdminCallback) {
  event.preventDefault();
  const loginForm = event.target;
  const usernameInput = loginForm.querySelector('#username');
  const passwordInput = loginForm.querySelector('#password');
  const submitButton = loginForm.querySelector("button[type='submit']");

  if (!usernameInput || !passwordInput || !submitButton) {
    console.error('Login form elements not found.');
    showMessage('Erro interno no formulário de login.', 'error');
    return;
  }

  if (loginAttempts.cooldownActive) {
    const remainingTime = Math.ceil(
      (loginAttempts.lastAttempt + LOGIN_COOLDOWN_MS - Date.now()) / 60000
    );
    showMessage(
      `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`,
      'error'
    );
    return;
  }

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showMessage('Nome de usuário e senha são necessários.', 'error');
    return;
  }

  setButtonLoading(submitButton, true);

  try {
    const data = await fetchApi(
      '/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { username, password },
      },
      false
    );

    if (data.success && data.token) {
      sessionStorage.setItem(LOGIN_TOKEN_KEY, data.token);

      loginAttempts.count = 0;

      await showAdminCallback();
      showMessage(data.message || 'Login realizado com sucesso!', 'success');
    } else {
      loginAttempts.count++;
      loginAttempts.lastAttempt = Date.now();

      if (loginAttempts.count >= MAX_LOGIN_ATTEMPTS) {
        loginAttempts.cooldownActive = true;

        setTimeout(() => {
          loginAttempts.cooldownActive = false;
          loginAttempts.count = 0;
        }, LOGIN_COOLDOWN_MS);

        throw new Error(
          `Número máximo de tentativas excedido. Tente novamente em ${LOGIN_COOLDOWN_MS / 60000} minutos.`
        );
      }

      const remainingAttempts = MAX_LOGIN_ATTEMPTS - loginAttempts.count;
      throw new Error(
        `${data.message || 'Credenciais inválidas'}. Tentativas restantes: ${remainingAttempts}.`
      );
    }
  } catch (error) {
    console.error('Erro no login:', error);
    showMessage(`Erro ao tentar fazer login: ${error.message}`, 'error');
    sessionStorage.removeItem(LOGIN_TOKEN_KEY);
  } finally {
    setButtonLoading(submitButton, false);
  }
}

export async function handleLogout(showLoginCallback) {
  try {
    const token = getAuthToken();
    if (token) {
      await fetchApi(
        '/logout',
        {
          method: 'POST',
        },
        true
      );
    }
  } catch {
    /* Ignora erros de logout, apenas garante que o token seja removido */ void 0;
  } finally {
    sessionStorage.removeItem(LOGIN_TOKEN_KEY);

    localStorage.removeItem(LOGIN_TOKEN_KEY);

    if (loginAttempts) {
      loginAttempts.count = 0;
      loginAttempts.cooldownActive = false;
    }

    showLoginCallback();
    showMessage('Logout realizado com sucesso.', 'info');
  }
}

export function getAuthToken() {
  return sessionStorage.getItem(LOGIN_TOKEN_KEY);
}

export { LOGIN_TOKEN_KEY };
