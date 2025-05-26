import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminScoresTable from '../../components/admin/AdminScoresTable';
import { AuthProvider } from '../../context/AuthContext';
import { MessageProvider } from '../../context/MessageContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { TournamentProvider } from '../../context/TournamentContext';
import AddScorePage from '../../pages/AddScorePage';
import ScoresPage from '../../pages/ScoresPage';

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
          <NotificationProvider>
            <TournamentProvider>{children}</TournamentProvider>
          </NotificationProvider>
        </AuthProvider>
      </MessageProvider>
    </BrowserRouter>
  );
};

describe('Scores Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Simular admin logado
    localStorage.setItem('adminToken', 'mock-jwt-token');
  });

  describe('Scores List Management', () => {
    it('should load and display scores list', async () => {
      render(
        <TestWrapper>
          <AdminScoresTable />
        </TestWrapper>
      );

      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      });

      // Verificar presença de elementos do placar
      expect(screen.getByText('Quartas de Final')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // player1_score
      expect(screen.getByText('1')).toBeInTheDocument(); // player2_score
    });

    it('should handle pagination in scores table', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminScoresTable />
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
        await waitFor(() => {
          expect(screen.getByText(/página \d+ de \d+/i)).toBeInTheDocument();
        });
      }
    });

    it('should display winner correctly', async () => {
      render(
        <TestWrapper>
          <AdminScoresTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Verificar se o vencedor está destacado
      const winnerElements = screen.getAllByText('João Silva');
      expect(winnerElements.length).toBeGreaterThan(1); // Aparece como player1 e como winner
    });
  });

  describe('Score Creation', () => {
    it('should create a new score successfully', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AddScorePage />
        </TestWrapper>
      );

      // Aguardar carregamento da página
      await waitFor(() => {
        expect(screen.getByText(/adicionar placar/i)).toBeInTheDocument();
      });

      // Preencher formulário de placar
      const player1Select = screen.getByLabelText(/jogador 1/i);
      const player2Select = screen.getByLabelText(/jogador 2/i);
      const player1ScoreInput = screen.getByLabelText(/placar jogador 1/i);
      const player2ScoreInput = screen.getByLabelText(/placar jogador 2/i);
      const roundSelect = screen.getByLabelText(/rodada/i);
      const submitButton = screen.getByRole('button', { name: /salvar placar/i });

      // Selecionar jogadores
      await user.selectOptions(player1Select, 'João Silva');
      await user.selectOptions(player2Select, 'Maria Santos');

      // Inserir placares
      await user.type(player1ScoreInput, '3');
      await user.type(player2ScoreInput, '1');

      // Selecionar rodada
      await user.selectOptions(roundSelect, 'Semifinal');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/placar salvo com sucesso/i)).toBeInTheDocument();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/admin/scores');
    });

    it('should validate required fields for score creation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AddScorePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/adicionar placar/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /salvar placar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/jogador 1 é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/jogador 2 é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/placar é obrigatório/i)).toBeInTheDocument();
      });
    });

    it('should validate that players are different', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AddScorePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/adicionar placar/i)).toBeInTheDocument();
      });

      const player1Select = screen.getByLabelText(/jogador 1/i);
      const player2Select = screen.getByLabelText(/jogador 2/i);
      const submitButton = screen.getByRole('button', { name: /salvar placar/i });

      // Selecionar o mesmo jogador para ambos
      await user.selectOptions(player1Select, 'João Silva');
      await user.selectOptions(player2Select, 'João Silva');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/jogadores devem ser diferentes/i)).toBeInTheDocument();
      });
    });

    it('should validate score values', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AddScorePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/adicionar placar/i)).toBeInTheDocument();
      });

      const player1Select = screen.getByLabelText(/jogador 1/i);
      const player2Select = screen.getByLabelText(/jogador 2/i);
      const player1ScoreInput = screen.getByLabelText(/placar jogador 1/i);
      const player2ScoreInput = screen.getByLabelText(/placar jogador 2/i);
      const submitButton = screen.getByRole('button', { name: /salvar placar/i });

      await user.selectOptions(player1Select, 'João Silva');
      await user.selectOptions(player2Select, 'Maria Santos');

      // Inserir valores inválidos
      await user.type(player1ScoreInput, '-1');
      await user.type(player2ScoreInput, '50');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/placar deve ser entre 0 e 21/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors during score creation', async () => {
      const user = userEvent.setup();

      // Mock server error
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.post('http://localhost:3000/api/admin/scores', () => {
          return HttpResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <AddScorePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/adicionar placar/i)).toBeInTheDocument();
      });

      const player1Select = screen.getByLabelText(/jogador 1/i);
      const player2Select = screen.getByLabelText(/jogador 2/i);
      const player1ScoreInput = screen.getByLabelText(/placar jogador 1/i);
      const player2ScoreInput = screen.getByLabelText(/placar jogador 2/i);
      const submitButton = screen.getByRole('button', { name: /salvar placar/i });

      await user.selectOptions(player1Select, 'João Silva');
      await user.selectOptions(player2Select, 'Maria Santos');
      await user.type(player1ScoreInput, '2');
      await user.type(player2ScoreInput, '1');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/erro interno do servidor/i)).toBeInTheDocument();
      });
    });
  });

  describe('Score Editing', () => {
    it('should load existing score data for editing', async () => {
      render(
        <TestWrapper>
          <AdminScoresTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Encontrar e clicar no botão de editar
      const editButtons = screen.getAllByRole('button', { name: /editar/i });
      const firstEditButton = editButtons[0];

      await userEvent.click(firstEditButton);

      // Verificar se modal de edição abriu com dados
      await waitFor(() => {
        expect(screen.getByDisplayValue('2')).toBeInTheDocument(); // player1_score
        expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // player2_score
      });
    });

    it('should update score successfully', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminScoresTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /editar/i });
      await user.click(editButtons[0]);

      // Aguardar modal abrir
      await waitFor(() => {
        expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      });

      const player1ScoreInput = screen.getByDisplayValue('2');
      const saveButton = screen.getByRole('button', { name: /salvar/i });

      // Alterar placar
      await user.clear(player1ScoreInput);
      await user.type(player1ScoreInput, '3');

      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/placar atualizado com sucesso/i)).toBeInTheDocument();
      });
    });

    it('should handle update errors', async () => {
      const user = userEvent.setup();

      // Mock update error
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.put('http://localhost:3000/api/admin/scores/:id', () => {
          return HttpResponse.json({ message: 'Erro ao atualizar placar' }, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <AdminScoresTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /editar/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/erro ao atualizar placar/i)).toBeInTheDocument();
      });
    });
  });

  describe('Score Deletion', () => {
    it('should delete score and move to trash', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminScoresTable />
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
        expect(screen.getByText(/placar movido para lixeira/i)).toBeInTheDocument();
      });

      // Verificar que o placar foi removido da lista
      await waitFor(() => {
        expect(screen.queryByText(/quartas de final/i)).not.toBeInTheDocument();
      });
    });

    it('should handle deletion errors', async () => {
      const user = userEvent.setup();

      // Mock deletion error
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.delete('http://localhost:3000/api/admin/scores/:id', () => {
          return HttpResponse.json({ message: 'Erro ao deletar placar' }, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <AdminScoresTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/erro ao deletar placar/i)).toBeInTheDocument();
      });
    });
  });

  describe('Public Scores View', () => {
    it('should display scores for public users', async () => {
      // Remover token de admin para simular usuário público
      localStorage.removeItem('adminToken');

      render(
        <TestWrapper>
          <ScoresPage />
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

    it('should allow filtering scores by round', async () => {
      const user = userEvent.setup();
      localStorage.removeItem('adminToken');

      render(
        <TestWrapper>
          <ScoresPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Quartas de Final')).toBeInTheDocument();
      });

      // Encontrar filtro de rodada
      const roundFilter = screen.getByLabelText(/filtrar por rodada/i);
      await user.selectOptions(roundFilter, 'Quartas de Final');

      await waitFor(() => {
        expect(screen.getByText('Quartas de Final')).toBeInTheDocument();
      });
    });

    it('should allow filtering scores by player', async () => {
      const user = userEvent.setup();
      localStorage.removeItem('adminToken');

      render(
        <TestWrapper>
          <ScoresPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const playerFilter = screen.getByPlaceholderText(/buscar por jogador/i);
      await user.type(playerFilter, 'João');

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });
  });

  describe('Winner Calculation', () => {
    it('should automatically determine winner based on scores', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AddScorePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/adicionar placar/i)).toBeInTheDocument();
      });

      const player1Select = screen.getByLabelText(/jogador 1/i);
      const player2Select = screen.getByLabelText(/jogador 2/i);
      const player1ScoreInput = screen.getByLabelText(/placar jogador 1/i);
      const player2ScoreInput = screen.getByLabelText(/placar jogador 2/i);

      await user.selectOptions(player1Select, 'João Silva');
      await user.selectOptions(player2Select, 'Maria Santos');
      await user.type(player1ScoreInput, '1');
      await user.type(player2ScoreInput, '3');

      // Verificar se o vencedor é automaticamente determinado
      await waitFor(() => {
        expect(screen.getByText(/vencedor: maria santos/i)).toBeInTheDocument();
      });
    });

    it('should handle tie scores', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AddScorePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/adicionar placar/i)).toBeInTheDocument();
      });

      const player1Select = screen.getByLabelText(/jogador 1/i);
      const player2Select = screen.getByLabelText(/jogador 2/i);
      const player1ScoreInput = screen.getByLabelText(/placar jogador 1/i);
      const player2ScoreInput = screen.getByLabelText(/placar jogador 2/i);

      await user.selectOptions(player1Select, 'João Silva');
      await user.selectOptions(player2Select, 'Maria Santos');
      await user.type(player1ScoreInput, '2');
      await user.type(player2ScoreInput, '2');

      // Verificar tratamento de empate
      await waitFor(() => {
        expect(screen.getByText(/empate/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update scores list when new score is added', async () => {
      const user = userEvent.setup();

      // Renderizar duas instâncias para simular updates em tempo real
      const { rerender } = render(
        <TestWrapper>
          <AdminScoresTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Simular adição de novo placar
      rerender(
        <TestWrapper>
          <AddScorePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/adicionar placar/i)).toBeInTheDocument();
      });

      const player1Select = screen.getByLabelText(/jogador 1/i);
      const player2Select = screen.getByLabelText(/jogador 2/i);
      const player1ScoreInput = screen.getByLabelText(/placar jogador 1/i);
      const player2ScoreInput = screen.getByLabelText(/placar jogador 2/i);
      const submitButton = screen.getByRole('button', { name: /salvar placar/i });

      await user.selectOptions(player1Select, 'Maria Santos');
      await user.selectOptions(player2Select, 'João Silva');
      await user.type(player1ScoreInput, '2');
      await user.type(player2ScoreInput, '0');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/placar salvo com sucesso/i)).toBeInTheDocument();
      });

      // Voltar para lista para verificar atualização
      rerender(
        <TestWrapper>
          <AdminScoresTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      });
    });
  });

  describe('Data Validation', () => {
    it('should prevent duplicate score entries', async () => {
      const user = userEvent.setup();

      // Mock duplicate entry error
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.post('http://localhost:3000/api/admin/scores', () => {
          return HttpResponse.json(
            { message: 'Placar já existe para estes jogadores' },
            { status: 409 }
          );
        })
      );

      render(
        <TestWrapper>
          <AddScorePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/adicionar placar/i)).toBeInTheDocument();
      });

      const player1Select = screen.getByLabelText(/jogador 1/i);
      const player2Select = screen.getByLabelText(/jogador 2/i);
      const player1ScoreInput = screen.getByLabelText(/placar jogador 1/i);
      const player2ScoreInput = screen.getByLabelText(/placar jogador 2/i);
      const submitButton = screen.getByRole('button', { name: /salvar placar/i });

      await user.selectOptions(player1Select, 'João Silva');
      await user.selectOptions(player2Select, 'Maria Santos');
      await user.type(player1ScoreInput, '2');
      await user.type(player2ScoreInput, '1');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/placar já existe para estes jogadores/i)).toBeInTheDocument();
      });
    });
  });
});
