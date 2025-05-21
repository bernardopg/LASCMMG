import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  const checkLoggedInAttempted = React.useRef(false);

  const logout = useCallback(async () => {
    try {
      if (currentUser) {
        await apiInstance.post('/api/auth/logout');
      }
    } catch (err) {
      // Ignorar erro de logout no servidor
      console.warn('Erro ao fazer logout no servidor:', err);
    } finally {
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
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!storedRefreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await apiInstance.post('/api/auth/refresh-token', {
        refreshToken: storedRefreshToken
      });

      const { token, refreshToken: newRefreshToken, expiresIn } = response.data;

      // Atualizar tokens e tempo de expiração
      setApiAuthToken(token);
      localStorage.setItem('authToken', token);

      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      // Calcular e salvar o tempo de expiração do token
      const expiryTime = Date.now() + (expiresIn || 3600) * 1000;
      localStorage.setItem('tokenExpiry', expiryTime.toString());

      return token;
    } catch (err) {
      console.error('Erro ao atualizar token:', err);
      // Se houver erro ao atualizar token, fazer logout
      await logout();
      throw err;
    } finally {
      setTokenRefreshing(false);
    }
  }, [logout]);

  const checkTokenExpiration = useCallback(() => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry, 10);
      const now = Date.now();

      // Se o token expirou
      if (now >= expiryTime) {
        // Tentar refresh token se disponível
        const hasRefreshToken = localStorage.getItem('refreshToken');
        if (hasRefreshToken && !tokenRefreshing) {
          refreshToken().catch(() => {
            // Logout já é chamado em caso de erro no refreshToken
          });
        } else {
          // Sem refresh token, apenas faz logout
          logout();
        }
        return false;
      }

      // Se o token está próximo de expirar (menos de 5 minutos)
      if (expiryTime - now < 5 * 60 * 1000) {
        // Atualizar token automaticamente em segundo plano
        const hasRefreshToken = localStorage.getItem('refreshToken');
        if (hasRefreshToken && !tokenRefreshing) {
          refreshToken().catch(() => {
            // Tratamento de erro silencioso aqui (logout já é chamado em caso de erro)
          });
        }
      }

      return true;
    }
    return false;
  }, [logout, refreshToken, tokenRefreshing]);

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
  }, [logout, checkTokenExpiration]);

  // Configurar verificação periódica de expiração do token (a cada minuto)
  useEffect(() => {
    const tokenCheckInterval = setInterval(() => {
      if (currentUser) {
        checkTokenExpiration();
      }
    }, 60000);

    return () => clearInterval(tokenCheckInterval);
  }, [currentUser, checkTokenExpiration]);

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

      const response = await apiInstance.post('/api/auth/login', {
        username: email,
        password,
        rememberMe,
      });

      const { admin, token, refreshToken: newRefreshToken, expiresIn } = response.data;
      const userObj = admin;

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      // Calcular e salvar o tempo de expiração do token
      const expiryTime = Date.now() + (expiresIn || 3600) * 1000; // Padrão: 1 hora
      localStorage.setItem('tokenExpiry', expiryTime.toString());

      // Salvar refresh token se disponível
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      localStorage.setItem('authUser', JSON.stringify(userObj));
      localStorage.setItem('authToken', token);

      setApiAuthToken(token);
      setCurrentUser(userObj);
      setLoginAttempts(0); // Resetar tentativas após login bem-sucedido

      return userObj;
    } catch (err) {
      setLoginAttempts((prev) => prev + 1);
      const errorMessage = err.response?.data?.message || 'Falha na autenticação';
      setError(errorMessage);
      setApiAuthToken(null);
      throw err;
    }
  }, [loginAttempts]);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
