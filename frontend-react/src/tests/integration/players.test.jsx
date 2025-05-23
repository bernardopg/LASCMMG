import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { MessageProvider } from '../../context/MessageContext';
import { TournamentProvider } from '../../context/TournamentContext';
import AdminPlayersTable from '../../components/admin/AdminPlayersTable';
import CreatePlayerPage from '../../pages/admin/CreatePlayerPage';
import EditPlayerPage from '../../pages/admin/EditPlayerPage';
import PlayersPage from '../../pages/PlayersPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <MessageProvider>
        <AuthProvider>
          <TournamentProvider>
            {children}
          </TournamentProvider>
        </AuthProvider>
      </MessageProvider>
    </BrowserRouter>
  );
};

describe('Players Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Simular admin logado
    localStorage.setItem('adminToken', 'mock-jwt-token');
  });

  describe('Players List Management', () => {
    it('should load and display players list', async () => {
      render(
        <TestWrapper>
          <AdminPlayersTable />
        </TestWrapper>
      );

      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      });

      // Verificar presença de elementos da tabela
      expect(screen.getByText('JoãoGamer')).toBeInTheDocument();
      expect(screen.getByText('MariaPro')).toBeInTheDocument();
      expect(screen.getByText('joao@test.com')).toBeInTheDocument();
      expect(screen.getByText('maria@test.com')).toBeInTheDocument();
    });

    it('should handle search functionality', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminPlayersTable />
        </TestWrapper>
      );

      // Aguardar carregamento inicial
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Encontrar campo de busca
      const searchInput = screen.getByPlaceholderText(/buscar jogadores/i);
      expect(searchInput).toBeInTheDocument();

      // Realizar busca
      await user.type(searchInput, 'João');

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
      });
    });

    it('should handle pagination', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminPlayersTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Verificar elementos de paginação
      const paginationInfo = screen.getByText(/página \d+ de \d+/i);
      expect(paginationInfo).toBeInTheDocument();

      // Testar navegação se houver mais páginas
      const nextButton = screen.queryByRole('button', { name: /próxima/i });
      if (nextButton && !nextButton.disabled) {
        await user.click(nextButton);
        // Aguardar carregamento da próxima página
        await waitFor(() => {
          expect(screen.getByText(/página \d+ de \d+/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Player Creation', () => {
    it('should create a new player successfully', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreatePlayerPage />
        </TestWrapper>
      );

      // Preencher formulário
      const nameInput = screen.getByLabelText(/nome/i);
      const nicknameInput = screen.getByLabelText(/nickname/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /criar jogador/i });

      await user.type(nameInput, 'Novo Jogador');
      await user.type(nicknameInput, 'NovoPlayer');
      await user.type(emailInput, 'novo@test.com');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/jogador criado com sucesso/i)).toBeInTheDocument();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/admin/players');
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreatePlayerPage />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /criar jogador/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/nickname é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreatePlayerPage />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/nome/i);
      const nicknameInput = screen.getByLabelText(/nickname/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /criar jogador/i });

      await user.type(nameInput, 'Teste Player');
      await user.type(nicknameInput, 'TestePlayer');
      await user.type(emailInput, 'email-invalido');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/formato de email inválido/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors during creation', async () => {
      const user = userEvent.setup();

      // Mock server error
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.post('http://localhost:3000/api/admin/players', () => {
          return HttpResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <CreatePlayerPage />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/nome/i);
      const nicknameInput = screen.getByLabelText(/nickname/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /criar jogador/i });

      await user.type(nameInput, 'Teste Player');
      await user.type(nicknameInput, 'TestePlayer');
      await user.type(emailInput, 'teste@valid.com');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/erro interno do servidor/i)).toBeInTheDocument();
      });
    });
  });

  describe('Player Editing', () => {
    it('should load player data for editing', async () => {
      render(
        <TestWrapper>
          <EditPlayerPage />
        </TestWrapper>
      );

      // Aguardar carregamento dos dados do jogador
      await waitFor(() => {
        expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
        expect(screen.getByDisplayValue('JoãoGamer')).toBeInTheDocument();
        expect(screen.getByDisplayValue('joao@test.com')).toBeInTheDocument();
      });
    });

    it('should update player successfully', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EditPlayerPage />
        </TestWrapper>
      );

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('João Silva');
      const submitButton = screen.getByRole('button', { name: /atualizar jogador/i });

      // Alterar nome
      await user.clear(nameInput);
      await user.type(nameInput, 'João Silva Atualizado');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/jogador atualizado com sucesso/i)).toBeInTheDocument();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/admin/players');
    });

    it('should handle player not found', async () => {
      // Mock player not found
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.get('http://localhost:3000/api/admin/players/1', () => {
          return HttpResponse.json({ message: 'Jogador não encontrado' }, { status: 404 });
        })
      );

      render(
        <TestWrapper>
          <EditPlayerPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/jogador não encontrado/i)).toBeInTheDocument();
      });
    });
  });

  describe('Player Deletion', () => {
    it('should delete player and move to trash', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminPlayersTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Encontrar e clicar no botão de delete
      const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
      const firstDeleteButton = deleteButtons[0];

      await user.click(firstDeleteButton);

      // Confirmar exclusão
      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/jogador movido para lixeira/i)).toBeInTheDocument();
      });

      // Verificar que o jogador foi removido da lista
      await waitFor(() => {
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
      });
    });

    it('should handle deletion errors', async () => {
      const user = userEvent.setup();

      // Mock deletion error
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.delete('http://localhost:3000/api/admin/players/:id', () => {
          return HttpResponse.json({ message: 'Erro ao deletar jogador' }, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <AdminPlayersTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
      const firstDeleteButton = deleteButtons[0];

      await user.click(firstDeleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/erro ao deletar jogador/i)).toBeInTheDocument();
      });
    });
  });

  describe('Public Players View', () => {
    it('should display players list for public users', async () => {
      // Remover token de admin para simular usuário público
      localStorage.removeItem('adminToken');

      render(
        <TestWrapper>
          <PlayersPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      });

      // Verificar que botões de admin não estão presentes
      expect(screen.queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    });

    it('should allow filtering players in public view', async () => {
      const user = userEvent.setup();
      localStorage.removeItem('adminToken');

      render(
        <TestWrapper>
          <PlayersPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar jogadores/i);
      await user.type(searchInput, 'Maria');

      await waitFor(() => {
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
      });
    });
  });

  describe('Player Import', () => {
    it('should handle CSV file import', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminPlayersTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Encontrar botão de importação
      const importButton = screen.getByRole('button', { name: /importar jogadores/i });
      await user.click(importButton);

      // Verificar se modal de importação abriu
      expect(screen.getByText(/selecionar arquivo csv/i)).toBeInTheDocument();

      // Simular upload de arquivo
      const fileInput = screen.getByLabelText(/arquivo csv/i);
      const csvFile = new File(['name,nickname,email\nTeste,TestPlayer,teste@import.com'], 'players.csv', {
        type: 'text/csv',
      });

      await user.upload(fileInput, csvFile);

      const uploadButton = screen.getByRole('button', { name: /importar/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/jogadores importados com sucesso/i)).toBeInTheDocument();
      });
    });

    it('should validate CSV format', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminPlayersTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: /importar jogadores/i });
      await user.click(importButton);

      // Upload arquivo inválido
      const fileInput = screen.getByLabelText(/arquivo csv/i);
      const invalidFile = new File(['invalid,data'], 'invalid.csv', {
        type: 'text/csv',
      });

      await user.upload(fileInput, invalidFile);

      const uploadButton = screen.getByRole('button', { name: /importar/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/formato de arquivo inválido/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence', () => {
    it('should maintain player data after page reload', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CreatePlayerPage />
        </TestWrapper>
      );

      // Criar novo jogador
      const nameInput = screen.getByLabelText(/nome/i);
      const nicknameInput = screen.getByLabelText(/nickname/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /criar jogador/i });

      await user.type(nameInput, 'Jogador Persistente');
      await user.type(nicknameInput, 'PersistentPlayer');
      await user.type(emailInput, 'persistent@test.com');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/jogador criado com sucesso/i)).toBeInTheDocument();
      });

      // Simular reload carregando lista de jogadores
      render(
        <TestWrapper>
          <AdminPlayersTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jogador Persistente')).toBeInTheDocument();
      });
    });
  });
});
