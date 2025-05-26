import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminTrashTable from '../../components/admin/AdminTrashTable';
import { AuthProvider } from '../../context/AuthContext';
import { MessageProvider } from '../../context/MessageContext';
import { TournamentProvider } from '../../context/TournamentContext';
import TrashPage from '../../pages/admin/TrashPage';

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
          <TournamentProvider>{children}</TournamentProvider>
        </AuthProvider>
      </MessageProvider>
    </BrowserRouter>
  );
};

describe('Trash Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Simular admin logado
    localStorage.setItem('adminToken', 'mock-jwt-token');
  });

  describe('Trash List Management', () => {
    it('should load and display trash items', async () => {
      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
      });

      // Verificar presença de elementos da tabela
      expect(screen.getByText('player')).toBeInTheDocument();
      expect(screen.getByText(/2025-01-01/)).toBeInTheDocument();
    });

    it('should filter trash items by type', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      // Aguardar carregamento inicial
      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
      });

      // Encontrar filtro de tipo
      const typeFilter = screen.getByLabelText(/filtrar por tipo/i);
      expect(typeFilter).toBeInTheDocument();

      // Filtrar por tipo player
      await user.selectOptions(typeFilter, 'player');

      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
        expect(screen.getByText('player')).toBeInTheDocument();
      });
    });

    it('should handle pagination in trash table', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
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

    it('should display different item types correctly', async () => {
      // Mock data with different types
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      const mixedTrashItems = [
        {
          id: 1,
          type: 'player',
          name: 'Jogador Deletado',
          deleted_at: '2025-01-01T10:00:00Z',
        },
        {
          id: 2,
          type: 'score',
          name: 'Placar Deletado',
          deleted_at: '2025-01-01T11:00:00Z',
        },
        {
          id: 3,
          type: 'tournament',
          name: 'Torneio Deletado',
          deleted_at: '2025-01-01T12:00:00Z',
        },
      ];

      server.use(
        http.get('http://localhost:3000/api/admin/trash', () => {
          return HttpResponse.json({
            success: true,
            trashItems: mixedTrashItems,
            currentPage: 1,
            totalPages: 1,
            total: mixedTrashItems.length,
          });
        })
      );

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
        expect(screen.getByText('Placar Deletado')).toBeInTheDocument();
        expect(screen.getByText('Torneio Deletado')).toBeInTheDocument();
      });

      // Verificar tipos
      expect(screen.getByText('player')).toBeInTheDocument();
      expect(screen.getByText('score')).toBeInTheDocument();
      expect(screen.getByText('tournament')).toBeInTheDocument();
    });
  });

  describe('Item Restoration', () => {
    it('should restore item successfully', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
      });

      // Encontrar e clicar no botão de restaurar
      const restoreButtons = screen.getAllByRole('button', { name: /restaurar/i });
      const firstRestoreButton = restoreButtons[0];

      await user.click(firstRestoreButton);

      // Confirmar restauração
      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/item restaurado com sucesso/i)).toBeInTheDocument();
      });

      // Verificar que o item foi removido da lixeira
      await waitFor(() => {
        expect(screen.queryByText('Jogador Deletado')).not.toBeInTheDocument();
      });
    });

    it('should handle restoration errors', async () => {
      const user = userEvent.setup();

      // Mock restoration error
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.post('http://localhost:3000/api/admin/trash/:type/:id/restore', () => {
          return HttpResponse.json({ message: 'Erro ao restaurar item' }, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByRole('button', { name: /restaurar/i });
      await user.click(restoreButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/erro ao restaurar item/i)).toBeInTheDocument();
      });
    });

    it('should restore different item types correctly', async () => {
      const user = userEvent.setup();

      // Mock mixed trash items
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      const mixedItems = [
        { id: 1, type: 'player', name: 'Player Test', deleted_at: '2025-01-01T10:00:00Z' },
        { id: 2, type: 'score', name: 'Score Test', deleted_at: '2025-01-01T11:00:00Z' },
      ];

      server.use(
        http.get('http://localhost:3000/api/admin/trash', () => {
          return HttpResponse.json({
            success: true,
            trashItems: mixedItems,
            currentPage: 1,
            totalPages: 1,
            total: mixedItems.length,
          });
        })
      );

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Player Test')).toBeInTheDocument();
        expect(screen.getByText('Score Test')).toBeInTheDocument();
      });

      // Restaurar primeiro item (player)
      const restoreButtons = screen.getAllByRole('button', { name: /restaurar/i });
      await user.click(restoreButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/item restaurado com sucesso/i)).toBeInTheDocument();
      });
    });
  });

  describe('Permanent Deletion', () => {
    it('should permanently delete item with confirmation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
      });

      // Encontrar e clicar no botão de deletar permanentemente
      const deleteButtons = screen.getAllByRole('button', { name: /deletar permanentemente/i });
      const firstDeleteButton = deleteButtons[0];

      await user.click(firstDeleteButton);

      // Verificar modal de confirmação
      expect(screen.getByText(/excluir permanentemente/i)).toBeInTheDocument();
      expect(screen.getByText(/esta ação não pode ser desfeita/i)).toBeInTheDocument();

      // Confirmar exclusão permanente
      const confirmButton = screen.getByRole('button', { name: /excluir permanentemente/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/item excluído permanentemente/i)).toBeInTheDocument();
      });

      // Verificar que o item foi removido
      await waitFor(() => {
        expect(screen.queryByText('Jogador Deletado')).not.toBeInTheDocument();
      });
    });

    it('should cancel permanent deletion', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /deletar permanentemente/i });
      await user.click(deleteButtons[0]);

      // Cancelar exclusão
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      // Verificar que o item ainda está presente
      expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
    });

    it('should handle permanent deletion errors', async () => {
      const user = userEvent.setup();

      // Mock deletion error
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.delete('http://localhost:3000/api/admin/trash/:type/:id', () => {
          return HttpResponse.json({ message: 'Erro ao excluir item' }, { status: 500 });
        })
      );

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /deletar permanentemente/i });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /excluir permanentemente/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/erro ao excluir item/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should select multiple items for bulk operations', async () => {
      const user = userEvent.setup();

      // Mock multiple trash items
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      const multipleItems = [
        { id: 1, type: 'player', name: 'Player 1', deleted_at: '2025-01-01T10:00:00Z' },
        { id: 2, type: 'player', name: 'Player 2', deleted_at: '2025-01-01T11:00:00Z' },
        { id: 3, type: 'score', name: 'Score 1', deleted_at: '2025-01-01T12:00:00Z' },
      ];

      server.use(
        http.get('http://localhost:3000/api/admin/trash', () => {
          return HttpResponse.json({
            success: true,
            trashItems: multipleItems,
            currentPage: 1,
            totalPages: 1,
            total: multipleItems.length,
          });
        })
      );

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Player 1')).toBeInTheDocument();
        expect(screen.getByText('Player 2')).toBeInTheDocument();
        expect(screen.getByText('Score 1')).toBeInTheDocument();
      });

      // Selecionar checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);

      // Selecionar primeiro item
      await user.click(checkboxes[1]); // checkboxes[0] é provavelmente o "select all"

      // Verificar se botões de bulk operations aparecem
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /restaurar selecionados/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /excluir selecionados/i })).toBeInTheDocument();
      });
    });

    it('should restore multiple selected items', async () => {
      const user = userEvent.setup();

      // Mock multiple items and setup bulk restore
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      const multipleItems = [
        { id: 1, type: 'player', name: 'Player 1', deleted_at: '2025-01-01T10:00:00Z' },
        { id: 2, type: 'player', name: 'Player 2', deleted_at: '2025-01-01T11:00:00Z' },
      ];

      server.use(
        http.get('http://localhost:3000/api/admin/trash', () => {
          return HttpResponse.json({
            success: true,
            trashItems: multipleItems,
            currentPage: 1,
            totalPages: 1,
            total: multipleItems.length,
          });
        }),
        http.post('http://localhost:3000/api/admin/trash/bulk/restore', () => {
          return HttpResponse.json({ success: true, message: 'Items restaurados com sucesso' });
        })
      );

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Player 1')).toBeInTheDocument();
      });

      // Selecionar itens
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      // Clicar em restaurar selecionados
      const bulkRestoreButton = screen.getByRole('button', { name: /restaurar selecionados/i });
      await user.click(bulkRestoreButton);

      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/items restaurados com sucesso/i)).toBeInTheDocument();
      });
    });

    it('should permanently delete multiple selected items', async () => {
      const user = userEvent.setup();

      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      const multipleItems = [
        { id: 1, type: 'player', name: 'Player 1', deleted_at: '2025-01-01T10:00:00Z' },
        { id: 2, type: 'score', name: 'Score 1', deleted_at: '2025-01-01T11:00:00Z' },
      ];

      server.use(
        http.get('http://localhost:3000/api/admin/trash', () => {
          return HttpResponse.json({
            success: true,
            trashItems: multipleItems,
            currentPage: 1,
            totalPages: 1,
            total: multipleItems.length,
          });
        }),
        http.delete('http://localhost:3000/api/admin/trash/bulk/delete', () => {
          return HttpResponse.json({ success: true, message: 'Items excluídos permanentemente' });
        })
      );

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Player 1')).toBeInTheDocument();
      });

      // Selecionar itens
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      // Clicar em excluir selecionados
      const bulkDeleteButton = screen.getByRole('button', { name: /excluir selecionados/i });
      await user.click(bulkDeleteButton);

      // Confirmar com aviso mais sério
      expect(screen.getByText(/excluir permanentemente \d+ item/i)).toBeInTheDocument();
      expect(screen.getByText(/esta ação não pode ser desfeita/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /excluir permanentemente/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/items excluídos permanentemente/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty Trash State', () => {
    it('should display empty state when no trash items', async () => {
      // Mock empty trash
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.get('http://localhost:3000/api/admin/trash', () => {
          return HttpResponse.json({
            success: true,
            trashItems: [],
            currentPage: 1,
            totalPages: 0,
            total: 0,
          });
        })
      );

      render(
        <TestWrapper>
          <TrashPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/lixeira vazia/i)).toBeInTheDocument();
        expect(screen.getByText(/nenhum item encontrado na lixeira/i)).toBeInTheDocument();
      });

      // Verificar que não há tabela ou botões de ação
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /restaurar/i })).not.toBeInTheDocument();
    });

    it('should display empty state for filtered results', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jogador Deletado')).toBeInTheDocument();
      });

      // Aplicar filtro que não retorna resultados
      const typeFilter = screen.getByLabelText(/filtrar por tipo/i);
      await user.selectOptions(typeFilter, 'tournament');

      await waitFor(() => {
        expect(screen.getByText(/nenhum item encontrado/i)).toBeInTheDocument();
      });
    });
  });

  describe('Trash Statistics', () => {
    it('should display trash statistics correctly', async () => {
      // Mock statistics
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.get('http://localhost:3000/api/admin/trash/stats', () => {
          return HttpResponse.json({
            success: true,
            stats: {
              total: 5,
              byType: {
                player: 2,
                score: 2,
                tournament: 1,
              },
              oldestItem: '2025-01-01T10:00:00Z',
              newestItem: '2025-01-01T15:00:00Z',
            },
          });
        })
      );

      render(
        <TestWrapper>
          <TrashPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/5 itens na lixeira/i)).toBeInTheDocument();
        expect(screen.getByText(/2 jogadores/i)).toBeInTheDocument();
        expect(screen.getByText(/2 placares/i)).toBeInTheDocument();
        expect(screen.getByText(/1 torneio/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-cleanup', () => {
    it('should display auto-cleanup warning for old items', async () => {
      // Mock old items that would be auto-cleaned
      const { server } = await import('../mocks/server');
      const { http, HttpResponse } = await import('msw');

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 dias atrás

      const oldItems = [
        {
          id: 1,
          type: 'player',
          name: 'Item Antigo',
          deleted_at: oldDate.toISOString(),
        },
      ];

      server.use(
        http.get('http://localhost:3000/api/admin/trash', () => {
          return HttpResponse.json({
            success: true,
            trashItems: oldItems,
            currentPage: 1,
            totalPages: 1,
            total: oldItems.length,
          });
        })
      );

      render(
        <TestWrapper>
          <AdminTrashTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Item Antigo')).toBeInTheDocument();
      });

      // Verificar aviso de auto-limpeza
      expect(screen.getByText(/será excluído automaticamente/i)).toBeInTheDocument();
    });
  });
});
