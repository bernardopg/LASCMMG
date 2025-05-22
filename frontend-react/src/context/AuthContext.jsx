import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import apiInstance, { setAuthToken as setApiAuthToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [tokenRefreshing, setTokenRefreshing] = useState(false);

  const checkLoggedInAttempted = useRef(false);
  const refreshTimeoutRef = useRef(null); // Ref para gerenciar o timeout de refresh

  const logout = useCallback(async () => {
    try {
      if (currentUser) {
        await apiInstance.post('/api/auth/logout');
      }
    } catch (err) {
      // Ignorar erro de logout no servidor
      console.warn('Erro ao fazer logout no servidor:', err);
    } finally {
      // Limpar qualquer timeout de refresh pendente
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('refreshToken');
      setApiAuthToken(null);
      setCurrentUser(null);
      setLoginAttempts(0);
    }
  }, [currentUser]);

  // Função para atualizar o token
  const refreshToken = useCallback(async () => {
    try {
      setTokenRefreshing(true);
      console.log('[AuthContext] Iniciando processo de refresh token');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!storedRefreshToken) {
        console.warn('[AuthContext] Refresh token não encontrado no localStorage');
        throw new Error('Refresh token não encontrado');
      }

      const response = await apiInstance.post('/api/auth/refresh-token', {
        refreshToken: storedRefreshToken
      });

      const { token, refreshToken: newRefreshToken, expiresIn } = response.data;
      console.log(`[AuthContext] Refresh token concluído com sucesso. Novo token expira em ${expiresIn}s`);

      // Atualizar tokens e tempo de expiração
      setApiAuthToken(token);
      localStorage.setItem('authToken', token);

      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      // Calcular e salvar o tempo de expiração do token
      const expiryTime = Date.now() + (expiresIn || 3600) * 1000;
      localStorage.setItem('tokenExpiry', expiryTime.toString());

      // Programar próximo refresh
      scheduleTokenRefresh(expiryTime);

      // Depurar estado dos tokens após refresh
      debugTokenStatus();

      return token;
    } catch (err) {
      console.error('Erro ao atualizar token:', err);
      // Se houver erro ao atualizar token, fazer logout
      await logout();
      throw err;
    } finally {
      setTokenRefreshing(false);
    }
  }, [logout]);  // Função para programar o refresh automático do token
  const scheduleTokenRefresh = useCallback((expiryTime) => {
    // Limpar qualquer refresh pendente
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;

    // Renovar quando faltar 5 minutos para expirar (ou imediatamente se faltar menos que isso)
    const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);

    console.log(`[AuthContext] Token será renovado em ${Math.round(refreshTime / 60000)} minutos (${new Date(now + refreshTime).toLocaleTimeString()})`);

    refreshTimeoutRef.current = setTimeout(() => {
      console.log('[AuthContext] Executando refresh token automático');
      refreshToken().catch(err => {
        console.error('[AuthContext] Falha no refresh automático:', err);
      });
    }, refreshTime);
  }, [refreshToken]);

  const checkTokenExpiration = useCallback(() => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry, 10);
      const now = Date.now();
      const timeToExpiry = expiryTime - now;
      const timeToExpiryMinutes = Math.round(timeToExpiry / 60000);

      // Se o token expirou
      if (now >= expiryTime) {
        console.log('[AuthContext] Token expirado. Tentando refresh...');
        // Tentar refresh token se disponível
        const hasRefreshToken = localStorage.getItem('refreshToken');
        if (hasRefreshToken && !tokenRefreshing) {
          refreshToken().catch(() => {
            // Logout já é chamado em caso de erro no refreshToken
          });
        } else {
          // Sem refresh token, apenas faz logout
          console.log('[AuthContext] Sem refresh token disponível para renovação. Realizando logout.');
          logout();
        }
        return false;
      }

      // Se o token está próximo de expirar mas ainda não foi agendado refresh
      if (timeToExpiry < 5 * 60 * 1000 && !refreshTimeoutRef.current) {
        console.log(`[AuthContext] Token próximo de expirar (${timeToExpiryMinutes} minutos restantes). Agendando refresh...`);
        // Programar refresh token
        scheduleTokenRefresh(expiryTime);
      }

      return true;
    }
    return false;
  }, [logout, refreshToken, tokenRefreshing, scheduleTokenRefresh]);

  // Função auxiliar para imprimir o estado dos tokens no console (apenas para depuração)
  const debugTokenStatus = useCallback(() => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    const authToken = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const rememberMe = localStorage.getItem('rememberMe');

    if (tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry, 10);
      const now = Date.now();
      const minutesLeft = Math.round((expiryTime - now) / (60 * 1000));

      console.group('[AuthContext] Estado dos tokens');
      console.log(`Token JWT: ${authToken ? '✅ Presente' : '❌ Ausente'}`);
      console.log(`Refresh Token: ${refreshToken ? '✅ Presente' : '❌ Ausente'}`);
      console.log(`Lembrar-me: ${rememberMe === 'true' ? '✅ Ativado' : '❌ Desativado'}`);
      console.log(`Expiração do token: ${new Date(expiryTime).toLocaleString()} (${minutesLeft} minutos restantes)`);
      console.log(`Refresh automático agendado: ${refreshTimeoutRef.current ? '✅ Sim' : '❌ Não'}`);
      console.groupEnd();
    } else {
      console.log('[AuthContext] Nenhum token ativo encontrado');
    }
  }, []);

  useEffect(() => {
    const checkLoggedIn = async () => {
      if (checkLoggedInAttempted.current) return;
      checkLoggedInAttempted.current = true;

      try {
        const storedUser = localStorage.getItem('authUser');
        const storedToken = localStorage.getItem('authToken');
        const rememberMe = localStorage.getItem('rememberMe') === 'true';

        if (storedUser && storedToken) {
          // Verifica se o token está expirado
          if (!checkTokenExpiration()) {
            return; // Token expirado, já foi tratado em checkTokenExpiration
          }

          setApiAuthToken(storedToken);

          const response = await apiInstance.get('/api/me');
          if (response.data && response.data.success && response.data.user) {
            setCurrentUser(response.data.user);

            // Programar refresh token se encontrado um token válido
            const tokenExpiry = localStorage.getItem('tokenExpiry');
            if (tokenExpiry) {
              scheduleTokenRefresh(parseInt(tokenExpiry, 10));
            }
          } else {
            await logout();
          }
        } else {
          setApiAuthToken(null);
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, [logout, checkTokenExpiration, scheduleTokenRefresh]);

  // Configurar verificação periódica de expiração do token (a cada minuto)
  useEffect(() => {
    const tokenCheckInterval = setInterval(() => {
      if (currentUser) {
        checkTokenExpiration();
      }
    }, 60000);

    return () => clearInterval(tokenCheckInterval);
  }, [currentUser, checkTokenExpiration]);

  // Adicionar chamada ao debugTokenStatus nos lugares críticos
  useEffect(() => {
    if (currentUser) {
      // Exibir status de token a cada minuto para facilitar depuração
      const debugInterval = setInterval(() => {
        debugTokenStatus();
      }, 60000); // a cada minuto

      // Executar uma vez no início
      debugTokenStatus();

      return () => clearInterval(debugInterval);
    }
  }, [currentUser, debugTokenStatus]);

  // Limpar o timeout de refresh ao desmontar o componente
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    try {
      setError(null);

      // Controle de múltiplas tentativas de login (3 tentativas)
      if (loginAttempts >= 3) {
        const waitTime = Math.pow(2, loginAttempts - 3) * 10; // 10, 20, 40 segundos...
        setError(`Múltiplas tentativas de login. Por favor, aguarde ${waitTime} segundos antes de tentar novamente.`);
        setTimeout(() => setLoginAttempts(0), waitTime * 1000);
        throw new Error(`Múltiplas tentativas de login. Tente novamente em ${waitTime} segundos.`);
      }

      // MOCK LOGIN for development/testing (bypasses actual API call)
      // In production, this should be removed and use the real API
      console.log('[AuthContext] Using mock login for development');

      // Mock user object with admin privileges
      const userObj = {
        id: 1,
        name: 'Admin Usuário',
        email: email,
        role: 'admin',
        permissions: ['manage_tournaments', 'manage_players', 'view_reports'],
        avatar: null,
        createdAt: new Date().toISOString()
      };

      // Mock token and expiry
      const token = 'mock-jwt-token-' + Math.random().toString(36).substring(2);
      const newRefreshToken = 'mock-refresh-token-' + Math.random().toString(36).substring(2);
      const expiresIn = 3600; // 1 hour

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        console.log('[AuthContext] Login com "Lembrar-me" ativado');
      } else {
        localStorage.removeItem('rememberMe');
        console.log('[AuthContext] Login sem "Lembrar-me"');
      }

      // Calcular e salvar o tempo de expiração do token
      const expiryTime = Date.now() + (expiresIn || 3600) * 1000; // Padrão: 1 hora
      const expiryDate = new Date(expiryTime);
      console.log(`[AuthContext] Token expira em ${expiresIn}s (${expiryDate.toLocaleString()})`);
      localStorage.setItem('tokenExpiry', expiryTime.toString());

      // Salvar refresh token se disponível
      if (newRefreshToken) {
        console.log('[AuthContext] Refresh token armazenado');
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      localStorage.setItem('authUser', JSON.stringify(userObj));
      localStorage.setItem('authToken', token);

      setApiAuthToken(token); setCurrentUser(userObj);
      setLoginAttempts(0); // Resetar tentativas após login bem-sucedido

      // Programar refresh token
      scheduleTokenRefresh(expiryTime);

      // Depurar estado dos tokens após login
      debugTokenStatus();

      return userObj;
    } catch (err) {
      setLoginAttempts((prev) => prev + 1);
      const errorMessage = err.response?.data?.message || 'Falha na autenticação';
      setError(errorMessage);
      setApiAuthToken(null);
      throw err;
    }
  }, [loginAttempts, scheduleTokenRefresh]);

  const hasPermission = useCallback((permission) => {
    if (!currentUser || !currentUser.role) return false;
    if (permission === 'admin') {
      return currentUser.role === 'admin';
    }

    // Se o usuário tiver um array de permissões específicas, podemos verificar aqui
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      return currentUser.permissions.includes(permission);
    }

    return false;
  }, [currentUser]);

  const hasRole = useCallback((role) => {
    if (!currentUser || !currentUser.role) return false;
    return currentUser.role === role;
  }, [currentUser]);

  // Função para atualizar dados do usuário atual
  const updateCurrentUser = useCallback(async (userData) => {
    try {
      const response = await apiInstance.put('/api/me', userData);
      if (response.data && response.data.success && response.data.user) {
        setCurrentUser(response.data.user);
        localStorage.setItem('authUser', JSON.stringify(response.data.user));
        return response.data.user;
      }
      return null;
    } catch (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
      const errorMessage = err.response?.data?.message || 'Falha ao atualizar dados do usuário';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    refreshToken,
    hasPermission,
    hasRole,
    updateCurrentUser,
    isAuthenticated: !!currentUser,
    loginAttempts,
    tokenRefreshing,
    hasRefreshToken: !!localStorage.getItem('refreshToken'),
    debugTokenStatus, // Expomos o método de depuração para uso em componentes
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
