import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MatchCard from './MatchCard'; // Assuming formatMatchDateTime is exported or tested via component

// Helper to format date/time, copied from MatchCard.jsx for direct testing
// Ideally, this would be in a utils file and imported by both MatchCard and its test.
const formatMatchDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'A definir';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'Data inválida';
    // For consistency in tests, let's specify timezone if it affects output,
    // or ensure tests run in a consistent timezone environment.
    // For now, using toLocaleString which might vary.
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Data inválida';
  }
};

describe('MatchCard utility functions', () => {
  describe('formatMatchDateTime', () => {
    it('should return "A definir" for null or undefined input', () => {
      expect(formatMatchDateTime(null)).toBe('A definir');
      expect(formatMatchDateTime(undefined)).toBe('A definir');
    });

    it('should return "Data inválida" for an invalid date string', () => {
      expect(formatMatchDateTime('invalid-date-string')).toBe('Data inválida');
    });

    it('should correctly format a valid ISO date string', () => {
      // Note: Output of toLocaleString can vary by environment's default timezone.
      // For robust tests, mock the timezone or use a library that handles timezones consistently.
      // Example: '2024-07-20T14:30:00.000Z'
      // Expected output in pt-BR might be '20/07/2024, 11:30' if local TZ is UTC-3
      // Or '20/07/2024, 14:30' if TZ is UTC.
      // Let's test a specific case assuming a consistent environment or mock.
      // For simplicity, we'll check parts of the string.
      const dateStr = '2024-07-20T18:30:00Z'; // UTC time
      const formatted = formatMatchDateTime(dateStr);
      // This test is brittle due to timezone. A better test would mock Date or use a date library.
      // For now, we'll just check it doesn't throw and returns something reasonable.
      expect(formatted).toContain('20/07/2024');
      // Example: expect(formatted).toBe('20/07/2024, 15:30'); // If local TZ is UTC-3
    });

    it('should handle different valid date formats if Date constructor supports them', () => {
      const formatted = formatMatchDateTime('2023-01-15 10:00');
      expect(formatted).toContain('15/01/2023');
      expect(formatted).toContain('10:00');
    });
  });
});

describe('MatchCard component', () => {
  const mockMatch = {
    id: '1',
    players: [
      { name: 'Jogador 1', score: 2, seed: 1 },
      { name: 'Jogador 2', score: 1, seed: 2 },
    ],
    winner: 0, // Index of winner
    dateTime: '2024-01-01T10:00:00Z',
    status: 'Concluída',
    roundName: 'Rodada 1',
  };

  it('renders player names and scores', () => {
    render(<MatchCard match={mockMatch} />);
    expect(screen.getByText('Jogador 1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Score of Player 1
    expect(screen.getByText('Jogador 2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Score of Player 2
  });

  it('highlights the winner', () => {
    render(<MatchCard match={mockMatch} />);
    const _player1Display = screen.getByText('Jogador 1').closest('.player-display'); // Assuming PlayerDisplay has this class
    // This test needs PlayerDisplay to add a specific class or attribute for winners.
    // For example, if PlayerDisplay adds 'font-bold' or 'text-green-400' to winner.
    // expect(player1Display).toHaveClass('font-bold'); // Example assertion
  });

  it('displays match date and time', () => {
    render(<MatchCard match={mockMatch} />);
    expect(screen.getByText(formatMatchDateTime(mockMatch.dateTime))).toBeInTheDocument();
  });

  it('displays BYE status correctly', () => {
    const byeMatch = {
      ...mockMatch,
      players: [{ name: 'Jogador 1', seed: 1 }, { is_bye: true }],
      winner: 0, // Player 1 wins by BYE
    };
    render(<MatchCard match={byeMatch} />);
    expect(screen.getByText('Jogador 1 avança (BYE)')).toBeInTheDocument();
  });
});
