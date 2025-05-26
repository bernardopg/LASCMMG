import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import apiInstance, {
  setAuthToken as setApiAuthToken,
  setAuthSuccessHandler,
} from '../services/api'; // Import setAuthSuccessHandler

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
  const [error, setError] = useState(null); // For login/registration errors
  const [tokenRefreshing, setTokenRefreshing] = useState(false);

  const checkLoggedInAttempted = useRef(false);
  const refreshTimeoutRef = useRef(null);

  const clearAuthData = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberMe');
    setApiAuthToken(null); // Clears token from api.js default headers
    setCurrentUser(null);
    setError(null);
  }, []);

  const logout = useCallback(
    async (navigate) => {
      try {
        if (currentUser) {
          await apiInstance.post('/api/auth/logout'); // Call backend logout
        }
      } catch (err) {
        console.warn(
          'Erro ao fazer logout no servidor (pode já estar deslogado ou token inválido):',
          err
        );
      } finally {
        clearAuthData();
        if (navigate) {
          navigate('/login', { replace: true });
        } else if (window.location.pathname !== '/login') {
          // Fallback if navigate is not passed, e.g. from an interceptor
          window.location.href = '/login';
        }
      }
    },
    [currentUser, clearAuthData]
  );

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
      console.log(
        `Token JWT: ${authToken ? '✅ Presente (' + authToken.substring(0, 15) + '...)' : '❌ Ausente'}`
      );
      console.log(
        `Refresh Token: ${refreshToken ? '✅ Presente (' + refreshToken.substring(0, 15) + '...)' : '❌ Ausente'}`
      );
      console.log(`Lembrar-me: ${rememberMe === 'true' ? '✅ Ativado' : '❌ Desativado'}`);
      console.log(
        `Expiração do token: ${new Date(expiryTime).toLocaleString()} (${minutesLeft} minutos restantes)`
      );
      console.log(
        `Refresh automático agendado: ${refreshTimeoutRef.current ? '✅ Sim' : '❌ Não'}`
      );
      console.groupEnd();
    } else {
      console.log('[AuthContext] Nenhum token ativo encontrado');
    }
  }, []);

  const scheduleTokenRefresh = useCallback((expiryTime) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes
    let refreshDelay = timeUntilExpiry - refreshBuffer;

    if (refreshDelay < 0) refreshDelay = 5000; // If already within buffer, try to refresh soon

    console.log(
      `[AuthContext] Token será renovado em ${Math.round(refreshDelay / 60000)} minutos.`
    );

    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('[AuthContext] Executando refresh token automático');
      try {
        await refreshToken(); // refreshToken itself will call scheduleTokenRefresh on success
      } catch (err) {
        console.error('[AuthContext] Falha no refresh automático:', err);
        // Logout is handled within refreshToken on failure
      }
    }, refreshDelay);
  }, []); // refreshToken will be added to dependency array after its definition

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      console.warn('[AuthContext] Refresh token não encontrado para renovação.');
      await logout(); // No refresh token, so logout
      throw new Error('Refresh token não disponível.');
    }

    try {
      setTokenRefreshing(true);
      console.log('[AuthContext] Iniciando processo de refresh token com o backend.');
      const response = await apiInstance.post('/api/auth/refresh-token', {
        refreshToken: storedRefreshToken,
      });

      const {
        token: newAccessToken,
        refreshToken: newRefreshTokenAfterRefresh,
        expiresIn,
      } = response.data;

      if (!newAccessToken) {
        throw new Error('Novo token de acesso não recebido do backend.');
      }

      console.log(`[AuthContext] Refresh token bem-sucedido. Novo token expira em ${expiresIn}s`);
      setApiAuthToken(newAccessToken);
      localStorage.setItem('authToken', newAccessToken);

      if (newRefreshTokenAfterRefresh) {
        localStorage.setItem('refreshToken', newRefreshTokenAfterRefresh);
      }

      const newExpiryTime = Date.now() + (expiresIn || 3600) * 1000;
      localStorage.setItem('tokenExpiry', newExpiryTime.toString());

      scheduleTokenRefresh(newExpiryTime); // Schedule next refresh
      debugTokenStatus();
      return newAccessToken;
    } catch (err) {
      console.error('Erro ao atualizar token via refresh:', err);
      await logout(); // If refresh fails, logout user
      throw err; // Re-throw for any calling component to handle if needed
    } finally {
      setTokenRefreshing(false);
    }
  }, [logout, scheduleTokenRefresh, debugTokenStatus]); // scheduleTokenRefresh is now defined before refreshToken

  // Add scheduleTokenRefresh to refreshToken's dependency array
  useEffect(() => {
    // This effect is just to manage the dependency cycle warning if any,
    // actual scheduling is done inside refreshToken and checkLoggedIn
  }, [scheduleTokenRefresh]);

  const checkTokenExpiration = useCallback(async () => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (!tokenExpiry) {
      if (currentUser) await logout(); // If there's a user but no expiry, something is wrong
      return false;
    }

    const expiryTime = parseInt(tokenExpiry, 10);
    const now = Date.now();

    if (now >= expiryTime) {
      console.log('[AuthContext] Token expirado. Tentando refresh...');
      try {
        if (!tokenRefreshing) {
          await refreshToken();
          return true; // Assuming refresh was successful and new token is set
        }
      } catch (err) {
        console.error('[AuthContext] Falha ao tentar refresh de token expirado:', err);
        // Logout is handled within refreshToken on failure
        return false;
      }
    } else {
      // Token is not expired, ensure refresh is scheduled if it's not already
      if (!refreshTimeoutRef.current) {
        // And if user is logged in (currentUser exists)
        if (currentUser) scheduleTokenRefresh(expiryTime);
      }
    }
    return true; // Token is valid or refresh was successful
  }, [currentUser, logout, refreshToken, tokenRefreshing, scheduleTokenRefresh]);

  useEffect(() => {
    const checkLoggedIn = async () => {
      if (checkLoggedInAttempted.current) return;
      checkLoggedInAttempted.current = true;
      setLoading(true);

      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUserString = localStorage.getItem('authUser');

        if (storedToken && storedUserString) {
          // Set the auth token first to ensure it's available for all requests
          setApiAuthToken(storedToken);

          if (await checkTokenExpiration()) {
            // This will also attempt refresh if needed
            try {
              const user = JSON.parse(storedUserString);
              setCurrentUser(user); // Optimistically set user
              // Optionally, re-verify with /api/me if token is still valid after potential refresh
              const response = await apiInstance.get('/api/me');
              if (response.data && response.data.success && response.data.user) {
                setCurrentUser(response.data.user);
                localStorage.setItem('authUser', JSON.stringify(response.data.user));
              } else {
                await logout(); // /api/me failed, token might be invalid despite not being expired
              }
            } catch (parseOrApiError) {
              console.error('Error parsing stored user or /api/me failed:', parseOrApiError);
              await logout();
            }
          }
        } else {
          clearAuthData(); // Ensure everything is cleared if no token/user
        }
      } catch (err) {
        console.error('Erro geral ao verificar autenticação inicial:', err);
        await logout();
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, [logout, checkTokenExpiration, clearAuthData]);

  useEffect(() => {
    const tokenCheckInterval = setInterval(
      async () => {
        if (currentUser) {
          // Only check if a user is logged in
          await checkTokenExpiration();
        }
      },
      1 * 60 * 1000
    ); // Check every minute
    return () => clearInterval(tokenCheckInterval);
  }, [currentUser, checkTokenExpiration]);

  useEffect(() => {
    if (currentUser) {
      const debugInterval = setInterval(debugTokenStatus, 60000);
      debugTokenStatus(); // Initial call
      return () => clearInterval(debugInterval);
    }
  }, [currentUser, debugTokenStatus]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Called by api.js service functions after successful login
  const handleLoginSuccessAndSetState = useCallback(
    (user, token, receivedRefreshToken, expiresIn, rememberMe) => {
      setError(null);
      setApiAuthToken(token);
      setCurrentUser(user);
      localStorage.setItem('authUser', JSON.stringify(user));
      localStorage.setItem('authToken', token);

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        if (receivedRefreshToken) {
          localStorage.setItem('refreshToken', receivedRefreshToken);
        }
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('refreshToken');
      }

      const expiryTimeMs = Date.now() + (expiresIn || 3600) * 1000;
      localStorage.setItem('tokenExpiry', expiryTimeMs.toString());
      scheduleTokenRefresh(expiryTimeMs);
      debugTokenStatus();
    },
    [scheduleTokenRefresh, debugTokenStatus]
  );

  // updateCurrentUser is a placeholder as PUT /api/me is not implemented for general profile updates.
  // Specific updates like password change should use dedicated functions from api.js.
  const updateCurrentUser = useCallback(
    async (newUserData) => {
      console.warn(
        'updateCurrentUser in AuthContext is a placeholder. For password changes, use specific API functions.'
      );
      // If a general profile update endpoint (e.g., PUT /api/users/me/profile) existed:
      // try {
      //   const response = await apiInstance.put('/api/users/me/profile', newUserData); // Hypothetical
      //   if (response.data.success && response.data.user) {
      //     setCurrentUser(response.data.user);
      //     localStorage.setItem('authUser', JSON.stringify(response.data.user));
      //     return response.data.user;
      //   }
      //   throw new Error(response.data.message || 'Failed to update profile');
      // } catch (err) {
      //   setError(err.response?.data?.message || err.message);
      //   throw err;
      // }
      // For now, just update local state if needed for optimistic UI, but this won't persist.
      // setCurrentUser(prevUser => ({ ...prevUser, ...newUserData }));
      return currentUser;
    },
    [currentUser]
  );

  // Provide the handleLoginSuccessAndSetState function to api.js
  useEffect(() => {
    if (handleLoginSuccessAndSetState) {
      setAuthSuccessHandler(handleLoginSuccessAndSetState);
    }
    // Cleanup on unmount if necessary, though setAuthSuccessHandler is simple
    return () => {
      setAuthSuccessHandler(null); // Clear handler on unmount
    };
  }, [handleLoginSuccessAndSetState]);

  const hasPermission = useCallback(
    (permission) => {
      if (!currentUser || !currentUser.role) return false;
      if (currentUser.role === 'admin') return true; // Admins have all permissions
      // Add more granular permission checks if currentUser.permissions array exists
      return false;
    },
    [currentUser]
  );

  const hasRole = useCallback(
    (roleOrRoles) => {
      if (!currentUser || !currentUser.role) return false;
      const rolesToCheck = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
      return rolesToCheck.includes(currentUser.role);
    },
    [currentUser]
  );

  // This is the login function that components like Login.jsx will call.
  // It takes the specific API login function (e.g., api.loginUser or api.loginRegularUser)
  // and the credentials.
  const login = useCallback(
    async (apiLoginFunction, credentials, rememberMe = false) => {
      setLoading(true);
      setError(null);
      try {
        // apiLoginFunction (e.g., api.loginUser) is expected to call
        // handleLoginSuccessAndSetState internally upon successful API response.
        // This was set up via setAuthSuccessHandler(handleLoginSuccessAndSetState) in api.js.
        const responseData = await apiLoginFunction(credentials, rememberMe); // Pass rememberMe if api function expects it

        // If apiLoginFunction doesn't call handleLoginSuccessAndSetState itself,
        // (which it should, via the handler), we might need to call it here.
        // However, the current setup is that api.js's loginUser/loginRegularUser
        // will call the registered handleLoginSuccess.

        // For safety, we can check if currentUser got set by the callback from api.js
        // This is more of a verification than primary logic.
        if (!localStorage.getItem('authToken')) {
          // A simple check
          throw new Error(
            responseData.message || 'Falha no login, dados de autenticação não foram definidos.'
          );
        }
        return responseData; // Return the response from the API call
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Erro desconhecido durante o login.';
        setError(errorMessage);
        console.error('Erro no AuthContext login:', errorMessage, err.response?.data);
        // Ensure local auth state is cleared on login failure
        clearAuthData();
        throw err; // Re-throw for the UI component to handle
      } finally {
        setLoading(false);
      }
    },
    [handleLoginSuccessAndSetState, clearAuthData]
  ); // Added clearAuthData

  const value = {
    currentUser,
    loading,
    error,
    login, // Expose the login function
    logout,
    refreshTokenFunction: refreshToken,
    hasPermission,
    hasRole,
    updateCurrentUser,
    isAuthenticated: !!currentUser,
    tokenRefreshing,
    // handleLoginSuccess is now primarily for internal use by api.js via setAuthSuccessHandler
    // but can be kept if direct use is needed, though login function above is preferred interface.
    handleLoginSuccess: handleLoginSuccessAndSetState,
    debugTokenStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
