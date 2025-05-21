import { createContext, useContext, useEffect, useState } from 'react';
import apiInstance, { setAuthToken as setApiAuthToken } from '../services/api'; // Importar api como default e setApiAuthToken

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
          // Configurar token para a instância 'api' compartilhada
          setApiAuthToken(storedToken);

          console.log('AuthContext: Verificando token com /api/auth/me. Token:', storedToken ? 'presente' : 'ausente');
          // Usar a instância 'api' configurada
          const response = await apiInstance.get('/api/auth/me');
          console.log('AuthContext: Resposta de /api/auth/me:', response.data);
          if (response.data && response.data.success && response.data.user) {
            setCurrentUser(response.data.user);
            console.log('AuthContext: Token verificado com sucesso, usuário definido:', response.data.user);
          } else {
            console.warn('AuthContext: /api/auth/me não retornou sucesso ou usuário. Resposta:', response.data, 'Fazendo logout.');
            await logout();
          }
        } else {
          setApiAuthToken(null); // Garantir que a instância api também seja limpa se não houver token
        }
      } catch (err) {
        console.warn('AuthContext: Falha ao verificar token com /api/auth/me. Erro:', err.response?.data || err.message, 'Fazendo logout.');
        await logout();
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

      const cleanEmail = email.includes('@') ?
        email.substring(0, email.indexOf('@')) + '@' + email.substring(email.indexOf('@') + 1) :
        email;

      // Usar a instância 'api' configurada
      const response = await apiInstance.post('/api/auth/login', {
        username: cleanEmail,
        password
      });

      const { admin, user, token } = response.data;
      const userObj = user || admin;

      localStorage.setItem('authUser', JSON.stringify(userObj));
      localStorage.setItem('authToken', token);

      // Configurar token para a instância 'api' compartilhada
      setApiAuthToken(token);

      setCurrentUser(userObj);
      console.log('AuthContext: Login bem-sucedido, tokens definidos.');
      return userObj;
    } catch (err) {
      setError(err.response?.data?.message || 'Falha na autenticação');
      setApiAuthToken(null); // Limpar token na instância api em caso de falha no login
      throw err;
    }
  };

  // Função de logout
  const logout = async () => {
    console.log('AuthContext: Iniciando processo de logout.');
    try {
      // Usar a instância 'api' configurada
      await apiInstance.post('/api/auth/logout');
      console.log('AuthContext: Chamada para /api/auth/logout bem-sucedida.');
    } catch (err) {
      console.error('AuthContext: Erro ao fazer logout no servidor:', err.response?.data || err.message);
    } finally {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      console.log('AuthContext: authUser e authToken removidos do localStorage.');

      setApiAuthToken(null); // Limpar token da instância 'api' compartilhada
      console.log('AuthContext: Cabeçalho Authorization removido da instância api.');

      setCurrentUser(null);
      console.log('AuthContext: currentUser definido como null.');
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
