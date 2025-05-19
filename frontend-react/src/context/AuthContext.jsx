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

          // Verificar se o token ainda é válido usando /api/me
          try {
            const response = await axios.get('/api/me');
            if (response.data && response.data.success && response.data.user) {
              setCurrentUser(response.data.user);
            } else {
              // Token inválido ou resposta inesperada, fazer logout
              // logout() já lida com a limpeza do localStorage e axios defaults
              await logout();
            }
          } catch (err) {
            // Se /api/me falhar (ex: 401, token expirado, erro de rede), fazer logout
            // logout() já lida com a limpeza do localStorage e axios defaults
            console.warn('Falha ao verificar token com /api/me, fazendo logout:', err.message);
            await logout();
          }
        }
      } catch (err) {
        // Erro ao acessar localStorage, por exemplo.
        console.error('Erro crítico durante checkLoggedIn (ex: localStorage):', err);
        // Garantir que o estado local seja limpo se houver erro aqui
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
        setCurrentUser(null);
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

      // O interceptor do Axios em services/api.js já deve adicionar o X-CSRF-Token.
      // A leitura manual do cookie aqui é provavelmente redundante.

      // Mapeia email para username conforme esperado pelo backend
      // TODO: Verificar se esta limpeza de email ainda é necessária após correções no formulário de Login.
      const cleanEmail = email.includes('@') ?
        email.substring(0, email.indexOf('@')) + '@' + email.substring(email.indexOf('@') + 1) :
        email;

      const response = await axios.post('/api/auth/login', {
        username: cleanEmail, // O backend espera 'username'
        password
      }); // O header CSRF será adicionado pelo interceptor

      // Aceita tanto { admin, token } quanto { user, token }
      const { admin, user, token } = response.data;
      const userObj = user || admin;

      // Salvar no localStorage sempre como "user"
      localStorage.setItem('authUser', JSON.stringify(userObj));
      localStorage.setItem('authToken', token);

      // Configurar token para futuras requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setCurrentUser(userObj);
      return userObj;
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
  // TODO: Endpoint /api/auth/register não existe no backend atualmente.
  // const register = async (userData) => {
  //   try {
  //     setError(null);
  //     const response = await axios.post('/api/auth/register', userData);
  //     // Considerar login automático após registro bem-sucedido
  //     return response.data;
  //   } catch (err) {
  //     setError(err.response?.data?.message || 'Falha ao registrar');
  //     throw err;
  //   }
  // };

  // Função para atualizar o perfil do usuário
  // TODO: Endpoint /api/auth/profile não existe no backend atualmente.
  // const updateProfile = async (userData) => {
  //   try {
  //     setError(null);
  //     const response = await axios.put('/api/auth/profile', userData);
  //     const updatedUser = response.data.user; // Supondo que o backend retorne { success: true, user: ... }

  //     if (updatedUser) {
  //       localStorage.setItem('authUser', JSON.stringify(updatedUser));
  //       setCurrentUser(updatedUser);
  //     }
  //     return updatedUser;
  //   } catch (err) {
  //     setError(err.response?.data?.message || 'Falha ao atualizar perfil');
  //     throw err;
  //   }
  // };

  // Verificar se o usuário tem uma determinada permissão
  // TODO: O backend atualmente retorna user.role (singular). Se múltiplas permissões/papéis forem necessários,
  // o backend precisa ser ajustado para enviar um array currentUser.permissions.
  const hasPermission = (permission) => {
    // Exemplo de implementação se currentUser.permissions fosse um array:
    // if (!currentUser || !Array.isArray(currentUser.permissions)) return false;
    // return currentUser.permissions.includes(permission);

    // Implementação atual baseada em um único role:
    if (!currentUser || !currentUser.role) return false;
    // Simplesmente verificar se a "permissão" é igual ao "papel" pode ser um placeholder.
    // Uma lógica mais robusta seria mapear papéis para permissões.
    // Por agora, se a permissão for 'admin', verificamos se o papel é 'admin'.
    if (permission === 'admin') {
      return currentUser.role === 'admin';
    }
    return false; // Nenhuma outra permissão definida por enquanto
  };

  // Verificar se o usuário tem um determinado papel
  const hasRole = (role) => {
    if (!currentUser || !currentUser.role) return false;
    // O backend retorna user.role (singular)
    return currentUser.role === role;
  };

  // Valor fornecido pelo context
  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    // register, // Removido pois o endpoint não existe
    // updateProfile, // Removido pois o endpoint não existe
    hasPermission,
    hasRole,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
