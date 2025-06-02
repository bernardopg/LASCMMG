import { AuthProvider } from './AuthContext';
import { MessageProvider } from './MessageContext';
import { NotificationProvider } from './NotificationContext';
import { TournamentProvider } from './TournamentContext';

/**
 * Centralized App Providers Component
 * Combines all context providers in the correct order to avoid prop drilling
 * and ensure proper context hierarchy
 */
const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <MessageProvider>
        <NotificationProvider>
          <TournamentProvider>{children}</TournamentProvider>
        </NotificationProvider>
      </MessageProvider>
    </AuthProvider>
  );
};

export default AppProviders;
