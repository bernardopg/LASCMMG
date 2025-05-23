import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { MessageProvider } from '../../context/MessageContext';
import Login from '../../pages/Login';
import AdminDashboardPage from '../../pages/AdminDashboardPage';

// Mock do react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <MessageProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MessageProvider>
    </BrowserRouter>
  );
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Admin Login', () => {
    it('should login admin successfully and redirect to dashboard', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Verificar se os campos estão presentes
      const usernameInput = screen.getByLabelText(/usuário/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const loginButton = screen.getByRole('button', { name: /entrar/i });

      expect(usernameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(loginButton).toBeInTheDocument();

      // Preencher credenciais do admin
      await user.type(usernameInput, 'admin@lascmmg.com');
      await user.type(passwordInput, 'admin123');

      // Clicar no botão de login
      await user.click(loginButton);

      // Aguardar processamento do login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });

      // Verificar se o token foi armazenado
      expect(localStorage.setItem).toHaveBeenCalledWith('adminToken', 'mock-jwt-token');
    });

    it('should show error message for invalid admin credentials', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/usuário/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const loginButton = screen.getByRole('button', { name: /entrar/i });

      // Preencher credenciais inválidas
      await user.type(usernameInput, 'admin@wrong.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      // Aguardar mensagem de erro
      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
      });

      // Verificar que não foi redirecionado
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle network errors during login', async () => {
      const user = userEvent.setup();

      // Mock network error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/usuário/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const loginButton = screen.getByRole('button', { name: /entrar/i });

      await user.type(usernameInput, 'admin@lascmmg.com');
      await user.type(passwordInput, 'admin123');

      // Simular erro de rede desabilitando MSW temporariamente
      const { server } = await import('../mocks/server');
      server.close();

      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/erro de conexão/i)).toBeInTheDocument();
      });

      // Restaurar server
      server.listen();
      consoleSpy.mockRestore();
    });
  });

  describe('User Login', () => {
    it('should login regular user successfully', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/usuário/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const loginButton = screen.getByRole('button', { name: /entrar/i });

      // Preencher credenciais do usuário
      await user.type(usernameInput, 'user@test.com');
      await user.type(passwordInput, 'user123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });

      expect(localStorage.setItem).toHaveBeenCalledWith('userToken', 'mock-user-jwt-token');
    });
  });

  describe('Authentication State Management', () => {
    it('should maintain authentication state across page reloads', () => {
      // Simular token existente
      localStorage.setItem('adminToken', 'mock-jwt-token');

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Verificar se o dashboard é renderizado sem problemas
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    it('should logout and clear tokens', async () => {
      const user = userEvent.setup();

      // Simular usuário logado
      localStorage.setItem('adminToken', 'mock-jwt-token');

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Encontrar e clicar no botão de logout
      const logoutButton = screen.getByRole('button', { name: /sair/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('adminToken');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect unauthenticated users to login', () => {
      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Verificar redirecionamento para login
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('CSRF Protection', () => {
    it('should fetch and use CSRF token on login', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/usuário/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const loginButton = screen.getByRole('button', { name: /entrar/i });

      await user.type(usernameInput, 'admin@lascmmg.com');
      await user.type(passwordInput, 'admin123');
      await user.click(loginButton);

      // O CSRF token deve ser automaticamente incluído nas requisições
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('should handle CSRF token errors', async () => {
      const user = userEvent.setup();

      // Mock CSRF error response
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.post('http://localhost:3000/api/auth/login', () => {
          return HttpResponse.json({ message: 'CSRF token invalid' }, { status: 403 });
        })
      );

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/usuário/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const loginButton = screen.getByRole('button', { name: /entrar/i });

      await user.type(usernameInput, 'admin@lascmmg.com');
      await user.type(passwordInput, 'admin123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/token csrf inválido/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should handle token expiration gracefully', async () => {
      // Simular token expirado
      localStorage.setItem('adminToken', 'expired-token');

      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.get('http://localhost:3000/api/admin/stats', () => {
          return HttpResponse.json({ message: 'Token expired' }, { status: 401 });
        })
      );

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
        expect(localStorage.removeItem).toHaveBeenCalledWith('adminToken');
      });
    });

    it('should auto-logout after token expiration time', async () => {
      vi.useFakeTimers();

      localStorage.setItem('adminToken', 'mock-jwt-token');
      localStorage.setItem('tokenExpiration', Date.now() + 1000); // Expira em 1 segundo

      render(
        <TestWrapper>
          <AdminDashboardPage />
        </TestWrapper>
      );

      // Avançar o tempo para além da expiração
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      vi.useRealTimers();
    });
  });
});
