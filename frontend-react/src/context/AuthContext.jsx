import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Criar context
const AuthContext = createContext();

// Hook personalizado para usar o context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar se existe um usuário logado no localStorage
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const storedUser = localStorage.getItem('authUser');
        const storedToken = localStorage.getItem('authToken');

        if (storedUser && storedToken) {
          // Configurar token de autenticação no axios
          axios.defaults.headers.common['Authorization'] =
            `Bearer ${storedToken}`;

          // Verificar se o token ainda é válido
          const response = await axios.get('/api/auth/verify');

          if (response.data.valid) {
            setCurrentUser(JSON.parse(storedUser));
          } else {
            // Token inválido, fazer logout
            await logout();
          }
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Função de login
  const login = async (email, password) => {
    try {
      setError(null);

      // Get CSRF token from cookies
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrfToken='))
        ?.split('=')[1];

      // Set CSRF token in headers if available
      const headers = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      // Mapeia email para username conforme esperado pelo backend
      // Remove eventual duplicação de email causada pelo bug no frontend
      const cleanEmail = email.includes('@') ?
        email.substring(0, email.indexOf('@')) + '@' + email.substring(email.indexOf('@') + 1) :
        email;

      const response = await axios.post('/api/auth/login', {
        username: cleanEmail,
        password
      }, { headers });

      const { admin: user, token } = response.data;

      // Salvar no localStorage
      localStorage.setItem('authUser', JSON.stringify(user));
      localStorage.setItem('authToken', token);

      // Configurar token para futuras requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Falha na autenticação');
      throw err;
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      // Tentar fazer logout no servidor
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    } finally {
      // Remover dados do localStorage
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');

      // Remover token de autenticação
      delete axios.defaults.headers.common['Authorization'];

      // Limpar estado do usuário
      setCurrentUser(null);
    }
  };

  // Função para registro (se necessário)
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao registrar');
      throw err;
    }
  };

  // Função para atualizar o perfil do usuário
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await axios.put('/api/auth/profile', userData);

      const updatedUser = response.data;

      // Atualizar no localStorage e no estado
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao atualizar perfil');
      throw err;
    }
  };

  // Verificar se o usuário tem uma determinada permissão
  const hasPermission = (permission) => {
    if (!currentUser || !currentUser.permissions) return false;
    return currentUser.permissions.includes(permission);
  };

  // Verificar se o usuário tem um determinado papel
  const hasRole = (role) => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes(role);
  };

  // Valor fornecido pelo context
  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    hasPermission,
    hasRole,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
