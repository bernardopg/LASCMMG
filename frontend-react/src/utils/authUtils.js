/**
 * Logs the current status of authentication tokens and related settings.
 * Useful for debugging authentication flows.
 */
export const debugTokenStatus = () => {
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  const authToken = localStorage.getItem('authToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const rememberMe = localStorage.getItem('rememberMe');
  // Attempt to get the refreshTimeoutRef value if it's exposed or managed elsewhere.
  // For now, this part is simplified as refreshTimeoutRef is internal to AuthContext.
  // We'll indicate if a refresh is *likely* scheduled based on token presence.

  if (tokenExpiry || authToken || refreshToken) {
    const expiryTime = tokenExpiry ? parseInt(tokenExpiry, 10) : null;
    const now = Date.now();
    const minutesLeft = expiryTime ? Math.round((expiryTime - now) / (60 * 1000)) : 'N/A';

    console.group('[AuthUtils] Estado dos tokens');
    console.log(
      `Token JWT: ${authToken ? `✅ Presente (${authToken.substring(0, 15)}...)` : '❌ Ausente'}`
    );
    console.log(
      `Refresh Token: ${refreshToken ? `✅ Presente (${refreshToken.substring(0, 15)}...)` : '❌ Ausente'}`
    );
    console.log(`Lembrar-me: ${rememberMe === 'true' ? '✅ Ativado' : '❌ Desativado'}`);
    if (expiryTime) {
      console.log(
        `Expiração do token: ${new Date(expiryTime).toLocaleString()} (${minutesLeft} minutos restantes)`
      );
    } else {
      console.log('Expiração do token: ❌ Não definida');
    }
    // Cannot directly access refreshTimeoutRef here, so we make an educated guess.
    console.log(
      `Refresh automático agendado: ${authToken && expiryTime && expiryTime > now ? '❔ Provavelmente (se token ativo)' : '❌ Não ou token expirado'}`
    );
    console.groupEnd();
  } else {
    console.log('[AuthUtils] Nenhum token ativo/informação de expiração encontrada.');
  }
};
