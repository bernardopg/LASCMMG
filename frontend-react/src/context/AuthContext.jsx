import React, {
  createContext,
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

  const checkLoggedInAttempted = React.useRef(false);

  useEffect(() => {
    const checkLoggedIn = async () => {
      if (checkLoggedInAttempted.current) return;
      checkLoggedInAttempted.current = true;

      try {
        const storedUser = localStorage.getItem('authUser');
        const storedToken = localStorage.getItem('authToken');
        // Verificar se o usuário tinha a preferência de "Lembrar-me" ativada
        const rememberMe = localStorage.getItem('rememberMe') === 'true';

        if (storedUser && storedToken) {
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
        await logout();
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      setError(null);

      // Call the admin login endpoint
      const response = await apiInstance.post('/api/auth/login', {
        // Padronizando para usar email consistentemente
        username: email, // Backend espera o email no campo 'username'
        password,
        rememberMe, // Passando a preferência para o backend
      });

      // Backend /api/auth/login returns { success, message, token, admin }
      const { admin, token } = response.data;
      const userObj = admin; // Use the admin object as the user object

      // Se rememberMe for verdadeiro, o token pode ser armazenado por mais tempo
      // Isso será usado posteriormente para definir um token com expiração mais longa
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      localStorage.setItem('authUser', JSON.stringify(userObj));
      localStorage.setItem('authToken', token);

      setApiAuthToken(token);

      setCurrentUser(userObj);
      return userObj;
    } catch (err) {
      setError(err.response?.data?.message || 'Falha na autenticação');
      setApiAuthToken(null);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiInstance.post('/api/auth/logout');
    } catch (err) {
      // Ignorar erro de logout no servidor
    } finally {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      setApiAuthToken(null);
      setCurrentUser(null);
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser || !currentUser.role) return false;
    if (permission === 'admin') {
      return currentUser.role === 'admin';
    }
    return false;
  };

  const hasRole = (role) => {
    if (!currentUser || !currentUser.role) return false;
    return currentUser.role === role;
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    hasPermission,
    hasRole,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
